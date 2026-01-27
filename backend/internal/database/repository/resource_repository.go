package repository

import (
	"ResourceAllocator/internal/api/resource"

	"gorm.io/gorm"
)

type ResourceRepository struct {
	db *gorm.DB
}

func NewResourceRepository(db *gorm.DB) *ResourceRepository {
	return &ResourceRepository{db: db}
}

func (r *ResourceRepository) CreateResource(res *resource.Resource) error {
	return r.db.Create(res).Error
}

func (r *ResourceRepository) GetResourceByID(id int) (*resource.Resource, error) {
	var res resource.Resource
	if err := r.db.First(&res, id).Error; err != nil {
		return nil, err
	}
	return &res, nil
}

func (r *ResourceRepository) GetAllResources(filters map[string]string) ([]resource.ResourceSummary, error) {
	var resources []resource.ResourceSummary

	query := r.db.Model(&resource.Resource{})
	// [NEW] Apply dynamic filters
	// filters might contain {"ram": "16GB"}
	for key, value := range filters {
		// Postgres JSONB syntax: properties ->> 'key' = 'value'
		query = query.Where("properties ->> ? = ?", key, value)
	}
	if err := query.Find(&resources).Error; err != nil {
		return nil, err
	}
	return resources, nil
}

func (r *ResourceRepository) UpdateResource(res *resource.Resource) error {
	return r.db.Save(res).Error
}

func (r *ResourceRepository) DeleteResource(id int) error {
	return r.db.Delete(&resource.Resource{}, id).Error
}

func (r *ResourceRepository) CreateResourceType(resType *resource.ResourceType) error {
	return r.db.Create(resType).Error
}

func (r *ResourceRepository) GetAllResourceTypes() ([]resource.ResourceType, error) {
	var types []resource.ResourceType
	if err := r.db.Find(&types).Error; err != nil {
		return nil, err
	}
	return types, nil
}

func (r *ResourceRepository) GetResourceTypeByID(id int) (*resource.ResourceType, error) {
	var resType resource.ResourceType
	if err := r.db.First(&resType, id).Error; err != nil {
		return nil, err
	}
	return &resType, nil
}

func (r *ResourceRepository) UpdateResourceType(resType *resource.ResourceType) error {
	return r.db.Save(resType).Error
}

func (r *ResourceRepository) DeleteResourceType(id int) error {
	return r.db.Delete(&resource.ResourceType{}, id).Error
}

func (r *ResourceRepository) CountResourcesByType(typeID int) (int64, error) {
	var count int64
	if err := r.db.Model(&resource.Resource{}).Where("type_id = ?", typeID).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}
