package repository

import (
	"ResourceAllocator/internal/api/user"
	"errors"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

// Update constructor to accept *gorm.DB
func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) GetUserByEmail(email string) (*user.User, error) {
	var u user.User

	// GORM: Find the first record where email matches
	result := r.db.Where("email = ?", email).First(&u)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("User not Found")
		}
		return nil, result.Error
	}

	return &u, nil
}

func (r *UserRepository) GetUserByUUID(uuid string) (*user.User, error) {
	var u user.User

	// GORM: Find by Primary Key
	result := r.db.First(&u, "uuid = ?", uuid)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("User not Found")
		}
		return nil, result.Error
	}

	return &u, nil
}

func (r *UserRepository) CreateNewUser(u *user.User) error {
	// GORM: Insert the struct directly
	result := r.db.Create(u)
	return result.Error
}

func (r *UserRepository) VerifyPassword(storedHash string, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(password))
	return err == nil
}
