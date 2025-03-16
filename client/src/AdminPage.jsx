import React, { useState, useEffect } from "react";
import "./AdminPage.css";
import { Chart, registerables } from "chart.js";
import { Pie } from "react-chartjs-2";

Chart.register(...registerables);

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
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [isEditingBuilding, setIsEditingBuilding] = useState(false);
  const [editedBuilding, setEditedBuilding] = useState({});
  const [parkingData, setParkingData] = useState(null);
  const [specialParkingData, setSpecialParkingData] = useState(null);
  const [employeesData, setEmployeesData] = useState(null);



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
  const editUser = async (userId, updatedUser) => {
    const formattedUser = {
      username: updatedUser.username,
      role: updatedUser.role,
      building: updatedUser.building,
      is_disabled_user: updatedUser.disabled, // שינוי השם ל-DB
      is_electric_car: updatedUser.electric_car, // שינוי השם ל-DB
    };
  
    try {
      const response = await fetch(`${API_URL}/update-user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedUser),
      });
  
      const data = await response.json();
  
      if (data.success) {
        alert("User updated successfully!");
        setUsers(users.map(user => (user.id === userId ? { ...user, ...formattedUser } : user))); 
        setIsEditing(false);
      } else {
        alert("Failed to update user: " + data.message);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Error updating user.");
    }
  };
  
  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
  
    try {
      const response = await fetch(`${API_URL}/delete-user/${userId}`, {
        method: "DELETE",
      });
  
      const data = await response.json();
  
      if (data.success) {
        alert("User deleted successfully!");
        setUsers(users.filter(user => user.id !== userId)); // עדכון הרשימה אחרי מחיקה
      } else {
        alert("Failed to delete user: " + data.message);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error deleting user.");
    }
  };

  const fetchBuildings = async () => {
    try {
      const response = await fetch(`${API_URL}/buildings`);
      const data = await response.json();
      if (data.success) {
        setBuildings(data.buildings);
      } else {
        console.error("Failed to fetch buildings:", data.message);
      }
    } catch (error) {
      console.error("Error fetching buildings:", error);
    }
  };

  const editBuilding = async (buildingId, updatedBuilding) => {
    try {
      const response = await fetch(`${API_URL}/update-building/${buildingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedBuilding),
      });
  
      const data = await response.json();
      if (data.success) {
        alert("Building updated successfully!");
        setBuildings(buildings.map(building => (building.id === buildingId ? { ...building, ...updatedBuilding } : building))); 
        setIsEditingBuilding(false);
      } else {
        alert("Failed to update building: " + data.message);
      }
    } catch (error) {
      console.error("Error updating building:", error);
      alert("Error updating building.");
    }
  };
  
  const deleteBuilding = async (buildingId) => {
    if (!window.confirm("Are you sure you want to delete this building?")) return;
  
    try {
      const response = await fetch(`${API_URL}/delete-building/${buildingId}`, {
        method: "DELETE",
      });
  
      const data = await response.json();
      if (data.success) {
        alert("Building deleted successfully!");
        setBuildings(buildings.filter(building => building.id !== buildingId));
      } else {
        alert("Failed to delete building: " + data.message);
      }
    } catch (error) {
      console.error("Error deleting building:", error);
      alert("Error deleting building.");
    }
  };
  
  const generatePieData = (data, label) => {
    console.log("📊 generatePieData received:", data); // ✅ בדיקה נוספת
    if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
      return {
        labels: ["No Data"],
        datasets: [
          {
            label,
            data: [1], // ברירת מחדל למניעת קריסה
            backgroundColor: ["#CCCCCC"],
          },
        ],
      };
    }
  
    return {
      labels: Object.keys(data), // רשימת התאריכים
      datasets: [
        {
          label,
          data: Object.values(data).map(value => Number(value) || 0), // מוודא שהכל מספרים
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4CAF50", "#9C27B0"],
        },
      ],
    };
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
                        {isEditing && selectedUser?.id === user.id ? (
                          <>
                            <td>{user.id}</td>
                            <td>
                              <input
                                type="text"
                                value={editedUser.username}
                                onChange={(e) => setEditedUser({ ...editedUser, username: e.target.value })}
                              />
                            </td>
                            <td>
                              <select
                                value={editedUser.role}
                                onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value })}
                              >
                                <option value="admin">Admin</option>
                                <option value="user">User</option>
                              </select>
                            </td>
                            <td>
                              <input
                                type="text"
                                value={editedUser.building}
                                onChange={(e) => setEditedUser({ ...editedUser, building: e.target.value })}
                              />
                            </td>
                            <td>
                              <input
                                type="checkbox"
                                checked={editedUser.is_disabled_user} // ✅ שינוי השם 
                                onChange={(e) => setEditedUser({ ...editedUser, is_disabled_user: e.target.checked })} // ✅ שינוי השם 
                              />
                            </td>
                            <td>
                              <input
                                type="checkbox"
                                checked={editedUser.is_electric_car} // ✅ שינוי השם 
                                onChange={(e) => setEditedUser({ ...editedUser, is_electric_car: e.target.checked })} // ✅ שינוי השם 
                              />
                            </td>
                            <td>
                              <button onClick={() => editUser(user.id, editedUser)}>Save</button>
                              <button onClick={() => setIsEditing(false)}>Cancel</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{user.id}</td>
                            <td>{user.username}</td>
                            <td>{user.role}</td>
                            <td>{user.building}</td>
                            <td>{user.disabled ? "[v]" : "[ ]"}</td>
                            <td>{user.electric_car ? "[v]" : "[ ]"}</td>
                            <td>
                              <button
                                className="edit-btn"
                                onClick={() => {
                                  setIsEditing(true);
                                  setSelectedUser(user);
                                  setEditedUser(user);
                                }}
                              >
                                Edit
                              </button>
                              <button className="delete-btn" onClick={() => deleteUser(user.id)}>Delete</button>
                            </td>
                          </>
                        )}
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
             
              {activeSection === "reports" && (
                <div className="content-section">
                  <h2>Statistics Overview</h2>

                  <div className="chart-container">
                    {parkingData && (
                      <div className="chart">
                        <h3>Parking Occupancy</h3>
                        <Pie data={generatePieData(parkingData, "Total Reservations")} />
                        <pre>{JSON.stringify(parkingData, null, 2)}</pre> {/* ✅ הצגת נתונים ב-JSON */}
                      </div>
                    )}
                    
                    {specialParkingData && (
                      <div className="chart">
                        <h3>Special Parking Usage</h3>
                        <Pie data={generatePieData(specialParkingData, "Special Parking")} />
                        <pre>{JSON.stringify(specialParkingData, null, 2)}</pre> {/* ✅ בדיקה */}
                      </div>
                    )}

                    {employeesData && (
                      <div className="chart">
                        <h3>Employees Per Day</h3>
                        <Pie data={generatePieData(employeesData, "Employees Count")} />
                        <pre>{JSON.stringify(employeesData, null, 2)}</pre> {/* ✅ הצגת הנתונים */}
                      </div>
                    )}
                  </div>
                </div>
              )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
