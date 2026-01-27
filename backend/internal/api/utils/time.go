package utils

import (
	"errors"
	"time"
)

var publicHolidays = map[string]string{
	"2026-01-26": "Republic Day",
	"2026-08-15": "Independence Day",
	"2026-10-02": "Gandhi Jayanti",
	"2026-12-25": "Christmas",
}

func getIST() *time.Location {
	loc, err := time.LoadLocation("Asia/Kolkata")
	if err != nil {
		// Fallback to UTC if timezone db missing, though unlikely on standard linux
		return time.UTC
	}
	return loc
}

func IsHoliday(t time.Time) error {
	t = t.In(getIST())
	// 1. Weekend Check
	if t.Weekday() == time.Saturday || t.Weekday() == time.Sunday {
		return errors.New("bookings are not allowed on weekends")
	}
	// 2. Public Holiday Check
	dateStr := t.Format("2006-01-02")
	if _, exists := publicHolidays[dateStr]; exists {
		return errors.New("bookings are not allowed on public holidays")
	}
	return nil
}

func IsWorkingHours(start time.Time, end time.Time) error {
	loc := getIST()
	start = start.In(loc)
	end = end.In(loc)

	// 9AM - 5PM check
	if start.Hour() < 9 || start.Hour() >= 17 {
		// Start must be 9:00 <= t < 17:00
		return errors.New("start time must be between 9 AM and 5 PM")
	}

	if end.Hour() < 9 || (end.Hour() >= 17 && (end.Minute() > 0 || end.Second() > 0)) {
		// End must be <= 17:00
		return errors.New("end time must be between 9 AM and 5 PM")
	}

	return nil
}
