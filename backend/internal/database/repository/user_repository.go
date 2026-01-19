package repository

import (
	"ResourceAllocator/internal/models"
	"database/sql"
	"errors"
	"log"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) GetUserByEmail(email string) (*models.User, error) {
	query := `
		SELECT uuid, name, dob, employee_level, role, email, hash_password,
		       max_daily_bookings, created_at, deleted_at
		FROM employees
		WHERE email = $1 AND deleted_at IS NULL
	`

	user := &models.User{}

	err := r.db.QueryRow(query, email).Scan(
		&user.UUID,
		&user.Name,
		&user.DOB,
		&user.EmployeeLevel,
		&user.Role,
		&user.Email,
		&user.HashPassword,
		&user.MaxDailyBookings,
		&user.CreatedAt,
		&user.DeletedAt,
	)

	log.Println(&user.HashPassword)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("User not Found")
		}
		return nil, err
	}

	return user, nil
}

func (r *UserRepository) GetUserByUUID(uuid string) (*models.User, error) {
	query := `
		SELECT uuid, name, dob, employee_level, role, email, 
		       max_daily_bookings, created_at, deleted_at
		FROM employees
		WHERE uuid = $1 AND deleted_at IS NULL
	`

	user := &models.User{}

	err := r.db.QueryRow(query, uuid).Scan(
		&user.UUID,
		&user.Name,
		&user.DOB,
		&user.EmployeeLevel,
		&user.Role,
		&user.Email,
		&user.MaxDailyBookings,
		&user.CreatedAt,
		&user.DeletedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("User not Found")
		}
		return nil, err
	}

	return user, nil
}

func (r *UserRepository) CreateNewUser(user *models.User) error {
	user.UUID = uuid.NewString()
	user.CreatedAt = time.Now()

	hashedPassword, err := bcrypt.GenerateFromPassword(user.HashPassword, bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO employees (uuid, name, dob, employee_level, role, email, 
		                      hash_password, max_daily_bookings, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`

	_, err = r.db.Exec(query,
		user.UUID,
		user.Name,
		user.DOB,
		user.EmployeeLevel,
		user.Role,
		user.Email,
		hashedPassword,
		user.MaxDailyBookings,
		user.CreatedAt,
	)

	return err
}

func (r *UserRepository) VerifyPassword(hashedPassword []byte, password string) bool {
	err := bcrypt.CompareHashAndPassword(hashedPassword, []byte(password))
	return err == nil
}
