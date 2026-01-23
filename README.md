# Resource Allocation & Conflict Resolver

A robust, high-concurrency backend system for managing office resources (conference rooms, equipment) with atomic conflict resolution, role-based access control, and automated lifecycle management.

---

## 🚀 Key Features

### 1. **User Management & Security**
*   **Role-Based Access Control (RBAC):** Distinct roles for **Admins** (Inventory management) and **Employees** (Booking).
*   **Secure Authentication:** JWT-based stateless authentication with strict password hashing (Bcrypt).
*   **Input Sanitization:** Automatic trimming and validation of user inputs to prevent data anomalies.

### 2. **Smart Booking System**
*   **Atomic Conflict Resolution:** Uses Database Transactions to ensure **zero double-bookings** even under high concurrency.
*   **Smart Suggestions:** Algorithm suggests up to 4 alternative time slots if the requested slot is busy.
*   **Strict Time Enforcement:** Bookings are aligned to hourly slots (e.g., 9:00, 10:00) for optimal utilization.
*   **Reciprocal Cancellation:** Deleting a resource automatically notifies/cancels future bookings for that resource.

### 3. **Lifecycle Automation (Background Jobs)**
*   **Auto-Release Mechanism:** A background ticker (running hourly) automatically identifies and releases bookings where the user failed to "Check-In" within 15 minutes.
*   **Check-In System:** Users must explicitly check in to secure their utilization.

### 4. **Resource Inventory**
*   **Dynamic Properties:** Support for custom resource attributes (JSONB) like "Projector Available", "Capacity", etc.
*   **Advanced Filtering:** Search resources by Type, Location, Availability (Time window), and custom properties.

---

## 🛠️ Technology Stack

*   **Language:** Golang (1.21+)
*   **Framework:** Gin Web Framework (High performance HTTP router)
*   **Database:** PostgreSQL
*   **ORM:** GORM (Object Relational Mapping)
*   **Concurrency:** Goroutines & Channels (for Background Jobs)
*   **Auth:** JWT (JSON Web Tokens)

---

## ⚙️ Setup & Installation

### Prerequisites
*   Go 1.21+ installed
*   PostgreSQL running locally or via Docker

### 1. Clone the Repository
```bash
git clone https://github.com/ishaanbhela-ai/ResourceAllocationAndConflictResolver.git
cd ResourceAllocationAndConflictResolver/backend
```

### 2. Environment Configuration
Create a `.env` file in the `backend` root:
```env
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=resource_db
DB_PORT=5432
JWT_SECRET=your_super_secret_key_change_this
```

### 3. Run the Application
The application handles database migrations automatically on startup.
```bash
go mod tidy
go run cmd/main.go
```
*Server runs on port `:8080` by default.*

---

## 📡 API Documentation

### **Auth & Users**
*   `POST /api/auth/login` - Login & Retrieve Token
*   `GET /api/user` - Get My Profile
*   `POST /api/bookings` - Create Booking
    *   *Payload:* `{"resource_id": 1, "start_time": "2026-01-25T10:00:00Z", "end_time": "2026-01-25T11:00:00Z", "purpose": "Meeting"}`
*   `PATCH /api/bookings/:id/checkin` - Check-in (Must be within 15 mins of start)
*   `PATCH /api/bookings/:id/cancel` - Cancel Booking

### **Admin Endpoints**
*   `POST /api/admin/resources` - Add new Resource
*   `POST /api/admin/user` - Create User
*   `PATCH /api/admin/bookings/:id/status` - Force Approve/Reject

---

## 🧠 Architecture Highlights

*   **Layered Architecture:** Strict separation of concerns:
    *   **Handler Layer:** Parse JSON, Validate Input, Send Response.
    *   **Service Layer:** Business Logic, Conflict Calculation, Sanitization.
    *   **Repository Layer:** Direct Database Access, Transactions.
*   **Dependency Injection:** Dependencies are injected at startup (`main.go`), making the codebase testable and modular.
