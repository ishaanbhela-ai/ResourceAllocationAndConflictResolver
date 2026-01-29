package booking

import (
	"ResourceAllocator/internal/api/resource"
	"ResourceAllocator/internal/api/user"
	"strings"
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
	StatusUtilized  BookingStatus = "utilized"
)

type Booking struct {
	ID           int               `json:"id" gorm:"primaryKey;autoIncrement"`
	ResourceID   int               `json:"resource_id" binding:"required"`
	Resource     resource.Resource `json:"-" gorm:"foreignKey:ResourceID"` // Association hidden
	ResourceName string            `json:"resource_name,omitempty" gorm:"-"`
	UserID       string            `json:"user_id" binding:"required"`                 // UUID
	User         user.User         `json:"-" gorm:"foreignKey:UserID;references:UUID"` // Association hidden
	UserName     string            `json:"user_name,omitempty" gorm:"-"`
	StartTime    time.Time         `json:"start_time" binding:"required"`
	EndTime      time.Time         `json:"end_time" binding:"required"`
	Purpose      string            `json:"purpose"`
	Status       BookingStatus     `json:"status" gorm:"default:'pending'"`

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

func (b *BookingCreate) Sanitize() {
	b.Purpose = strings.TrimSpace(b.Purpose)
}

type DashboardResourceStat struct {
	ResourceID   int    `json:"resource_id"`
	ResourceName string `json:"resource_name"`
	Pending      int64  `json:"pending"`
	Approved     int64  `json:"approved"`
	Utilized     int64  `json:"utilized"`
	Total        int64  `json:"total"`
}

type DashboardUserStat struct {
	UserID        string `json:"user_id"`
	UserName      string `json:"user_name"`
	ReleasedCount int64  `json:"released_count"`
}
