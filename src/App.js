import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import Login from "./Login";
import Signup from "./Signup";
import AdminPage from "./AdminPage";
import ParkingReservation from "./ParkingReservation";
import CancelParking from "./CancelParking";
import EmployeeReservation from "./EmployeeReservation"; // Import the EmployeePage

const App = () => {
  // הגדרת basename דינמית בהתאם לסביבה
  const basename = process.env.REACT_APP_BASENAME || "/";

  return (
    <Router basename={basename}>
      <Routes>
        {/* Root Route */}
        <Route path="/" element={<Login />} />
        
        {/* User Routes */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/signup" element={<Signup />} />

        {/* Admin Route */}
        <Route path="/admin" element={<AdminPage />} />

        {/* Parking Routes */}
        <Route path="/parkingReservation" element={<ParkingReservation />} />
        <Route path="/cancel-parking" element={<CancelParking />} />

        {/* Employee Route */}
        <Route path="/employeePage" element={<EmployeeReservation />} />
      </Routes>
    </Router>
  );
};

export default App;
