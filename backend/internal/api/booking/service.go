package booking

import (
	"ResourceAllocator/internal/api/utils"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"
)

type IBookingRepo interface {
	CreateBooking(b *Booking) error
	GetBookingByID(id int) (*Booking, error)
	HasApprovedOverlap(resourceID int, start, end time.Time) (bool, error)
	GetPendingOverlaps(resourceID int, start, end time.Time) ([]Booking, error)
	UpdateBooking(b *Booking) error
	ApproveBookingAndRejectConflicts(targetBooking *Booking) ([]Booking, error)
	GetBookingsByUserID(userID string, filters map[string]interface{}, pagination utils.PaginationQuery) ([]Booking, int64, error)
	GetAllBookings(filters map[string]interface{}, pagination utils.PaginationQuery) ([]Booking, int64, error)
	GetFutureApprovedBookings(resourceID int, startTime time.Time) ([]Booking, error)
	CheckInBooking(bookingId int) error
	ReleaseUncheckedBookings(cutoffTime time.Time) error
	GetApprovedBookingsStartingAt(startTime time.Time) ([]Booking, error)
}

type BookingService struct {
	BookingRepo IBookingRepo
}

func NewBookingService(repo IBookingRepo) *BookingService {
	return &BookingService{BookingRepo: repo}
}

// Helper: Check if a specific slot is valid (Time, History, Weekend)
func isValidSlot(start time.Time, duration time.Duration) error {
	end := start.Add(duration)
	if err := utils.IsWorkingHours(start, end); err != nil {
		return err
	}
	return utils.IsHoliday(start)
}

func (s *BookingService) findNextAvailableSlots(resourceID int, initialStart time.Time, duration time.Duration, limit int) ([]time.Time, error) {
	// 1. Fetch bookings sorted by StartTime (Make sure your Repo sorts them!)
	bookings, err := s.BookingRepo.GetFutureApprovedBookings(resourceID, initialStart)
	if err != nil {
		return nil, err
	}
	var suggestions []time.Time

	// Start looking from the requested time
	candidate := initialStart
	// Safety limit: look ahead max 7 days
	endTimeLimit := initialStart.AddDate(0, 0, 7)
	// Index to track which booking we are currently "near" to avoid re-scanning past bookings
	bookingIdx := 0
	totalBookings := len(bookings)
	for len(suggestions) < limit {
		if candidate.After(endTimeLimit) {
			break
		}
		// 2. Adjust candidate if it falls outside working hours or on a holiday
		// If this function moves the time forward, loop again to check the new time against bookings
		if err := isValidSlot(candidate, duration); err != nil {
			// Jump to next 9 AM
			nextDay := candidate.AddDate(0, 0, 1)
			candidate = time.Date(nextDay.Year(), nextDay.Month(), nextDay.Day(), 9, 0, 0, 0, nextDay.Location())
			continue
		}
		// 3. Fast-Forward past bookings that end before our candidate starts
		for bookingIdx < totalBookings && bookings[bookingIdx].EndTime.Before(candidate.Add(time.Second)) {
			bookingIdx++
		}
		// 4. Check Collision with the current relevant booking
		isOverlapping := false
		if bookingIdx < totalBookings {
			b := bookings[bookingIdx]
			// We only care if the Booking Start is before our Candidate End
			// (We already know Booking End is after Candidate Start from step 3)
			if b.StartTime.Before(candidate.Add(duration)) {
				isOverlapping = true
				// Optimization: Jump straight to the end of this blocking booking
				candidate = b.EndTime
			}
		}
		// 5. If valid, add to suggestions
		if !isOverlapping {
			suggestions = append(suggestions, candidate)
			// Move forward by 1 hour to give the user alternative start times
			candidate = candidate.Add(1 * time.Hour)
		}
	}
	if len(suggestions) == 0 {
		return nil, errors.New("no slots available in next 7 days")
	}
	return suggestions, nil
}

func (s *BookingService) CreateBooking(req *BookingCreate, userID string) (*BookingSummary, error) {
	// Use robust timezone loading
	loc, err := time.LoadLocation("Asia/Kolkata")
	if err != nil {
		// Fallback to strict offset if DB is missing (5h 30m = 19800s)
		loc = time.FixedZone("IST", 5*3600+30*60)
	}

	if req.StartTime.Before(time.Now().In(loc)) {
		return nil, fmt.Errorf("%w: start time must be in the future", utils.ErrInvalidInput)
	}

	// A. Validate Time
	if req.EndTime.Before(req.StartTime) {
		return nil, fmt.Errorf("%w: end time must be after start time", utils.ErrInvalidInput)
	}

	// [NEW] Strict Whole-Hour Validation
	if req.StartTime.Minute() != 0 || req.StartTime.Second() != 0 || req.StartTime.Nanosecond() != 0 {
		return nil, fmt.Errorf("%w: bookings must start exactly at the top of the hour (e.g. 10:00:00)", utils.ErrInvalidInput)
	}

	duration := req.EndTime.Sub(req.StartTime)
	// Make sure duration is a multiple of 60 minutes
	if int(duration.Minutes())%60 != 0 {
		return nil, fmt.Errorf("%w: booking duration must be multiples of 1 hour", utils.ErrInvalidInput)
	}

	// 9AM - 5PM check
	if err := utils.IsWorkingHours(req.StartTime, req.EndTime); err != nil {
		return nil, fmt.Errorf("%w: %v", utils.ErrInvalidInput, err)
	}

	// Holiday Logic
	if err := utils.IsHoliday(req.StartTime); err != nil {
		return nil, fmt.Errorf("%w: %v", utils.ErrInvalidInput, err)
	}

	// B. Approved Overlap Check (Strict)
	hasOverlap, err := s.BookingRepo.HasApprovedOverlap(req.ResourceID, req.StartTime, req.EndTime)
	if err != nil {
		return nil, err
	}
	if hasOverlap {
		slots, err := s.findNextAvailableSlots(req.ResourceID, req.StartTime, duration, 4)
		msg := "slot unavailable"
		if err == nil && len(slots) > 0 {
			var slotStrings []string
			for _, slot := range slots {
				slotStrings = append(slotStrings, slot.Format("Mon, 02 Jan 15:04"))
			}
			// add a new line character after each time.
			msg = fmt.Sprintf("slot unavailable. Suggested slots: \n%v", strings.Join(slotStrings, "\n"))
		}
		return nil, fmt.Errorf("%w: %s", utils.ErrConflict, msg)
	}
	// C. Create
	booking := &Booking{
		ResourceID: req.ResourceID,
		UserID:     userID,
		StartTime:  req.StartTime,
		EndTime:    req.EndTime,
		Purpose:    req.Purpose,
		Status:     StatusPending,
	}
	if err := s.BookingRepo.CreateBooking(booking); err != nil {
		return nil, err
	}

	// Fetch the full booking with associations to generate summary
	fullBooking, err := s.BookingRepo.GetBookingByID(booking.ID)
	if err != nil {
		// Log error but maybe return something? Ideally this shouldn't fail.
		return nil, err
	}

	// Map to Summary
	summary := &BookingSummary{
		ID:           fullBooking.ID,
		ResourceName: fullBooking.Resource.Name,
		UserName:     fullBooking.User.Name,
		StartTime:    fullBooking.StartTime,
		EndTime:      fullBooking.EndTime,
		Status:       fullBooking.Status,
	}

	summaryEmailBody := fmt.Sprintf("Thank You for booking a resource, Here is your summary: \n\n Booking ID: %d\nResource: %s\nUser: %s\nStart Time: %s\nEnd Time: %s\nStatus: %s", summary.ID, summary.ResourceName, summary.UserName, summary.StartTime, summary.EndTime, summary.Status)

	utils.SendEmail(summaryEmailBody, fullBooking.User.Email, "Booking Summary")

	return summary, nil
}

func (s *BookingService) UpdateStatus(id int, req *BookingStatusUpdate, approverID string) error {
	booking, err := s.BookingRepo.GetBookingByID(id)
	if err != nil {
		return err
	}
	if booking.Status != StatusPending {
		return fmt.Errorf("%w: can only change status of pending bookings", utils.ErrInvalidInput)
	}
	// APPROVE
	if req.Status == StatusApproved {
		// 1. Prepare data for approval
		now := time.Now()
		booking.Status = StatusApproved
		booking.ApprovedBy = &approverID
		booking.ApprovedAt = &now

		// 2. Execute Transaction (Approve + Reject Conflicts in DB)
		// Now receives list of rejected bookings for email notification
		rejectedBookings, err := s.BookingRepo.ApproveBookingAndRejectConflicts(booking)
		if err != nil {
			return err
		}

		// 3. Send Approval Email
		subject := "Resource Approved!"
		body := fmt.Sprintf("Your booking has been approved!\n\nBooking ID: %d\nResource: %s\nUser: %s\nStart Time: %s\nEnd Time: %s\nStatus: %s", booking.ID, booking.Resource.Name, booking.User.Name, booking.StartTime, booking.EndTime, booking.Status)
		utils.SendEmail(body, booking.User.Email, subject)

		// 4. Send Rejection Emails (Async preferred but Sync for now)
		for _, rb := range rejectedBookings {
			rejectSubject := "Booking Rejected due to Conflict"
			rejectBody := fmt.Sprintf("Your booking has been rejected because the slot was approved for another request.\n\nBooking ID: %d\nResource: %s\nStart Time: %v\nEnd Time: %v", rb.ID, rb.Resource.Name, rb.StartTime, rb.EndTime)
			// Ensure we have the user email. Preload in repo handles this.
			if rb.User.Email != "" {
				utils.SendEmail(rejectBody, rb.User.Email, rejectSubject)
			}
		}

		return nil
	}
	// REJECT
	if req.Status == StatusRejected {
		booking.Status = StatusRejected
		booking.RejectionReason = req.RejectionReason
		approverIDVal := approverID
		booking.ApprovedBy = &approverIDVal // Track who rejected it
		now := time.Now()
		booking.ApprovedAt = &now // Track when it was rejected
		// Use UpdateBooking (since UpdateStatus was not available in your repo)
		err := s.BookingRepo.UpdateBooking(booking)
		if err != nil {
			return err
		}
		subject := "Resource Rejected!"
		body := fmt.Sprintf("Your booking has been rejected!\n\nBooking ID: %d\nResource: %s\nUser: %s\nStart Time: %s\nEnd Time: %s\nStatus: %s\n Reason: %s", booking.ID, booking.Resource.Name, booking.User.Name, booking.StartTime, booking.EndTime, booking.Status, booking.RejectionReason)
		utils.SendEmail(body, booking.User.Email, subject)
		return nil
	}
	return fmt.Errorf("%w: invalid status transition", utils.ErrInvalidInput)
}

func (s *BookingService) CancelBooking(id int, userID string) error {
	booking, err := s.BookingRepo.GetBookingByID(id)
	if err != nil {
		return err
	}
	// Security Check: You can only cancel YOUR OWN booking
	if booking.UserID != userID {
		return fmt.Errorf("%w: you can only cancel your own bookings", utils.ErrUnauthorized)
	}
	if booking.Status == StatusCancelled || booking.Status == StatusRejected {
		return fmt.Errorf("%w: booking is already cancelled or rejected", utils.ErrInvalidInput)
	}
	// Reuse Update logic, but specifically for Cancel
	booking.Status = StatusCancelled
	err = s.BookingRepo.UpdateBooking(booking)
	if err != nil {
		return err
	}
	subject := "Resource Cancelled!"
	body := fmt.Sprintf("Your booking has been cancelled!\n\nBooking ID: %d\nResource: %s\nUser: %s\nStart Time: %s\nEnd Time: %s\nStatus: %s", booking.ID, booking.Resource.Name, booking.User.Name, booking.StartTime, booking.EndTime, booking.Status)
	utils.SendEmail(body, booking.User.Email, subject)
	return nil
}

func (s *BookingService) GetMyBookings(userID string, filters map[string]interface{}, pagination utils.PaginationQuery) ([]BookingSummary, int64, error) {
	bookings, total, err := s.BookingRepo.GetBookingsByUserID(userID, filters, pagination)
	if err != nil {
		return nil, 0, err
	}
	return s.mapToSummary(bookings), total, nil
}

// 5. List (Admin)
func (s *BookingService) GetAllBookings(filters map[string]interface{}, pagination utils.PaginationQuery) ([]BookingSummary, int64, error) {
	bookings, total, err := s.BookingRepo.GetAllBookings(filters, pagination)
	if err != nil {
		return nil, 0, err
	}
	return s.mapToSummary(bookings), total, nil
}

func (s *BookingService) mapToSummary(bookings []Booking) []BookingSummary {
	summaries := make([]BookingSummary, len(bookings))
	for i, b := range bookings {
		summaries[i] = BookingSummary{
			ID:           b.ID,
			ResourceName: b.Resource.Name,
			UserName:     b.User.Name,
			StartTime:    b.StartTime,
			EndTime:      b.EndTime,
			Status:       b.Status,
		}
	}
	return summaries
}

func (s *BookingService) CheckInBooking(bookingId int, userId string) error {
	booking, err := s.BookingRepo.GetBookingByID(bookingId)

	if err != nil {
		return err
	}

	if booking.UserID != userId {
		return fmt.Errorf("%w: Unauthorized Action", utils.ErrUnauthorized)
	}

	if booking.Status != BookingStatus(StatusApproved) {
		return fmt.Errorf("%w: Cannot checkin unapproved/ released bookings", utils.ErrInvalidInput)
	}

	if booking.StartTime.After(time.Now()) {
		return fmt.Errorf("%w: Checkin can only be done within 15 minutes of start time", utils.ErrInvalidInput)
	}

	if time.Now().After(booking.StartTime.Add(15 * time.Minute)) {
		return fmt.Errorf("%w: Checkin time expired", utils.ErrUnauthorized)
	}

	return s.BookingRepo.CheckInBooking(bookingId)
}

// RunAutoReleaseJob finds approved bookings started >15 mins ago that haven't been checked in
// and releases them. Run this via a background ticker.
func (s *BookingService) RunAutoReleaseJob() error {
	// 15 minutes ago
	cutoffTime := time.Now().Add(-15 * time.Minute)
	return s.BookingRepo.ReleaseUncheckedBookings(cutoffTime)
}

func (s *BookingService) SendCheckInReminders() error {
	// 1. Calculate the booking start time we are interested in.
	// Use time.Date to safely truncate to the hour in Local time (Handles IST +5:30 correctly)
	now := time.Now()
	bookingStartTime := time.Date(now.Year(), now.Month(), now.Day(), now.Hour(), 0, 0, 0, now.Location())

	// 2. Find customers who haven't checked in yet
	bookings, err := s.BookingRepo.GetApprovedBookingsStartingAt(bookingStartTime)
	if err != nil {
		return err
	}

	log.Printf("Check-in Reminder Job: Looking for bookings at %s. Found %d bookings.", bookingStartTime, len(bookings))

	// 3. Send Reminder Emails
	for _, b := range bookings {
		log.Printf("Sending reminder to user %s (%s) for booking %d", b.User.Name, b.User.Email, b.ID)
		subject := "Reminder: Check-in to your Booking!"
		body := fmt.Sprintf("Hello %s,\n\nYou have a booking for %s that started at %s.\n\nPlease check in within the next 5 minutes to avoid auto-cancellation!",
			b.User.Name, b.Resource.Name, b.StartTime.Format("15:04"))

		// This uses your new async email worker!
		utils.SendEmail(body, b.User.Email, subject)
	}

	return nil
}
