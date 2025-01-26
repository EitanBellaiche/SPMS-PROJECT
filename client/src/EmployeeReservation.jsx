import React, { useState, useEffect } from "react";
import "./EmployeeReservation.css";

const EmployeeReservation = () => {
  const [selectedDays, setSelectedDays] = useState([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reservationDuration, setReservationDuration] = useState(1); // שבועות
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username") || "default_user";
    setUsername(storedUsername);
  }, []);

  const toggleDaySelection = (day) => {
    setSelectedDays((prevDays) =>
      prevDays.includes(day)
        ? prevDays.filter((d) => d !== day)
        : [...prevDays, day]
    );
  };

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

  const reserveFutureParking = async () => {
    if (!selectedDays.length || !startTime || !endTime || !reservationDuration) {
      alert("Please select days, times, and duration.");
      return;
    }

    try {
      setLoading(true);

      // שליחת בקשה להזמנת חנייה חוזרת
      const response = await fetch("http://127.0.0.1:5000/reserve-future-parking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          selectedDays,
          startTime,
          endTime,
          reservationDuration,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // ניסיון לשלוף חנייה מומלצת
        const recommendedResponse = await fetch(
          `http://127.0.0.1:5000/recommend-parking?username=${username}&reservation_date=${new Date().toISOString().split("T")[0]}`
        );

        const recommendedData = await recommendedResponse.json();

        if (recommendedData.success) {
          alert(
            `Future parking reservations were successful! Recommended parking spot: Spot ${recommendedData.recommendedSpot.spot_code}, Level ${recommendedData.recommendedSpot.level}`
          );
        } else {
          alert("Future parking reservations were successful, but no recommended parking spot was found.");
        }
      } else {
        alert(data.message || "Failed to reserve future parking.");
      }
    } catch (error) {
      console.error("Error reserving future parking:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employee-reservation-container">
      <header className="reservation-header">
        <h1>Employee Parking Reservation</h1>
        {username && <p>Welcome, {username}</p>}
      </header>

      <main className="reservation-main">
        <div className="reservation-form">
          <h2>Reserve Recurring Parking</h2>

          {/* Days Selection */}
          <div className="day-selection">
            <label>Select Days:</label>
            <div className="days-container">
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(
                (day) => (
                  <button
                    key={day}
                    className={`day-button ${
                      selectedDays.includes(day) ? "selected" : ""
                    }`}
                    onClick={() => toggleDaySelection(day)}
                  >
                    {day}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Time Selection */}
          <div className="time-selection">
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

          {/* Duration Selection */}
          <div className="duration-selection">
            <label>
              Reserve For (weeks):
              <input
                type="number"
                min="1"
                max="52"
                value={reservationDuration}
                onChange={(e) => setReservationDuration(e.target.value)}
              />
            </label>
          </div>

          {/* Reserve Button */}
          <button
            className="reserve-button"
            onClick={reserveFutureParking}
            disabled={loading}
          >
            {loading ? "Reserving..." : "Reserve Parking"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default EmployeeReservation;
