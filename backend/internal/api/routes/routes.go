package routes

import (
	"ResourceAllocator/internal/api/handlers"
	"ResourceAllocator/internal/api/middleware"

	"github.com/gin-gonic/gin"
)

type Handlers struct {
	UserHandler *handlers.UserHandler
	// Add more handlers here as you create them:
	// ResourceHandler *ResourceHandler
	// BookingHandler  *BookingHandler
	// etc.
}

func NewHandlers(UserHandler *handlers.UserHandler) *Handlers {
	return &Handlers{
		UserHandler: UserHandler,
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
			auth.POST("/admin", h.UserHandler.AdminLogin)
		}
	}

	//PROTECTED ROUTES
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware())
	{

	}

	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware())
	admin.Use(middleware.AdminMiddleware())
	{

	}

	return router
}
