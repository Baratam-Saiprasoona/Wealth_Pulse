import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        // Try to parse as JSON first
        const userObj = JSON.parse(storedUser);
        setUser(userObj);
      } catch (error) {
        // If parsing fails, treat as string (username only)
        setUser({ username: storedUser });
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/category">Categories</Link>
        <Link to="/profile">Profile</Link>
      </div>
      <div className="nav-right">
        {user ? (
          <>
            <span className="welcome-msg">
              Welcome {user.username || user.fullName || 'User'}
            </span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </>
        ) : (
          <Link to="/login" className="login-btn">Log In</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;