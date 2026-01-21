package user

import (
	"os"
	"time"

	"ResourceAllocator/internal/api/utils"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// 1. UPDATED INTERFACE: Removed VerifyPassword (it's logic, not data access)
type UserRepository interface {
	// Return UserCreate here (contains password)
	GetUserByEmail(email string) (*UserCreate, error)
	GetUserByUUID(uuid string) (*User, error)
	// Accept UserCreate here
	CreateNewUser(user *UserCreate) error
	UpdateUser(user *User) error
	DeleteUser(uuid string) error
	ListUsers() ([]UserSummary, error)
}

type UserService struct {
	userRepo UserRepository
}

func NewUserService(userRepo UserRepository) *UserService {
	return &UserService{userRepo: userRepo}
}

func (s *UserService) Login(email, password string) (*LoginResponse, error) {
	userWithPass, err := s.userRepo.GetUserByEmail(email)

	if err != nil {
		return nil, utils.ErrInvalidCredentials
	}

	err = bcrypt.CompareHashAndPassword([]byte(userWithPass.Password), []byte(password))
	if err != nil {
		return nil, utils.ErrInvalidCredentials
	}

	token, err := s.generateToken(&userWithPass.User)
	if err != nil {
		return nil, utils.ErrInternal
	}

	return &LoginResponse{
		Token: token,
		User:  userWithPass.User, // Return the User part (without password)
	}, nil
}

func (s *UserService) CreateNewUser(user *UserCreate) error {
	user.UUID = uuid.NewString()
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return utils.ErrInternal
	}

	user.Password = string(hashedPassword)

	if err := s.userRepo.CreateNewUser(user); err != nil {
		return err
	}

	user.Password = ""

	return nil
}

func (s *UserService) generateToken(user *User) (string, error) {
	secretKey := os.Getenv("JWT_SECRET")
	if secretKey == "" {
		return "", utils.ErrInternal
	}

	claims := jwt.MapClaims{
		"uuid":  user.UUID,
		"email": user.Email,
		"role":  string(user.Role),
		"exp":   time.Now().Add(time.Hour * 24).Unix(),
		"iat":   time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secretKey))
}

func (s *UserService) UpdateUser(user *User) (*User, error) {
	_, err := s.GetUserByUUID(user.UUID)
	if err != nil {
		return nil, err
	}
	err = s.userRepo.UpdateUser(user)
	if err != nil {
		return nil, err
	}
	return s.GetUserByUUID(user.UUID)
}

func (s *UserService) GetUserByUUID(uuid string) (*User, error) {
	return s.userRepo.GetUserByUUID(uuid)
}

func (s *UserService) ListUsers() ([]UserSummary, error) {
	return s.userRepo.ListUsers()
}

func (s *UserService) DeleteUser(uuid string) error {
	_, err := s.GetUserByUUID(uuid)
	if err != nil {
		return err
	}
	return s.userRepo.DeleteUser(uuid)
}
