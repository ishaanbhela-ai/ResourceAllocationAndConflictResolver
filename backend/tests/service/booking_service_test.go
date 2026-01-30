package service_test

import (
	"ResourceAllocator/internal/api/booking"
	"ResourceAllocator/internal/api/resource" // Import Resource
	"ResourceAllocator/internal/api/user"     // Import User
	"ResourceAllocator/internal/api/utils"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// --- MOCK REPOSITORY ---
type MockBookingRepo struct {
	mock.Mock
}

func (m *MockBookingRepo) CreateBooking(b *booking.Booking) error {
	args := m.Called(b)
	// If the mock was set up to return an ID, simulate setting it
	if id := args.Int(1); id != 0 {
		b.ID = id
	}
	return args.Error(0)
}

func (m *MockBookingRepo) GetBookingByID(id int) (*booking.Booking, error) {
	args := m.Called(id)
	if b := args.Get(0); b != nil {
		return b.(*booking.Booking), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockBookingRepo) HasApprovedOverlap(resourceID int, start, end time.Time) (bool, error) {
	args := m.Called(resourceID, start, end)
	return args.Bool(0), args.Error(1)
}

// Stubs for other interface methods
func (m *MockBookingRepo) GetPendingOverlaps(resourceID int, start, end time.Time) ([]booking.Booking, error) {
	args := m.Called(resourceID, start, end)
	return args.Get(0).([]booking.Booking), args.Error(1)
}
func (m *MockBookingRepo) UpdateBooking(b *booking.Booking) error {
	args := m.Called(b)
	return args.Error(0)
}
func (m *MockBookingRepo) ApproveBookingAndRejectConflicts(targetBooking *booking.Booking) ([]booking.Booking, error) {
	args := m.Called(targetBooking)
	return args.Get(0).([]booking.Booking), args.Error(1)
}
func (m *MockBookingRepo) GetBookingsByUserID(userID string, filters map[string]interface{}, pagination utils.PaginationQuery) ([]booking.Booking, int64, error) {
	args := m.Called(userID, filters, pagination)
	return args.Get(0).([]booking.Booking), args.Get(1).(int64), args.Error(2)
}
func (m *MockBookingRepo) GetAllBookings(filters map[string]interface{}, pagination utils.PaginationQuery) ([]booking.Booking, int64, error) {
	args := m.Called(filters, pagination)
	return args.Get(0).([]booking.Booking), args.Get(1).(int64), args.Error(2)
}
func (m *MockBookingRepo) GetFutureApprovedBookings(resourceID int, startTime time.Time) ([]booking.Booking, error) {
	args := m.Called(resourceID, startTime)
	if val := args.Get(0); val != nil {
		return val.([]booking.Booking), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockBookingRepo) CheckInBooking(bookingId int) error {
	return m.Called(bookingId).Error(0)
}
func (m *MockBookingRepo) ReleaseUncheckedBookings(cutoffTime time.Time) error {
	return m.Called(cutoffTime).Error(0)
}
func (m *MockBookingRepo) GetApprovedBookingsStartingAt(startTime time.Time) ([]booking.Booking, error) {
	args := m.Called(startTime)
	if val := args.Get(0); val != nil {
		return val.([]booking.Booking), args.Error(1)
	}
	return nil, args.Error(1)
}
func (m *MockBookingRepo) CancelExpiredPendingBookings(cutoffTime time.Time) error {
	return m.Called(cutoffTime).Error(0)
}

func (m *MockBookingRepo) GetTopBookedResources(limit int) ([]booking.DashboardResourceStat, error) {
	args := m.Called(limit)
	if val := args.Get(0); val != nil {
		return val.([]booking.DashboardResourceStat), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockBookingRepo) GetTopReleasingUsers(limit int) ([]booking.DashboardUserStat, error) {
	args := m.Called(limit)
	if val := args.Get(0); val != nil {
		return val.([]booking.DashboardUserStat), args.Error(1)
	}
	return nil, args.Error(1)
}

// --- TEST SUITE ---

func TestCreateBooking_Success(t *testing.T) {
	// 1. Setup
	mockRepo := new(MockBookingRepo)
	svc := booking.NewBookingService(mockRepo)

	// Utils
	loc, _ := time.LoadLocation("Asia/Kolkata")
	if loc == nil {
		loc = time.UTC // Fallback for environments without zoneinfo
	}
	now := time.Now().In(loc)
	// Example: Start at next 10:00 AM, ensuring it's a weekday
	startTime := time.Date(now.Year(), now.Month(), now.Day()+1, 10, 0, 0, 0, loc)
	for startTime.Weekday() == time.Saturday || startTime.Weekday() == time.Sunday {
		startTime = startTime.AddDate(0, 0, 1)
	}
	endTime := startTime.Add(1 * time.Hour)

	req := &booking.BookingCreate{
		ResourceID: 101,
		StartTime:  startTime,
		EndTime:    endTime,
		Purpose:    "Discussion",
	}

	// 2. Expectations
	// Expect Overlap check -> Returns false (No overlap)
	mockRepo.On("HasApprovedOverlap", 101, startTime, endTime).Return(false, nil)

	// Expect Create -> Returns success
	// We use mock.AnythingOfType because the object pointer changes
	mockRepo.On("CreateBooking", mock.AnythingOfType("*booking.Booking")).Return(nil, 123)

	// Expect GetBookingByID (for summary) -> Returns full object
	mockRepo.On("GetBookingByID", 123).Return(&booking.Booking{
		ID:         123,
		ResourceID: 101,
		Status:     booking.StatusPending,
		StartTime:  startTime,
		EndTime:    endTime,
		Resource:   resource.Resource{Name: "Test Room"},                    // Correct Type
		User:       user.User{Name: "Test User", Email: "test@example.com"}, // Correct Type
	}, nil)

	// 3. Execution
	summary, err := svc.CreateBooking(req, "user-uuid-123")

	// 4. Assertions
	assert.NoError(t, err)
	assert.NotNil(t, summary)
	assert.Equal(t, 123, summary.ID)
	assert.Equal(t, "Test Room", summary.ResourceName)

	mockRepo.AssertExpectations(t)
}

func TestCreateBooking_Conflict(t *testing.T) {
	mockRepo := new(MockBookingRepo)
	svc := booking.NewBookingService(mockRepo)

	loc, _ := time.LoadLocation("Asia/Kolkata")
	now := time.Now().In(loc)
	startTime := time.Date(now.Year(), now.Month(), now.Day()+1, 10, 0, 0, 0, loc)
	endTime := startTime.Add(1 * time.Hour)

	req := &booking.BookingCreate{
		ResourceID: 101,
		StartTime:  startTime,
		EndTime:    endTime,
		Purpose:    "Conflict Test",
	}

	// Expect Overlap check -> Returns TRUE (Conflict exists)
	mockRepo.On("HasApprovedOverlap", 101, startTime, endTime).Return(true, nil)

	// Expect GetFutureApprovedBookings (Service tries to find suggestions)
	// Return empty list implies no suggestions found
	mockRepo.On("GetFutureApprovedBookings", 101, startTime).Return([]booking.Booking{}, nil)

	_, err := svc.CreateBooking(req, "user-uuid")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "slot unavailable") // Ensure correct error
	assert.ErrorIs(t, err, utils.ErrConflict)

	mockRepo.AssertNotCalled(t, "CreateBooking") // Should NOT trigger creation
}
