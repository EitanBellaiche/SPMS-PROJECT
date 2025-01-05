import React, { useState, useEffect } from "react";
import "./AdminPage.css";

const AdminPage = () => {
  const [parkingSpots, setParkingSpots] = useState([
    { id: 1, status: "Available" },
    { id: 2, status: "Occupied" },
    { id: 3, status: "Available" },
    { id: 4, status: "Occupied" },
  ]);
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");

  // Get username from localStorage
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const toggleStatus = (id) => {
    setParkingSpots((prevSpots) =>
      prevSpots.map((spot) =>
        spot.id === id
          ? { ...spot, status: spot.status === "Available" ? "Occupied" : "Available" }
          : spot
      )
    );
    setMessage(`Parking Spot ${id} status updated successfully!`);
    setTimeout(() => setMessage(""), 3000); // Clear message after 3 seconds
  };

  return (
    <div className="admin-page-container">
      {/* Header */}
      <header className="admin-header">
        <div className="logo">SPMS</div>
        <h1>Parking Management</h1>
        {username && <h2 className="welcome-message">Hello, {username}</h2>} {/* Add Welcome Message */}
      </header>

      {/* Success Message */}
      {message && <div className="success-message">{message}</div>}

      {/* Main Content */}
      <main className="admin-main">
        <div className="parking-management">
          <h2>Parking Spots Management</h2>
          <ul className="parking-list">
            {parkingSpots.map((spot) => (
              <li key={spot.id} className={`parking-item ${spot.status.toLowerCase()}`}>
                <span className="parking-info">
                  Parking Spot {spot.id}: <strong>{spot.status}</strong>
                </span>
                <button
                  className={`toggle-button ${
                    spot.status === "Available" ? "occupied-btn" : "available-btn"
                  }`}
                  onClick={() => toggleStatus(spot.id)}
                >
                  {spot.status === "Available" ? (
                    <>
                      <i className="fas fa-times-circle"></i> Mark as Occupied
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check-circle"></i> Mark as Available
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
