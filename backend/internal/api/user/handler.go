package user

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type IUserService interface {
	AdminLogin(email, password string) (*LoginRespose, error)
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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := uh.iuserService.AdminLogin(loginReq.Email, loginReq.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

func (uh *UserHandler) CreateNewUser(c *gin.Context) {

	var user User

	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := uh.iuserService.CreateNewUser(&user)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User Created Successfully"})

}
