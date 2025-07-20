import axios from 'axios';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Register.css';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '', 
    fullName: '',
    email: '',
    phoneNumber: '', 
    password: '',
    confirmPassword: '',
    monthlyIncome: '',
    savingsGoal: '',
    defaultBudget: '',
  });

  const [errors, setErrors] = useState({
    username: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    monthlyIncome: '',
    savingsGoal: '',
    defaultBudget: ''
  });

  const validateForm = () => {
    let newErrors = { ...errors };

    // Validate username
    if (formData.username.length < 6) {
      newErrors.username = "Username must be at least 6 characters.";
    } else {
      newErrors.username = '';
    }

    // Validate full name (letters only)
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(formData.fullName)) {
      newErrors.fullName = "Full Name should only contain letters.";
    } else {
      newErrors.fullName = '';
    }

    // Validate password
    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    } else {
      newErrors.password = '';
    }

    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords must match.";
    } else {
      newErrors.confirmPassword = '';
    }

    // Validate email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    } else {
      newErrors.email = '';
    }

    // Validate phone number (10 digits, starting with 6-9)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Phone number must be 10 digits, starting with 6-9.";
    } else {
      newErrors.phoneNumber = '';
    }

    // Validate monthly income, savingsGoal, and defaultBudget (numbers only)
    const numberRegex = /^\d+$/;
    if (!numberRegex.test(formData.monthlyIncome)) {
      newErrors.monthlyIncome = "Monthly Income must be a valid number.";
    } else {
      newErrors.monthlyIncome = '';
    }

    if (formData.savingsGoal && !numberRegex.test(formData.savingsGoal)) {
      newErrors.savingsGoal = "Savings Goal must be a valid number.";
    } else {
      newErrors.savingsGoal = '';
    }

    if (!numberRegex.test(formData.defaultBudget)) {
      newErrors.defaultBudget = "Default Budget must be a valid number.";
    } else {
      newErrors.defaultBudget = '';
    }

    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
  
    setFormData((prev) => ({ ...prev, [name]: value }));
  
    // Live validation for the current field
    let error = '';
    const nameRegex = /^[A-Za-z\s]+$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^[6-9]\d{9}$/;
    const numberRegex = /^\d+$/;
  
    switch (name) {
      case 'username':
        error = value.length < 6 ? "Username must be at least 6 characters." : '';
        break;
      case 'fullName':
        error = !nameRegex.test(value) ? "Full Name should only contain letters." : '';
        break;
      case 'email':
        error = !emailRegex.test(value) ? "Please enter a valid email address." : '';
        break;
      case 'phoneNumber':
        error = !phoneRegex.test(value) ? "Phone number must be 10 digits, starting with 6-9." : '';
        break;
      case 'password':
        error = value.length < 8 ? "Password must be at least 8 characters." : '';
        break;
      case 'confirmPassword':
        error = value !== formData.password ? "Passwords must match." : '';
        break;
      case 'monthlyIncome':
        error = !numberRegex.test(value) ? "Monthly Income must be a valid number." : '';
        break;
      case 'savingsGoal':
        error = value && !numberRegex.test(value) ? "Savings Goal must be a valid number." : '';
        break;
      case 'defaultBudget':
        error = !numberRegex.test(value) ? "Default Budget must be a valid number." : '';
        break;
      default:
        break;
    }
  
    setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!validateForm()) {
      alert("Please fix the errors before submitting.");
      return;
    }
  
    try {
      const response = await axios.post('http://127.0.0.1:5000/register', formData);
      alert(response.data.message);
      navigate('/login');
    } catch (error) {
      console.error("Error:", error);
      const errorMsg = error.response?.data?.error || error.message || "Unknown error occurred";
  
      if (errorMsg.includes("username")) {
        alert("Cannot register: Username already exists.");
      } else if (errorMsg.includes("email")) {
        alert("Cannot register: Email already exists.");
      } else {
        alert('Registration failed: ' + errorMsg);
      }
    }
  };
  

  return (
    <div className="register-container">
      <div className="register-box">
        <div className="logo">🔷 WealthPulse</div>
        <h2>Create your WealthPulse account</h2>
        <form className="register-form" onSubmit={handleSubmit}>
          <label>Username</label>
          <input 
            name="username" 
            type="text" 
            placeholder="Username" 
            required 
            onChange={handleChange} 
          />
          <span className="error">{errors.username}</span>

          <label>Full Name</label>
          <input 
            name="fullName" 
            type="text" 
            placeholder="Full Name" 
            required 
            onChange={handleChange} 
          />
          <span className="error">{errors.fullName}</span>

          <label>Email</label>
          <input 
            name="email" 
            type="email" 
            placeholder="Email" 
            required 
            onChange={handleChange} 
          />
          <span className="error">{errors.email}</span>

          <label>Phone Number</label>
          <input 
            name="phoneNumber" 
            type="text" 
            placeholder="Phone Number" 
            required 
            onChange={handleChange} 
          />
          <span className="error">{errors.phoneNumber}</span>

          <label>Password</label>
          <input 
            name="password" 
            type="password" 
            placeholder="Password" 
            required 
            onChange={handleChange} 
          />
          <span className="error">{errors.password}</span>

          <label>Confirm Password</label>
          <input 
            name="confirmPassword" 
            type="password" 
            placeholder="Confirm Password" 
            required 
            onChange={handleChange} 
          />
          <span className="error">{errors.confirmPassword}</span>

          <label>Monthly Income</label>
          <input 
            name="monthlyIncome" 
            type="number" 
            placeholder="Monthly Income" 
            required 
            onChange={handleChange} 
          />
          <span className="error">{errors.monthlyIncome}</span>

          <label>Savings Goal (Optional)</label>
          <input 
            name="savingsGoal" 
            type="number" 
            placeholder="Savings Goal" 
            onChange={handleChange} 
          />
          <span className="error">{errors.savingsGoal}</span>

          <label>Default Monthly Budget</label>
          <input 
            name="defaultBudget" 
            type="number" 
            placeholder="Default Monthly Budget" 
            required 
            onChange={handleChange} 
          />
          <span className="error">{errors.defaultBudget}</span>

          <button type="submit">Register</button>
        </form>

        <p className="login-text">
          Already have an account? <Link to="/Login">Log in</Link>
        </p>
        
        <p className="login-text">
          <Link to="/">← Back to Home Page</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;