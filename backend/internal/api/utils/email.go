package utils

import (
	"log"
	"net/smtp"
	"os"
)

// Define a struct to hold email data
type EmailTask struct {
	To      string
	Subject string
	Body    string
}

// Create a buffered channel (buffer size 100).
// If the buffer is full, the main thread will block briefly until a slot opens.
var emailQueue = make(chan EmailTask, 100)

// 1. New Helper: Adds email to the queue (Non-blocking usually)
func SendEmail(body string, toUser string, subject string) {
	task := EmailTask{
		To:      toUser,
		Subject: subject,
		Body:    body,
	}
	// Push to channel
	select {
	case emailQueue <- task:
		log.Println("Email queued for:", toUser)
	default:
		log.Println("Email queue full! Dropping email for:", toUser)
	}
}

// 2. New Worker: Runs in the background and processes the queue
func StartEmailWorker() {
	from := "ishaan.bhela@joshsoftware.com"
	password := os.Getenv("EMAIL_PASSWORD")
	smtpHost := "smtp.gmail.com"
	smtpPort := "587"
	// Loop forever, processing messages as they arrive
	for task := range emailQueue {
		log.Println("Processing email for:", task.To)
		message := []byte("Subject: " + task.Subject + "\r\n" +
			"\r\n" +
			task.Body)
		auth := smtp.PlainAuth("", from, password, smtpHost)
		err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{task.To}, message)
		if err != nil {
			log.Printf("Failed to send email to %s: %v\n", task.To, err)
			// Optional: You could re-queue it here if you wanted retry logic
		} else {
			log.Println("Email sent successfully to:", task.To)
		}
	}
}
