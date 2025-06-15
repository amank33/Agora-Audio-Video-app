import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Call from './components/Call';
import Dashboard from './components/Dashboard'; // Import Dashboard

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup/:type" element={<Signup />} />
        <Route path="/login/:type" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} /> {/* Add Dashboard route */}
        <Route path="/call/:channelName/:callType" element={<Call />} /> {/* Update Call route */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
