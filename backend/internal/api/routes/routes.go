package routes

import (
	"ResourceAllocator/internal/api/middleware"
	"ResourceAllocator/internal/api/user"

	"github.com/gin-gonic/gin"
)

// Handlers groups all handler instances used in routing.
// Each concrete handler still lives in its own package (e.g. user_handler).
type Handlers struct {
	UserHandler *user.UserHandler
}

// NewHandlers builds the Handlers container (called from main.go).
func NewHandlers(userHandler *user.UserHandler) *Handlers {
	return &Handlers{
		UserHandler: userHandler,
	}
}

func SetupRoutes(h *Handlers) *gin.Engine {
	router := gin.Default()

	// HEALTH CHECK
	router.GET("/health", func(ctx *gin.Context) {
		ctx.JSON(200, gin.H{"status": "OK"})
	})

	// PUBLIC ROUTES
	api := router.Group("/api")
	{
		auth := api.Group("/auth")
		{
			// Admin login - NOT protected
			auth.POST("/admin", h.UserHandler.AdminLogin)
		}
	}

	// PROTECTED ROUTES
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware())
	{
		// add protected routes later
	}

	// ADMIN ROUTES
	admin := api.Group("/admin")
	//admin.Use(middleware.AuthMiddleware())
	//admin.Use(middleware.AdminMiddleware())
	{
		admin.POST("/user", h.UserHandler.CreateNewUser)
	}

	return router
}
