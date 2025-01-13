import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CancelParking.css";

const CancelParking = () => {
  const [reservations, setReservations] = useState([]); // כל ההזמנות
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true); // טעינה
  const [error, setError] = useState(""); // שגיאות
  const navigate = useNavigate();

  // שליפת שם המשתמש וההזמנות מהשרת
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);

      const fetchReservations = async () => {
        try {
          const response = await fetch(
            `http://127.0.0.1:5000/user-reservations?username=${storedUsername}`
          );
          const data = await response.json();

          if (data.success) {
            setReservations(data.reservations);
          } else {
            setError("Failed to load your reservations.");
          }
        } catch (err) {
          console.error("Error fetching reservations:", err);
          setError("Failed to load your reservations.");
        } finally {
          setLoading(false);
        }
      };

      fetchReservations();
    } else {
      setError("No username found. Please log in.");
      setLoading(false);
    }
  }, [navigate]);

  const cancelReservation = async (spotId, reservationDate) => {
    try {
      const response = await fetch("http://127.0.0.1:5000/cancel-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          reservation_date: reservationDate,
        }),
      });
  
      const result = await response.json();
  
      if (result.success) {
        alert("Reservation cancelled successfully!");
        // עדכון הרשימה לאחר הביטול
        setReservations((prevReservations) =>
          prevReservations.filter(
            (reservation) =>
              reservation.spot_id !== spotId ||
              reservation.reservation_date !== reservationDate
          )
        );
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
    return <div>Loading your reservations...</div>;
  }

  if (error) {
    return (
      <div className="cancel-page-container">
        <header className="cancel-header">
          <div className="logo">SPMS</div>
          <h1>Cancel Parking Reservations</h1>
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

  // הצגת ההזמנות
  return (
    <div className="cancel-page-container">
      <header className="cancel-header">
        <div className="logo">SPMS</div>
        <h1>Cancel Parking Reservations</h1>
      </header>
      <main className="cancel-main">
        {reservations.length > 0 ? (
          <div className="reservations-list">
            <h2>Your Reservations</h2>
            <table className="reservations-table">
              <thead>
                <tr>
                  <th>Spot ID</th>
                  <th>Reservation Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={`${reservation.spot_id}-${reservation.reservation_date}`}>
                    <td>{reservation.spot_id}</td>
                    <td>{reservation.reservation_date}</td>
                    <td>{reservation.status}</td>
                    <td>
                      <button
                        className="cancel-button"
                        onClick={() =>
                          cancelReservation(
                            reservation.spot_id,
                            reservation.reservation_date
                          )
                        }
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            <p>You have no reservations.</p>
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
