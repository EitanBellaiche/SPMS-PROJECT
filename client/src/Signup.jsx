import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Signup.css";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    id: "",
    username: "",
    password: "",
    building: "",
  });

  const [errorMessage, setErrorMessage] = useState("");

  // עדכון השדות בעת שינוי קלט
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
  
      const data = await response.json();
  
      if (data.success) {
        alert("Registration successful!");
        navigate("/"); // ניווט חזרה לדף הכניסה
      } else {
        setErrorMessage(data.message || "Error: wrong details.");
      }
    } catch (error) {
      console.error("Error during signup:", error);
      setErrorMessage("Error: Could not connect to the server.");
    }
  };
  

  return (
    <div className="signup-page">
      {/* Header */}
      <header className="header">
        <div className="logo">SPMS</div>
        <nav>
          <Link to="/">Login</Link>
          <Link to="/signup">Sign Up</Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="signup-main">
        <div className="signup-container">
          <h1>Sign Up</h1>
          <form className="signup-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="id"
              placeholder="ID"
              value={formData.id}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="building"
              placeholder="Building"
              value={formData.building}
              onChange={handleChange}
              required
            />
            {/* עוטפים את הכפתור ב-div */}
            <div className="button-container">
              <button type="submit" className="submit-button">Sign Up</button>
            </div>
          </form>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        © 2024 Smart Parking Management System. All rights reserved.
      </footer>
    </div>
  );
};

export default Signup;
