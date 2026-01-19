package user

import (
	"time"
)

type Role string

const (
	RoleAdmin    Role = "ADMIN"
	RoleEmployee Role = "Employee"
)

type User struct {
	UUID             string     `json:"uuid" db:"uuid"`
	Name             string     `json:"name" db:"name" binding:"required"`
	DOB              time.Time  `json:"dob" db:"dob" binding:"required"`
	EmployeeID       string     `json:"employee_id" db:"employee_id" binding:"required"`
	Role             Role       `json:"role" db:"role" binding:"required"`
	Email            string     `json:"email" db:"email" binding:"required,email"`
	Password         string     `json:"password" db:"password" binding:"required"` // bcrypt hash as string
	MaxDailyBookings int        `json:"max_daily_bookings" db:"max_daily_bookings" binding:"required"`
	CreatedAt        time.Time  `json:"created_at" db:"created_at"`
	DeletedAt        *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginRespose struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}
