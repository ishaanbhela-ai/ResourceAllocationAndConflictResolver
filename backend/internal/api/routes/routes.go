package routes

import (
	"ResourceAllocator/internal/api/booking"
	"ResourceAllocator/internal/api/middleware"
	"ResourceAllocator/internal/api/resource"
	"ResourceAllocator/internal/api/user"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// Handlers groups all handler instances used in routing.
// Each concrete handler still lives in its own package (e.g. user_handler).
type Handlers struct {
	UserHandler     *user.UserHandler
	ResourceHandler *resource.ResourceHandler
	BookingHandler  *booking.BookingHandler
}

// NewHandlers builds the Handlers container (called from main.go).
func NewHandlers(userHandler *user.UserHandler, resourceHandler *resource.ResourceHandler, bookingHandler *booking.BookingHandler) *Handlers {
	return &Handlers{
		UserHandler:     userHandler,
		ResourceHandler: resourceHandler,
		BookingHandler:  bookingHandler,
	}
}

func SetupRoutes(h *Handlers) *gin.Engine {
	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour,
	}))

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
			auth.POST("/login", h.UserHandler.Login) // For Login
		}
	}

	// PROTECTED ROUTES
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware())
	{
		// Resource Management
		protected.GET("/resources", h.ResourceHandler.ListResources)            // For users/ Admins to see all resources
		protected.GET("/resources/:id", h.ResourceHandler.GetResource)          // For users/ Admins to see a specific resource
		protected.GET("/resource_types", h.ResourceHandler.ListResourceTypes)   // For users/ Admins to see all resource types
		protected.GET("/resource_types/:id", h.ResourceHandler.GetResourceType) // For users/ Admins to see a specific resource type

		// User Management
		protected.GET("/user", h.UserHandler.GetUser)
		protected.PATCH("/user/password", h.UserHandler.UpdatePassword) // [NEW] Change Password

		// [NEW] Bookings (User)
		protected.POST("/bookings", h.BookingHandler.CreateBooking)
		protected.GET("/bookings", h.BookingHandler.ListMyBookings)
		protected.PATCH("/bookings/:id/cancel", h.BookingHandler.CancelBooking)
	}

	// ADMIN ROUTES
	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware())
	admin.Use(middleware.AdminMiddleware())
	{
		// User Management
		admin.POST("/user", h.UserHandler.CreateNewUser)
		admin.GET("/user", h.UserHandler.ListUsers)
		admin.DELETE("/user/:uuid", h.UserHandler.DeleteUser)
		admin.PUT("/user/:uuid", h.UserHandler.UpdateUser)

		// Resource Management
		admin.POST("/resources", h.ResourceHandler.CreateResource)    // For Admins to create a new resource
		admin.PUT("/resources/:id", h.ResourceHandler.UpdateResource) // For Admins to update a resource
		// admin.PUT("/resource_types/:id", h.ResourceHandler.UpdateResourceType)     // For Admins to update a resource
		admin.DELETE("/resources/:id", h.ResourceHandler.DeleteResource)          // For Admins to delete a resource
		admin.DELETE("/resource_types/:id", h.ResourceHandler.DeleteResourceType) // For Admins to delete a resource
		admin.POST("/resource_types", h.ResourceHandler.CreateResourceType)       // For Admins to create a new resource type

		// [NEW] Bookings (Admin)
		admin.GET("/bookings", h.BookingHandler.ListAllBookings)
		admin.PATCH("/bookings/:id/status", h.BookingHandler.UpdateBookingStatus)

		admin.PATCH("/bookings/:id/checkin", h.BookingHandler.CheckIn)

		// [NEW] Dashboard Stats (Admin)
		admin.GET("/dashboard/resources", h.BookingHandler.GetDashboardResourceStats)
		admin.GET("/dashboard/users", h.BookingHandler.GetDashboardUserStats)
	}

	return router
}
