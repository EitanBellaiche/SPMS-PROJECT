import React, { useState, useEffect } from "react";
import "./ParkingReservation.css";
import { useNavigate } from "react-router-dom";

const ParkingSpotRow = ({ spot, onReserve }) => {
  const rowClass = `spot-row ${spot.status === "Occupied"
    ? "occupied-spot"
    : spot.recommended
      ? "recommended-spot"
      : "available-spot"
    }`;

  return (
    <tr key={spot.id} className={rowClass}>
      <td>{spot.spot_code}</td>
      <td>Level {spot.level}</td>
      <td>
        {spot.is_electric && <span>⚡ Electric</span>}{" "}
        {spot.is_disabled && <span>♿ Disabled</span>}
      </td>
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
  if (!parkingSpots || parkingSpots.length === 0) {
    return null; // אין להציג הודעת "אין חניות" אם אין חניות זמינות
  }

  return (
    <table className="parking-table">
      <thead>
        <tr>
          <th>Spot Code</th>
          <th>Level</th>
          <th>Features</th>
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
  const navigate = useNavigate(); // Add useNavigate hook

  const API_URL =
    process.env.NODE_ENV === "development"
      ? process.env.REACT_APP_API_URL || "http://localhost:5000"
      : process.env.REACT_APP_API_PRODUCTION_URL || "https://spms-project.onrender.com";

  useEffect(() => {
    const storedUsername = localStorage.getItem("username") || "default_user";
    setUsername(storedUsername);
  }, []);

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 6; hour <= 24; hour++) {
      if (hour === 24) {
        options.push("00:00"); // Add midnight
        break;
      }
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
        `${API_URL}/parking-spots?reservation_date=${selectedDate}&start_time=${startTime}&end_time=${endTime}&username=${username}`
      );
      const data = await response.json();

      if (data.success) {
        setParkingSpots(data.parkingSpots);

        const recommendResponse = await fetch(
          `${API_URL}/recommend-parking?username=${username}&reservation_date=${selectedDate}`
        );
        const recommendData = await recommendResponse.json();

        if (recommendData.success) {
          const recommendedSpot = recommendData.recommendedSpot;

          const updatedSpots = data.parkingSpots.map((spot) =>
            spot.id === recommendedSpot.id
              ? { ...spot, recommended: true }
              : spot
          );
          setParkingSpots(updatedSpots);
        }
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
      const response = await fetch(`${API_URL}/reserve-spot-date`, {
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
        // הצגת הודעה על ההצלחה
        alert(data.message || "Parking spot reserved successfully!");
        
        // ניווט לדף הבית אחרי הצלחה
        navigate("/home");
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
      {/* Header */}
      <header className="reservation-header">
        <div className="logo">SPMS</div>
        <nav>
          <button className="back-home-button" onClick={() => navigate("/home")}>
            Home
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="reservation-main">
        <div className="parking-reservation">
          <h2>Find and Reserve Parking</h2>
          <div className="date-time-container">
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
          </div>

          {parkingSpots.some((spot) => spot.recommended) && (
            <div className="recommendation-container">
              <div className="recommendation-message">
                <p className="recommendation-text">
                  Recommended spot is highlighted blue.
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <p>Loading...</p>
          ) : (
            <ParkingTable parkingSpots={parkingSpots} onReserve={reserveSpot} />
          )}
        </div>
      </main>
      <footer id="contact-footer" className="footer">
        <p>&copy; 2024 Smart Parking Management System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ParkingReservation;
