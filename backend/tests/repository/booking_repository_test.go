package repository_test

import (
	"ResourceAllocator/internal/api/booking"
	"ResourceAllocator/internal/database/repository" // Import the repository package
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestCreateBooking(t *testing.T) {
	db := setupTestDB()
	repo := repository.NewBookingRepository(db)

	agent := createTestUser(db, "agent@test.com", "EMPLOYEE")
	res := createTestResource(db, "Focus Room 1")

	newBooking := &booking.Booking{
		UserID:     agent.UUID,
		ResourceID: res.ID,
		StartTime:  time.Now().Add(1 * time.Hour),
		EndTime:    time.Now().Add(2 * time.Hour),
		Status:     booking.StatusPending,
	}

	err := repo.CreateBooking(newBooking)
	assert.NoError(t, err)
	assert.NotZero(t, newBooking.ID)
}

func TestHasApprovedOverlap(t *testing.T) {
	db := setupTestDB()
	repo := repository.NewBookingRepository(db)

	// 1. Setup
	u := createTestUser(db, "u@test.com", "EMPLOYEE")
	r := createTestResource(db, "Boardroom")

	baseTime := time.Date(2025, 1, 1, 10, 0, 0, 0, time.UTC)

	// Create an EXISTING APPROVED booking: 10:00 - 12:00
	existing := &booking.Booking{
		UserID:     u.UUID,
		ResourceID: r.ID,
		StartTime:  baseTime,
		EndTime:    baseTime.Add(2 * time.Hour),
		Status:     booking.StatusApproved,
	}
	db.Create(existing)

	// 2. Test Scenarios
	tests := []struct {
		name        string
		start       time.Time
		end         time.Time
		expectError bool
		expectTrue  bool // Expect an overlap?
	}{
		{
			name:       "Exact Overlap",
			start:      baseTime,
			end:        baseTime.Add(2 * time.Hour),
			expectTrue: true,
		},
		{
			name:       "Partial Overlap (Start inside)",
			start:      baseTime.Add(1 * time.Hour),
			end:        baseTime.Add(3 * time.Hour),
			expectTrue: true,
		},
		{
			name:       "Partial Overlap (End inside)",
			start:      baseTime.Add(-1 * time.Hour),
			end:        baseTime.Add(1 * time.Hour),
			expectTrue: true,
		},
		{
			name:       "No Overlap (Before)",
			start:      baseTime.Add(-2 * time.Hour),
			end:        baseTime, // Ends exactly when existing starts
			expectTrue: false,
		},
		{
			name:       "No Overlap (After)",
			start:      baseTime.Add(2 * time.Hour), // Starts exactly when existing ends
			end:        baseTime.Add(4 * time.Hour),
			expectTrue: false,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			hasOverlap, err := repo.HasApprovedOverlap(r.ID, tc.start, tc.end)
			assert.NoError(t, err)
			assert.Equal(t, tc.expectTrue, hasOverlap)
		})
	}
}
