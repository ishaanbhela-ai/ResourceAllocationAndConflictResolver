package user

import (
	"strings"
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
	Role       Role           `json:"role" binding:"required,oneof=ADMIN EMPLOYEE"`
	Email      string         `json:"email" binding:"required,email" gorm:"unique;not null"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

type CreateUser struct {
	User
	Password string `json:"password" binding:"required" gorm:"type:text"`
}

func (CreateUser) TableName() string {
	return "users"
}

type ChangePasswordRequest struct {
	OldPassword        string `json:"old_password" binding:"required"`
	NewPassword        string `json:"new_password" binding:"required"`
	ConfirmNewPassword string `json:"confirm_new_password" binding:"required"`
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

func (u *CreateUser) Sanitize() {
	u.Name = strings.TrimSpace(u.Name)
	u.Email = strings.TrimSpace(u.Email)
}
func (l *LoginRequest) Sanitize() {
	l.Email = strings.TrimSpace(l.Email)
}
func (u *User) Sanitize() {
	u.Name = strings.TrimSpace(u.Name)
	u.Email = strings.TrimSpace(u.Email)
}
