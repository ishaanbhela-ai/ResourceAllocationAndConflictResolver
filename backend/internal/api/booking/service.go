package booking

import (
	"ResourceAllocator/internal/api/utils"
	"errors"
	"fmt"
	"time"
)

type IBookingRepo interface {
	CreateBooking(b *Booking) error
	GetBookingByID(id int) (*Booking, error)
	HasApprovedOverlap(resourceID int, start, end time.Time) (bool, error)
	GetPendingOverlaps(resourceID int, start, end time.Time) ([]Booking, error)
	UpdateBooking(b *Booking) error
	ApproveBookingAndRejectConflicts(targetBooking *Booking, conflicts []Booking) error
	GetBookingsByUserID(userID string, filters map[string]interface{}, pagination utils.PaginationQuery) ([]Booking, int64, error)
	GetAllBookings(filters map[string]interface{}, pagination utils.PaginationQuery) ([]Booking, int64, error)
	GetFutureApprovedBookings(resourceID int, startTime time.Time) ([]Booking, error)
	CheckInBooking(bookingId int) error
	ReleaseUncheckedBookings(cutoffTime time.Time) error
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

// Helper: Find next gaps (plural)
func (s *BookingService) findNextAvailableSlots(resourceID int, initialStart time.Time, duration time.Duration, limit int) ([]time.Time, error) {
	bookings, err := s.BookingRepo.GetFutureApprovedBookings(resourceID, initialStart)
	if err != nil {
		return nil, err
	}

	var suggestions []time.Time
	candidate := initialStart

	// Safety limit: look ahead max 7 days
	endTimeLimit := initialStart.AddDate(0, 0, 7)

	for len(suggestions) < limit {
		if candidate.After(endTimeLimit) {
			break
		}

		// 1. Check strict validity (Hours + Holidays)
		if err := isValidSlot(candidate, duration); err != nil {
			// If outside hours or holiday, advance to next 9AM
			candidate = time.Date(candidate.Year(), candidate.Month(), candidate.Day(), 9, 0, 0, 0, candidate.Location()).AddDate(0, 0, 1)
			continue
		}

		// 2. Check Overlap
		isOverlapping := false
		for _, b := range bookings {
			// If candidate End > Booking Start AND candidate Start < Booking End
			if candidate.Add(duration).After(b.StartTime) && candidate.Before(b.EndTime) {
				isOverlapping = true
				// Jump to end of conflict
				// But we also need to ensure that the new candidate is top-of-hour if that's a rule
				// For simplicity, let's jump to the booking's EndTime (which should be hourly aligned)
				candidate = b.EndTime
				break
			}
		}

		if !isOverlapping {
			suggestions = append(suggestions, candidate)
			// Move to next hour to find next option
			candidate = candidate.Add(1 * time.Hour)
		}
	}

	if len(suggestions) == 0 {
		return nil, errors.New("no slots available in next 7 days")
	}
	return suggestions, nil
}

func (s *BookingService) CreateBooking(req *BookingCreate, userID string) (*BookingSummary, error) {
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
			// Format slots
			var slotStrings []string
			for _, slot := range slots {
				slotStrings = append(slotStrings, slot.Format("15:04"))
			}
			msg = fmt.Sprintf("slot unavailable. Suggested slots: %v", slotStrings)
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
		// 1. Find overlapping pending requests
		conflicts, err := s.BookingRepo.GetPendingOverlaps(booking.ResourceID, booking.StartTime, booking.EndTime)
		if err != nil {
			return err
		}
		// 2. Filter list (remove self)
		var realConflicts []Booking
		for _, b := range conflicts {
			if b.ID != id {
				realConflicts = append(realConflicts, b)
			}
		}
		// 3. Prepare data for approval
		now := time.Now()
		booking.Status = StatusApproved
		booking.ApprovedBy = &approverID
		booking.ApprovedAt = &now
		// 4. Execute Transaction
		return s.BookingRepo.ApproveBookingAndRejectConflicts(booking, realConflicts)
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
		return s.BookingRepo.UpdateBooking(booking)
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
	return s.BookingRepo.UpdateBooking(booking)
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
