package repository

import (
	"ResourceAllocator/internal/api/resource"
	"ResourceAllocator/internal/api/utils"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"
)

type ResourceRepository struct {
	db *gorm.DB
}

func NewResourceRepository(db *gorm.DB) *ResourceRepository {
	return &ResourceRepository{db: db}
}

func (r *ResourceRepository) CreateResource(res *resource.Resource) error {
	if err := r.db.Create(res).Error; err != nil {
		if utils.IsDuplicateKeyError(err) {
			return fmt.Errorf("%w: resource already exists", utils.ErrConflict)
		}
		return err
	}
	return nil
}

func (r *ResourceRepository) GetResourceByID(id int) (*resource.Resource, error) {
	var res resource.Resource
	if err := r.db.First(&res, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("%w: resource not found", utils.ErrNotFound)
		}
		return nil, err
	}
	return &res, nil
}

func (r *ResourceRepository) GetAllResources(typeID *int, location string, props map[string]string) ([]resource.ResourceSummary, error) {
	var resources []resource.ResourceSummary
	query := r.db.Model(&resource.Resource{})
	// 1. Standard SQL Filters
	if typeID != nil {
		query = query.Where("type_id = ?", *typeID)
	}
	if location != "" {
		query = query.Where("location = ?", location)
	}
	// 2. Dynamic JSON Filters
	for key, value := range props {
		query = query.Where("properties::jsonb ->> ? = ?", key, value)
	}
	if err := query.Find(&resources).Error; err != nil {
		return nil, err
	}
	return resources, nil
}

func (r *ResourceRepository) UpdateResource(res *resource.Resource) error {
	if err := r.db.Save(res).Error; err != nil {
		if utils.IsDuplicateKeyError(err) {
			return fmt.Errorf("%w: resource already exists", utils.ErrConflict)
		}
		return err
	}
	return nil
}

func (r *ResourceRepository) DeleteResource(id int) error {
	result := r.db.Delete(&resource.Resource{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("%w: resource not found", utils.ErrNotFound)
	}
	return nil
}

func (r *ResourceRepository) CreateResourceType(resType *resource.ResourceType) error {
	if err := r.db.Create(resType).Error; err != nil {
		if utils.IsDuplicateKeyError(err) {
			return fmt.Errorf("%w: resource type already exists", utils.ErrConflict)
		}
		return err
	}
	return nil
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
		if errors.Is(err, gorm.ErrRecordNotFound) { // <--- CHECK
			return nil, fmt.Errorf("%w: resource type not found", utils.ErrNotFound)
		}
		return nil, err
	}
	return &resType, nil
}

func (r *ResourceRepository) UpdateResourceType(resType *resource.ResourceType) error {
	return r.db.Save(resType).Error
}

func (r *ResourceRepository) DeleteResourceType(id int) error {
	result := r.db.Delete(&resource.ResourceType{}, id)
	if result.Error != nil {
		// Import "errors" and check Postgres code
		var pgErr *pgconn.PgError
		if errors.As(result.Error, &pgErr) && pgErr.Code == "23503" {
			return fmt.Errorf("%w: resource type in use", utils.ErrConflict)
		}
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("%w: resource type not found", utils.ErrNotFound)
	}
	return nil
}

func (r *ResourceRepository) CountResourcesByType(typeID int) (int64, error) {
	var count int64
	if err := r.db.Model(&resource.Resource{}).Where("type_id = ?", typeID).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}
