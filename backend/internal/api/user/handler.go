package user

import (
	"ResourceAllocator/internal/api/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

// 1. Service Interface
type IUserService interface {
	Login(email, password string) (*LoginResponse, error)
	CreateNewUser(user *CreateUser) error
	UpdateUser(user *User) (*User, error)
	GetUserByUUID(uuid string) (*User, error)
	ListUsers(pagination utils.PaginationQuery) ([]UserSummary, int64, error)
	DeleteUser(uuid string) error
	ChangePassword(userID string, req ChangePasswordRequest) error
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
		utils.Error(c, http.StatusBadRequest, "Invalid login request")
		return
	}
	loginRes, err := uh.iuserService.Login(loginReq.Email, loginReq.Password)
	if err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusOK, loginRes)
}

func (uh *UserHandler) CreateNewUser(c *gin.Context) {
	var userReq CreateUser
	if err := c.ShouldBindJSON(&userReq); err != nil {
		utils.Error(c, http.StatusBadRequest, "Invalid user")
		return
	}
	if err := uh.iuserService.CreateNewUser(&userReq); err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusCreated, userReq.User)
}

func (uh *UserHandler) UpdatePassword(c *gin.Context) {
	userID, exists := c.Get("userUUID")
	if !exists {
		utils.Error(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, "Invalid request")
		return
	}

	if err := uh.iuserService.ChangePassword(userID.(string), req); err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}

func (uh *UserHandler) UpdateUser(c *gin.Context) {
	targetUUID := c.Param("uuid")
	var user User
	if err := c.ShouldBindJSON(&user); err != nil {
		utils.Error(c, http.StatusBadRequest, "Invalid user data")
		return
	}
	user.UUID = targetUUID
	updatedUser, err := uh.iuserService.UpdateUser(&user)
	if err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusOK, updatedUser)
}

func (uh *UserHandler) GetUser(c *gin.Context) {
	uuid, exists := c.Get("userUUID")
	if !exists {
		utils.Error(c, http.StatusUnauthorized, "Unauthorized: No user identity found")
		return
	}
	user, err := uh.iuserService.GetUserByUUID(uuid.(string))
	if err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusOK, user)
}

func (uh *UserHandler) ListUsers(c *gin.Context) {
	pagination := utils.GetPaginationParams(c)
	users, total, err := uh.iuserService.ListUsers(pagination)
	if err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusOK, utils.GetPaginatedResponse(users, pagination.Page, pagination.Limit, total))
}

func (uh *UserHandler) DeleteUser(c *gin.Context) {
	uuidStr := c.Param("uuid")
	if err := uh.iuserService.DeleteUser(uuidStr); err != nil {
		utils.Error(c, utils.StatusCodeFromError(err), err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User Deleted Successfully"})
}
