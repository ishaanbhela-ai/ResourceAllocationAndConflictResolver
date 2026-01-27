package booking

import (
	"ResourceAllocator/internal/api/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// 1. Service Interface
type IBookingService interface {
	CreateBooking(req *BookingCreate, userID string) (*Booking, error)
	GetMyBookings(userID string) ([]Booking, error)
	GetAllBookings(filters map[string]interface{}) ([]Booking, error)
	CancelBooking(id int, userID string) error
	UpdateStatus(id int, req *BookingStatusUpdate, approverID string) error
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
		utils.Error(c, http.StatusUnauthorized, "User identity missing")
		return
	}
	var req BookingCreate
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, "Invalid booking request")
		return
	}
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
		utils.Error(c, http.StatusUnauthorized, "User identity missing")
		return
	}
	bookings, err := h.service.GetMyBookings(userID.(string))
	if err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusOK, bookings)
}

func (h *BookingHandler) ListAllBookings(c *gin.Context) {
	// Extract optional filters from Query Params
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
	bookings, err := h.service.GetAllBookings(filters)
	if err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusOK, bookings)
}

func (h *BookingHandler) CancelBooking(c *gin.Context) {
	userID, exists := c.Get("userUUID")
	if !exists {
		utils.Error(c, http.StatusUnauthorized, "User identity missing")
		return
	}
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "Invalid booking ID")
		return
	}
	if err := h.service.CancelBooking(id, userID.(string)); err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Booking cancelled successfully"})
}

func (h *BookingHandler) UpdateBookingStatus(c *gin.Context) {
	approverID, exists := c.Get("userUUID")
	if !exists {
		utils.Error(c, http.StatusUnauthorized, "User identity missing")
		return
	}
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "Invalid booking ID")
		return
	}
	var req BookingStatusUpdate
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, "Invalid status update request")
		return
	}
	if err := h.service.UpdateStatus(id, &req, approverID.(string)); err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Booking status updated successfully"})
}
