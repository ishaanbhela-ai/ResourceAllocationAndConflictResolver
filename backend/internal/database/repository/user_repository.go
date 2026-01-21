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

func (r *UserRepository) GetUserByEmail(email string) (*user.UserCreate, error) {
	var u user.UserCreate
	// GORM will populate the embedded User fields + Password
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

func (r *UserRepository) CreateNewUser(u *user.UserCreate) error {
	// Note: You might need to make sure GORM inserts into the "users" table
	// If UserCreate doesn't map automatically, use Table("users")
	result := r.db.Table("users").Create(u)
	return result.Error
}

func (r *UserRepository) VerifyPassword(storedHash string, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(password))
	return err == nil
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
		return errors.New("user not found")
	}
	return nil
}

func (r *UserRepository) UpdateUser(u *user.User) error {
	_, err := r.GetUserByUUID(u.UUID)
	if err != nil {
		return err
	}
	return r.db.Model(&user.User{}).Where("uuid = ?", u.UUID).Updates(u).Error
}
