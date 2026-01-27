package resource

import (
	"ResourceAllocator/internal/api/response"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type IResourceService interface {
	GetResourceByID(id int) (*Resource, error)
	GetAllResources(filters map[string]string) ([]ResourceSummary, error)
	GetAllResourceTypes() ([]ResourceType, error)
	GetResourceTypeByID(id int) (*ResourceType, error)

	CreateResource(res *Resource) error
	CreateResourceType(resType *ResourceType) error

	UpdateResource(res *Resource) error
	UpdateResourceType(resType *ResourceType) error

	DeleteResourceType(id int) error
	DeleteResource(id int) error
}

type ResourceHandler struct {
	iservice IResourceService
}

func NewResourceHandler(iservice IResourceService) *ResourceHandler {
	return &ResourceHandler{iservice: iservice}
}

func (h *ResourceHandler) CreateResource(c *gin.Context) {
	var res Resource
	if err := c.ShouldBindJSON(&res); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid resource")
		return
	}

	if err := h.iservice.CreateResource(&res); err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to create resource", err.Error())
		return
	}

	c.JSON(http.StatusCreated, res)
}

func (h *ResourceHandler) GetResource(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid resource ID")
		return
	}

	res, err := h.iservice.GetResourceByID(id)
	if err != nil {
		response.Error(c, http.StatusNotFound, "Resource not found")
		return
	}

	c.JSON(http.StatusOK, res)
}

func (h *ResourceHandler) ListResources(c *gin.Context) {
	// 1. Extract filters starting with "prop_"
	filters := make(map[string]string)
	queryParams := c.Request.URL.Query()

	for key, values := range queryParams {
		if len(key) > 5 && key[:5] == "prop_" && len(values) > 0 {
			// prop_ram -> ram
			actualKey := key[5:]
			filters[actualKey] = values[0]
		}
	}
	// 2. Pass filters to service
	resources, err := h.iservice.GetAllResources(filters)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to fetch resources", err.Error())
		return
	}
	c.JSON(http.StatusOK, resources)
}

func (h *ResourceHandler) UpdateResource(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid resource ID")
		return
	}

	var res Resource
	if err := c.ShouldBindJSON(&res); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid resource")
		return
	}
	res.ID = id // Ensure ID matches URL param

	if err := h.iservice.UpdateResource(&res); err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to update resource", err.Error())
		return
	}

	c.JSON(http.StatusOK, res)
}

func (h *ResourceHandler) DeleteResource(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid resource ID")
		return
	}

	if err := h.iservice.DeleteResource(id); err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to delete resource", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Resource deleted successfully"})
}

func (h *ResourceHandler) CreateResourceType(c *gin.Context) {
	var resType ResourceType
	if err := c.ShouldBindJSON(&resType); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid resource type")
		return
	}

	if err := h.iservice.CreateResourceType(&resType); err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to create resource type", err.Error())
		return
	}

	c.JSON(http.StatusCreated, resType)
}

func (h *ResourceHandler) ListResourceTypes(c *gin.Context) {
	types, err := h.iservice.GetAllResourceTypes()
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to fetch resource types", err.Error())
		return
	}

	c.JSON(http.StatusOK, types)
}

func (h *ResourceHandler) GetResourceType(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid resource type ID")
		return
	}

	resType, err := h.iservice.GetResourceTypeByID(id)
	if err != nil {
		response.Error(c, http.StatusNotFound, "Resource type not found")
		return
	}

	c.JSON(http.StatusOK, resType)
}

func (h *ResourceHandler) UpdateResourceType(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid resource type ID")
		return
	}

	var resType ResourceType
	if err := c.ShouldBindJSON(&resType); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid resource type ID")
		return
	}
	resType.ID = id

	if err := h.iservice.UpdateResourceType(&resType); err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to update resource type", err.Error())
		return
	}

	c.JSON(http.StatusOK, resType)
}

func (h *ResourceHandler) DeleteResourceType(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid resource type ID")
		return
	}

	if err := h.iservice.DeleteResourceType(id); err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to delete resource type", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Resource type deleted successfully"})
}
