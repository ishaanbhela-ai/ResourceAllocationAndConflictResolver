package resource

import (
	"strings"
	"time"
)

type Resource struct {
	ID               int                    `json:"id" gorm:"primaryKey;autoIncrement"`
	Name             string                 `json:"name" binding:"required"`
	TypeID           int                    `json:"type_id" binding:"required"`
	Location         string                 `json:"location"`
	Description      string                 `json:"description" binding:"required"`
	IsActive         bool                   `json:"is_active" gorm:"default:true"`
	RequiresApproval bool                   `json:"requires_approval" gorm:"default:false"`
	Properties       map[string]interface{} `json:"properties" gorm:"type:jsonb;serializer:json"`
	CreatedAt        time.Time              `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt        time.Time              `json:"updated_at" gorm:"autoUpdateTime"`
}

type ResourceTypeSummary struct {
	ID   int    `json:"id" gorm:"primaryKey;autoIncrement"`
	Type string `json:"type" binding:"required" gorm:"unique"`
}

type ResourceType struct {
	ResourceTypeSummary
	SchemaDefinition map[string]string `json:"schema_definition" gorm:"type:jsonb;serializer:json"`
}

type ResourceSummary struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	TypeID   int    `json:"type_id"`
	Location string `json:"location"`
	IsActive bool   `json:"is_active"`
}

func (r *Resource) Sanitize() {
	r.Name = strings.TrimSpace(r.Name)
	r.Location = strings.TrimSpace(r.Location)
	r.Description = strings.TrimSpace(r.Description)
}
func (rt *ResourceType) Sanitize() {
	rt.Type = strings.TrimSpace(rt.Type)
}
