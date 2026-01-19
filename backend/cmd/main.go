package main

import (
	"ResourceAllocator/internal/api/routes"
	"ResourceAllocator/internal/api/user"
	"ResourceAllocator/internal/database"
	"ResourceAllocator/internal/database/repository"
	"log"
)

func main() {
	db, err := database.NewDB()
	if err != nil {
		log.Fatalf("Failed to initalize database: %v", err)
	}

	defer db.Close()

	// ============================================
	// USER FEATURE - Dependency Injection Chain
	// ============================================
	userRepo := repository.NewUserRepository(db.GetConnection())
	userService := user.NewUserService(userRepo)
	userHandler := user.NewUserHandler(userService)

	appHandlers := routes.NewHandlers(
		userHandler,
	)

	router := routes.SetupRoutes(appHandlers)

	port := ":8080"

	log.Printf("Server Starting on port %s", port)
	if err := router.Run(port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
