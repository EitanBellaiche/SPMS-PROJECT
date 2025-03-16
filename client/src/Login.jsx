import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; 
import "./Login.css";
import logo from "./assets/logo.png"; // Importing the logo from src/assets

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  
  const API_URL =
    process.env.NODE_ENV === "development"
      ? process.env.REACT_APP_API_URL || "http://localhost:5000"
      : process.env.REACT_APP_API_PRODUCTION_URL || "https://spms-project.onrender.com";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        // אם השרת החזיר שגיאה
        const errorData = await response.json();
        setErrorMessage(errorData.message || "An error occurred.");
        return;
      }

      const data = await response.json();

      if (data.success) {
        // Save username, profile picture, and role to localStorage
        localStorage.setItem("username", data.username);
        localStorage.setItem("profilePicture", data.profile_picture);
        localStorage.setItem("role", data.role); // Save role to localStorage

        // Navigate based on role
        if (data.role === "admin") {
          navigate("/admin");
        } else if (data.role === "guest") {
          navigate("/home");
        } else if (data.role === "employee") {
          navigate("/home");
        } else {
          setErrorMessage("Role not recognized.");
        }
      } else {
        setErrorMessage(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("An error occurred. Please try again later.");
    }
  };

  return (
    <div className="login-page">
      <header className="homepage-header">
        <div className="logo">
          <img src={logo} alt="SPMS Logo" className="logo-image" />
          SPMS
        </div>
        <nav className="navbar">
          <ul>
            <li>
              <Link to="/signup">Sign up</Link> { }
            </li>
          </ul>
        </nav>
      </header>

      <main className="login-main">
        <div className="login-container">
          <form onSubmit={handleSubmit} className="login-form">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={credentials.username}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={credentials.password}
              onChange={handleChange}
              required
            />
            <button type="submit">Login</button>
          </form>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>
      </main>

      <footer id="contact-footer" className="footer">
        <p>&copy; 2024 Smart Parking Management System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Login;