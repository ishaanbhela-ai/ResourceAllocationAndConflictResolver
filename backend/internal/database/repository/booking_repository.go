package repository

import (
	"ResourceAllocator/internal/api/booking"
	"ResourceAllocator/internal/api/utils"
	"fmt"
	"time"

	"gorm.io/gorm"
)

type BookingRepository struct {
	db *gorm.DB
}

func NewBookingRepository(db *gorm.DB) *BookingRepository {
	return &BookingRepository{db: db}
}

func (r *BookingRepository) CreateBooking(b *booking.Booking) error {
	return r.db.Create(b).Error
}

func (r *BookingRepository) GetBookingByID(id int) (*booking.Booking, error) {
	var b booking.Booking
	if err := r.db.Preload("Resource").Preload("User").First(&b, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("%w: booking not found", utils.ErrNotFound)
		}
		return nil, err
	}
	return &b, nil
}

// CRITICAL: Find conflicting approved bookings (To prevent double-booking)
func (r *BookingRepository) HasApprovedOverlap(resourceID int, start, end time.Time) (bool, error) {
	var count int64
	err := r.db.Model(&booking.Booking{}).
		Where("resource_id = ? AND status = ?", resourceID, booking.StatusApproved).
		Where("start_time < ? AND end_time > ?", end, start). // Overlap Formula
		Count(&count).Error
	return count > 0, err
}

// CRITICAL: Find conflicting PENDING bookings (For Auto-Rejection)
func (r *BookingRepository) GetPendingOverlaps(resourceID int, start, end time.Time) ([]booking.Booking, error) {
	var bookings []booking.Booking
	err := r.db.Where("resource_id = ? AND status = ?", resourceID, booking.StatusPending).
		Where("start_time < ? AND end_time > ?", end, start).
		Find(&bookings).Error
	return bookings, err
}

func (r *BookingRepository) UpdateBooking(b *booking.Booking) error {
	// This will only update fields that are non-zero in the struct
	if err := r.db.First(&booking.Booking{}, b.ID).Error; err != nil {
		return fmt.Errorf("%w: booking not found", utils.ErrNotFound)
	}
	return r.db.Model(&booking.Booking{}).Where("id = ?", b.ID).Updates(b).Error
}

func (r *BookingRepository) ApproveBookingAndRejectConflicts(targetBooking *booking.Booking) ([]booking.Booking, error) {
	var rejectedBookings []booking.Booking
	err := r.db.Transaction(func(tx *gorm.DB) error {

		// Check if target booking exists
		if err := tx.First(&booking.Booking{}, targetBooking.ID).Error; err != nil {
			return fmt.Errorf("%w: booking not found", utils.ErrNotFound)
		}

		// 1. Approve Target
		// Force update status (even if it was pending)
		if err := tx.Model(&booking.Booking{}).
			Where("id = ?", targetBooking.ID).
			Updates(map[string]interface{}{
				"status":           booking.StatusApproved,
				"approved_by":      targetBooking.ApprovedBy,
				"approved_at":      targetBooking.ApprovedAt,
				"rejection_reason": nil, // Clear rejection reason if any
			}).Error; err != nil {
			return err
		}

		// 2. Find Conflicts (Fetch Booking + User for Email)
		// We explicitly fetch them first to get the User data
		if err := tx.Preload("User").Preload("Resource").
			Where("resource_id = ? AND status = ? AND id != ?", targetBooking.ResourceID, booking.StatusPending, targetBooking.ID).
			Where("start_time < ? AND end_time > ?", targetBooking.EndTime, targetBooking.StartTime).
			Find(&rejectedBookings).Error; err != nil {
			return err
		}

		// 3. Reject Conflicts
		if len(rejectedBookings) > 0 {
			var ids []int
			for _, b := range rejectedBookings {
				ids = append(ids, b.ID)
			}

			if err := tx.Model(&booking.Booking{}).
				Where("id IN ?", ids).
				Updates(map[string]interface{}{
					"status":           booking.StatusRejected,
					"rejection_reason": "Slot allocated to another request",
				}).Error; err != nil {
				return err
			}
		}

		return nil
	})

	return rejectedBookings, err
}

func (r *BookingRepository) GetBookingsByUserID(userID string, filters map[string]interface{}, pagination utils.PaginationQuery) ([]booking.Booking, int64, error) {
	var bookings []booking.Booking
	var total int64

	query := r.db.Model(&booking.Booking{}).Preload("Resource").Preload("User").Where("user_id = ?", userID)

	// Apply Filters (Status, ResourceID)
	if val, ok := filters["status"]; ok && val != "" {
		query = query.Where("status = ?", val)
	}
	if val, ok := filters["resource_id"]; ok && val != "" {
		query = query.Where("resource_id = ?", val)
	}

	// Count Total (before pagination)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply Pagination & Order
	offset := (pagination.Page - 1) * pagination.Limit
	err := query.Order("start_time desc").
		Limit(pagination.Limit).
		Offset(offset).
		Find(&bookings).Error

	return bookings, total, err
}

func (r *BookingRepository) GetAllBookings(filters map[string]interface{}, pagination utils.PaginationQuery) ([]booking.Booking, int64, error) {
	var bookings []booking.Booking
	var total int64

	query := r.db.Model(&booking.Booking{}).Preload("Resource").Preload("User")

	// Apply Filters
	for key, value := range filters {
		if value != "" {
			query = query.Where(key+" = ?", value)
		}
	}

	// Count Total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply Pagination & Order
	offset := (pagination.Page - 1) * pagination.Limit
	err := query.Order("created_at desc").
		Limit(pagination.Limit).
		Offset(offset).
		Find(&bookings).Error

	return bookings, total, err
}

func (r *BookingRepository) GetFutureApprovedBookings(resourceID int, startTime time.Time) ([]booking.Booking, error) {
	var bookings []booking.Booking
	err := r.db.Preload("Resource").Preload("User").Where("resource_id = ? AND status = ? AND end_time > ?", resourceID, booking.StatusApproved, startTime).
		Order("start_time asc").
		Find(&bookings).Error
	return bookings, err
}

func (r *BookingRepository) CheckInBooking(bookingId int) error {
	err := r.db.Model(&booking.Booking{}).Where("id = ?", bookingId).Updates(map[string]interface{}{
		"status": booking.StatusUtilized,
	}).Error

	return err
}

// ReleaseUncheckedBookings: Updates bookings to RELEASED if they are APPROVED and start_time < cutoffTime.
func (r *BookingRepository) ReleaseUncheckedBookings(cutoffTime time.Time) error {
	// Find and Update in one query
	result := r.db.Model(&booking.Booking{}).
		Where("status = ? AND start_time < ?", booking.StatusApproved, cutoffTime).
		Updates(map[string]interface{}{
			"status":           booking.StatusReleased,
			"rejection_reason": "Auto-released due to no check-in",
		})

	if result.Error != nil {
		return result.Error
	}
	// Ideally we log how many were released: result.RowsAffected
	return nil
}

// GetApprovedBookingsStartingAt finds bookings that started at a specific time and are still only 'APPROVED' (not Utilized)
func (r *BookingRepository) GetApprovedBookingsStartingAt(startTime time.Time) ([]booking.Booking, error) {
	var bookings []booking.Booking
	// We need User data for the email address and Resource data for the name
	err := r.db.Preload("User").Preload("Resource").
		Where("status = ? AND start_time = ?", booking.StatusApproved, startTime).
		Find(&bookings).Error
	return bookings, err
}

func (r *BookingRepository) CancelExpiredPendingBookings(cutoffTime time.Time) error {
	// Update pending bookings to cancelled if their start time has passed
	return r.db.Model(&booking.Booking{}).
		Where("status = ? AND start_time < ?", booking.StatusPending, cutoffTime).
		Updates(map[string]interface{}{
			"status":           booking.StatusCancelled,
			"rejection_reason": "Not seen by admin",
		}).Error
}
