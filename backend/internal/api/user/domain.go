package user

import (
	"time"

	"gorm.io/gorm"
)

type Role string

const (
	RoleAdmin    Role = "ADMIN"
	RoleEmployee Role = "Employee"
)

type User struct {
	UUID             string         `json:"uuid" gorm:"primaryKey;type:varchar(36)"`
	Name             string         `json:"name" binding:"required"`
	DOB              time.Time      `json:"dob" binding:"required"`
	EmployeeID       string         `json:"employee_id" binding:"required"`
	Role             Role           `json:"role" binding:"required"`
	Email            string         `json:"email" binding:"required,email" gorm:"unique;not null"`
	Password         string         `json:"password" binding:"required"`
	MaxDailyBookings int            `json:"max_daily_bookings" binding:"required" gorm:"default:5"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginRespose struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}
