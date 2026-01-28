package repository_test

import (
	"ResourceAllocator/internal/api/booking"
	"ResourceAllocator/internal/api/resource"
	"ResourceAllocator/internal/api/user"
	"fmt"
	"log"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var testDB *gorm.DB

func TestMain(m *testing.M) {
	// 1. Setup Test Database Connection
	// Default to localhost if not provided
	dsn := os.Getenv("TEST_DB_DSN")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=resource_allocator_test port=5432 sslmode=disable"
	}

	var err error
	testDB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to test database: %v", err)
	}

	// 2. AutoMigrate Schema
	err = testDB.AutoMigrate(&user.CreateUser{}, &resource.Resource{}, &booking.Booking{})
	if err != nil {
		log.Fatalf("Failed to migrate test database: %v", err)
	}

	// 3. Run Tests
	code := m.Run()

	// 4. Teardown
	os.Exit(code)
}

func setupTestDB() *gorm.DB {
	err := testDB.Exec("TRUNCATE TABLE bookings, resources, users RESTART IDENTITY CASCADE").Error
	if err != nil {
		log.Fatalf("Failed to clean test database: %v", err)
	}
	return testDB
}

func createTestUser(db *gorm.DB, email string, role user.Role) *user.CreateUser {
	u := &user.CreateUser{
		User: user.User{
			UUID:       uuid.NewString(),
			Email:      email,
			Name:       "Test User",
			EmployeeID: "EMP-" + uuid.NewString()[:8],
			Role:       role,
			DOB:        time.Now().AddDate(-25, 0, 0),
		},
		Password: "password123",
	}
	if err := db.Create(u).Error; err != nil {
		panic(fmt.Sprintf("Failed to create test user: %v", err))
	}
	return u
}

func createTestResource(db *gorm.DB, name string) *resource.Resource {
	rt := &resource.ResourceType{
		ResourceTypeSummary: resource.ResourceTypeSummary{
			Type: "Conference Room " + uuid.NewString()[:8],
		},
		SchemaDefinition: map[string]string{"capacity": "integer"},
	}
	if err := db.Create(rt).Error; err != nil {
		panic(fmt.Sprintf("Failed to create test resource type: %v", err))
	}

	r := &resource.Resource{
		Name:        name,
		TypeID:      rt.ID,
		Description: "Descriptive test resource",
		Location:    "Building A, Floor 1",
		IsActive:    true,
	}
	if err := db.Create(r).Error; err != nil {
		panic(fmt.Sprintf("Failed to create test resource: %v", err))
	}
	return r
}
