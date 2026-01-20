package resource

import "errors"

type ResourceRepository interface {
	GetResourceByID(id int) (*Resource, error)
	GetAllResources() ([]Resource, error)
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
	_, err := s.Repo.GetResourceTypeByID(res.TypeID)
	if err != nil {
		return errors.New("resource type does not exist")
	}

	return s.Repo.CreateResource(res)
}

func (s *ResourceService) GetResourceByID(id int) (*Resource, error) {
	return s.Repo.GetResourceByID(id)
}

func (s *ResourceService) GetAllResources() ([]Resource, error) {
	return s.Repo.GetAllResources()
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
