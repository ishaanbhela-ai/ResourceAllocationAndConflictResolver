package user

import (
	"ResourceAllocator/internal/api/response"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type IUserService interface {
	Login(email, password string) (*LoginResponse, error)
	CreateNewUser(user *UserCreate) error
	UpdateUser(user *User) (*User, error)
	GetUserByUUID(uuid string) (*User, error)
	ListUsers() ([]UserSummary, error)
	DeleteUser(uuid string) error
}

type UserHandler struct {
	iuserService IUserService
}

func NewUserHandler(iuserService IUserService) *UserHandler {
	return &UserHandler{iuserService: iuserService}
}

func (uh *UserHandler) Login(c *gin.Context) {
	var loginReq LoginRequest

	if err := c.ShouldBindJSON(&loginReq); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid login request")
		return
	}

	loginRes, err := uh.iuserService.Login(loginReq.Email, loginReq.Password)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	c.JSON(http.StatusOK, loginRes)
}

func (uh *UserHandler) CreateNewUser(c *gin.Context) {
	var userReq UserCreate

	if err := c.ShouldBindJSON(&userReq); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid user")
		return
	}

	err := uh.iuserService.CreateNewUser(&userReq)

	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
			response.Error(c, http.StatusConflict, "User with this email already exists")
			return
		}

		response.Error(c, http.StatusInternalServerError, "Failed to create user", err.Error())
		return
	}
	c.JSON(http.StatusCreated, userReq.User)
}

func (uh *UserHandler) UpdateUser(c *gin.Context) {
	// 1. Get Target UUID from URL (Since Admin is doing it)
	targetUUID := c.Param("uuid")

	var user User
	// 2. Bind the changes
	if err := c.ShouldBindJSON(&user); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid user data")
		return
	}

	user.UUID = targetUUID
	updatedUser, err := uh.iuserService.UpdateUser(&user)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to update user", err.Error())
		return
	}
	c.JSON(http.StatusOK, updatedUser)
}

func (uh *UserHandler) GetUser(c *gin.Context) {
	// SECURE: Get UUID from Context (set by Middleware)
	uuid, exists := c.Get("userUUID")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "Unauthorized: No user identity found")
		return
	}

	user, err := uh.iuserService.GetUserByUUID(uuid.(string))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to get user", err.Error())
		return
	}
	c.JSON(http.StatusOK, user)
}

func (uh *UserHandler) ListUsers(c *gin.Context) {
	users, err := uh.iuserService.ListUsers()

	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to list users", err.Error())
		return
	}

	c.JSON(http.StatusOK, users)
}

func (uh *UserHandler) DeleteUser(c *gin.Context) {
	uuisStr := c.Param("uuid")

	if err := uh.iuserService.DeleteUser(uuisStr); err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to delete User", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User Deleted Successfully"})
}
