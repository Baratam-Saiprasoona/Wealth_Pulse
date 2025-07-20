import React, { useEffect, useState } from 'react';
import './Home.css';
import Navbar from './Navbar';
import { Link } from 'react-router-dom';

import axios from 'axios';

const Home = () => {
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [monthlySpent, setMonthlySpent] = useState(0);
  const [alertVisible, setAlertVisible] = useState(false);
  const userIdentifier = localStorage.getItem('userIdentifier');

  useEffect(() => {
    const fetchMonthlyData = async () => {
      if (!userIdentifier) return;
      try {
        const budgetRes = await axios.get(`http://localhost:5000/api/user/budget/${userIdentifier}`);
        const { defaultBudget } = budgetRes.data;
        setMonthlyBudget(defaultBudget || 0);

        const expensesRes = await axios.get(`http://localhost:5000/api/expenses/month/${userIdentifier}`);
        const totalSpent = expensesRes.data.totalSpent || 0;
        setMonthlySpent(totalSpent);

        if (totalSpent > 0.5 * (defaultBudget || 0)) {
          setAlertVisible(true);
        } else {
          setAlertVisible(false);
        }
      } catch (error) {
        console.error('Failed to fetch monthly budget or expenses', error);
      }
    };

    fetchMonthlyData();

  }, [userIdentifier]);

  return (
    <>
      <Navbar />
      <div className="home-container">
        <div className="branding">
          {/*<div className="logo"></div>*/}
          <h1>WealthPulse</h1>
          <p className="tagline">Track. Budget. Grow.</p>
          {alertVisible && (
            <div className="budget-alert" style={{ backgroundColor: '#ffcccc', padding: '10px', borderRadius: '5px', marginTop: '10px', color: '#a94442' }}>
              <strong>Alert:</strong> You have spent more than 50% of your monthly budget. From now on, please spend optimally to stay within your budget.
            </div>
          )}
        </div>

        <div className="cards">
          <Link to="/category" className="card no-underline">
            <div className="icon">💰</div>
            <h3>Track Daily Expenses</h3>
            <p>Easily monitor and manage your daily spending.</p>
            <button>Learn more</button>
          </Link>

          <Link to="/dashboard" className="card no-underline">
            <div className="icon">📈</div>
            <h3>Visualize with Charts</h3>
            <p>Gain insights into your finances through charts</p>
            <button>Learn more</button>
          </Link>

          <div className="card" style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/alerts'}>
            <div className="icon">🔔</div>
            <h3>Get Budget Alerts</h3>
            <p>Stay informed when you exceed your budget</p>
            <button>Learn more</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;