package resource

import (
	"ResourceAllocator/internal/api/utils"
	"fmt"
)

type ResourceRepository interface {
	GetResourceByID(id int) (*Resource, error)
	GetAllResources(typeID *int, location string, props map[string]string) ([]ResourceSummary, error)
	GetAllResourceTypes() ([]ResourceType, error)
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

func (s *ResourceService) GetAllResources(typeID *int, location string, props map[string]string) ([]ResourceSummary, error) {
	// VALIDATION LOGIC
	if len(props) > 0 {
		if typeID == nil {
			return nil, fmt.Errorf("%w: cannot filter by properties without specifying type_id", utils.ErrInvalidInput)
		}
		// Verify properties against Schema
		resType, err := s.Repo.GetResourceTypeByID(*typeID)
		if err != nil {
			return nil, err
		}
		for key := range props {
			if _, ok := resType.SchemaDefinition[key]; !ok {
				return nil, fmt.Errorf("%w: property '%s' is not valid for this resource type", utils.ErrInvalidInput, key)
			}
		}
	}
	return s.Repo.GetAllResources(typeID, location, props)
}

func (s *ResourceService) UpdateResource(res *Resource) error {
	_, err := s.Repo.GetResourceTypeByID(res.TypeID)
	if err != nil {
		if err == utils.ErrNotFound {
			return err
		}
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

func (s *ResourceService) GetAllResourceTypes() ([]ResourceType, error) {
	return s.Repo.GetAllResourceTypes()
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
		return utils.ErrConflict // "Cannot delete: assigned to resources"
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
	return nil
}
