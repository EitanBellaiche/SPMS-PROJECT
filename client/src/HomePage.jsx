import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

const HomePage = () => {
  const [username, setUsername] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // שליפת הנתונים מ-LocalStorage
    const storedUsername = localStorage.getItem("username");
    const storedProfilePicture = localStorage.getItem("profilePicture");

    if (storedUsername) {
      setUsername(storedUsername);
    }

    if (storedProfilePicture) {
      setProfilePicture(storedProfilePicture);
    }
  }, []);

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

      {/* Greeting Section */}
      <section className="greeting-section">
        <div className="greeting-text">
          <h2>Hello {username},</h2>
          <p>Welcome back to the system!</p>
        </div>
        <div className="profile">
          {profilePicture ? (
            <img
              src={`http://localhost:5000${profilePicture}`}
              alt="Profile"
              className="profile-icon"
            />
          ) : (
            <div className="profile-icon">No Image</div>
          )}
          <p>{username}</p>
        </div>
      </section>

      {/* Buttons */}
      <section className="action-buttons">
        <button
          className="action-button"
          onClick={() => navigate("/parkingReservation")} // ניווט לדף הזמנת חניה
        >
          Parking reservation <span className="button-icon"></span>
        </button>
        <button
          className="action-button"
          onClick={() => navigate("/cancel-parking")}
        >
          Cancel Parking
        </button>
        <button className="action-button">Parking available</button>
      </section>

      {/* Footer */}
      <footer className="homepage-footer">
        <div className="footer-icon">🔄</div>
        <div className="footer-icon">⚙️</div>
        <div className="footer-icon">🔔</div>
      </footer>
    </div>
  );
};

export default HomePage;
