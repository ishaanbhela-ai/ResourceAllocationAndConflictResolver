package service_test

import (
	"ResourceAllocator/internal/api/resource"
	"ResourceAllocator/internal/api/utils"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// --- MOCK REPOSITORY ---
type MockResourceRepo struct {
	mock.Mock
}

func (m *MockResourceRepo) GetResourceTypeByID(id int) (*resource.ResourceType, error) {
	args := m.Called(id)
	if r := args.Get(0); r != nil {
		return r.(*resource.ResourceType), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockResourceRepo) CreateResource(res *resource.Resource) error {
	args := m.Called(res)
	return args.Error(0)
}

func (m *MockResourceRepo) CountResourcesByType(typeID int) (int64, error) {
	args := m.Called(typeID)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockResourceRepo) DeleteResourceType(id int) error {
	args := m.Called(id)
	return args.Error(0)
}

// Stubs
func (m *MockResourceRepo) GetResourceByID(id int) (*resource.Resource, error) {
	args := m.Called(id)
	if r := args.Get(0); r != nil {
		return r.(*resource.Resource), args.Error(1)
	}
	return nil, args.Error(1)
}
func (m *MockResourceRepo) GetAllResources(typeID *int, location string, props map[string]string, startTime, endTime *string, pagination utils.PaginationQuery) ([]resource.ResourceSummary, int64, error) {
	args := m.Called(typeID, location, props, startTime, endTime, pagination)
	return args.Get(0).([]resource.ResourceSummary), args.Get(1).(int64), args.Error(2)
}
func (m *MockResourceRepo) GetAllResourceTypes(pagination utils.PaginationQuery) ([]resource.ResourceType, int64, error) {
	args := m.Called(pagination)
	return args.Get(0).([]resource.ResourceType), args.Get(1).(int64), args.Error(2)
}
func (m *MockResourceRepo) CreateResourceType(resType *resource.ResourceType) error {
	return m.Called(resType).Error(0)
}
func (m *MockResourceRepo) DeleteResource(id int) error {
	return m.Called(id).Error(0)
}
func (m *MockResourceRepo) UpdateResource(res *resource.Resource) error {
	return m.Called(res).Error(0)
}
func (m *MockResourceRepo) UpdateResourceType(resType *resource.ResourceType) error {
	return m.Called(resType).Error(0)
}

// --- TEST SUITE ---

func TestCreateResource_ValidationSuccess(t *testing.T) {
	mockRepo := new(MockResourceRepo)
	svc := resource.NewResourceService(mockRepo)

	// Local mock setup
	resType := &resource.ResourceType{
		ID:               1,
		Type:             "Room",
		SchemaDefinition: map[string]string{"capacity": "int"},
	}
	mockRepo.On("GetResourceTypeByID", 1).Return(resType, nil)

	validRes := &resource.Resource{
		Name:       "Room 1",
		TypeID:     1,
		Properties: map[string]interface{}{"capacity": 10},
	}

	mockRepo.On("CreateResource", validRes).Return(nil)

	err := svc.CreateResource(validRes)
	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestCreateResource_ValidationFail_MissingProp(t *testing.T) {
	mockRepo := new(MockResourceRepo)
	svc := resource.NewResourceService(mockRepo)

	resType := &resource.ResourceType{
		ID:               1,
		SchemaDefinition: map[string]string{"capacity": "int"}, // Required
	}
	mockRepo.On("GetResourceTypeByID", 1).Return(resType, nil)

	invalidRes := &resource.Resource{
		TypeID:     1,
		Properties: map[string]interface{}{}, // Missing 'capacity'
	}

	err := svc.CreateResource(invalidRes)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "missing required property")

	mockRepo.AssertNotCalled(t, "CreateResource")
}

func TestDeleteResourceType_Conflict(t *testing.T) {
	mockRepo := new(MockResourceRepo)
	svc := resource.NewResourceService(mockRepo)

	// Simulate that there are 5 resources using this Type
	mockRepo.On("CountResourcesByType", 99).Return(int64(5), nil)

	err := svc.DeleteResourceType(99)
	assert.Error(t, err)
	assert.ErrorIs(t, err, utils.ErrConflict) // Should fail safely

	mockRepo.AssertNotCalled(t, "DeleteResourceType")
}
