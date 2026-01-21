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
}

type BookingService struct {
	BookingRepo IBookingRepo
}

func NewBookingService(repo IBookingRepo) *BookingService {
	return &BookingService{BookingRepo: repo}
}

var publicHolidays = map[string]string{
	"2026-01-26": "Republic Day",
	"2026-08-15": "Independence Day",
	"2026-10-02": "Gandhi Jayanti",
	"2026-12-25": "Christmas",
}

func isHoliday(t time.Time) error {
	// 1. Weekend Check
	if t.Weekday() == time.Saturday || t.Weekday() == time.Sunday {
		return errors.New("bookings are not allowed on weekends")
	}
	// 2. Public Holiday Check
	dateStr := t.Format("2006-01-02")
	if _, exists := publicHolidays[dateStr]; exists {
		return errors.New("bookings are not allowed on public holidays")
	}
	return nil
}

// Helper: Check if a specific slot is valid (Time, History, Weekend)
func isValidSlot(start time.Time, duration time.Duration) error {
	end := start.Add(duration)
	// 9AM - 5PM check
	if start.Hour() < 9 || start.Hour() > 17 || end.Hour() > 17 || end.Hour() < 9 {
		return errors.New("outside working hours")
	}
	return isHoliday(start)
}

// Helper: Find next gap
func (s *BookingService) findNextAvailableSlot(resourceID int, initialStart time.Time, duration time.Duration) (time.Time, error) {
	bookings, err := s.BookingRepo.GetFutureApprovedBookings(resourceID, initialStart)
	if err != nil {
		return time.Time{}, err
	}

	candidate := initialStart
	// Safety limit: look ahead max 7 days to avoid infinite/long loops
	limit := initialStart.AddDate(0, 0, 7)

	for {
		if candidate.After(limit) {
			return time.Time{}, errors.New("no slots available in next 7 days")
		}

		// 1. Check strict validity (Hours + Holidays)
		if err := isValidSlot(candidate, duration); err != nil {
			// If outside hours or holiday, advance to next 9AM
			// Simplistic advance: if past 5PM today, go to tomorrow 9AM.
			// If holiday, go to tomorrow 9AM.
			candidate = time.Date(candidate.Year(), candidate.Month(), candidate.Day(), 9, 0, 0, 0, candidate.Location()).AddDate(0, 0, 1)
			continue
		}

		// 2. Check Overlap with Existing Future Bookings
		isOverlapping := false
		for _, b := range bookings {
			// If candidate End > Booking Start AND candidate Start < Booking End
			if candidate.Add(duration).After(b.StartTime) && candidate.Before(b.EndTime) {
				isOverlapping = true
				candidate = b.EndTime // Jump to end of conflict
				break
			}
		}

		if !isOverlapping {
			return candidate, nil // Found it!
		}
	}
}

func (s *BookingService) CreateBooking(req *BookingCreate, userID string) (*Booking, error) {
	// A. Validate Time
	if req.EndTime.Before(req.StartTime) {
		return nil, fmt.Errorf("%w: end time must be after start time", utils.ErrInvalidInput)
	}

	duration := req.EndTime.Sub(req.StartTime)
	if duration.Minutes() < 60 || int(duration.Minutes())%60 != 0 {
		return nil, fmt.Errorf("%w: booking duration must be multiples of 1 hour", utils.ErrInvalidInput)
	}

	// 9AM - 5PM check
	if req.StartTime.Hour() < 9 || req.StartTime.Hour() > 17 || req.EndTime.Hour() > 17 || req.EndTime.Hour() < 9 {
		return nil, fmt.Errorf("%w: bookings only allowed between 9AM and 5PM", utils.ErrInvalidInput)
	}

	// Holiday Logic
	if err := isHoliday(req.StartTime); err != nil {
		return nil, fmt.Errorf("%w: %v", utils.ErrInvalidInput, err)
	}

	// B. Approved Overlap Check (Strict)
	hasOverlap, err := s.BookingRepo.HasApprovedOverlap(req.ResourceID, req.StartTime, req.EndTime)
	if err != nil {
		return nil, err
	}
	if hasOverlap {
		nextSlot, err := s.findNextAvailableSlot(req.ResourceID, req.StartTime, duration)
		msg := "slot unavailable"
		if err == nil {
			msg = fmt.Sprintf("slot unavailable. Next possible slot starts at %s", nextSlot.Format("2006-01-02 15:04"))
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
	return booking, nil
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
			ResourceName: fmt.Sprintf("%d", b.ResourceID), // Placeholder: Returning ID as name since we lack join.
			UserName:     b.UserID,                        // Placeholder: Returning UUID as name.
			StartTime:    b.StartTime,
			EndTime:      b.EndTime,
			Status:       b.Status,
		}
	}
	return summaries
}
