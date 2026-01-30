package repository_test

import (
	"ResourceAllocator/internal/api/booking"
	"ResourceAllocator/internal/api/resource"
	"ResourceAllocator/internal/api/utils"
	"ResourceAllocator/internal/database/repository"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestCreateResource_Success(t *testing.T) {
	db := setupTestDB()
	repo := repository.NewResourceRepository(db)

	rt := &resource.ResourceType{
		Type: "MeetingRoom-" + uuid.NewString()[:8],
	}
	db.Create(rt)

	r := &resource.Resource{
		Name:        "Room 101",
		TypeID:      rt.ID,
		Description: "A nice room",
		Location:    "Floor 1",
		IsActive:    true,
	}

	err := repo.CreateResource(r)
	assert.NoError(t, err)
	assert.NotZero(t, r.ID)
}

func TestGetAllResources_TemporalFilter(t *testing.T) {
	db := setupTestDB()
	resRepo := repository.NewResourceRepository(db)
	bookRepo := repository.NewBookingRepository(db) // Need to create bookings

	// 1. Setup: Create Resource
	r := createTestResource(db, "Conf Room A")

	// 2. Setup: Create an APPROVED booking 10:00 - 12:00
	u := createTestUser(db, "u@test.com", "EMPLOYEE")
	baseTime := time.Date(2025, 1, 1, 10, 0, 0, 0, time.UTC)
	b := &booking.Booking{
		UserID:     u.UUID,
		ResourceID: r.ID,
		StartTime:  baseTime,
		EndTime:    baseTime.Add(2 * time.Hour),
		Status:     booking.StatusApproved,
	}
	bookRepo.CreateBooking(b)

	// 3. Test Cases for Filter
	tests := []struct {
		name        string
		queryStart  string
		queryEnd    string
		expectFound bool
	}{
		{
			name:        "Available (After booking)",
			queryStart:  "2025-01-01T13:00:00Z",
			queryEnd:    "2025-01-01T14:00:00Z",
			expectFound: true,
		},
		{
			name:        "Unavailable (Overlaps booking)",
			queryStart:  "2025-01-01T11:00:00Z",
			queryEnd:    "2025-01-01T13:00:00Z",
			expectFound: false, // Should NOT include this resource
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// NOTE: GetAllResources takes strings for start/end because they come from query params
			pagination := utils.PaginationQuery{Page: 1, Limit: 10}
			results, _, err := resRepo.GetAllResources(nil, "", nil, &tc.queryStart, &tc.queryEnd, pagination)
			assert.NoError(t, err)

			found := false
			for _, res := range results {
				if res.ID == r.ID {
					found = true
					break
				}
			}
			assert.Equal(t, tc.expectFound, found)
		})
	}
}
