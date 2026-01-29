package booking

import (
	"ResourceAllocator/internal/api/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// 1. Service Interface
type IBookingService interface {
	CreateBooking(req *BookingCreate, userID string) (*BookingSummary, error)
	GetMyBookings(userID string, filters map[string]interface{}, pagination utils.PaginationQuery) ([]BookingSummary, int64, error)
	GetAllBookings(filters map[string]interface{}, pagination utils.PaginationQuery) ([]BookingSummary, int64, error)
	CancelBooking(id int, userID string) error
	UpdateStatus(id int, req *BookingStatusUpdate, approverID string) error
	CheckInBooking(bookingId int, userId string) error
}

type BookingHandler struct {
	service IBookingService
}

func NewBookingHandler(service IBookingService) *BookingHandler {
	return &BookingHandler{service: service}
}

func (h *BookingHandler) CreateBooking(c *gin.Context) {
	userID, exists := c.Get("userUUID")
	if !exists {
		utils.Error(c, http.StatusUnauthorized, "user identity missing")
		return
	}
	var req BookingCreate
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, "invalid booking request")
		return
	}
	req.Sanitize()
	booking, err := h.service.CreateBooking(&req, userID.(string))
	if err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusCreated, booking)
}

func (h *BookingHandler) ListMyBookings(c *gin.Context) {
	userID, exists := c.Get("userUUID")
	if !exists {
		utils.Error(c, http.StatusUnauthorized, "user identity missing")
		return
	}

	pagination := utils.GetPaginationParams(c)

	// Optional filtering for Employee as well (status, etc.)
	filters := make(map[string]interface{})
	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}
	if resourceID := c.Query("resource_id"); resourceID != "" {
		filters["resource_id"] = resourceID
	}

	bookings, total, err := h.service.GetMyBookings(userID.(string), filters, pagination)
	if err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusOK, utils.GetPaginatedResponse(bookings, pagination.Page, pagination.Limit, total))
}

func (h *BookingHandler) ListAllBookings(c *gin.Context) {
	pagination := utils.GetPaginationParams(c)

	// Extract filters from Query Params
	filters := make(map[string]interface{})

	if resourceID := c.Query("resource_id"); resourceID != "" {
		filters["resource_id"] = resourceID
	}
	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}
	if userID := c.Query("user_id"); userID != "" {
		filters["user_id"] = userID
	}

	bookings, total, err := h.service.GetAllBookings(filters, pagination)
	if err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusOK, utils.GetPaginatedResponse(bookings, pagination.Page, pagination.Limit, total))
}

func (h *BookingHandler) CancelBooking(c *gin.Context) {
	userID, exists := c.Get("userUUID")
	if !exists {
		utils.Error(c, http.StatusUnauthorized, "user identity missing")
		return
	}
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "invalid booking ID")
		return
	}
	if err := h.service.CancelBooking(id, userID.(string)); err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "booking cancelled successfully"})
}

func (h *BookingHandler) UpdateBookingStatus(c *gin.Context) {
	approverID, exists := c.Get("userUUID")
	if !exists {
		utils.Error(c, http.StatusUnauthorized, "user identity missing")
		return
	}
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "invalid booking ID")
		return
	}
	var req BookingStatusUpdate
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, "invalid status update request")
		return
	}
	if err := h.service.UpdateStatus(id, &req, approverID.(string)); err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "booking status updated successfully"})
}

func (h *BookingHandler) CheckIn(c *gin.Context) {
	userId, exists := c.Get("userUUID")

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "invalid booking ID")
		return
	}

	if err := h.service.CheckInBooking(id, userId.(string)); err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "successfully checked in booking. enjoy!"})
}
