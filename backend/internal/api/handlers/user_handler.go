package handlers

import (
	"ResourceAllocator/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

type UserService interface {
	AdminLogin(email, password string) (*models.LoginRespose, error)
}

type UserHandler struct {
	userService UserService
}

func NewUserHandler(userService UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

func (uh *UserHandler) AdminLogin(c *gin.Context) {
	var loginReq models.LoginRequest

	if err := c.ShouldBindJSON(&loginReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := uh.userService.AdminLogin(loginReq.Email, loginReq.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}
