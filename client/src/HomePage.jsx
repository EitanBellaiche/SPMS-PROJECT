import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

const HomePage = () => {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState(""); // שמירת התפקיד
  const navigate = useNavigate();

  // שימוש במשתנה סביבתי לכתובת ה-API
  const API_URL =
    process.env.NODE_ENV === "development"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_PRODUCTION_URL;

  useEffect(() => {
    // שליפת הנתונים מ-LocalStorage
    const storedUsername = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role");

    if (storedUsername) {
      setUsername(storedUsername);
    }

    if (storedRole) {
      setRole(storedRole); // שמירת התפקיד ב-state
    }
  }, [API_URL]);

  if (!username) {
    return <div>Loading...</div>; // מסך טעינה
  }

  return (
    <div className="homepage-container">
      {/* Header */}
      <header className="homepage-header">
        <div className="logo">SPMS</div>
        <nav>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Greeting Section */}
        <section className="greeting-section">
          <div className="greeting-text">
            <h2>Hello {username},</h2>
            <p>Welcome back to the system!</p>
          </div>
        </section>

        {/* Buttons */}
        <section className="action-buttons">
          <button
            className="action-button"
            onClick={() => navigate("/parkingReservation")}
          >
            Parking reservation <span className="button-icon"></span>
          </button>
          {role !== "guest" && (
            <button
              className="action-button"
              onClick={() => navigate("/employeePage")}
            >
              Reserve Parking Routine <span className="button-icon"></span>
            </button>
          )}
          <button
            className="action-button"
            onClick={() => navigate("/cancel-parking")}
          >
            my Parkings
          </button>
        </section>
      </div>

      {/* Footer */}
      <footer className="footer">
        © 2024 Smart Parking Management System. All rights reserved.
      </footer>
    </div>
  );
};

export default HomePage;
