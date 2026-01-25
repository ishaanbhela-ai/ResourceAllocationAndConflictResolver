package utils

import (
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
)

var (
	ErrNotFound           = errors.New("record not found")
	ErrInvalidInput       = errors.New("invalid input data")
	ErrConflict           = errors.New("resource already exists or is in use")
	ErrInternal           = errors.New("internal system error")
	ErrUnauthorized       = errors.New("unauthorized action")
	ErrInvalidCredentials = errors.New("invalid credentials")
)

func IsDuplicateKeyError(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505" // unique_violation
	}
	return false
}
