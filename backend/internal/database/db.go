package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

// DB wraps the database connection
type DB struct {
	conn *sql.DB
}

// NewDB creates a new database connection
func NewDB() (*DB, error) {
	// Get database connection string from environment variables
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}

	dbPort := os.Getenv("DB_PORT")
	if dbPort == "" {
		dbPort = "5432"
	}

	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		dbUser = "postgres"
	}

	dbPassword := os.Getenv("DB_PASSWORD")
	if dbPassword == "" {
		dbPassword = "postgres"
	}

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "Resource_allocator_test"
	}

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPassword, dbName)

	conn, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err = conn.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("Database connection established successfully")

	err = createTables(conn)

	if err != nil {
		return nil, fmt.Errorf("Failed to create Tables necessary for application")
	}

	return &DB{conn: conn}, nil
}

// GetConnection returns the underlying sql.DB connection
// This is used by repositories
func (d *DB) GetConnection() *sql.DB {
	return d.conn
}

// Close closes the database connection
func (d *DB) Close() error {
	if d.conn != nil {
		return d.conn.Close()
	}
	return nil
}

func createTables(conn *sql.DB) error {
	query := `
			CREATE TABLE IF NOT EXISTS employees (
			uuid VARCHAR(36) PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			dob DATE NOT NULL,
			employee_level INTEGER NOT NULL,
			role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'Employee')),
			email VARCHAR(255) UNIQUE NOT NULL,
			hash_password BYTEA NOT NULL,
			max_daily_bookings INTEGER DEFAULT 5,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			deleted_at TIMESTAMP NULL
		);

		CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
		CREATE INDEX IF NOT EXISTS idx_employees_deleted_at ON employees(deleted_at);
	`

	_, err := conn.Exec(query)

	if err != nil {
		return err
	}

	return nil
}
