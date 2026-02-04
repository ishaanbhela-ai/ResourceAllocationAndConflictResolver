# **🏢 Resource Allocation & Conflict Resolver**

A robust, high-concurrency backend system for managing office resources (conference rooms, equipment) with atomic conflict resolution, role-based access control, and automated lifecycle management — paired with a modern React frontend.

---

## **🚀 Key Features**

### **1\. User Management & Security**

* **Role-Based Access Control (RBAC):**

  * **Admins:** Manage inventory and system configuration

  * **Employees:** Book and manage resources

* **Secure Authentication:** JWT-based stateless authentication with Bcrypt password hashing

* **Input Sanitization:** Automatic trimming and validation to prevent malformed data

---

### **2\. Smart Booking System**

* **Atomic Conflict Resolution:** Database transactions guarantee **zero double-bookings** under high concurrency

* **Smart Suggestions:** Returns up to 4 alternative time slots when conflicts occur

* **Strict Time Enforcement:** Bookings align to hourly slots (e.g., 9:00, 10:00)

* **Reciprocal Cancellation:** Deleting a resource automatically cancels future bookings and notifies users

---

### **3\. Lifecycle Automation (Background Jobs)**

* **Auto-Release Mechanism:** Hourly background worker releases bookings if users fail to check in within 15 minutes

* **Check-In System:** Users must explicitly check in to secure usage

---

### **4\. Resource Inventory**

* **Dynamic Properties:** Custom JSONB attributes (e.g., `"Projector": true`, `"Capacity": 12`)

* **Advanced Filtering:** Search by type, location, availability window, and custom properties

---

## **🛠️ Technology Stack**

### **Backend**

* **Language:** Go (1.21+)

* **Framework:** Gin

* **Database:** PostgreSQL

* **ORM:** GORM

* **Concurrency:** Goroutines & Channels

* **Auth:** JWT

### **Frontend**

* **Framework:** React

* **Package Manager:** npm

---

## **⚙️ Setup & Installation**

### **Prerequisites**

* Go 1.21+

* PostgreSQL (local or Docker)

* Node.js \+ npm

---

## **🔧 Backend Setup**

### **1\. Clone the Repository**

`git clone https://github.com/ishaanbhela-ai/ResourceAllocationAndConflictResolver.git`  
`cd ResourceAllocationAndConflictResolver/backend`

### **2\. Configure Environment Variables**

Create a `.env` file in the `backend` directory:

`DB_HOST=localhost`  
`DB_USER=postgres`  
`DB_PASSWORD=yourpassword`  
`DB_NAME=resource_db`  
`DB_PORT=5432`  
`JWT_SECRET=your_super_secret_key_change_this`

### **3\. Run the Backend**

`go mod tidy`  
`go run cmd/main.go`

➡️ Server runs on `http://localhost:8080`

---

## **💻 Frontend Setup (React)**

Navigate to the frontend directory and run:

`npm install`  
`npm start`

➡️ Frontend runs on `http://localhost:3000`

---

## **🧠 Architecture Highlights**

* **Layered Architecture**

  * **Handler Layer:** Request parsing, validation, responses

  * **Service Layer:** Business logic, conflict resolution, sanitization

  * **Repository Layer:** Database access and transactions

* **Dependency Injection:** All dependencies are wired in `main.go`, making the system modular and testable

---
