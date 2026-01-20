package user

import (
	"ResourceAllocator/internal/api/response"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type IUserService interface {
	AdminLogin(email, password string) (*LoginResponse, error)
	CreateNewUser(user *User) error
}

type UserHandler struct {
	iuserService IUserService
}

func NewUserHandler(iuserService IUserService) *UserHandler {
	return &UserHandler{iuserService: iuserService}
}

func (uh *UserHandler) AdminLogin(c *gin.Context) {
	var loginReq LoginRequest

	if err := c.ShouldBindJSON(&loginReq); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid login request")
		return
	}

	loginRes, err := uh.iuserService.AdminLogin(loginReq.Email, loginReq.Password)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	c.JSON(http.StatusOK, loginRes)
}

func (uh *UserHandler) CreateNewUser(c *gin.Context) {
	var user User

	if err := c.ShouldBindJSON(&user); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid user")
		return
	}

	err := uh.iuserService.CreateNewUser(&user)

	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
			response.Error(c, http.StatusConflict, "User with this email already exists")
			return
		}

		response.Error(c, http.StatusInternalServerError, "Failed to create user", err.Error())
		return
	}
	c.JSON(http.StatusCreated, user)
}
