import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; 

const Navbar = () => {
  return (
    <nav className="navbar">
      <h2 className="navbar-title">Faculty Selection</h2>
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/management" className="nav-link">Management</Link>
      </div>
    </nav>
  );
};


export default Navbar;