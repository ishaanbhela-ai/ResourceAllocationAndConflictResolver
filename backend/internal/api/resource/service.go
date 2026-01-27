package resource

import (
	"ResourceAllocator/internal/api/utils"
	"fmt"
	"time"
)

type ResourceRepository interface {
	GetResourceByID(id int) (*Resource, error)
	GetAllResources(typeID *int, location string, props map[string]string, startTime, endTime *string, pagination utils.PaginationQuery) ([]ResourceSummary, int64, error)
	GetAllResourceTypes(pagination utils.PaginationQuery) ([]ResourceTypeSummary, int64, error)
	GetResourceTypeByID(id int) (*ResourceType, error)

	CreateResource(res *Resource) error
	CreateResourceType(resType *ResourceType) error

	DeleteResource(id int) error
	DeleteResourceType(id int) error

	UpdateResource(res *Resource) error
	UpdateResourceType(resType *ResourceType) error

	CountResourcesByType(typeID int) (int64, error)
}

type ResourceService struct {
	Repo ResourceRepository
}

func NewResourceService(repo ResourceRepository) *ResourceService {
	return &ResourceService{Repo: repo}
}

func (s *ResourceService) CreateResource(res *Resource) error {
	// 1. Fetch Type
	resType, err := s.Repo.GetResourceTypeByID(res.TypeID)
	if err != nil {
		return err
	}
	// 2. [NEW] Validate Properties
	if err := validateProperties(resType.SchemaDefinition, res.Properties); err != nil {
		return err
	}
	return s.Repo.CreateResource(res)
}

func (s *ResourceService) GetResourceByID(id int) (*Resource, error) {
	return s.Repo.GetResourceByID(id)
}

func (s *ResourceService) GetAllResources(typeID *int, location string, props map[string]string, startTime, endTime *string, pagination utils.PaginationQuery) ([]ResourceSummary, int64, error) {
	// VALIDATION LOGIC
	if len(props) > 0 {
		if typeID == nil {
			return nil, 0, fmt.Errorf("%w: cannot filter by properties without specifying type_id", utils.ErrInvalidInput)
		}
		// Verify properties against Schema
		resType, err := s.Repo.GetResourceTypeByID(*typeID)
		if err != nil {
			return nil, 0, err
		}
		for key := range props {
			if _, ok := resType.SchemaDefinition[key]; !ok {
				return nil, 0, fmt.Errorf("%w: property '%s' is not valid for this resource type", utils.ErrInvalidInput, key)
			}
		}
	}

	// [NEW] Temporal Filter Validation
	if startTime != nil && endTime != nil && *startTime != "" && *endTime != "" {
		start, err := time.Parse(time.RFC3339, *startTime)
		if err != nil {
			return nil, 0, fmt.Errorf("%w: invalid start_time format (expected RFC3339)", utils.ErrInvalidInput)
		}
		end, err := time.Parse(time.RFC3339, *endTime)
		if err != nil {
			return nil, 0, fmt.Errorf("%w: invalid end_time format (expected RFC3339)", utils.ErrInvalidInput)
		}

		if end.Before(start) {
			return nil, 0, fmt.Errorf("%w: end_time must be after start_time", utils.ErrInvalidInput)
		}

		// 9-5 and Holiday Checks
		if err := utils.IsWorkingHours(start, end); err != nil {
			return nil, 0, fmt.Errorf("%w: %v", utils.ErrInvalidInput, err)
		}
		if err := utils.IsHoliday(start); err != nil {
			return nil, 0, fmt.Errorf("%w: %v", utils.ErrInvalidInput, err)
		}
	}

	return s.Repo.GetAllResources(typeID, location, props, startTime, endTime, pagination)
}

func (s *ResourceService) UpdateResource(res *Resource) error {
	// if err == utils.ErrNotFound {
	// 	return err
	// }
	// return err
	resType, err := s.Repo.GetResourceTypeByID(res.TypeID)
	if err != nil {
		return err
	}

	// 2. [NEW] Validate Properties
	if err := validateProperties(resType.SchemaDefinition, res.Properties); err != nil {
		return err
	}

	return s.Repo.UpdateResource(res)
}

func (s *ResourceService) DeleteResource(id int) error {
	return s.Repo.DeleteResource(id)
}

func (s *ResourceService) CreateResourceType(resType *ResourceType) error {
	return s.Repo.CreateResourceType(resType)
}

func (s *ResourceService) GetAllResourceTypes(pagination utils.PaginationQuery) ([]ResourceTypeSummary, int64, error) {
	return s.Repo.GetAllResourceTypes(pagination)
}

func (s *ResourceService) GetResourceTypeByID(id int) (*ResourceType, error) {
	return s.Repo.GetResourceTypeByID(id)
}

func (s *ResourceService) UpdateResourceType(resType *ResourceType) error {
	return s.Repo.UpdateResourceType(resType)
}

func (s *ResourceService) DeleteResourceType(id int) error {
	count, err := s.Repo.CountResourcesByType(id)
	if err != nil {
		return err
	}
	if count > 0 {
		return fmt.Errorf("%w: cannot delete resource type, it is assigned to a specific resource", utils.ErrConflict) // "Cannot delete: assigned to resources"
	}
	return s.Repo.DeleteResourceType(id)
}

func validateProperties(schema map[string]string, props map[string]interface{}) error {
	for key := range schema {
		if _, exists := props[key]; !exists {
			// Return typed error!
			// We use fmt.Errorf to Wrap the sentinel with details
			return fmt.Errorf("%w: missing required property '%s'", utils.ErrInvalidInput, key)
		}
	}

	// Check for extra fields
	for key := range props {
		if _, exists := schema[key]; !exists {
			return fmt.Errorf("%w: unknown property '%s'", utils.ErrInvalidInput, key)
		}
	}
	return nil
}
