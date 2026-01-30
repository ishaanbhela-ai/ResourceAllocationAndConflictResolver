package resource

import (
	"ResourceAllocator/internal/api/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type IResourceService interface {
	GetResourceByID(id int) (*Resource, error)
	GetAllResources(typeID *int, location string, props map[string]string, startTime, endTime *string, pagination utils.PaginationQuery) ([]ResourceSummary, int64, error)
	GetAllResourceTypes(pagination utils.PaginationQuery) ([]ResourceType, int64, error)
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
		utils.Error(c, http.StatusBadRequest, "invalid resource")
		return
	}
	res.Sanitize()
	if err := h.iservice.CreateResource(&res); err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusCreated, res)
}

func (h *ResourceHandler) GetResource(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "invalid resource ID")
		return
	}
	res, err := h.iservice.GetResourceByID(id)
	if err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusOK, res)
}

func (h *ResourceHandler) ListResources(c *gin.Context) {
	// 1. Pagination
	pagination := utils.GetPaginationParams(c)

	// 2. Standard Filters
	var typeID *int
	if tID := c.Query("type_id"); tID != "" {
		id, err := strconv.Atoi(tID)
		if err != nil {
			utils.Error(c, http.StatusBadRequest, "invalid type_id")
			return
		}
		typeID = &id
	}
	location := c.Query("location")

	// 3. Dynamic Filters
	props := make(map[string]string)
	for key, values := range c.Request.URL.Query() {
		if len(key) > 5 && key[:5] == "prop_" && len(values) > 0 {
			props[key[5:]] = values[0]
		}
	}

	// 4. Temporal Filter
	var startTime, endTime *string
	if st := c.Query("start_time"); st != "" {
		startTime = &st
	}
	if et := c.Query("end_time"); et != "" {
		endTime = &et
	}

	// 5. Call Service
	resources, total, err := h.iservice.GetAllResources(typeID, location, props, startTime, endTime, pagination)
	if err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusOK, utils.GetPaginatedResponse(resources, pagination.Page, pagination.Limit, total))
}

func (h *ResourceHandler) UpdateResource(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "invalid resource ID")
		return
	}
	var res Resource
	if err := c.ShouldBindJSON(&res); err != nil {
		utils.Error(c, http.StatusBadRequest, "invalid resource")
		return
	}
	res.Sanitize()
	res.ID = id
	if err := h.iservice.UpdateResource(&res); err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusOK, res)
}

func (h *ResourceHandler) DeleteResource(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "invalid resource ID")
		return
	}
	if err := h.iservice.DeleteResource(id); err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "resource deleted successfully"})
}

func (h *ResourceHandler) CreateResourceType(c *gin.Context) {
	var resType ResourceType
	if err := c.ShouldBindJSON(&resType); err != nil {
		utils.Error(c, http.StatusBadRequest, "invalid resource type")
		return
	}
	resType.Sanitize()
	if err := h.iservice.CreateResourceType(&resType); err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusCreated, resType)
}

func (h *ResourceHandler) ListResourceTypes(c *gin.Context) {
	pagination := utils.GetPaginationParams(c)
	types, total, err := h.iservice.GetAllResourceTypes(pagination)
	if err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusOK, utils.GetPaginatedResponse(types, pagination.Page, pagination.Limit, total))
}

func (h *ResourceHandler) GetResourceType(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "invalid resource type ID")
		return
	}
	resType, err := h.iservice.GetResourceTypeByID(id)
	if err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusOK, resType)
}

func (h *ResourceHandler) UpdateResourceType(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "invalid resource type ID")
		return
	}
	var resType ResourceType
	if err := c.ShouldBindJSON(&resType); err != nil {
		utils.Error(c, http.StatusBadRequest, "invalid resource type")
		return
	}
	resType.Sanitize()
	resType.ID = id
	if err := h.iservice.UpdateResourceType(&resType); err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusOK, resType)
}

func (h *ResourceHandler) DeleteResourceType(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "invalid resource type ID")
		return
	}
	if err := h.iservice.DeleteResourceType(id); err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "resource type deleted successfully"})
}
