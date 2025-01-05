import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="homepage-container">
      {/* Header */}
      <header className="homepage-header">
        <div
          className="hamburger"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="logo">SPMS</div>
        <nav className={`navbar ${isMenuOpen ? 'active' : ''}`}>
          <ul>
            {/* Link to Footer Contact Section */}
            <li><a href="#contact-footer">Contact</a></li>
            <li><Link to="/search-parking">Reservations</Link></li>
          </ul>
        </nav>
      </header>

      {/* Main Content */}
      <main className="homepage-main">
        {/* Intro Section */}
        <section className="intro">
          <h1>Welcome to the Smart Parking Management System</h1>
          <p>Efficiently manage and find available parking spots with ease.</p>
          <button className="cta-button">
            <Link to="/search-parking">Start Now</Link>
          </button>
        </section>

        {/* Information Section */}
        <section className="info-section">
          <h2>Why Choose SPMS?</h2>
          <div className="info-cards">
            <div className="info-card">
              <div className="icon">
                <i className="fas fa-car"></i> {/* אייקון רכב */}
              </div>
              <h3>Real-time Monitoring</h3>
              <p>Keep track of parking availability in real-time with advanced sensors.</p>
            </div>
            <div className="info-card">
              <div className="icon">
                <i className="fas fa-parking"></i> {/* אייקון חנייה */}
              </div>
              <h3>Effortless Management</h3>
              <p>Reserve and manage parking spaces quickly and efficiently.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact-footer" className="search-parking-footer">
        <p>Contact Us:</p>
        <p>Email: support@spms.com</p>
        <p>Phone: +1-800-123-4567</p>
        <p>&copy; 2024 Smart Parking Management System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;
