package repository

import (
	"ResourceAllocator/internal/api/user"
	"ResourceAllocator/internal/api/utils"
	"errors"
	"fmt"

	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

// Update constructor to accept *gorm.DB
func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) GetUserByEmail(email string) (*user.CreateUser, error) {
	var u user.CreateUser
	result := r.db.Where("email = ?", email).First(&u)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("%w: user not found", utils.ErrNotFound)
		}
		return nil, result.Error
	}
	return &u, nil
}

func (r *UserRepository) GetUserByUUID(uuid string) (*user.User, error) {
	var u user.User
	result := r.db.First(&u, "uuid = ?", uuid)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("%w: user not found", utils.ErrNotFound)
		}
		return nil, result.Error
	}
	return &u, nil
}

func (r *UserRepository) CreateNewUser(u *user.CreateUser) error {
	result := r.db.Table("users").Create(u)

	if result.Error != nil {
		if utils.IsDuplicateKeyError(result.Error) {
			return fmt.Errorf("%w: email/ employeeID aready in use", utils.ErrConflict)
		}
		return result.Error
	}
	return nil
}

func (r *UserRepository) ListUsers(pagination utils.PaginationQuery) ([]user.UserSummary, int64, error) {
	users := []user.UserSummary{}
	var total int64

	query := r.db.Table("users")
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (pagination.Page - 1) * pagination.Limit
	err := query.Order("created_at desc").
		Limit(pagination.Limit).
		Offset(offset).
		Find(&users).Error

	return users, total, err
}

func (r *UserRepository) DeleteUser(uuid string) error {
	result := r.db.Delete(&user.User{}, "uuid = ?", uuid)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("%w: user not found", utils.ErrNotFound)
	}
	return nil
}

func (r *UserRepository) UpdateUser(u *user.User) error {
	_, err := r.GetUserByUUID(u.UUID)
	if err != nil {
		return err
	}

	if err := r.db.Model(&user.User{}).Where("uuid = ?", u.UUID).Updates(u).Error; err != nil {
		if utils.IsDuplicateKeyError(err) {
			return fmt.Errorf("%w: email aready in use", utils.ErrConflict)
		}
		return err
	}
	return nil
}

func (r *UserRepository) GetAuthUserByUUID(uuid string) (*user.CreateUser, error) {
	var u user.CreateUser
	if err := r.db.Table("users").Where("uuid = ?", uuid).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("%w: user not found", utils.ErrNotFound)
		}
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) UpdatePassword(uuid string, password string) error {
	return r.db.Table("users").Where("uuid = ?", uuid).Update("password", password).Error
}
