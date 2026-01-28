package repository_test

import (
	"ResourceAllocator/internal/api/user"
	"ResourceAllocator/internal/api/utils"
	"ResourceAllocator/internal/database/repository" // Import the repository package
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestCreateUser_Success(t *testing.T) {
	db := setupTestDB()
	repo := repository.NewUserRepository(db)

	u := &user.CreateUser{
		User: user.User{
			UUID:       uuid.NewString(),
			Name:       "Test User",
			Email:      "unique@test.com",
			EmployeeID: "EMP-001",
			Role:       user.RoleEmployee,
			DOB:        time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC),
		},
		Password: "hashed_password",
	}

	err := repo.CreateNewUser(u)
	assert.NoError(t, err)

	// Verify retrieval
	retrieved, err := repo.GetUserByEmail("unique@test.com")
	assert.NoError(t, err)
	assert.Equal(t, u.UUID, retrieved.UUID)
}

func TestCreateUser_DuplicateEmail(t *testing.T) {
	db := setupTestDB()
	repo := repository.NewUserRepository(db)

	// 1. Create first user
	createTestUser(db, "duplicate@test.com", user.RoleEmployee)

	// 2. Try to create second user with SAME email
	u2 := &user.CreateUser{
		User: user.User{
			UUID:       uuid.NewString(),
			Name:       "Another User",
			Email:      "duplicate@test.com", // Constraint Violation
			EmployeeID: "EMP-002",            // Unique
			Role:       user.RoleEmployee,
			DOB:        time.Now(),
		},
		Password: "pass",
	}

	err := repo.CreateNewUser(u2)
	assert.Error(t, err)
	// Check if it wraps ErrConflict (as defined in your Repository code)
	assert.ErrorIs(t, err, utils.ErrConflict)
}

func TestCreateUser_DuplicateEmployeeID(t *testing.T) {
	db := setupTestDB()
	repo := repository.NewUserRepository(db)

	// 1. Create first user with EMP-001
	u1 := &user.CreateUser{
		User: user.User{
			UUID:       uuid.NewString(),
			Name:       "User One",
			Email:      "one@test.com",
			EmployeeID: "EMP-001",
			Role:       user.RoleEmployee,
			DOB:        time.Now(),
		},
		Password: "pass",
	}
	repo.CreateNewUser(u1)

	// 2. Try to create second user with SAME EMP-001 but different email
	u2 := &user.CreateUser{
		User: user.User{
			UUID:       uuid.NewString(),
			Name:       "User Two",
			Email:      "two@test.com",
			EmployeeID: "EMP-001", // Constraint Violation
			Role:       user.RoleEmployee,
			DOB:        time.Now(),
		},
		Password: "pass",
	}

	err := repo.CreateNewUser(u2)
	assert.Error(t, err)
	assert.ErrorIs(t, err, utils.ErrConflict)
}
