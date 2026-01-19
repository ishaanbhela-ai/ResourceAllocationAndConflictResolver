package services

import (
	"ResourceAllocator/internal/models"
	"errors"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type UserRepository interface {
	GetUserByEmail(email string) (*models.User, error)
	GetUserByUUID(uuid string) (*models.User, error)
	CreateNewUser(user *models.User) error
	VerifyPassword(hashedPassword []byte, password string) bool
}

type UserService struct {
	userRepo UserRepository
}

func NewUserService(userRepo UserRepository) *UserService {
	return &UserService{userRepo: userRepo}
}

func (s *UserService) AdminLogin(email, password string) (*models.LoginRespose, error) {
	user, err := s.userRepo.GetUserByEmail(email)

	if err != nil {
		log.Println(err.Error())
		return nil, errors.New("Invalid Credentials")
	}

	if user.Role != models.RoleAdmin {
		return nil, errors.New("Access Denied: Admin Only")
	}

	if !s.userRepo.VerifyPassword(user.HashPassword, password) {
		return nil, errors.New("Invalid Credentials")
	}

	token, err := s.generateToken(user)
	if err != nil {
		return nil, errors.New("Failed to generate token")
	}

	user.HashPassword = nil

	return &models.LoginRespose{
		Token: token,
		User:  *user,
	}, nil
}

func (s *UserService) generateToken(user *models.User) (string, error) {
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
