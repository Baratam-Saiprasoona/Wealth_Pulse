import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Default achievements structure
  const defaultAchievements = [
    {
      id: 1,
      title: "First Login",
      description: "Earned on your first day of login.",
      earned: false,
      icon: "🎉"
    },
    {
      id: 2,
      title: "Day 1 Completed",
      description: "Unlocked after completing your first day.",
      earned: false,
      icon: "✅"
    },
    {
      id: 3,
      title: "Expense Tracker Beginner",
      description: "Add your first expense to earn this badge.",
      earned: false,
      icon: "💰"
    },
    {
      id: 4,
      title: "Budget Master",
      description: "Set your first budget to unlock this badge.",
      earned: false,
      icon: "📊"
    },
    {
      id: 5,
      title: "Finance Streak",
      description: "Log in for 7 consecutive days.",
      earned: false,
      icon: "🔥"
    }
  ];

  // Unlock the First Login badge and save to localStorage
  const unlockFirstLoginBadge = () => {
    let savedAchievements = JSON.parse(localStorage.getItem('achievements')) || defaultAchievements;

    // Mark the First Login badge as earned
    savedAchievements = savedAchievements.map(badge =>
      badge.id === 1 ? { ...badge, earned: true } : badge
    );

    // Save back to localStorage
    localStorage.setItem('achievements', JSON.stringify(savedAchievements));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save user details in localStorage
        localStorage.setItem('userIdentifier', identifier);
        localStorage.setItem('username', data.username);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', identifier);
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('userName', data.fullName);
        localStorage.setItem('userPhone', data.phoneNumber);
        localStorage.setItem('userMonthlyIncome', data.monthlyIncome);

        // Unlock "First Login" badge
        unlockFirstLoginBadge();

        setMessage('✅ Login successful! Redirecting...');
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        setMessage('❌ Invalid username or password, try logging in again!');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('❌ Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo">🔷 WealthPulse</div>
        <h2>Log in to WealthPulse</h2>

        <form className="login-form" onSubmit={handleLogin}>
          <label>Email or Username</label>
          <input
            type="text"
            placeholder="Email or Username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            disabled={loading}
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        {message && (
          <p className={`login-message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </p>
        )}

        <p className="signup-text">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>

        <p className="signup-text">
          <Link to="/">← Back to Home Page</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
