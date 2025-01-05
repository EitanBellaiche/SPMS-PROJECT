import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import SearchParking from './SearchParking';
import Login from './Login';
import AdminPage from './AdminPage';

const App = () => {
  return (
    <Router basename="/spms">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/search-parking" element={<SearchParking />} />
        <Route path="/admin" element={<AdminPage />} /> {/* Add AdminPage route */}
      </Routes>
    </Router>
  );
};

export default App;
