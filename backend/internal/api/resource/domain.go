package resource

import "time"

type Resource struct {
	ID                        int       `json:"id" gorm:"primaryKey;autoIncrement"`
	Name                      string    `json:"name" binding:"required"`
	TypeID                    int       `json:"type_id" binding:"required"`
	Location                  string    `json:"location"`
	Description               string    `json:"description" binding:"required"`
	IsActive                  bool      `json:"is_active" gorm:"default:true"`
	RequiresApproval          bool      `json:"requires_approval" gorm:"default:false"`
	MaxBookingDurationMinutes int       `json:"max_booking_duration_minutes" binding:"required"`
	AdvanceBookingDays        int       `json:"advance_booking_days binding:required"`
	CreatedAt                 time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt                 time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

type ResourceType struct {
	ID   int    `json:"id" gorm:"primaryKey;autoIncrement"`
	Type string `json:"type" binding:"required"`
}
