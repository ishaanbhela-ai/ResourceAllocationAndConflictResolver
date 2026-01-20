package main

import (
	"ResourceAllocator/internal/api/resource"
	"ResourceAllocator/internal/api/routes"
	"ResourceAllocator/internal/api/user"
	"ResourceAllocator/internal/database"
	"ResourceAllocator/internal/database/repository"
	"log"

	"github.com/joho/godotenv"
)

func main() {

	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found or error loading it. Relying on System Environment Variables.")
	}

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

	appHandlers := routes.NewHandlers(
		userHandler,
		resourceHandler,
	)

	router := routes.SetupRoutes(appHandlers)

	port := ":8080"
	log.Printf("Server Starting on port %s", port)
	if err := router.Run(port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
