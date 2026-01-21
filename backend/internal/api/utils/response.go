package utils

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Standard error response
func Error(c *gin.Context, status int, err string, details ...string) {
	resp := gin.H{"error": err}

	// If it's a 500 or detailed error, add the message
	if len(details) > 0 {
		resp["message"] = details[0]
	}
	c.JSON(status, resp)
}

func StatusCodeFromError(err error) int {
	if errors.Is(err, ErrNotFound) {
		return http.StatusNotFound
	}
	if errors.Is(err, ErrInvalidInput) {
		return http.StatusBadRequest
	}
	if errors.Is(err, ErrConflict) {
		return http.StatusConflict
	}
	if errors.Is(err, ErrInvalidCredentials) {
		return http.StatusUnauthorized
	}
	if errors.Is(err, ErrUnauthorized) {
		return http.StatusForbidden
	}
	return http.StatusInternalServerError
}
