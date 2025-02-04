import React, { useState, useEffect } from "react";
import "./AdminPage.css";

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [parkingSpots, setParkingSpots] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [activeSection, setActiveSection] = useState("parking");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (activeSection === "users") {
      fetchUsers();
    }
  }, [activeSection]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        console.error("Failed to fetch users:", data.message);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchFilteredParkingSpots = async () => {
    if (!selectedDate || !startTime || !endTime) {
      alert("Please select a date and time range.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/parking-spots?reservation_date=${selectedDate}&start_time=${startTime}&end_time=${endTime}`
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

  const fetchAllParkingSpots = async () => {
    try {
      const response = await fetch(`${API_URL}/all-parking-spots`);
      const data = await response.json();
      if (data.success) {
        setParkingSpots(data.parkingSpots);
      } else {
        console.error("Failed to fetch all parking spots:", data.message);
      }
    } catch (error) {
      console.error("Error fetching all parking spots:", error);
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="logo">SPMS</div>
        <h1 className="header-title">Parking Management</h1>
      </header>

      <div className="admin-wrapper">
        <aside className="sidebar">
          <ul>
            <li onClick={() => setActiveSection("users")}>User Management</li>
            <li onClick={() => setActiveSection("parking")}>Parking Spots Management</li>
            <li onClick={() => setActiveSection("buildings")}>Building Management</li>
            <li onClick={() => setActiveSection("reports")}>Statistics</li>
          </ul>
        </aside>

        <div className="admin-content">
          <main className="admin-main">
            {activeSection === "users" && (
              <div className="content-section">
                <h2>User Management</h2>
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Role</th>
                      <th>Building</th>
                      <th>Disabled</th>
                      <th>Electric Car</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.username}</td>
                        <td>{user.role}</td>
                        <td>{user.building}</td>
                        <td>{user.disabled ? "[v]" : "[ ]"}</td>
                        <td>{user.electric_car ? "[v]" : "[ ]"}</td>
                        <td>
                          <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit</button>
                          <button className="delete-btn">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeSection === "parking" && (
              <div className="content-section">
                <h2>Parking Spots Management</h2>
                <div className="filters">
                  <label>Date:</label>
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />

                  <label>Start Time:</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />

                  <label>End Time:</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />

                  <button className="search-btn" onClick={fetchFilteredParkingSpots}>Search</button>
                  <button className="all-spots-btn" onClick={fetchAllParkingSpots}>See All Parking Spots</button>
                </div>

                <table className="parking-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Spot Code</th>
                      <th>Building</th>
                      <th>Status</th>
                      <th>Available</th>
                      <th>Electric</th>
                      <th>Disabled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parkingSpots.map((spot) => (
                      <tr key={spot.id}>
                        <td>{spot.id}</td>
                        <td>{spot.spot_code}</td>
                        <td>{spot.level}</td>
                        <td>{spot.status}</td>
                        <td>{spot.availability ? "✔️" : "X"}</td>
                        <td>{spot.is_electric ? "⚡" : "No"}</td>
                        <td>{spot.is_disabled ? "♿" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
