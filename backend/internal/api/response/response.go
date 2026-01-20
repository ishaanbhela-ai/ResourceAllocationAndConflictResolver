package response

import (
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
