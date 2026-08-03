// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HotelLanding from '../src/home/home';
import AuthCallback from '../src/pages/authCallback';
import BookingPage from '../src/booking/book';
import AdminLogin from "../src/adminLogin/admin"
import AdminDashboard from "../src/adminLogin/adminDashboard"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HotelLanding />} />
        <Route path="/auth-callback" element={<AuthCallback />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/booking-guest" element={<BookingPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;