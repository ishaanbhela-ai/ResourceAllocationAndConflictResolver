package database

import (
	"errors"
	"fmt"
	"log"
	"os"

	"ResourceAllocator/internal/api/booking"
	"ResourceAllocator/internal/api/resource"
	"ResourceAllocator/internal/api/user"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type DB struct {
	conn *gorm.DB
}

func NewDB() (*DB, error) {
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		return nil, errors.New("No DB_HOST provided")
	}

	dbPort := os.Getenv("DB_PORT")
	if dbPort == "" {
		return nil, errors.New("No DB_PORT provided")
	}

	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		return nil, errors.New("No DB_USER provided")
	}

	dbPassword := os.Getenv("DB_PASSWORD")
	if dbPassword == "" {
		return nil, errors.New("No DB_PASSWORD provided")
	}

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		return nil, errors.New("No DB_NAME provided")
	}

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPassword, dbName,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect database: %w", err)
	}

	log.Println("Database connection established successfully")

	// Auto-migrate tables
	if err := db.AutoMigrate(&user.CreateUser{}, &resource.Resource{}, &resource.ResourceType{}, &booking.Booking{}); err != nil {
		return nil, fmt.Errorf("failed to auto-migrate: %w", err)
	}

	return &DB{conn: db}, nil
}

func (d *DB) GetConnection() *gorm.DB {
	return d.conn
}
