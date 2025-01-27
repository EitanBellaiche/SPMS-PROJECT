import React, { useState, useEffect } from "react";
import "./AdminPage.css";

const AdminPage = () => {
  const [parkingSpots, setParkingSpots] = useState([]); // נתוני חניות
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const [selectedDate, setSelectedDate] = useState(""); // תאריך שנבחר

  // משתנה סביבתי לכתובת ה-API
  const API_URL = process.env.REACT_APP_API_URL;

  // קבלת שם המשתמש מה-localStorage
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  // שליפת מצב החניות לפי תאריך
  useEffect(() => {
    if (!selectedDate) return; // אם לא נבחר תאריך, לא לעשות כלום

    const fetchParkingSpotsByDate = async () => {
      try {
        const response = await fetch(
          `${API_URL}/parking-spots-by-date?reservation_date=${selectedDate}`
        );
        const data = await response.json();

        if (data.success) {
          setParkingSpots(data.parkingSpots);
        } else {
          console.error("Failed to fetch parking spots:", data.message);
        }
      } catch (error) {
        console.error("Error fetching parking spots:", error);
      }
    };

    fetchParkingSpotsByDate();
  }, [selectedDate, API_URL]);

  const toggleStatus = async (id) => {
    const updatedSpots = parkingSpots.map((spot) =>
      spot.id === id
        ? { ...spot, status: spot.status === "Available" ? "Occupied" : "Available" }
        : spot
    );
    setParkingSpots(updatedSpots);

    const updatedSpot = updatedSpots.find((spot) => spot.id === id);

    try {
      if (updatedSpot.status === "Available") {
        const reservationDate = selectedDate;

        const deleteResponse = await fetch(`${API_URL}/delete-reservation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spot_id: id,
            reservation_date: reservationDate,
          }),
        });

        if (!deleteResponse.ok) {
          console.error("Failed to delete reservation:", await deleteResponse.text());
          return; // יציאה מוקדמת אם יש בעיה במחיקה
        }
      }

      const response = await fetch(`${API_URL}/parking-spots/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: updatedSpot.status }),
      });

      if (!response.ok) {
        console.error("Failed to update parking spot:", await response.text());
        return; // יציאה מוקדמת אם יש בעיה בעדכון
      }

      const data = await response.json();
      if (data.success) {
        setMessage(`Parking Spot ${updatedSpot.spot_code} status updated successfully!`);
      }
    } catch (error) {
      console.error("Unexpected error:", error.message);
    }
  };

  return (
    <div className="admin-page-container">
      <header className="admin-header">
        <div className="logo">SPMS</div>
        <h1>Parking Management</h1>
        {username && <h2 className="welcome-message">Hello, {username}</h2>}
      </header>

      {message && <div className="success-message">{message}</div>}

      <main className="admin-main">
        <div className="parking-management">
          <h2>Parking Spots Management</h2>
          <div className="date-picker-container">
            <label htmlFor="date-picker">Select Date:</label>
            <input
              type="date"
              id="date-picker"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-picker"
            />
          </div>
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
