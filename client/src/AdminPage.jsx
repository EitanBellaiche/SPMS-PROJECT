import React, { useState, useEffect } from "react";
import "./AdminPage.css";

const AdminPage = () => {
  const [parkingSpots, setParkingSpots] = useState([]); // נתוני חניות
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");

  // קבלת שם המשתמש מה-localStorage
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  // שליפת חניות מהשרת
  useEffect(() => {
    const fetchParkingSpots = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/parking-spots");
        const data = await response.json();
        setParkingSpots(data.parkingSpots);
      } catch (error) {
        console.error("Error fetching parking spots:", error);
      }
    };

    fetchParkingSpots();
  }, []);

  // עדכון סטטוס חניה
  const toggleStatus = async (id) => {
    const updatedSpots = parkingSpots.map((spot) =>
      spot.id === id
        ? { ...spot, status: spot.status === "Available" ? "Occupied" : "Available" }
        : spot
    );
    setParkingSpots(updatedSpots);

    const updatedSpot = updatedSpots.find((spot) => spot.id === id);

    try {
      await fetch(`http://127.0.0.1:5000/parking-spots/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: updatedSpot.status }),
      });
      setMessage(`Parking Spot ${updatedSpot.spot_code} status updated successfully!`);
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating parking spot:", error);
    }
  };

  return (
    <div className="admin-page-container">
      {/* Header */}
      <header className="admin-header">
        <div className="logo">SPMS</div>
        <h1>Parking Management</h1>
        {username && <h2 className="welcome-message">Hello, {username}</h2>}
      </header>

      {/* Success Message */}
      {message && <div className="success-message">{message}</div>}

      {/* Main Content */}
      <main className="admin-main">
        <div className="parking-management">
          <h2>Parking Spots Management</h2>
          <table className="parking-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Spot Code</th>
                <th>Level</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {parkingSpots.map((spot) => (
                <tr key={spot.id}>
                  <td>{spot.id}</td>
                  <td>{spot.spot_code}</td>
                  <td>Level {spot.level}</td>
                  <td className={spot.status.toLowerCase()}>{spot.status}</td>
                  <td>
                    <button
                      className={`toggle-button ${
                        spot.status === "Available" ? "occupied-btn" : "available-btn"
                      }`}
                      onClick={() => toggleStatus(spot.id)}
                    >
                      {spot.status === "Available" ? "Mark as Occupied" : "Mark as Available"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
