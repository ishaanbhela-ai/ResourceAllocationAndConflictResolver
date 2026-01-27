package booking

import (
	"time"
)

// Enum for Booking Status
type BookingStatus string

const (
	StatusPending   BookingStatus = "pending"
	StatusApproved  BookingStatus = "approved"
	StatusRejected  BookingStatus = "rejected"
	StatusCancelled BookingStatus = "cancelled"
	StatusReleased  BookingStatus = "released"
)

type Booking struct {
	ID         int           `json:"id" gorm:"primaryKey;autoIncrement"`
	ResourceID int           `json:"resource_id" binding:"required"`
	UserID     string        `json:"user_id" binding:"required"` // UUID
	StartTime  time.Time     `json:"start_time" binding:"required"`
	EndTime    time.Time     `json:"end_time" binding:"required"`
	Purpose    string        `json:"purpose"`
	Status     BookingStatus `json:"status" gorm:"default:'pending'"`

	// Approval / Rejection info
	ApprovedBy      *string    `json:"approved_by"` // UUID of admin
	ApprovedAt      *time.Time `json:"approved_at"`
	RejectionReason string     `json:"rejection_reason"`

	// Check-in info
	CheckedInAt *time.Time `json:"checked_in_at"`
	CreatedAt   time.Time  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time  `json:"updated_at" gorm:"autoUpdateTime"`
}

type BookingCreate struct {
	// User ID will come from Context (Auth Middleware)
	ResourceID int       `json:"resource_id" binding:"required"`
	StartTime  time.Time `json:"start_time" binding:"required"`
	EndTime    time.Time `json:"end_time" binding:"required"`
	Purpose    string    `json:"purpose" binding:"required"`
}

type BookingStatusUpdate struct {
	Status          BookingStatus `json:"status" binding:"required"`
	RejectionReason string        `json:"rejection_reason"` // Optional, only for rejection
}

type BookingSummary struct {
	ID           int           `json:"id"`
	ResourceName string        `json:"resource_name"`
	UserName     string        `json:"user_name"`
	StartTime    time.Time     `json:"start_time"`
	EndTime      time.Time     `json:"end_time"`
	Status       BookingStatus `json:"status"`
}
