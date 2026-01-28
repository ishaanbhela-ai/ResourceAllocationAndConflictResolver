package service_test

import (
	"ResourceAllocator/internal/api/user"
	"ResourceAllocator/internal/api/utils"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"golang.org/x/crypto/bcrypt"
)

// --- MOCK REPOSITORY ---
type MockUserRepo struct {
	mock.Mock
}

func (m *MockUserRepo) GetUserByEmail(email string) (*user.CreateUser, error) {
	args := m.Called(email)
	if u := args.Get(0); u != nil {
		return u.(*user.CreateUser), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockUserRepo) GetAuthUserByUUID(uuid string) (*user.CreateUser, error) {
	args := m.Called(uuid)
	if u := args.Get(0); u != nil {
		return u.(*user.CreateUser), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockUserRepo) CreateNewUser(u *user.CreateUser) error {
	args := m.Called(u)
	return args.Error(0)
}

func (m *MockUserRepo) UpdatePassword(uuid string, password string) error {
	args := m.Called(uuid, password)
	return args.Error(0)
}

// Stubs for other interface methods
func (m *MockUserRepo) GetUserByUUID(uuid string) (*user.User, error) {
	args := m.Called(uuid)
	if u := args.Get(0); u != nil {
		return u.(*user.User), args.Error(1)
	}
	return nil, args.Error(1)
}
func (m *MockUserRepo) UpdateUser(u *user.User) error {
	return m.Called(u).Error(0)
}
func (m *MockUserRepo) DeleteUser(uuid string) error {
	return m.Called(uuid).Error(0)
}
func (m *MockUserRepo) ListUsers(pagination utils.PaginationQuery) ([]user.UserSummary, int64, error) {
	args := m.Called(pagination)
	return args.Get(0).([]user.UserSummary), args.Get(1).(int64), args.Error(2)
}

// --- TEST SUITE ---

func TestLogin_Success(t *testing.T) {
	os.Setenv("JWT_SECRET", "test_secret")
	mockRepo := new(MockUserRepo)
	svc := user.NewUserService(mockRepo)

	password := "securePass123"
	hashed, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	mockUser := &user.CreateUser{
		User: user.User{
			UUID:  "123",
			Email: "test@example.com",
			Name:  "Test User",
			Role:  user.RoleEmployee,
		},
		Password: string(hashed), // Store Hash
	}

	// Expect Repo to be called
	mockRepo.On("GetUserByEmail", "test@example.com").Return(mockUser, nil)

	// Action
	resp, err := svc.Login("test@example.com", password)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.NotEmpty(t, resp.Token)
	assert.Equal(t, "test@example.com", resp.User.Email)
}

func TestLogin_InvalidPassword(t *testing.T) {
	mockRepo := new(MockUserRepo)
	svc := user.NewUserService(mockRepo)

	hashed, _ := bcrypt.GenerateFromPassword([]byte("correctPass"), bcrypt.DefaultCost)
	mockUser := &user.CreateUser{
		User:     user.User{Email: "test@example.com"},
		Password: string(hashed),
	}

	mockRepo.On("GetUserByEmail", "test@example.com").Return(mockUser, nil)

	// Action with WRONG password
	resp, err := svc.Login("test@example.com", "wrongPass")

	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Equal(t, utils.ErrInvalidCredentials, err)
}

func TestCreateNewUser_Success(t *testing.T) {
	mockRepo := new(MockUserRepo)
	svc := user.NewUserService(mockRepo)

	req := &user.CreateUser{
		User:     user.User{Email: "new@test.com", Name: "New User"},
		Password: "plainPassword",
	}

	// Expect CreateNewUser to be called
	// Validate that the password passed to Repo is NOT plain text
	mockRepo.On("CreateNewUser", mock.MatchedBy(func(u *user.CreateUser) bool {
		// Verify email matches
		if u.Email != "new@test.com" {
			return false
		}
		// Verify UUID was generated
		if u.UUID == "" {
			return false
		}
		// Verify Password is Hashed (not "plainPassword")
		return u.Password != "plainPassword"
	})).Return(nil)

	err := svc.CreateNewUser(req)

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestChangePassword_Success(t *testing.T) {
	mockRepo := new(MockUserRepo)
	svc := user.NewUserService(mockRepo)

	oldPass := "oldPass"
	hashedOld, _ := bcrypt.GenerateFromPassword([]byte(oldPass), bcrypt.DefaultCost)

	// Assume Auth middleware extracted UUID "u-1"
	mockRepo.On("GetAuthUserByUUID", "u-1").Return(&user.CreateUser{
		User:     user.User{UUID: "u-1"},
		Password: string(hashedOld),
	}, nil)

	// Expect UpdatePassword with ANY new hash (since hash is random/salted)
	mockRepo.On("UpdatePassword", "u-1", mock.AnythingOfType("string")).Return(nil)

	req := user.ChangePasswordRequest{
		OldPassword:        oldPass,
		NewPassword:        "newPass",
		ConfirmNewPassword: "newPass",
	}

	err := svc.ChangePassword("u-1", req)
	assert.NoError(t, err)
}

func TestChangePassword_Mismatch(t *testing.T) {
	mockRepo := new(MockUserRepo)
	svc := user.NewUserService(mockRepo)

	req := user.ChangePasswordRequest{
		OldPassword:        "old",
		NewPassword:        "new",
		ConfirmNewPassword: "mismatch",
	}

	err := svc.ChangePassword("u-1", req)
	assert.Error(t, err)
	assert.Equal(t, utils.ErrInvalidInput, err)

	mockRepo.AssertNotCalled(t, "GetAuthUserByUUID") // Should fail fast
}
