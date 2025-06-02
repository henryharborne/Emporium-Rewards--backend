# Emporium Rewards – Backend

This is the backend API for **Emporium Rewards**, a full-stack customer loyalty program built for Smoke Emporium in Gainesville, Florida. It manages customer records, point tracking, admin authentication, logging, and secure actions through RESTful endpoints and Supabase integration.

---

## Tech Stack

- **Node.js + Express** – API server  
- **Supabase** – Database (PostgreSQL) + Auth + RLS
- **JWT** – Admin authentication  
- **Render** – Backend deployment
- **Vercel** – Frontend deployment

---

## Project Structure

/controllers
/middleware
/routes
/utils
.env (excluded)
/database/supabaseClient.js
server.js

## Features

- Customer lookup by name, email, or phone  
- Secure admin login with JWT  
- Admin-only routes protected by token  
- Add/Subtract customer points  
- Edit customer name, email, phone, notes  
- Admin action logging ('admin_logs' table)  
- CSV export of customer data  
- Supabase RLS enforced for data security  

---

## Security (Current & Planned)

### Implemented
- JWT-based authentication  
- Supabase Row-Level Security (RLS)  
- Route-level access control  
- Rate limiting per IP

### In Progress
-  IP logging for audit trails  
-  Encrypted logs for tamper prevention  
-  Role-based permissions (RBAC)  
-  Admin 2FA (email/TOTP)  

---

## Setup & Usage

### 1. Clone the Repo
git clone https://github.com/henryharborne/Emporium-Rewards--backend.git
cd Emporium-Rewards--backend

### 2. Install Dependencies
npm install

### 3. Environment Variables
Create a .env file in the root directory with the following:

SUPABASE_URL=your_supabase_project_url, 
SUPABASE_KEY=your_service_role_key, 
JWT_SECRET=your_jwt_secret

### 4. Start the Server
npm run dev (runs on http://localhost:4000)

---

## Author
 - Henry Harborne
 - Senior CS Major @ University of Florida
 - Focused on full-stack development, cybersecurity, and DevOps
