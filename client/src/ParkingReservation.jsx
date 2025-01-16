import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ParkingReservation.css";

const ParkingSpotRow = ({ spot, onReserve }) => {
  const rowClass = spot.isRecommended ? "recommended-spot" : ""; // עיצוב לחניה מומלצת

  return (
    <tr key={spot.id} className={rowClass}>
      <td>
        {spot.id}
        {spot.isRecommended && (
          <span className="recommended-badge">Recommended</span>
        )}
      </td>
      <td>{spot.spot_code}</td>
      <td>Level {spot.level}</td>
      <td>
        <button className="reserve-button" onClick={() => onReserve(spot.id)}>
          Reserve
        </button>
      </td>
    </tr>
  );
};

const ParkingTable = ({ parkingSpots, onReserve }) => {
  if (!parkingSpots.length) {
    return <p className="no-spots-message">No available parking spots.</p>;
  }

  return (
    <table className="parking-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Spot Code</th>
          <th>Level</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {parkingSpots.map((spot) => (
          <ParkingSpotRow key={spot.id} spot={spot} onReserve={onReserve} />
        ))}
      </tbody>
    </table>
  );
};

const ParkingReservation = () => {
  const [parkingSpots, setParkingSpots] = useState([]);
  const [username, setUsername] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // שליפת שם המשתמש מה-LS
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  // שליפת חניות פנויות לפי תאריך
  useEffect(() => {
    const fetchAvailableSpots = async () => {
      if (!selectedDate) return;

      try {
        setLoading(true);
        const response = await fetch(
          `http://127.0.0.1:5000/parking-spots-by-date?reservation_date=${selectedDate}`
        );
        const data = await response.json();

        if (data.success) {
          setParkingSpots(data.parkingSpots);
        } else {
          console.error("Failed to fetch parking spots:", data.error);
        }
      } catch (error) {
        console.error("Error fetching parking spots:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableSpots();
  }, [selectedDate]);

  // פונקציה להזמנת חניה
  const reserveSpot = async (id) => {
    if (!selectedDate) {
      alert("Please select a date before reserving.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/reserve-spot-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          spot_id: id,
          reservation_date: selectedDate,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Spot ${id} reserved successfully for ${selectedDate}`);
        setParkingSpots((prevSpots) =>
          prevSpots.filter((spot) => spot.id !== id)
        ); // הסרת החניה מהטבלה
      } else {
        alert(data.message || "Failed to reserve the spot");
      }
    } catch (error) {
      console.error("Error reserving spot:", error);
      alert("An error occurred while reserving the spot. Please try again.");
    }
  };

  return (
    <div className="reservation-page-container">
      <header className="reservation-header">
        <div className="logo">SPMS</div>
        <h1>Parking Reservation</h1>
        {username && <h2 className="welcome-message">Hello, {username}</h2>}
      </header>

      <main className="reservation-main">
        <div className="parking-reservation">
          <h2>Reserve a Parking Spot</h2>

          <div className="date-picker-container">
            <label htmlFor="reservation-date">Select Date:</label>
            <input
              type="date"
              id="reservation-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="loading-message">Loading parking spots...</p>
          ) : (
            <ParkingTable parkingSpots={parkingSpots} onReserve={reserveSpot} />
          )}
        </div>
      </main>
    </div>
  );
};

export default ParkingReservation;
