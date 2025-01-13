import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ParkingReservation.css";

const ParkingReservation = () => {
  const [parkingSpots, setParkingSpots] = useState([]);
  const [username, setUsername] = useState("");
  const [selectedDate, setSelectedDate] = useState(""); // תאריך שנבחר
  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  useEffect(() => {
    const fetchAvailableSpots = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/parking-spots");
        const data = await response.json();

        if (data.success) {
          setParkingSpots(data.parkingSpots);
        } else {
          console.error("Failed to fetch parking spots:", data.error);
        }
      } catch (error) {
        console.error("Error fetching parking spots:", error);
      }
    };

    fetchAvailableSpots();
  }, []);

  const reserveSpot = async (id) => {
    if (!selectedDate) {
      alert("Please select a date before reserving a parking spot.");
      return;
    }

    try {
      const checkAvailabilityResponse = await fetch(
        "http://127.0.0.1:5000/check-availability",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ spot_id: id, reservation_date: selectedDate }),
        }
      );

      const checkAvailabilityResult = await checkAvailabilityResponse.json();

      if (!checkAvailabilityResult.available) {
        alert("This spot is already reserved for the selected date.");
        return;
      }

      const reserveSpotResponse = await fetch(
        "http://127.0.0.1:5000/reserve-spot-date",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            spot_id: id,
            reservation_date: selectedDate,
          }),
        }
      );

      const reserveSpotResult = await reserveSpotResponse.json();

      if (reserveSpotResult.success) {
        alert("Parking Spot reserved successfully!");
        navigate("/home");
      } else {
        alert(`Failed to reserve parking spot: ${reserveSpotResult.message}`);
      }
    } catch (error) {
      console.error("Error reserving parking spot:", error);
      alert("Failed to reserve the parking spot. Please try again.");
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
                <tr key={spot.id}>
                  <td>{spot.id}</td>
                  <td>{spot.spot_code}</td>
                  <td>Level {spot.level}</td>
                  <td>
                    <button
                      className="reserve-button"
                      onClick={() => reserveSpot(spot.id)}
                    >
                      Reserve
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

export default ParkingReservation;
