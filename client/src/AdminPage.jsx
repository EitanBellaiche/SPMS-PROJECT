import React, { useState } from "react";
import "./AdminPage.css";

const AdminPage = () => {
  const [parkingSpots, setParkingSpots] = useState([
    { id: 1, status: "Available" },
    { id: 2, status: "Occupied" },
    { id: 3, status: "Available" },
    { id: 4, status: "Occupied" },
  ]);
  const [message, setMessage] = useState("");

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
                  className="toggle-button"
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
