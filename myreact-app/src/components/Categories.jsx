import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './Navbar';
import './Categories.css';
import { FaSearch, FaCalendarAlt } from 'react-icons/fa';
import axios from 'axios';

import {
  FaUtensils, FaBolt, FaPlane, FaShoppingCart, FaHeartbeat,
  FaCar, FaLaptop, FaMoneyBillWave, FaBook, FaGift,
  FaHome, FaGasPump, FaQuestion
} from 'react-icons/fa';

const categoryIcons = {
  Food: <FaUtensils />,
  Bills: <FaBolt />,
  Travel: <FaPlane />,  
  Shopping: <FaShoppingCart />,
  Health: <FaHeartbeat />,
  Transport: <FaCar />,
  Electronics: <FaLaptop />,
  Salary: <FaMoneyBillWave />,
  Education: <FaBook />,
  Gifts: <FaGift />,
  Rent: <FaHome />,
  Fuel: <FaGasPump />,
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState('');
  const [filter, setFilter] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [editedAmount, setEditedAmount] = useState('');
  const [editedDate, setEditedDate] = useState('');
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categoryExpenses, setCategoryExpenses] = useState({});
  const [loadingExpenses, setLoadingExpenses] = useState({});
  
  // Date range search states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateSearchActive, setDateSearchActive] = useState(false);
  const [dateSearchResults, setDateSearchResults] = useState([]);
  const [dateSearchLoading, setDateSearchLoading] = useState(false);

  // Get user identifier from localStorage (set during login)
  const userIdentifier = localStorage.getItem('userIdentifier') || 'defaultUser';

  const API_BASE_URL = 'http://localhost:5000/api';

  // Helper function to format date as dd/mm/yyyy
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper function to format date for input field (yyyy-mm-dd)
  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/expenses/categories/${userIdentifier}`);
      setCategories(response.data);
      setError('');
      
      // Fetch expenses for each category automatically
      for (const category of response.data) {
        await fetchCategoryExpenses(category.name);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to fetch categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [userIdentifier, API_BASE_URL]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const fetchCategoryExpenses = async (categoryName) => {
    setLoadingExpenses(prev => ({ ...prev, [categoryName]: true }));
    try {
      console.log(`Fetching expenses for category: ${categoryName}`);
      const response = await axios.get(`${API_BASE_URL}/expenses/category/${userIdentifier}/${encodeURIComponent(categoryName)}`);
      console.log(`Received ${response.data.length} expenses for category: ${categoryName}`, response.data);
      
      setCategoryExpenses(prev => ({
        ...prev,
        [categoryName]: response.data
      }));
      setError('');
    } catch (error) {
      console.error('Error fetching category expenses:', error);
      setError('Failed to fetch category expenses');
      setCategoryExpenses(prev => ({
        ...prev,
        [categoryName]: []
      }));
    } finally {
      setLoadingExpenses(prev => ({ ...prev, [categoryName]: false }));
    }
  };

  const handleDateRangeSearch = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date');
      return;
    }

    setDateSearchLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/expenses/date-range/${userIdentifier}`, {
        params: {
          startDate: startDate,
          endDate: endDate
        }
      });
      
      setDateSearchResults(response.data);
      setDateSearchActive(true);
      
      if (response.data.length === 0) {
        setError('No expenses found for the selected date range');
      }
    } catch (error) {
      console.error('Error fetching date range expenses:', error);
      setError('Failed to fetch expenses for the selected date range');
      setDateSearchResults([]);
    } finally {
      setDateSearchLoading(false);
    }
  };

  const handleClearDateSearch = () => {
    setDateSearchActive(false);
    setDateSearchResults([]);
    setStartDate('');
    setEndDate('');
    setError('');
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim() || !newAmount.trim() || !newDate.trim()) {
      setError('Please enter category name, amount, and date');
      return;
    }

    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount < 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/expenses`, {
        identifier: userIdentifier,
        category: newCategory,
        amount: amount,
        date: new Date(newDate)
      });

      setNewCategory('');
      setNewAmount('');
      setNewDate('');
      setError('');
      await fetchCategories(); // Refresh categories and expenses
    } catch (error) {
      console.error('Error adding category:', error);
      setError('Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryName) => {
    if (!window.confirm(`Are you sure you want to delete all expenses in category "${categoryName}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/expenses/category/${userIdentifier}/${encodeURIComponent(categoryName)}`);
      await fetchCategories(); // Refresh categories
      // Remove from expenses cache
      setCategoryExpenses(prev => {
        const updated = { ...prev };
        delete updated[categoryName];
        return updated;
      });
      setError('');
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (categoryName, amount, date, expenseId) => {
    setEditingCategory(categoryName);
    setEditedName(categoryName);
    setEditedAmount(amount.toString());
    setEditedDate(formatDateForInput(date));
    setEditingExpenseId(expenseId);
  };

  const handleSaveEdit = async () => {
    if (!editedName.trim() || !editedAmount.trim() || !editedDate.trim()) {
      setError('Please enter category name, amount, and date');
      return;
    }

    const amount = parseFloat(editedAmount);
    if (isNaN(amount) || amount < 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // Update the specific expense entry
      await axios.put(`${API_BASE_URL}/expenses/${editingExpenseId}`, {
        category: editedName,
        amount: amount,
        date: new Date(editedDate)
      });

      const oldCategoryName = editingCategory;
      setEditingCategory(null);
      setEditedName('');
      setEditedAmount('');
      setEditedDate('');
      setEditingExpenseId(null);
      setError('');
      await fetchCategories(); // Refresh categories and expenses
      
      // Clear the expenses cache for affected categories to force refresh
      setCategoryExpenses(prev => {
        const updated = { ...prev };
        delete updated[oldCategoryName];
        if (editedName !== oldCategoryName) {
          delete updated[editedName];
        }
        return updated;
      });
    } catch (error) {
      console.error('Error saving edit:', error);
      setError('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditedName('');
    setEditedAmount('');
    setEditedDate('');
    setEditingExpenseId(null);
    setError('');
  };

  const handleDeleteExpense = async (expenseId, categoryName) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/expenses/${expenseId}`);
      await fetchCategories(); // Refresh categories
      // Refresh the specific category expenses
      await fetchCategoryExpenses(categoryName);
      setError('');
    } catch (error) {
      console.error('Error deleting expense:', error);
      setError('Failed to delete expense');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(filter.toLowerCase())
  );

  // Group date search results by category
  const groupedDateResults = dateSearchResults.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = [];
    }
    acc[expense.category].push(expense);
    return acc;
  }, {});

  return (
    <>
      <Navbar />
      <div className="categories-container">
        <h2>Expense Categories</h2>
        
        {error && (
          <div className="error-message" style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#dc2626',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {loading && (
          <div className="loading-message" style={{
            background: 'rgba(99, 102, 241, 0.1)',
            color: '#6366f1',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            Loading...
          </div>
        )}

        <div className="filter-section">
          <input
            type="text"
            placeholder="Filter categories"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-input"
          />
          <FaSearch className="search-icon" />
        </div>

        {/* Date Range Search Section */}
        <div className="date-search-section">
          <div className="date-inputs">
            <div className="date-input-group">
              <FaCalendarAlt className="calendar-icon" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="date-input"
                placeholder="Start Date"
              />
            </div>
            <div className="date-input-group">
              <FaCalendarAlt className="calendar-icon" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="date-input"
                placeholder="End Date"
              />
            </div>
            <button 
              onClick={handleDateRangeSearch}
              disabled={dateSearchLoading}
              className="date-search-btn"
            >
              {dateSearchLoading ? 'Searching...' : 'Search'}
            </button>
            {dateSearchActive && (
              <button 
                onClick={handleClearDateSearch}
                className="clear-search-btn"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Date Search Results */}
        {dateSearchActive && (
          <div className="date-search-results">
            <h3>
              Expenses from {formatDate(startDate)} to {formatDate(endDate)}
            </h3>
            {dateSearchResults.length === 0 ? (
              <div className="no-results">
                There are no matched results for your search.
              </div>
            ) : (
              <div className="search-results-list">
                {Object.entries(groupedDateResults).map(([categoryName, expenses]) => (
                  <div key={categoryName} className="search-result-category">
                    <div className="search-category-header">
                      <span className="icon">{categoryIcons[categoryName] || <FaQuestion />}</span>
                      <span className="category-name">{categoryName}</span>
                      <span className="expense-count">({expenses.length} expenses)</span>
                    </div>
                    <div className="search-expenses-list">
                      {expenses.map((expense, index) => (
                        <div key={expense._id || index} className="search-expense-item">
                          <div className="expense-details">
                            <span className="expense-amount">₹{expense.amount.toFixed(2)}</span>
                            <span className="expense-date">{formatDate(expense.date)}</span>
                          </div>
                          <div className="expense-actions">
                            <button 
                              className="edit-btn"
                              onClick={() => handleEditCategory(expense.category, expense.amount, expense.date, expense._id)}
                              disabled={loading}
                            >
                              Edit
                            </button>
                            <button 
                              className="delete-btn"
                              onClick={() => handleDeleteExpense(expense._id, expense.category)}
                              disabled={loading}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Regular Categories List (only show when date search is not active) */}
        {!dateSearchActive && (
          <div className="category-list">
            {filteredCategories.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: 'white',
                fontSize: '1.2rem',
                padding: '2rem'
              }}>
                {loading ? 'Loading categories...' : 'No categories found. Add your first category below!'}
              </div>
            ) : (
              filteredCategories.map((cat, index) => (
                <div key={index} className="category-item">
                  <div className="category-header">
                    <span className="icon">{categoryIcons[cat.name] || <FaQuestion />}</span>
                    <div className="category-info">
                      <span className="category-name">{cat.name}</span>
                      <span className="category-date">
                        {formatDate(cat.latestDate)}
                      </span>
                    </div>
                    <div className="action-buttons">
                      <button 
                        className="edit-btn" 
                        onClick={() => handleEditCategory(cat.name, cat.latestAmount, cat.latestDate, cat.latestExpenseId)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-btn" 
                        onClick={() => handleDeleteCategory(cat.name)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Always visible expenses list */}
                  <div className="expenses-list">
                    {loadingExpenses[cat.name] ? (
                      <div className="loading-expenses">Loading expenses...</div>
                    ) : categoryExpenses[cat.name] && categoryExpenses[cat.name].length > 0 ? (
                      categoryExpenses[cat.name].map((expense, expenseIndex) => (
                        <div key={expense._id || expenseIndex} className="expense-item">
                          <div className="expense-details">
                            <span className="expense-amount">₹{expense.amount.toFixed(2)}</span>
                            <span className="expense-date">{formatDate(expense.date)}</span>
                          </div>
                          <div className="expense-actions">
                            <button 
                              className="edit-btn"
                              onClick={() => handleEditCategory(expense.category, expense.amount, expense.date, expense._id)}
                              disabled={loading}
                            >
                              Edit
                            </button>
                            <button 
                              className="delete-btn"
                              onClick={() => handleDeleteExpense(expense._id, cat.name)}
                              disabled={loading}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-expenses">
                        {categoryExpenses[cat.name] === undefined 
                          ? "Loading expenses..." 
                          : "No expenses found for this category."
                        }
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Editing Form */}
        {editingCategory && (
          <div className="edit-category-form">
            <h3>Edit Category</h3>
            <input
              type="text"
              placeholder="Category Name"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              disabled={loading}
            />
            <input
              type="number"
              placeholder="Amount"
              value={editedAmount}
              onChange={(e) => setEditedAmount(e.target.value)}
              min="0"
              step="0.01"
              disabled={loading}
            />
            <input
              type="date"
              value={editedDate}
              onChange={(e) => setEditedDate(e.target.value)}
              disabled={loading}
            />
            <button 
              onClick={handleSaveEdit}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button 
              onClick={handleCancelEdit}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        )}

        <div className="add-category">
          <input
            type="text"
            placeholder="Add new category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            disabled={loading}
          />
          <input
            type="number"
            placeholder="Amount"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            min="0"
            step="0.01"
            disabled={loading}
          />
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            disabled={loading}
          />
          <button 
            onClick={handleAddCategory}
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Category'}
          </button>
        </div>
      </div>
    </>
  );
};

export default Categories;