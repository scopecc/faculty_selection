import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav style={styles.navbar}>
      <h2>Faculty Selection</h2>
      <div>
        <Link to="/" style={styles.link}>Home</Link>
        <Link to="/management" style={styles.link}>Management</Link>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#282c34',
    padding: '10px 20px',
    color: 'white'
  },
  link: {
    margin: '0 15px',
    textDecoration: 'none',
    color: 'white',
    fontSize: '16px'
  }
};

export default Navbar;