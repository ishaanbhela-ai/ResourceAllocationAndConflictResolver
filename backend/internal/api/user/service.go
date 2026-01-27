package user

import (
	"fmt"
	"os"
	"time"

	"ResourceAllocator/internal/api/utils"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// 1. UPDATED INTERFACE: Removed VerifyPassword (it's logic, not data access)
type UserRepository interface {
	GetUserByEmail(email string) (*CreateUser, error)
	GetUserByUUID(uuid string) (*User, error)
	CreateNewUser(user *CreateUser) error
	UpdateUser(user *User) error
	DeleteUser(uuid string) error
	ListUsers(pagination utils.PaginationQuery) ([]UserSummary, int64, error)
	// New Methods
	GetAuthUserByUUID(uuid string) (*CreateUser, error)
	UpdatePassword(uuid string, password string) error
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

func (s *UserService) CreateNewUser(user *CreateUser) error {
	user.UUID = uuid.NewString()
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return utils.ErrInternal
	}

	emailPass := user.Password
	emailBody := fmt.Sprintf("Hello! You have been registered for JOSH Software resource booking software!\n\nYour Username is: %s \nYour password is: %s \n\nYou can access the website from here: http://localhost:8080/api/auth/login \n\nDon't forget to change your password after you login!", user.Email, emailPass)

	user.Password = string(hashedPassword)

	if err := s.userRepo.CreateNewUser(user); err != nil {
		return err
	}

	utils.SendEmail(emailBody, user.Email, "Resource Booking Software: Registration Successful")

	user.Password = ""

	return nil
}

func (s *UserService) ChangePassword(userID string, req ChangePasswordRequest) error {
	// 1. Match New
	if req.NewPassword != req.ConfirmNewPassword {
		// Using fmt.Errorf to wrap standard errors is good practice, but here we can just return input error
		return utils.ErrInvalidInput // "passwords do not match" could be detailed
	}

	// 2. Get User (with password)
	u, err := s.userRepo.GetAuthUserByUUID(userID)
	if err != nil {
		return err
	}

	// 3. Verify Old
	err = bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(req.OldPassword))
	if err != nil {
		return utils.ErrUnauthorized // "old password incorrect"
	}

	// 4. Hash New
	hashed, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return utils.ErrInternal
	}

	// 5. Update
	return s.userRepo.UpdatePassword(userID, string(hashed))
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

func (s *UserService) ListUsers(pagination utils.PaginationQuery) ([]UserSummary, int64, error) {
	return s.userRepo.ListUsers(pagination)
}

func (s *UserService) DeleteUser(uuid string) error {
	_, err := s.GetUserByUUID(uuid)
	if err != nil {
		return err
	}
	return s.userRepo.DeleteUser(uuid)
}
