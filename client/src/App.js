import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import SearchParking from "./SearchParking";
import Login from "./Login";
import Signup from "./Signup";
import AdminPage from "./AdminPage";
import ParkingReservation from "./ParkingReservation";
import CancelParking from "./CancelParking"; // Import the CancelParking page

const App = () => {
  return (
    <Router basename="/spms">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/search-parking" element={<SearchParking />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/parkingReservation" element={<ParkingReservation />} />
        <Route path="/cancel-parking" element={<CancelParking />} /> {/* Add CancelParking route */}
      </Routes>
    </Router>
  );
};

export default App;
