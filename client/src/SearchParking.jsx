import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './SearchParking.css';

const SearchParking = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchData, setSearchData] = useState({
    companyName: '',
    parkingLot: '',
    carName: '',
    carType: '',
    carSize: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchData({ ...searchData, [name]: value });
  };

  const handleSearch = () => {
    alert(`Searching parking for:
Company: ${searchData.companyName}
Parking Lot: ${searchData.parkingLot}
Car Name: ${searchData.carName}
Car Type: ${searchData.carType}
Car Size: ${searchData.carSize}`);
  };

  return (
    <div className="search-parking-container">
      {/* Header */}
      <header className="homepage-header">
        <div
          className="hamburger"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <div></div>
          <div></div>
          <div></div>
        </div>
        {/* Link to HomePage */}
        <Link to="/" className="logo">
          SPMS
        </Link>
        <nav className={`navbar ${isMenuOpen ? 'active' : ''}`}>
          <ul>
            {/* Link to Contact section in Footer */}
            <li><a href="#contact-footer">Contact</a></li>
            <li><Link to="/search-parking">Reservations</Link></li>
          </ul>
        </nav>
      </header>

      {/* Main Content */}
      <main className="search-parking-main">
        <section className="intro">
          <h1>Search Parking Spot</h1>
          <p>Find and reserve your parking space easily and efficiently.</p>
        </section>

        <section className="search-parking-form">
          <h2>Search for a Parking Spot</h2>
          <div className="search-form">
            <input
              type="text"
              name="companyName"
              placeholder="Company Name"
              value={searchData.companyName}
              onChange={handleChange}
            />
            <select
              name="parkingLot"
              value={searchData.parkingLot}
              onChange={handleChange}
            >
              <option value="" disabled>Select Parking Lot</option>
              <option value="Lot A">Lot A</option>
              <option value="Lot B">Lot B</option>
              <option value="Lot C">Lot C</option>
            </select>
            <input
              type="text"
              name="carName"
              placeholder="Car Name (e.g., Toyota)"
              value={searchData.carName}
              onChange={handleChange}
            />
            <input
              type="text"
              name="carType"
              placeholder="Car Type (e.g., Sedan)"
              value={searchData.carType}
              onChange={handleChange}
            />
            <select
              name="carSize"
              value={searchData.carSize}
              onChange={handleChange}
            >
              <option value="" disabled>Car Size</option>
              <option value="Small">Small</option>
              <option value="Medium">Medium</option>
              <option value="Large">Large</option>
            </select>
            <button onClick={handleSearch}>Search</button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact-footer" className="search-parking-footer">
        <p>Contact Us:</p>
        <p>Email: support@spms.com</p>
        <p>Phone: +1-800-123-4567</p>
        <p>&copy; 2024 Smart Parking Management System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default SearchParking;
