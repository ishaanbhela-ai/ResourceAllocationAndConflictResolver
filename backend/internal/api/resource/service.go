package resource

import "errors"

type ResourceRepository interface {
	GetResourceByID(id int) (*Resource, error)
	GetAllResources(filters map[string]string) ([]ResourceSummary, error)
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
		return errors.New("resource type does not exist")
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

func (s *ResourceService) GetAllResources(filters map[string]string) ([]ResourceSummary, error) {
	return s.Repo.GetAllResources(filters)
}

func (s *ResourceService) UpdateResource(res *Resource) error {
	_, err := s.Repo.GetResourceTypeByID(res.TypeID)
	if err != nil {
		return errors.New("resource type does not exist")
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
	// 1. Check if any resources use this type
	count, err := s.Repo.CountResourcesByType(id)
	if err != nil {
		return err
	}
	if count > 0 {
		return errors.New("cannot delete resource type: it is currently assigned to existing resources")
	}
	// 2. Safe to delete
	return s.Repo.DeleteResourceType(id)
}

func validateProperties(schema map[string]string, props map[string]interface{}) error {
	for key := range schema {
		if _, exists := props[key]; !exists {
			return errors.New("missing required property " + key)
		}
	}
	return nil
}
