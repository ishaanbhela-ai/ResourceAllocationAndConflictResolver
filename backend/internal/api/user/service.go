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

type UserRepository interface {
	GetUserByEmail(email string) (*User, error)
	GetUserByUUID(uuid string) (*User, error)
	CreateNewUser(user *User) error
	VerifyPassword(storedHash string, password string) bool
}

type UserService struct {
	userRepo UserRepository
}

func NewUserService(userRepo UserRepository) *UserService {
	return &UserService{userRepo: userRepo}
}

func (s *UserService) AdminLogin(email, password string) (*LoginRespose, error) {
	user, err := s.userRepo.GetUserByEmail(email)

	if err != nil {
		log.Println(err.Error())
		return nil, errors.New("Invalid Credentials")
	}

	if user.Role != RoleAdmin {
		return nil, errors.New("Access Denied: Admin Only")
	}

	if !s.userRepo.VerifyPassword(user.Password, password) {
		return nil, errors.New("Invalid Credentials")
	}

	token, err := s.generateToken(user)
	if err != nil {
		return nil, errors.New("Failed to generate token")
	}

	// don’t expose password hash
	user.Password = ""

	return &LoginRespose{
		Token: token,
		User:  *user,
	}, nil
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

func (s *UserService) CreateNewUser(user *User) error {
	user.UUID = uuid.NewString()
	user.CreatedAt = time.Now()

	// user.Password is the plain password coming in
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.Password = string(hashedPassword)
	return s.userRepo.CreateNewUser(user)
}
