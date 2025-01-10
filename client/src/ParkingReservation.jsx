import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ParkingReservation.css";

const ParkingReservation = () => {
  const [parkingSpots, setParkingSpots] = useState([]);
  const [username, setUsername] = useState("");
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
          const availableSpots = data.parkingSpots.filter(
            (spot) => spot.status === "Available"
          );
          setParkingSpots(availableSpots);
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
    try {
      const checkReservedResponse = await fetch(
        "http://127.0.0.1:5000/check-reserved-spot",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        }
      );

      const checkReservedResult = await checkReservedResponse.json();

      if (checkReservedResult.reservedSpot) {
        alert(
          "You already have a reserved spot. You cannot reserve two spots."
        );
        navigate("/home");
        return;
      }

      const updateSpotResponse = await fetch(
        `http://127.0.0.1:5000/parking-spots/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Occupied" }),
        }
      );

      const updateSpotResult = await updateSpotResponse.json();

      if (updateSpotResult.success) {
        const reserveSpotResponse = await fetch(
          "http://127.0.0.1:5000/reserve-spot",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, spot_id: id }),
          }
        );

        const reserveSpotResult = await reserveSpotResponse.json();

        if (reserveSpotResult.success) {
          alert("Parking Spot reserved successfully!");
          navigate("/home");
        } else {
          alert(
            `Failed to update reserved spot: ${reserveSpotResult.message}`
          );
        }
      } else {
        alert(`Failed to update parking spot: ${updateSpotResult.message}`);
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
          <h2>Available Parking Spots</h2>
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
