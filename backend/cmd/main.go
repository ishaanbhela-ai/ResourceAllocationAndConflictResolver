package main

import (
	"ResourceAllocator/internal/api/booking"
	"ResourceAllocator/internal/api/resource"
	"ResourceAllocator/internal/api/routes"
	"ResourceAllocator/internal/api/user"
	"ResourceAllocator/internal/database"
	"ResourceAllocator/internal/database/repository"
	"log"
	"time"

	"github.com/joho/godotenv"
)

func main() {

	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found or error loading it. Relying on System Environment Variables.")
	}

	// Enforce IST Timezone
	loc, err := time.LoadLocation("Asia/Kolkata")
	if err != nil {
		log.Fatalf("Failed to load timezone Asia/Kolkata: %v", err)
	}
	time.Local = loc
	log.Println("Global timezone set to Asia/Kolkata (IST)")

	db, err := database.NewDB()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// ============================================
	// USER FEATURE - Dependency Injection Chain
	// ============================================
	userRepo := repository.NewUserRepository(db.GetConnection())
	userService := user.NewUserService(userRepo)
	userHandler := user.NewUserHandler(userService)

	// ============================================
	// RESOURCE FEATURE - Dependency Injection Chain
	// ============================================
	resourceRepo := repository.NewResourceRepository(db.GetConnection())
	resourceService := resource.NewResourceService(resourceRepo)
	resourceHandler := resource.NewResourceHandler(resourceService)

	// ============================================
	// BOOKING FEATURE - Dependency Injection Chain
	// ============================================
	bookingRepo := repository.NewBookingRepository(db.GetConnection())
	bookingService := booking.NewBookingService(bookingRepo)
	bookingHandler := booking.NewBookingHandler(bookingService)

	// ============================================
	// BACKGROUND WORKER - Auto-Release Unchecked Bookings
	// ============================================
	go func() {
		// Calculate time to next XX:16:00
		now := time.Now()
		nextRun := time.Date(now.Year(), now.Month(), now.Day(), now.Hour(), 16, 0, 0, now.Location())
		if nextRun.Before(now) {
			nextRun = nextRun.Add(1 * time.Hour)
		}

		log.Printf("Background Worker: Auto-release scheduled for %s", nextRun.Format("15:04:05"))
		time.Sleep(time.Until(nextRun))

		// 1. Run immediately on wake up
		log.Println("Background Worker: Running auto-release job...")
		if err := bookingService.RunAutoReleaseJob(); err != nil {
			log.Printf("Background Worker Error: %v", err)
		}

		// 2. Start Ticker for every 1 hour
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()

		for range ticker.C {
			log.Println("Background Worker: Running auto-release job...")
			if err := bookingService.RunAutoReleaseJob(); err != nil {
				log.Printf("Background Worker Error: %v", err)
			}
		}
	}()

	appHandlers := routes.NewHandlers(
		userHandler,
		resourceHandler,
		bookingHandler,
	)

	router := routes.SetupRoutes(appHandlers)

	port := ":8080"
	log.Printf("Server Starting on port %s", port)
	if err := router.Run(port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
