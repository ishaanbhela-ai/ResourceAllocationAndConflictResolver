package repository

import (
	"ResourceAllocator/internal/api/user"
	"ResourceAllocator/internal/api/utils"
	"errors"

	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

// Update constructor to accept *gorm.DB
func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) GetUserByEmail(email string) (*user.UserCreate, error) {
	var u user.UserCreate
	result := r.db.Where("email = ?", email).First(&u)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, utils.ErrNotFound
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
			return nil, utils.ErrNotFound
		}
		return nil, result.Error
	}
	return &u, nil
}

func (r *UserRepository) CreateNewUser(u *user.UserCreate) error {
	result := r.db.Table("users").Create(u)

	if result.Error != nil {
		if utils.IsDuplicateKeyError(result.Error) {
			return utils.ErrConflict // Strictly typed "User already exists"
		}
		return result.Error
	}
	return nil
}

func (r *UserRepository) ListUsers() ([]user.UserSummary, error) {
	users := []user.UserSummary{}
	result := r.db.Table("users").Find(&users)
	return users, result.Error
}

func (r *UserRepository) DeleteUser(uuid string) error {
	result := r.db.Delete(&user.User{}, "uuid = ?", uuid)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return utils.ErrNotFound
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
			return utils.ErrConflict
		}
		return err
	}
	return nil
}
