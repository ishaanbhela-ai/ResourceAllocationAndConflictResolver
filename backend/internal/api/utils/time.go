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

func IsHoliday(t time.Time) error {
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
	// 9AM - 5PM check
	if start.Hour() < 9 || start.Hour() > 17 || end.Hour() > 17 || end.Hour() < 9 {
		return errors.New("outside working hours (9 AM - 5 PM)")
	}
	// Edge case: if end is exactly 17:00 it is fine, but Hour() returns 17.
	// We need to careful. internal hour logic:
	// If 17:00, Hour is 17. If 17:01, Hour is 17.
	// Typically 9-17 means 09:00 to 17:00 inclusive.

	// Re-evaluating the logic from booking service:
	// if start.Hour() < 9 || start.Hour() > 17 || end.Hour() > 17 || end.Hour() < 9
	// if start is 17:00 -> reject (cannot start at closing)
	// if end is 17:00 -> accept.
	// if end is 17:01 -> reject.

	// Let's stick to strict simple check based on hours for now as per original code,
	// checking if it falls strictly outside [9, 17]

	// If end is 17:00:00 -> End hour is 17.
	// Original code: end.Hour() > 17. So 17 is allowed.
	// But 18 is not.

	// But wait, if end is 17:30, end.Hour() is 17. Allowed?
	// "9AM - 5PM" usually means work ENDS at 5PM.
	// So 17:30 should be invalid.

	if start.Hour() < 9 || start.Hour() >= 17 {
		// Start must be 9:00 <= t < 17:00
		return errors.New("start time must be between 9 AM and 5 PM")
	}

	if end.Hour() < 9 || (end.Hour() >= 17 && (end.Minute() > 0 || end.Second() > 0)) {
		// End must be <= 17:00
		// If hour > 17 -> fail
		// If hour == 17 and min > 0 -> fail
		return errors.New("end time must be between 9 AM and 5 PM")
	}

	return nil
}
