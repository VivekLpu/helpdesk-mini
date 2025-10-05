# HelpDesk Mini - Setup and Login Guide

## ✅ Setup Complete

All dependencies have been installed successfully:
- **Backend**: 429 packages installed
- **Frontend**: 1,369 packages installed

## 🔧 Configuration

### Backend (.env)
```
MONGODB_URI=mongodb+srv://vivek-helpdesk:Vk%40%238789@cluster0.wyayfvt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=gejeirjedfjfd6464646d464fdfehfejh
FRONTEND_URL=http://localhost:3000
PORT=5000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
```

## 🚀 How to Run the Application

### Option 1: Run in Separate Terminals

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Option 2: Using npm scripts (if available)
```bash
# From root directory
npm run dev
```

## 👥 Test User Accounts

The database has been seeded with the following test accounts:

| Role  | Email                | Password   |
|-------|---------------------|------------|
| Admin | admin@example.com   | admin123   |
| Agent | agent@example.com   | agent123   |
| User  | user@example.com    | user123    |

## 🔐 Login/Signup Testing

### To Test Login:
1. Start both backend (port 5000) and frontend (port 3000)
2. Navigate to http://localhost:3000/login
3. Use any of the test accounts above
4. Click "Login"

### To Test Signup:
1. Navigate to http://localhost:3000/register
2. Fill in all required fields:
   - First Name
   - Last Name
   - Username (3-30 characters)
   - Email (valid email format)
   - Password (minimum 6 characters)
   - Confirm Password
3. Click "Register"

## ✅ Backend API Verification

The backend API has been tested and is working correctly:

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test login endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## 🐛 Common Issues and Solutions

### Issue 1: "Cannot connect to backend"
**Solution:** Make sure the backend server is running on port 5000
```bash
cd backend
npm start
```

### Issue 2: "Port 5000 already in use"
**Solution:** Kill the existing process
```bash
# Windows PowerShell
Get-Process -Name node | Stop-Process -Force

# Then restart
cd backend
npm start
```

### Issue 3: "Login/Signup not working"
**Checklist:**
- [ ] Backend server is running (check http://localhost:5000/api/health)
- [ ] Frontend server is running (check http://localhost:3000)
- [ ] MongoDB connection is active (check backend console for connection messages)
- [ ] Browser console for any error messages (F12 → Console tab)
- [ ] Network tab to see if API requests are being made (F12 → Network tab)

### Issue 4: "Invalid credentials" error
**Solution:** 
- Use one of the seeded test accounts listed above
- Or create a new account via the Register page
- Ensure password meets minimum requirements (6 characters)

### Issue 5: "CORS error"
**Solution:** The backend is configured to accept requests from all origins. If you still see CORS errors:
1. Check that FRONTEND_URL in backend/.env matches your frontend URL
2. Restart the backend server after any .env changes

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth token)

### Tickets
- `GET /api/tickets` - Get all tickets
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/:id` - Get ticket by ID
- `PATCH /api/tickets/:id` - Update ticket
- `POST /api/tickets/:id/comments` - Add comment to ticket

### Users
- `GET /api/users/agents` - Get all agents (requires agent/admin role)

## 🔍 Debugging Tips

### Check Backend Logs
The backend has extensive console logging. Check the backend terminal for:
- Database connection status
- Incoming API requests
- Authentication attempts
- Error messages

### Check Frontend Logs
Open browser DevTools (F12) and check:
- **Console tab**: For JavaScript errors and API request logs
- **Network tab**: To see API requests and responses
- **Application tab**: To check localStorage for auth token

### Verify Database Connection
The backend connects to MongoDB Atlas. Check the backend console for:
```
Server running on port 5000
```

If you see connection errors, verify:
1. Internet connection is active
2. MongoDB Atlas cluster is running
3. IP address is whitelisted in MongoDB Atlas (or use 0.0.0.0/0 for all IPs)

## 🎯 Next Steps

1. **Start both servers** (backend and frontend)
2. **Open browser** to http://localhost:3000
3. **Try logging in** with admin@example.com / admin123
4. **Or register** a new account
5. **Check browser console** if any issues occur

## 📞 Support

If login/signup is still not working after following this guide:
1. Check browser console for errors (F12)
2. Check backend terminal for error messages
3. Verify both servers are running
4. Try the curl commands above to test backend directly
5. Clear browser cache and localStorage
6. Try a different browser

## ✨ Features

- **Role-based access control** (User, Agent, Admin)
- **JWT authentication** with 7-day expiration
- **Real-time updates** via Socket.io
- **SLA tracking** for tickets
- **Responsive UI** with React Bootstrap

