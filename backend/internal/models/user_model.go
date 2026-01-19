package models

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
	Name             string     `json:"name" db:"name"`
	DOB              time.Time  `json:"dob" db:"dob"`
	EmployeeLevel    int        `json:"employee_level" db:"employee_level"`
	Role             Role       `json:"role" db:"role"`
	Email            string     `json:"email" db:"email"`
	HashPassword     []byte     `json:"-" db:"hash_password"`
	MaxDailyBookings int        `json:"max_daily_bookings" db:"max_daily_bookings"`
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
