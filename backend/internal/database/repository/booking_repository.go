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
	if err := r.db.First(&b, id).Error; err != nil {
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

func (r *BookingRepository) ApproveBookingAndRejectConflicts(targetBooking *booking.Booking, conflicts []booking.Booking) error {
	return r.db.Transaction(func(tx *gorm.DB) error {

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
		// 2. Reject Conflicts
		for _, b := range conflicts {
			// Optimization: Update all conflicts in one query if possible, but loop is safer for now
			if err := tx.Model(&booking.Booking{}).
				Where("id = ?", b.ID).
				Updates(map[string]interface{}{
					"status":           booking.StatusRejected,
					"rejection_reason": "Slot allocated to another request",
				}).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *BookingRepository) GetBookingsByUserID(userID string) ([]booking.Booking, error) {
	var bookings []booking.Booking
	if err := r.db.Where("user_id = ?", userID).Order("start_time desc").Find(&bookings).Error; err != nil {
		return nil, err
	}
	return bookings, nil
}

func (r *BookingRepository) GetAllBookings(filters map[string]interface{}) ([]booking.Booking, error) {
	var bookings []booking.Booking
	query := r.db.Model(&booking.Booking{})
	// Apply Filters
	for key, value := range filters {
		query = query.Where(key+" = ?", value)
	}
	if err := query.Order("created_at desc").Find(&bookings).Error; err != nil {
		return nil, err
	}
	return bookings, nil
}

func (r *BookingRepository) GetFutureApprovedBookings(resourceID int, startTime time.Time) ([]booking.Booking, error) {
	var bookings []booking.Booking
	err := r.db.Where("resource_id = ? AND status = ? AND end_time > ?", resourceID, booking.StatusApproved, startTime).
		Order("start_time asc").
		Find(&bookings).Error
	return bookings, err
}
