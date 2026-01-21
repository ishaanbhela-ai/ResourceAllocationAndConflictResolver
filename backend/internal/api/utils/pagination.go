package utils

import (
	"math"
	"strconv"

	"github.com/gin-gonic/gin"
)

// PaginationQuery defines standard pagination parameters
type PaginationQuery struct {
	Page  int `json:"page" form:"page"`
	Limit int `json:"limit" form:"limit"`
}

// Meta defines the pagination metadata in the response
type Meta struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
}

// PaginatedResponse defines the standard response structure
type PaginatedResponse struct {
	Data interface{} `json:"data"`
	Meta Meta        `json:"meta"`
}

// GetPaginationParams extracts pagination parameters from the request context.
// Defaults: Page 1, Limit 10. Max Limit 100.
func GetPaginationParams(c *gin.Context) PaginationQuery {
	page, err := strconv.Atoi(c.Query("page"))
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(c.Query("limit"))
	if err != nil || limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}

	return PaginationQuery{
		Page:  page,
		Limit: limit,
	}
}

// GetPaginatedResponse constructs the response with metadata
func GetPaginatedResponse(data interface{}, page, limit int, total int64) PaginatedResponse {
	totalPages := int(math.Ceil(float64(total) / float64(limit)))

	return PaginatedResponse{
		Data: data,
		Meta: Meta{
			Page:       page,
			Limit:      limit,
			Total:      total,
			TotalPages: totalPages,
		},
	}
}
