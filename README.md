# Demo App for Agora

This is a full-stack web application that demonstrates integration with Agora for real-time audio/video calls. The project consists of a Node.js/Express backend and a React frontend.

## Features
- User authentication (signup, login)
- Dashboard for users
- Real-time audio/video calling using Agora

## Project Structure
```
backend/      # Node.js/Express backend
frontend/     # React frontend
```

## Getting Started

### Prerequisites
- Node.js (v14 or above)
- npm or yarn

### Backend Setup
1. Navigate to the backend folder:
   ```powershell
   cd backend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Configure your database and email settings in `config/dbcon.js` and `config/emailConfig.js`.
4. Start the backend server:
   ```powershell
   npm start
   ```

### Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```powershell
   cd frontend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the React development server:
   ```powershell
   npm start
   ```

The frontend will typically run on [http://localhost:3000](http://localhost:3000) and the backend on [http://localhost:5000](http://localhost:5000) (or as configured).

## Usage
- Sign up for a new account or log in with existing credentials.
- Access the dashboard and initiate/join calls using the Agora integration.

## Folder Details
- `backend/routes/` - API endpoints for authentication, users, and Agora
- `backend/models/` - Mongoose models for User and Host
- `frontend/src/components/` - React components for Call, Dashboard, Login, Signup

## License
This project is for demonstration purposes only.
