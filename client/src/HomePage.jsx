import React, { useEffect, useState } from "react";
import "./HomePage.css";

const HomePage = ({ loggedInUser }) => {
  const [username, setUsername] = useState("");

  useEffect(() => {
    // שליפת שם המשתמש מהשרת
    const fetchUsername = async () => {
      try {
        const response = await fetch(`/user-data?username=${loggedInUser}`);
        const data = await response.json();
        if (data.success) {
          setUsername(data.username); // עדכון שם המשתמש מהשרת
        } else {
          console.error("Failed to fetch user data:", data.message);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (loggedInUser) {
      fetchUsername();
    }
  }, [loggedInUser]);

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
          <h2>Hello {username},</h2> {/* הצגת שם המשתמש מהדאטה בייס */}
          <p>Welcome back to the system!</p>
        </div>
        <div className="profile">
          <div className="profile-icon"></div>
          <p>{username}</p>
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
