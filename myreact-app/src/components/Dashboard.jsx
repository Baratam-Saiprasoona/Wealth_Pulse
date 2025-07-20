import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import Navbar from './Navbar';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { FaCalendarAlt } from 'react-icons/fa';
import axios from 'axios';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', '#d084d0', '#87d068', '#ffa726', '#ef5350', '#ab47bc'];

const Dashboard = () => {
  const [pieData, setPieData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');  
  const [totalAmount, setTotalAmount] = useState(0);
  const [pieDataFetched, setPieDataFetched] = useState(false);
  const [barDataFetched, setBarDataFetched] = useState(false);
  const [searchType, setSearchType] = useState('range'); // 'range' or 'single'

  // New state variables for budget alert
  const [monthlyBudget, setMonthlyBudget] = useState(null);
  const [monthlySpent, setMonthlySpent] = useState(null);

  const userIdentifier = localStorage.getItem('userIdentifier') || 'defaultUser';
  const API_BASE_URL = 'http://localhost:5000/api';

  // Set default dates but don't fetch data automatically
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
    setSelectedDate(now.toISOString().split('T')[0]);
  }, []);

  // Custom label function for pie chart to show percentages
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  // Fetch monthly budget and monthly spent for alert box
  useEffect(() => {
    const fetchBudgetAndSpent = async () => {
      try {
        // Fetch user budget info
        const budgetResponse = await axios.get(`${API_BASE_URL}/user/budget/${userIdentifier}`);
        const budgetData = budgetResponse.data;
        setMonthlyBudget(budgetData.defaultBudget || 0);

        // Fetch total spent in current month
        const spentResponse = await axios.get(`${API_BASE_URL}/expenses/month/${userIdentifier}`);
        const spentData = spentResponse.data;
        setMonthlySpent(spentData.totalSpent || 0);
      } catch (error) {
        console.error('Error fetching budget or spent data:', error);
      }
    };

    fetchBudgetAndSpent();
  }, [userIdentifier, API_BASE_URL]);

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`${data.name}`}</p>
          <p className="tooltip-value">{`Amount: ₹${data.value.toFixed(2)}`}</p>
          <p className="tooltip-percentage">{`Percentage: ${data.percentage.toFixed(1)}%`}</p>
        </div>
      );
    }
    return null;
  };

  const fetchPieChartData = async (dateType = 'range') => {
    setLoading(true);
    setError('');
    
    try {
      let response;
      
      if (dateType === 'single') {
        if (!selectedDate) {
          setError('Please select a date');
          setLoading(false);
          return;
        }
        
        response = await axios.get(`${API_BASE_URL}/expenses/dashboard/pie/${userIdentifier}`, {
          params: {
            startDate: selectedDate,
            endDate: selectedDate
          }
        });
      } else {
        if (!startDate || !endDate) {
          setError('Please select both start and end dates');
          setLoading(false);
          return;
        }

        if (new Date(startDate) > new Date(endDate)) {
          setError('Start date cannot be after end date');
          setLoading(false);
          return;
        }
        
        response = await axios.get(`${API_BASE_URL}/expenses/dashboard/pie/${userIdentifier}`, {
          params: {
            startDate: startDate,
            endDate: endDate
          }
        });
      }
      
      const data = response.data;
      
      if (data.length === 0) {
        setPieData([]);
        setTotalAmount(0);
      } else {
        // Calculate total amount
        const total = data.reduce((sum, item) => sum + item.value, 0);
        setTotalAmount(total);
        
        // Add colors and percentages to the data
        const coloredData = data.map((item, index) => ({
          ...item,
          color: COLORS[index % COLORS.length],
          percentage: (item.value / total) * 100
        }));
        
        setPieData(coloredData);
      }
      setPieDataFetched(true);
      setError('');
    } catch (error) {
      console.error('Error fetching pie chart data:', error);
      setError('Failed to fetch expense data');
      setPieData([]);
      setTotalAmount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchBarChartData = async () => {
    if (!selectedYear) {
      setError('Please enter a valid year');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/expenses/dashboard/monthly/${userIdentifier}`, {
        params: {
          year: selectedYear
        }
      });
      
      const data = response.data;
      
      if (data.length === 0) {
        setBarData([]);
      } else {
        setBarData(data);
      }
      setBarDataFetched(true);
      setError('');
    } catch (error) {
      console.error('Error fetching bar chart data:', error);
      setError('Failed to fetch monthly expense data');
      setBarData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSearch = () => {
    fetchPieChartData(searchType);
  };

  const handleYearSearch = () => {
    fetchBarChartData();
  };

  const handleSearchTypeChange = (type) => {
    setSearchType(type);
    setPieDataFetched(false);
    setPieData([]);
    setTotalAmount(0);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getPieChartTitle = () => {
    if (!pieDataFetched) {
      return 'Expenses by Category';
    }
    
    if (searchType === 'single') {
      return `Expenses by Category - ${formatDate(selectedDate)}`;
    } else {
      return `Expenses by Category - ${formatDate(startDate)} to ${formatDate(endDate)}`;
    }
  };

  const getPieChartNoDataMessage = () => {
    if (!pieDataFetched) {
      return 'Select date/range and click search to view expenses';
    }
    
    if (searchType === 'single') {
      return `No expenses found for ${formatDate(selectedDate)}`;
    } else {
      return `No expenses found between ${formatDate(startDate)} and ${formatDate(endDate)}`;
    }
  };
  
  
  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <div className="main-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {loading && (
            <div className="loading-message">
              Loading...
            </div>
          )}

          <div className="top-section">
            <div className="pie-section">
              <h3>{getPieChartTitle()}</h3>
              
              {/* Search Type Toggle */}
              <div className="search-type-toggle">
                <button 
                  className={`toggle-btn ${searchType === 'range' ? 'active' : ''}`}
                  onClick={() => handleSearchTypeChange('range')}
                >
                  Date Range
                </button>
                <button 
                  className={`toggle-btn ${searchType === 'single' ? 'active' : ''}`}
                  onClick={() => handleSearchTypeChange('single')}
                >
                  Single Date
                </button>
              </div>

              {/* Date Input Section */}
              <div className="date-range-input">
                {searchType === 'range' ? (
                  <>
                    <div className="date-input-group">
                      <FaCalendarAlt className="calendar-icon" />
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="date-input"
                      />
                    </div>
                    <div className="date-input-group">
                      <FaCalendarAlt className="calendar-icon" />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="date-input"
                      />
                    </div>
                  </>
                ) : (
                  <div className="date-input-group">
                    <FaCalendarAlt className="calendar-icon" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="date-input"
                    />
                  </div>
                )}
                <button onClick={handleDateSearch} className="search-btn">
                  Search
                </button>
              </div>

              <div className="pie-content">
                <div className="pie-chart">
                  {pieDataFetched && pieData.length > 0 ? (
                    <PieChart width={350} height={300}>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        labelLine={false}
                        label={renderCustomizedLabel}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  ) : (
                    <div className="no-data-message">
                      {getPieChartNoDataMessage()}
                    </div>
                  )}
                </div>

                {pieDataFetched && pieData.length > 0 && (
                  <div className="summary-section">
                    <h4>Category Summary</h4>
                    <div className="summary-list">
                      {pieData.map((item, index) => (
                        <div key={index} className="summary-item">
                          <div className="category-info">
                            <div 
                              className="color-indicator" 
                              style={{ backgroundColor: item.color }}
                            ></div>
                            <span className="category-name">{item.name}</span>
                          </div>
                          <div className="summary-amounts">
                            <span className="amount" style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>₹{item.value.toFixed(2)}</span>
                            <span className="percentage">({item.percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="total-summary">
                      <strong>Total: ₹{totalAmount.toFixed(2)} (100%)</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="alert-box">
              <h4>🔶 Budget Alert</h4>
              <p>Track your spending patterns and stay within budget!</p>
          {totalAmount > 0 && (
            <p><strong>Current Period Total: ₹{totalAmount.toFixed(2)}</strong></p>
          )}

          {/* New budget alert messages */}
          {monthlyBudget !== null && monthlySpent !== null && (
            <>
              {monthlySpent > 0.5 * monthlyBudget ? (
                <p style={{ color: 'red', fontWeight: 'bold' }}>
                  ⚠️ Alert: You have spent more than 50% of your monthly budget!
                </p>
              ) : (
                <p style={{ color: 'green', fontWeight: 'bold' }}>
                  👍 Good job! You have spent less than 50% of your monthly budget.
                </p>
              )}
              <p><strong>Monthly Budget: ₹{monthlyBudget.toFixed(2)}</strong></p>
              <p><strong>Spent This Month: ₹{monthlySpent.toFixed(2)}</strong></p>
            </>
          )}

        </div>
          </div>

          <div className="bar-chart-section">
            <h3>Monthly Expenses</h3>
            
            {/* Year Input */}
            <div className="year-input-section">
              <label htmlFor="year-input">Enter Year:</label>
              <input
                id="year-input"
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                min="2000"
                max="2030"
                className="year-input"
              />
              <button onClick={handleYearSearch} className="search-btn">
                Search
              </button>
            </div>

            {barDataFetched && barData.length > 0 ? (
              <BarChart width={800} height={300} data={barData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value.toFixed(2)}`, 'Amount']} />
                <Bar dataKey="amount" fill="#8884d8" />
              </BarChart>
            ) : (
              <div className="no-data-message">
                {barDataFetched ? 
                  `No expenses found for the year ${selectedYear}` : 
                  'Enter a year and click search to view monthly expenses'
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;