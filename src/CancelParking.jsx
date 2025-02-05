import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CancelParking.css";

const CancelParking = () => {
  const [reservations, setReservations] = useState([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReservation, setSelectedReservation] = useState(null);
  const navigate = useNavigate();

  const API_URL =
    process.env.NODE_ENV === "development"
      ? process.env.REACT_APP_API_URL || "http://localhost:5000"
      : process.env.REACT_APP_API_PRODUCTION_URL || "https://spms-project.onrender.com";

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);

      const fetchReservations = async () => {
        try {
          const response = await fetch(
            `${API_URL}/user-reservations?username=${storedUsername}`
          );
          const data = await response.json();

          console.log("Reservations Data:", data); // ✅ בדיקה האם הנתונים מגיעים

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
  }, [API_URL]);

  const cancelReservation = async (spotId, reservationDate) => {
    try {
      const response = await fetch(`${API_URL}/cancel-reservation`, {
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

  const viewReservationDetails = (reservation) => {
    console.log("Selected Reservation:", reservation);

    if (!reservation.latitude || !reservation.longitude) {
      alert("Location data is missing. Please check the database or API.");
      return;
    }
    setSelectedReservation(reservation);
  };

  const closeDetailsModal = () => {
    setSelectedReservation(null);
  };

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

  return (
    <div className="cancel-page-container">
      <header className="homepage-header">
        <div className="logo">SPMS</div>
        <nav>
          <a href="#contact">Contact</a>
        </nav>
      </header>
      <main className="cancel-main">
        {reservations.length > 0 ? (
          <div className="reservations-list">
            <h2>Your Reservations</h2>
            <table className="reservations-table">
              <thead>
                <tr>
                  <th>Spot Code</th>
                  <th>Reservation Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={`${reservation.spot_id}-${reservation.reservation_date}`}>
                    <td>{reservation.spot_code}</td>
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
                      <button
                        className="details-button"
                        onClick={() => viewReservationDetails(reservation)}
                      >
                        View Details
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

      {/* 🔹 חלון עם פרטי החנייה וכפתור ניווט */}
      {selectedReservation && (
        <div className="details-modal">
          <div className="modal-content">
            <h2>Reservation Details</h2>
            <p><strong>Spot Code:</strong> {selectedReservation.spot_code}</p>
            <p><strong>Date:</strong> {selectedReservation.reservation_date}</p>
            <p><strong>Start Time:</strong> {selectedReservation.start_time}</p>
            <p><strong>End Time:</strong> {selectedReservation.end_time}</p>
            
            {/* 🔹 הצגת נתוני מיקום */}
            {selectedReservation.latitude && selectedReservation.longitude ? (
              <>
                <p><strong>Location:</strong> {selectedReservation.latitude}, {selectedReservation.longitude}</p>
                <button
                  className="navigate-button"
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${selectedReservation.latitude},${selectedReservation.longitude}&travelmode=driving`,
                      "_blank"
                    )
                  }
                >
                  🚗 Navigate
                </button>
              </>
            ) : (
              <p className="error-message">Location data is not available for this parking spot.</p>
            )}

            <button className="close-modal-button" onClick={closeDetailsModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CancelParking;
