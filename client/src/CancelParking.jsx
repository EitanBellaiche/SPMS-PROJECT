import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CancelParking.css";

const CancelParking = () => {
  const [reservedSpot, setReservedSpot] = useState(null); // חנייה שמורה
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true); // טעינה
  const [error, setError] = useState(""); // שגיאות
  const navigate = useNavigate();

  // קבלת שם המשתמש והחנייה השמורה מה-localStorage
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);

      // שליפת החנייה השמורה מהשרת
      const fetchReservedSpot = async () => {
        try {
          const response = await fetch(`http://127.0.0.1:5000/user-info?username=${storedUsername}`);
          const data = await response.json();

          if (data.success) {
            setReservedSpot(data.reserved_spot);
          } else {
            setError("You don't have a reserved parking spot.");
            setReservedSpot(null);
          }
        } catch (err) {
          console.error("Error fetching reserved spot:", err);
          setError("Failed to load your reserved parking spot.");
        } finally {
          setLoading(false);
        }
      };

      fetchReservedSpot();
    } else {
      setError("No username found. Please log in.");
      setLoading(false);
    }
  }, [navigate]);

  // ביטול החנייה
  const cancelReservation = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/cancel-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const result = await response.json();

      if (result.success) {
        alert("Your parking reservation has been cancelled.");
        navigate("/home"); // מעבר לדף הבית לאחר ביטול
      } else {
        alert(`Failed to cancel the reservation: ${result.message}`);
      }
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      alert("Failed to cancel the reservation. Please try again.");
    }
  };

  // טעינה או שגיאה
  if (loading) {
    return <div>Loading your reserved parking spot...</div>;
  }

  if (error) {
    return (
      <div className="cancel-page-container">
        <header className="cancel-header">
          <div className="logo">SPMS</div>
          <h1>Cancel Parking Reservation</h1>
        </header>
        <main className="cancel-main">
          <p className="error-message">{error}</p>
          <button className="back-button" onClick={() => navigate("/home")}>
            Back to Home
          </button>
        </main>
      </div>
    );
  }

  // הצגת פרטי החנייה וכפתור ביטול
  return (
    <div className="cancel-page-container">
      <header className="cancel-header">
        <div className="logo">SPMS</div>
        <h1>Cancel Parking Reservation</h1>
      </header>
      <main className="cancel-main">
        {reservedSpot ? (
          <div className="reservation-details">
            <h2>Your Reserved Parking Spot</h2>
            <p><strong>Spot ID:</strong> {reservedSpot}</p>
            <button className="cancel-button" onClick={cancelReservation}>
              Cancel Reservation
            </button>
          </div>
        ) : (
          <div>
            <p>You don't have a reserved parking spot.</p>
            <button className="back-button" onClick={() => navigate("/home")}>
              Back to Home
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default CancelParking;
