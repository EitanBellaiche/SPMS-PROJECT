import React from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";

const HomePage = () => {
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
          <h2>Hello Dan,</h2>
          <p>How can we help you today?</p>
        </div>
        <div className="profile">
          <div className="profile-icon"></div>
          <p>Dan</p>
        </div>
      </section>

      {/* Buttons */}
      <section className="action-buttons">
        <button className="action-button">
          Parking reservation <span className="button-icon"></span>
        </button>
        <button className="action-button">Cancel parking reservation</button>
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
