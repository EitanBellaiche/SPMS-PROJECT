import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import logo from "./assets/logo.png"; // Importing the logo from src/assets

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success) {
        // Save username and profile picture to localStorage
        localStorage.setItem("username", data.username);
        localStorage.setItem("profilePicture", data.profile_picture);

        // Navigate based on role
        if (data.role === "admin") {
          navigate("/admin");
        } else if (data.role === "client") {
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
          <img src={logo} alt="SPMS Logo" className="logo-image" /> {/* Logo */}
          SPMS
        </div>
        <nav className="navbar">
          <ul>
            <li>
              <a href="/About us">About us</a>
            </li>
            <li>
              <a href="/Sign up">Sign up</a>
            </li>
          </ul>
        </nav>
      </header>

      <main className="login-main">
        <div className="login-container">
          <h1></h1>
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

      <footer id="contact-footer" className="homepage-footer">
        <p>&copy; 2024 Smart Parking Management System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Login;
