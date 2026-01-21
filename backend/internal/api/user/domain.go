package user

import (
	"time"

	"gorm.io/gorm"
)

type Role string

const (
	RoleAdmin    Role = "ADMIN"
	RoleEmployee Role = "EMPLOYEE"
)

type User struct {
	UUID       string         `json:"uuid" gorm:"primaryKey;type:varchar(36)"`
	Name       string         `json:"name" binding:"required"`
	DOB        time.Time      `json:"dob" binding:"required"`
	EmployeeID string         `json:"employee_id" binding:"required" gorm:"unique"`
	Role       Role           `json:"role" binding:"required,oneof=ADMIN Employee"`
	Email      string         `json:"email" binding:"required,email" gorm:"unique;not null"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

type UserCreate struct {
	User
	Password string `json:"password" binding:"required"`
}

func (UserCreate) TableName() string {
	return "users"
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type UserSummary struct {
	UUID       string `json:"uuid"`
	Name       string `json:"name"`
	EmployeeID string `json:"employee_id"`
	Role       Role   `json:"role"`
}
