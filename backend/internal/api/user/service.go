package user

import (
	"errors"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// 1. UPDATED INTERFACE: Removed VerifyPassword (it's logic, not data access)
type UserRepository interface {
	GetUserByEmail(email string) (*User, error)
	GetUserByUUID(uuid string) (*User, error)
	CreateNewUser(user *User) error
}

type UserService struct {
	userRepo UserRepository
}

func NewUserService(userRepo UserRepository) *UserService {
	return &UserService{userRepo: userRepo}
}

func (s *UserService) AdminLogin(email, password string) (*LoginResponse, error) {
	user, err := s.userRepo.GetUserByEmail(email)

	if err != nil {
		log.Printf("Login error for %s: %v", email, err) // Log internal details
		return nil, errors.New("invalid credentials")
	}

	if user.Role != RoleAdmin {
		return nil, errors.New("access denied: admin only")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	token, err := s.generateToken(user)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	user.Password = ""

	return &LoginResponse{
		Token: token,
		User:  *user,
	}, nil
}

func (s *UserService) CreateNewUser(user *User) error {
	user.UUID = uuid.NewString()

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
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
		secretKey = "your-secret-key-change-in-production"
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
