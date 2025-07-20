import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import axios from 'axios';
import './Alerts.css'; // Use new alerts.css for styling
import { useNavigate } from 'react-router-dom';

const Alerts = () => {
  const [totalSpentToday, setTotalSpentToday] = useState(0);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlySpent, setMonthlySpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');  
  const navigate = useNavigate();

  // Get user identifier from localStorage (set during login)
  const userIdentifier = localStorage.getItem('userIdentifier');

  useEffect(() => {
    if (!userIdentifier) {
      setError('User not logged in');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch today's total expenses
        const expensesRes = await axios.get(`http://localhost:5000/api/expenses/today/${userIdentifier}`);
        const totalSpent = expensesRes.data.totalSpent || 0;
        setTotalSpentToday(totalSpent);

        // Fetch user budget info
        const budgetRes = await axios.get(`http://localhost:5000/api/user/budget/${userIdentifier}`);
        const { defaultBudget, monthlyIncome } = budgetRes.data;
        setMonthlyBudget(defaultBudget || 0);
        setMonthlyIncome(monthlyIncome || 0);

        // Fetch monthly total expenses
        const monthlyExpensesRes = await axios.get(`http://localhost:5000/api/expenses/month/${userIdentifier}`);
        const totalMonthlySpent = monthlyExpensesRes.data.totalSpent || 0;
        setMonthlySpent(totalMonthlySpent);

      } catch (err) {
        setError('Failed to fetch budget alerts data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userIdentifier]);

  // Calculate days in current month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const now = new Date();
  const daysInMonth = getDaysInMonth(now.getFullYear(), now.getMonth());

  const dailyBudget = monthlyBudget / daysInMonth;

  const getMessage = () => {
    if (totalSpentToday > dailyBudget) {
      return `You have spent more than your daily budget today. Try to spend optimally in the coming days to stay within your monthly budget of ₹${monthlyBudget}.`;
    } else if (totalSpentToday === dailyBudget) {
      return 'Good job! You have spent exactly your daily budget today.';
    } else if (totalSpentToday<dailyBudget) {
      return 'Great! You are doing a great job maintaining your budget. Keep it up!';
    }
  };

  const getMonthlyAlertMessage = () => {
    const remainingBudget = monthlyBudget - monthlySpent;
    if (monthlySpent > 0.5 * monthlyBudget) {
      return (
        <>
          <p className="alert-message" style={{ color: 'red', fontWeight: 'bold' }}>
            ⚠️⚠️ You have spent more than 50% of your monthly budget. From now on, please spend optimally to stay within your budget. ⚠️⚠️
          </p>
          <p style={{ fontWeight: 'bold' }}>
            You can spend ₹{remainingBudget.toFixed(2)} more this month to stay within your budget.
          </p>
        </>
      );
    } else {
      return (
        <p style={{ fontWeight: 'bold' }}>
          You can spend ₹{remainingBudget.toFixed(2)} more this month to stay within your budget.
        </p>
      );
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <>
      <Navbar />
      <div className="alerts-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="alert-box">
          <h3>Today's Spending Alert</h3>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : (
            <>
              <p className="amount">₹{totalSpentToday.toFixed(2)}</p>
              <p className="message">{getMessage()}</p>
            </>
          )}
        </div>
        <div className="alert-box">
          <h3>Budget Alert</h3>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : (
            getMonthlyAlertMessage()
          )}
        </div>
        <button className="back-button" onClick={handleBack} style={{ marginTop: '20px' }}>
          &larr; Back to Home
        </button>
      </div>
    </>
  );
};

export default Alerts;
