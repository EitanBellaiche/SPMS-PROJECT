import React, { useState, useEffect } from "react";
import "./ParkingReservation.css";

const ParkingSpotRow = ({ spot, onReserve }) => {
  const rowClass = spot.status === "Occupied" ? "occupied-spot" : "available-spot";

  return (
    <tr key={spot.id} className={rowClass}>
      <td>{spot.id}</td>
      <td>{spot.spot_code}</td>
      <td>Level {spot.level}</td>
      <td>
        {spot.status === "Available" ? (
          <button className="reserve-button" onClick={() => onReserve(spot.id)}>
            Reserve
          </button>
        ) : (
          <span className="status-text">Occupied</span>
        )}
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
          <th>Status</th>
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
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username") || "default_user";
    setUsername(storedUsername);
  }, []);

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourStr = hour.toString().padStart(2, "0");
      options.push(`${hourStr}:00`);
      options.push(`${hourStr}:30`);
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const fetchAvailableSpots = async () => {
    if (!selectedDate || !startTime || !endTime) {
      alert("Please select a date, start time, and end time.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `http://127.0.0.1:5000/parking-spots?reservation_date=${selectedDate}&start_time=${startTime}&end_time=${endTime}`
      );
      const data = await response.json();

      if (data.success) {
        setParkingSpots(data.parkingSpots);
      } else {
        alert(data.message || "Error fetching parking spots.");
      }
    } catch (error) {
      alert("An error occurred while fetching parking spots.");
      console.error("Error fetching parking spots:", error);
    } finally {
      setLoading(false);
    }
  };

  const reserveSpot = async (spotId) => {
    if (!selectedDate || !startTime || !endTime) {
      alert("Please provide all details before reserving.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/reserve-spot-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          spot_id: spotId,
          reservation_date: selectedDate,
          start_time: startTime,
          end_time: endTime,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        fetchAvailableSpots(); // Refresh spots after reservation
      } else {
        alert(data.message || "Failed to reserve spot.");
      }
    } catch (error) {
      alert("An error occurred while reserving the spot.");
      console.error("Error reserving spot:", error);
    }
  };

  return (
    <div className="reservation-page-container">
      <header className="reservation-header">
        <h1>Parking Reservation</h1>
        {username && <p>Welcome, {username}</p>}
      </header>

      <main className="reservation-main">
        <div className="parking-reservation">
          <h2>Find and Reserve Parking</h2>
          <div className="date-time-picker">
            <label>
              Date:
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </label>
            <label>
              Start Time:
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              >
                <option value="">Select Start Time</option>
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </label>
            <label>
              End Time:
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              >
                <option value="">Select End Time</option>
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button onClick={fetchAvailableSpots} className="search-button">
            Search
          </button>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ParkingTable parkingSpots={parkingSpots} onReserve={reserveSpot} />
          )}
        </div>
      </main>
    </div>
  );
};

export default ParkingReservation;
