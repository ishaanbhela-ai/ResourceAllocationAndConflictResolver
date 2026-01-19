package repository

import (
	"ResourceAllocator/internal/api/user"
	"database/sql"
	"errors"

	"golang.org/x/crypto/bcrypt"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) GetUserByEmail(email string) (*user.User, error) {
	query := `
		SELECT uuid, name, dob, employee_id, role, email, password,
		       max_daily_bookings, created_at, deleted_at
		FROM employees
		WHERE email = $1 AND deleted_at IS NULL
	`

	user := &user.User{}

	err := r.db.QueryRow(query, email).Scan(
		&user.UUID,
		&user.Name,
		&user.DOB,
		&user.EmployeeID,
		&user.Role,
		&user.Email,
		&user.Password,
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

func (r *UserRepository) GetUserByUUID(uuid string) (*user.User, error) {
	query := `
		SELECT uuid, name, dob, employee_level, role, email, 
		       max_daily_bookings, created_at, deleted_at
		FROM employees
		WHERE uuid = $1 AND deleted_at IS NULL
	`

	user := &user.User{}

	err := r.db.QueryRow(query, uuid).Scan(
		&user.UUID,
		&user.Name,
		&user.DOB,
		&user.EmployeeID,
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

func (r *UserRepository) CreateNewUser(user *user.User) error {
	query := `
		INSERT INTO employees (uuid, name, dob, employee_id, role, email,
		                      password, max_daily_bookings, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`

	_, err := r.db.Exec(query,
		user.UUID,
		user.Name,
		user.DOB,
		user.EmployeeID,
		user.Role,
		user.Email,
		user.Password,
		user.MaxDailyBookings,
		user.CreatedAt,
	)

	return err
}

func (r *UserRepository) VerifyPassword(storedHash string, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(password))
	return err == nil
}
