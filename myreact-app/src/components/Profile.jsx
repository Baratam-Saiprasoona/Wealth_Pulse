import { Award, Bell, Briefcase, Calendar, Camera, DollarSign, Edit3, Mail, MapPin, Phone, Save, Star, Target, User, Smartphone, Download, CheckCircle, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import './Profile.css';
import axios from 'axios'; // <-- Add this import

const Profile = () => {
  // Initialize user data from localStorage or defaults
  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    address: '', 
    annualSavingsAmount: 0,
    occupation: '',
    profileImage: '',
    dateOfBirth: '',
    monthlyIncome: 0,
    preferredCurrency: 'INR', // Match your backend default
    financialGoal: '',
    joinDate: '',
    membershipLevel: 'Basic',
    bio: '',
  });

  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('financial');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Settings state - Default to enabled for new users
  const [settings, setSettings] = useState({
    emailNotifications: true,
    mobileNotifications: true,
  });

  // Financial summary data from localStorage
  const [financialData, setFinancialData] = useState({
    totalSaved: 0,
    savingsGoal: 0,
    monthlySpent: 0,
    savingsRate: 0,
  });

  // Only these four badges, all start as not earned
  const [achievements, setAchievements] = useState([
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
]);
const earnedBadges = achievements.filter(a => a.earned);
const lockedBadges = achievements.filter(a => !a.earned);


  const [budgetProgress, setBudgetProgress] = useState(0);
  const [budgetMonths, setBudgetMonths] = useState(0);

  // Load data from backend and localStorage on component mount
  useEffect(() => {
    loadUserData();
    loadFinancialData();
    loadAchievements();
    loadSettings();
    checkLoginStatus();
    setDataLoaded(true);
    // eslint-disable-next-line
  }, []);

  // Save user data to backend and localStorage whenever user state changes
  useEffect(() => {
    if (dataLoaded) saveUserData();
    // eslint-disable-next-line
  }, [user, dataLoaded]);

  // Save financial data to localStorage whenever it changes
  useEffect(() => {
    if (dataLoaded) saveFinancialData();
    // eslint-disable-next-line
  }, [financialData, dataLoaded]);

  // Save achievements to localStorage whenever they change
  useEffect(() => {
    if (dataLoaded) saveAchievements();
    // eslint-disable-next-line
  }, [achievements, dataLoaded]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (dataLoaded) saveSettings();
    // eslint-disable-next-line
  }, [settings, dataLoaded]);

  // Check and update achievements based on user data
  useEffect(() => {
    if (dataLoaded) {
      calculateBudgetProgress();
      checkAndUpdateAchievements();
    }
    // eslint-disable-next-line
  }, [user, financialData, dataLoaded]);

  useEffect(() => {
    const fetchTotalCategoryExpenses = async () => {
      const username = localStorage.getItem('username');
      if (!username) return;
      try {
        const res = await axios.get(`http://localhost:5000/api/expenses/user/${encodeURIComponent(username)}`);
        // Group expenses by month for the current year
        const currentYear = new Date().getFullYear();
        const monthlyTotals = {};
        res.data
          .filter(exp => new Date(exp.date).getFullYear() === currentYear)
          .forEach(exp => {
            const date = new Date(exp.date);
            const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
            monthlyTotals[key] = (monthlyTotals[key] || 0) + Number(exp.amount);
          });
        // Calculate total savings as sum of (monthlyIncome - monthlyExpenses) for each month
        const monthlyIncome = user.monthlyIncome || 0;
        let totalSavings = 0;
        let totalExpensesAllMonths = 0;
        Object.values(monthlyTotals).forEach(monthlyExpense => {
          totalSavings += (monthlyIncome - monthlyExpense);
          totalExpensesAllMonths += monthlyExpense;
        });
        setFinancialData(prev => ({
          ...prev,
          totalCategoryExpenses: totalExpensesAllMonths,
          totalSavings: totalSavings
        }));
      } catch (err) {
        setFinancialData(prev => ({ ...prev, totalCategoryExpenses: 0, totalSavings: 0 }));
      }
    };
    fetchTotalCategoryExpenses();
  }, [user]);

  const checkLoginStatus = () => {
    const hasBasicInfo = localStorage.getItem('userName') || localStorage.getItem('userEmail');
    setIsLoggedIn(!!hasBasicInfo);
  };

  // Function to check and update achievements based on user data
  const checkAndUpdateAchievements = async () => {
    const updatedAchievements = [...achievements];
    let hasUpdates = false;

    // Get user expenses for achievement calculations
    const username = localStorage.getItem('username');
    let userExpenses = [];
    try {
      if (username) {
        const res = await axios.get(`http://localhost:5000/api/expenses/user/${encodeURIComponent(username)}`);
        userExpenses = res.data || [];
      }
    } catch (err) {
      console.log('Could not fetch expenses for achievement calculation');
    }

    // Check Expense Tracker Beginner badge (id 3, index 2)
    const expenseTrackerBadgeIndex = achievements.findIndex(a => a.title === "Expense Tracker Beginner");
    if (expenseTrackerBadgeIndex !== -1) {
      if (userExpenses.length > 0 && !updatedAchievements[expenseTrackerBadgeIndex].earned) {
        updatedAchievements[expenseTrackerBadgeIndex].earned = true;
        hasUpdates = true;
      } else if (userExpenses.length === 0 && updatedAchievements[expenseTrackerBadgeIndex].earned) {
        updatedAchievements[expenseTrackerBadgeIndex].earned = false;
        hasUpdates = true;
      }
    }

    // Unlock Day 1 Completed badge if one day has passed since joinDate
    const day1BadgeIndex = achievements.findIndex(a => a.title === "Day 1 Completed");
    if (day1BadgeIndex !== -1 && user.joinDate) {
      const joinDate = new Date(user.joinDate);
      const now = new Date();
      const diffTime = now - joinDate;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      if (diffDays >= 1 && !updatedAchievements[day1BadgeIndex].earned) {
        updatedAchievements[day1BadgeIndex].earned = true;
        hasUpdates = true;
      }
    }

    // Group expenses by month
    const monthlyTotals = {};
    userExpenses.forEach((exp) => {
      const date = new Date(exp.date);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthlyTotals[key] = (monthlyTotals[key] || 0) + Number(exp.amount);
    });

    // Assume monthlyBudget is 80% of monthlyIncome if not set
    const monthlyBudget = user.monthlyBudget || user.monthlyIncome * 0.8;
    let monthsWithinBudget = 0;
    Object.values(monthlyTotals).forEach(total => {
      if (total <= monthlyBudget) monthsWithinBudget++;
    });

    // Budget Master badge (id 4, index 3): Stayed within budget for 12 months
    const budgetMasterBadgeIndex = achievements.findIndex(a => a.title === "Budget Master");
    if (budgetMasterBadgeIndex !== -1) {
      if (monthsWithinBudget >= 12 && !updatedAchievements[budgetMasterBadgeIndex].earned) {
        updatedAchievements[budgetMasterBadgeIndex].earned = true;
        hasUpdates = true;
      } else if (monthsWithinBudget < 12 && updatedAchievements[budgetMasterBadgeIndex].earned) {
        updatedAchievements[budgetMasterBadgeIndex].earned = false;
        hasUpdates = true;
      }
    }

    // ...other achievement checks (Savings Champion, Goal Achiever, First Month)...

    if (hasUpdates) {
      setAchievements(updatedAchievements);
    }
  };

  // Helper to calculate savings rate for each of the last 6 months
const calculateSavingsChampion = (expenses, monthlyIncome) => {
  if (!monthlyIncome || expenses.length < 6) return false;
  // Group expenses by month
  const monthlyTotals = {};
  expenses.forEach((exp) => {
    const date = new Date(exp.date);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    monthlyTotals[key] = (monthlyTotals[key] || 0) + Number(exp.amount);
  });
  // Get last 6 months keys
  const sortedMonths = Object.keys(monthlyTotals).sort((a, b) => new Date(a) - new Date(b));
  const last6 = sortedMonths.slice(-6);
  // Calculate savings rate for each month
  let allAbove60 = true;
  last6.forEach(monthKey => {
    const spent = monthlyTotals[monthKey];
    const saved = monthlyIncome - spent;
    const rate = (saved / monthlyIncome) * 100;
    if (rate < 60) allAbove60 = false;
  });
  return last6.length === 6 && allAbove60;
};

  const calculateBudgetProgress = async () => {
    const username = localStorage.getItem('username');
    let userExpenses = [];
    try {
      if (username) {
        const res = await axios.get(`http://localhost:5000/api/expenses/user/${encodeURIComponent(username)}`);
        userExpenses = res.data || [];
      }
    } catch (err) {
      // handle error
    }

    // Group expenses by month
    const monthlyTotals = {};
    userExpenses.forEach((exp) => {
      const date = new Date(exp.date);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthlyTotals[key] = (monthlyTotals[key] || 0) + Number(exp.amount);
    });

    // Assume monthlyBudget is 80% of monthlyIncome if not set
    const monthlyBudget = user.monthlyBudget || user.monthlyIncome * 0.8;
    let monthsWithinBudget = 0;
    Object.values(monthlyTotals).forEach(total => {
      if (total <= monthlyBudget) monthsWithinBudget++;
    });

    setBudgetMonths(monthsWithinBudget);

    // Progress: % of months within budget (out of 12)
    const progress = Math.min((monthsWithinBudget / 12) * 100, 100);
    setBudgetProgress(progress);
  };

  // Fetch user profile from backend, fallback to localStorage if not found
  const loadUserData = async () => {
    const email = localStorage.getItem('userEmail');
    if (email) {
      try {
        const res = await axios.get(`http://localhost:5000/api/profile/${email}`);
        if (res.data) {
          setUser(prev => ({
          ...prev,
          ...res.data,
          email // <-- Always set email from localStorage
        }));
        return;
        }
      } catch (err) {
        // fallback to localStorage if backend fails
      }
    }
    // fallback to localStorage
    const savedUser = {
      name: localStorage.getItem('userName') || '',
      email: localStorage.getItem('userEmail') || '',
      phone: localStorage.getItem('userPhone') || '',
      address: localStorage.getItem('userAddress') || '',
      annualSavingsAmount: parseInt(localStorage.getItem('userAnnualSavingsAmount')) || 0,
      occupation: localStorage.getItem('userOccupation') || '',
      profileImage: localStorage.getItem('profileImage') || '',
      dateOfBirth: localStorage.getItem('userDateOfBirth') || '',
      monthlyIncome: parseInt(localStorage.getItem('userMonthlyIncome')) || 0,
      preferredCurrency: localStorage.getItem('userCurrency') || 'INR',
      financialGoal: localStorage.getItem('userFinancialGoal') || '',
      joinDate: localStorage.getItem('userJoinDate') || new Date().toISOString().split('T')[0],
      membershipLevel: localStorage.getItem('userMembershipLevel') || 'Basic',
      bio: localStorage.getItem('userBio') || '',
    };
    setUser(prev => ({
    ...prev,
    ...savedUser,
    email // <-- Always set email from localStorage
  }));
  };

  const loadFinancialData = () => {
    const savedFinancialData = {
      totalSaved: parseInt(localStorage.getItem('totalSaved')) || 0,
      savingsGoal: parseInt(localStorage.getItem('savingsGoal')) || 0,
      monthlySpent: parseInt(localStorage.getItem('monthlySpent')) || 0,
      savingsRate: parseFloat(localStorage.getItem('savingsRate')) || 0,
    };
    setFinancialData(savedFinancialData);
  };

  const loadAchievements = () => {
  const savedAchievements = localStorage.getItem('achievements');
  if (savedAchievements) {
    setAchievements(JSON.parse(savedAchievements));
  }
};




  const loadSettings = () => {
    // Check if settings exist in localStorage, if not, use defaults (enabled)
    const emailNotifications = localStorage.getItem('emailNotifications');
    const mobileNotifications = localStorage.getItem('mobileNotifications');
    
    const savedSettings = {
      emailNotifications: emailNotifications !== null ? emailNotifications === 'true' : true,
      mobileNotifications: mobileNotifications !== null ? mobileNotifications === 'true' : true,
    };
    setSettings(savedSettings);
  };

  // Save user profile to backend and localStorage
  const saveUserData = async () => {
    // Save to backend
    try {
      await axios.post('http://localhost:5000/api/profile', user);
    } catch (err) {
      // handle error if needed
    }
    // Save to localStorage (for offline/caching)
    Object.keys(user).forEach(key => {
      if (key === 'monthlyIncome' || key === 'annualSavingsAmount') {
        localStorage.setItem(`user${key.charAt(0).toUpperCase() + key.slice(1)}`, user[key].toString());
      } else {
        localStorage.setItem(`user${key.charAt(0).toUpperCase() + key.slice(1)}`, user[key]);
      }
    });
  };

  const saveFinancialData = () => {
    Object.keys(financialData).forEach(key => {
      localStorage.setItem(key, financialData[key].toString());
    });
  };

  const saveAchievements = () => {
    localStorage.setItem('achievements', JSON.stringify(achievements));
  };

  const saveSettings = () => {
    localStorage.setItem('emailNotifications', settings.emailNotifications.toString());
    localStorage.setItem('mobileNotifications', settings.mobileNotifications.toString());
  };

  const toggleEdit = () => setEditing(!editing);

  const handleInputChange = (e) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value;
    setUser({ ...user, [e.target.name]: value });
  };

  const handleSettingToggle = (setting) => {
    setSettings({ ...settings, [setting]: !settings[setting] });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser({ ...user, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfileImage = () => {
    setUser({ ...user, profileImage: '' });
  };

  const exportData = async (format) => {
  // Get the logged-in user's username (or identifier)
  const username = localStorage.getItem('username');

  // Fetch expenses for this user from backend
  let expenses = [];
  try {
    const res = await axios.get(`http://localhost:5000/api/expenses/user/${encodeURIComponent(username)}`);
    expenses = res.data; // Should be an array of {category, amount, date}
  } catch (err) {
    alert('Failed to fetch expenses for export.');
    return;
  }

  // Prepare rows: Category, Amount, Date
  const csvData = [
    ['Category', 'Amount', 'Date']
  ];
  let overallTotal = 0;

  expenses.forEach(exp => {
    csvData.push([
      exp.category,
      `₹${Number(exp.amount).toFixed(2)}`,
      exp.date ? new Date(exp.date).toLocaleDateString() : ''
    ]);
    overallTotal += Number(exp.amount);
  });

  // Add overall total row
  csvData.push(['Overall Total', `₹${overallTotal.toFixed(2)}`, '']);

  const csvContent = csvData.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = format === 'csv' ? 'categories_data.csv' : 'categories_data.xlsx';
  a.click();
  URL.revokeObjectURL(url);
  return;
};

  const getMembershipBadge = () => {
    switch(user.membershipLevel) {
      case 'Premium': return { color: 'bg-gradient-to-r from-yellow-400 to-orange-500', text: 'Premium' };
      case 'Gold': return { color: 'bg-gradient-to-r from-yellow-500 to-yellow-600', text: 'Gold' };
      default: return { color: 'bg-gradient-to-r from-gray-400 to-gray-500', text: 'Basic' };
    }
  };

  const TabButton = ({ id, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
        isActive 
          ? 'bg-indigo-600 text-white shadow-lg' 
          : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
      }`}
    >
      {label}
    </button>
  );

  const isProfileIncomplete = () => {
    return !user.name || !user.email || !user.phone || user.monthlyIncome === 0;
  };

  return (
    <>
      <Navbar />
      <div className="profile-container">
        {/* Animated Background Elements */}
        <div className="background-animation">
          <div className="floating-orb floating-orb-1"></div>
          <div className="floating-orb floating-orb-2"></div>
        </div>

        {/* Header */}
        <div className="profile-header">
          <div className="header-content">
            <div className="header-text">
              <h1 className="main-title">
                Profile Dashboard
              </h1>
              <p className="subtitle">Manage your personal information and track your financial journey</p>
              {isProfileIncomplete() && (
                <div className="incomplete-notice">
                  <Bell size={16} />
                  <span>Complete your profile to unlock all features</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="main-content">
          <div className="content-grid">
            {/* Profile Card */}
            <div className="profile-card-container">
              <div className="profile-card">
                {/* Profile Header with Dynamic Gradient */}
                <div className="profile-card-header">
                  <div className="profile-header-overlay"></div>
                  <div className="profile-header-content">
                    <div className="profile-image-container">
                      <div className="profile-image">
                        {user.profileImage ? (
                          <img 
                            src={user.profileImage} 
                            alt="Profile" 
                            className="profile-img"
                          />
                        ) : (
                          <div className="profile-placeholder">
                            {user.name ? user.name.charAt(0).toUpperCase() : <User size={48} />}
                          </div>
                        )}
                      </div>
                      {editing && (
                        <label className="image-upload-btn">
                          <Camera size={16} />
                          <input
                            type="file"
                            className="hidden-input"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                      )}
                    </div>
                    <h2 className="profile-name">
                      {user.name || 'Set Your Name'}
                    </h2>
                    <p className="profile-occupation">{user.occupation || 'Add your occupation'}</p>
                    <div className={`membership-badge ${getMembershipBadge().color}`}>
                      <Star size={14} />
                      {getMembershipBadge().text} Member
                    </div>
                    {user.profileImage && editing && (
                      <button 
                        onClick={removeProfileImage} 
                        className="remove-photo-btn"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>
                <div className="profile-card-body">
                  {user.bio && !editing && (
                    <div className="bio-section">
                      <p className="bio-text">{user.bio}</p>
                    </div>
                  )}
                  {editing ? (
                    <div className="edit-form">
                      <div className="form-group">
                        <label className="form-label">Name<span style={{color: 'red'}}>*</span></label>
                        <div className="input-container">
                          <User className="input-icon" />
                          <input
                            name="name"
                            value={user.name}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Enter your name"
                            required
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email<span style={{color: 'red'}}>*</span></label>
                        <div className="input-container">
                          <Mail className="input-icon" />
                          <input
                            name="email"
                            type="email"
                            value={user.email}
                            className="form-input"
                            readOnly
                            required
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone<span style={{color: 'red'}}>*</span></label>
                        <div className="input-container">
                          <Phone className="input-icon" />
                          <input
                            name="phone"
                            value={user.phone}
                            onChange={handleInputChange}
                            className="form-input"
                            readOnly
                            required
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Address<span style={{color: 'red'}}>*</span></label>
                        <div className="input-container">
                          <MapPin className="input-icon" />
                          <textarea
                            name="address"
                            value={user.address}
                            onChange={handleInputChange}
                            className="form-textarea"
                            placeholder="Enter your address"
                            rows="2"
                            required
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Annual Savings Amount (₹)<span style={{color: 'red'}}>*</span></label>
                        <div className="input-container">
                          <input
                            name="annualSavingsAmount"
                            type="number"
                            value={user.annualSavingsAmount}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Enter annual savings amount"
                            required
                            min={1}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Occupation</label>
                        <div className="input-container">
                          <Briefcase className="input-icon" />
                          <input
                            name="occupation"
                            value={user.occupation}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Enter your occupation"
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Bio</label>
                        <textarea
                          name="bio"
                          value={user.bio}
                          onChange={handleInputChange}
                          className="form-textarea"
                          placeholder="Tell us about yourself..."
                          rows="3"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Date of Birth<span style={{color: 'red'}}>*</span></label>
                        <div className="input-container">
                          <Calendar className="input-icon" />
                          <input
                            name="dateOfBirth"
                            type="date"
                            value={user.dateOfBirth}
                            onChange={handleInputChange}
                            className="form-input"
                            required
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Monthly Income (₹)<span style={{color: 'red'}}>*</span></label>
                        <div className="input-container">
                          <input
                            name="monthlyIncome"
                            type="number"
                            value={user.monthlyIncome}
                            onChange={handleInputChange}
                            className="form-input"
                            readOnly
                            required
                            min={1}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Date of Joining<span style={{color: 'red'}}>*</span></label>
                        <div className="input-container">
                          <Calendar className="input-icon" />
                          <input
                            name="joinDate"
                            type="date"
                            value={user.joinDate}
                            onChange={handleInputChange}
                            className="form-input"
                            required
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Financial Goal</label>
                        <textarea
                          name="financialGoal"
                          value={user.financialGoal}
                          onChange={handleInputChange}
                          className="form-textarea"
                          placeholder="Describe your financial goals..."
                          rows="2"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Membership Level<span style={{color: 'red'}}>*</span></label>
                        <select
                          name="membershipLevel"
                          value={user.membershipLevel}
                          onChange={handleInputChange}
                          className="form-select"
                          required
                        >
                          <option value="Basic">Basic</option>
                          <option value="Premium">Premium</option>
                          <option value="Gold">Gold</option>
                        </select>
                      </div>
                      <button 
                        onClick={async () => {
                        await saveUserData();
                        toggleEdit();
                  }} 
                      className="save-btn"
                 >
                      <Save size={16} /> Save Changes
                      </button>
                    </div>
                  ) : (
                    <div className="profile-info">
                      {[
                        { icon: Mail, label: 'Email', value: user.email },
                        { icon: Phone, label: 'Phone', value: user.phone },
                        { icon: MapPin, label: 'Address', value: user.address },
                        { icon: DollarSign, label: 'Annual Savings Amount', value: user.annualSavingsAmount ? `₹${user.annualSavingsAmount.toLocaleString()}` : '' },
                        { icon: Briefcase, label: 'Occupation', value: user.occupation },
                        { icon: Calendar, label: 'Date of Birth', value: user.dateOfBirth },
                        { icon: Calendar, label: 'Date of Joining', value: user.joinDate },
                        { icon: DollarSign, label: 'Monthly Income', value: user.monthlyIncome ? `₹${user.monthlyIncome.toLocaleString()}` : '' },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="info-item">
                          <div className="info-icon">
                            <Icon size={16} />
                          </div>
                          <div className="info-content">
                            <p className="info-label">{label}</p>
                            <p className="info-value">{value || 'Not set'}</p>
                          </div>
                        </div>
                      ))}
                      {user.financialGoal && (
                        <div className="goal-section">
                          <p className="goal-label">Financial Goal</p>
                          <p className="goal-text">{user.financialGoal}</p>
                        </div>
                      )}
                      <button 
                        onClick={toggleEdit} 
                        className="edit-btn"
                      >
                        <Edit3 size={16} /> Edit Profile
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Main Content */}
            <div className="dashboard-content">
              {/* Navigation Tabs */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #e5e5e5' }}>
  {['financial', 'achievements', 'settings'].map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      style={{
        padding: '12px 24px',
        border: 'none',
        background: activeTab === tab ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
        color: activeTab === tab ? 'white' : '#666',
        borderRadius: '10px 10px 0 0',
        fontWeight: activeTab === tab ? 'bold' : 'normal',
        cursor: 'pointer',
        textTransform: 'capitalize',
        transition: 'all 0.3s ease'
      }}
    >
      {tab}
    </button>
  ))}
</div>

              {/* Tab Content */}

              {activeTab === 'financial' && (
                <div className="tab-content" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                  <>
                    {/* Annual Savings Progress (based on categories) */}
                    <div style={{
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      borderRadius: '15px',
                      padding: '25px',
                      color: 'white',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                        <Target size={28} />
                        <h3 style={{ margin: 0, fontSize: '24px' }}>Annual Savings Progress</h3>
                      </div>
                      <div style={{ fontSize: '18px', opacity: 0.9, marginBottom: 8 }}>Progress</div>
                      <div style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: 8 }}>
                        ₹{financialData.totalSavings?.toLocaleString() || 0} / ₹{user.annualSavingsAmount ? user.annualSavingsAmount.toLocaleString() : '0'}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: 15, opacity: 0.8 }}>Annual Income</div>
                        <div style={{ fontWeight: 600, fontSize: 18 }}>
                          ₹{user.monthlyIncome ? (user.monthlyIncome * 12).toLocaleString() : 0}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 15, opacity: 0.8 }}>Total Expenses (All Categories)</div>
                        <div style={{ fontWeight: 600, fontSize: 18, color: '#ef4444' }}>
                          ₹{financialData.totalCategoryExpenses?.toLocaleString() || 0}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 15, opacity: 0.8 }}>Savings</div>
                        <div style={{ fontWeight: 600, fontSize: 18, color: '#10b981' }}>
                          ₹{financialData.totalSavings?.toLocaleString() || 0}
                        </div>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div style={{
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: '10px',
                      height: '18px',
                      overflow: 'hidden',
                      marginBottom: '10px',
                      position: 'relative'
                    }}>
                      <div style={{
                        background: (user.annualSavingsAmount > 0 &&
                          financialData.totalSavings >= 0)
                          ? '#10b981'
                          : 'linear-gradient(90deg, #10b981, #34d399)',
                        height: '100%',
                        width: `${
                          user.annualSavingsAmount > 0
                            ? Math.min(
                                100,
                                (financialData.totalSavings / user.annualSavingsAmount) * 100
                              )
                            : 0
                        }%`,
                        transition: 'width 0.5s ease'
                      }} />
                      <span style={{
                        position: 'absolute',
                        right: 12,
                        top: 0,
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 14
                      }}>
                        {user.annualSavingsAmount > 0
                          ? `${Math.min(
                              100,
                              (financialData.totalSavings / user.annualSavingsAmount) * 100
                            ).toFixed(1)}%`
                          : '0.0%'}
                      </span>
                    </div>
                    <div style={{ fontSize: '15px', marginBottom: 4 }}>
                      {(user.monthlyIncome > 0) && (
                        <>
                          {financialData.totalSavings < 0
                            ? <>You have overspent by <b>₹{Math.abs(financialData.totalSavings).toLocaleString()}</b>.</>
                            : <span style={{ color: '#22c55e', fontWeight: 600 }}>🎉 Good job! You are saving money.</span>
                          }
                        </>
                      )}
                    </div>
                      {user.financialGoal && (
                        <p style={{ margin: '15px 0 0 0', opacity: 0.9, fontStyle: 'italic' }}>"{user.financialGoal}"</p>
                      )}
                    </div>
                    {/* Budget Adherence (Last 12 Months) - Styled like Annual Savings Goal */}
                    <div style={{
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      borderRadius: '15px',
                      padding: '25px',
                      color: 'white',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                        <DollarSign size={24} color="#fff" />
                        <h3 style={{ margin: 0, fontSize: '24px' }}>Budget Adherence (Last 12 Months)</h3>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <span style={{ fontSize: '18px', opacity: 0.9 }}>Months Within Budget</span>
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
                          {budgetMonths} / 12
                        </span>
                      </div>
                      <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '10px',
                        height: '12px',
                        overflow: 'hidden',
                        marginBottom: '10px'
                      }}>
                        <div style={{
                          background: 'linear-gradient(90deg, #10b981, #34d399)',
                          height: '100%',
                          width: `${budgetProgress}%`,
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', opacity: 0.9 }}>
                        <span>{budgetProgress.toFixed(1)}% Adherence</span>
                        <span>Earn the <b>Budget Master</b> badge at 12/12!</span>
                      </div>
                      <p style={{ margin: '15px 0 0 0', color: '#e0e7ff', fontSize: '14px' }}>
                        Stay within your monthly budget for 12 months to earn the <b>Budget Master</b> badge!
                      </p>
                    </div>
                    {/* Data Export */}
                    <div className="setting-item">
                      <div className="setting-info">
                        <div className="setting-icon">
                          <Download size={20} />
                        </div>
                        <div className="setting-content">
                          <div className="setting-text">
                            <h4 className="setting-name">Data Export</h4>
                            <p className="setting-desc">Download your profile and financial data</p>
                          </div>
                          <div className="export-buttons">
                            <button 
                              onClick={() => exportData('csv')}
                              className={`toggle-btn toggle-active`}
                              style={{minWidth: 120}}
                            >
                              Export as CSV
                            </button>
                            <button 
                              onClick={() => exportData('excel')}
                              className={`toggle-btn toggle-active`}
                              style={{minWidth: 120}}
                            >
                              Export as Excel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
            
                  </>
                </div>
              )}
              
             {activeTab === 'achievements' && (() => {
  // Default achievements with "First Login" earned initially


  return (
    <div className="achievements-card" style={{
      background: 'white',
      borderRadius: '15px',
      padding: '25px',
      boxShadow: '0 5px 20px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
        <Award size={28} color="#667eea" />
        <h3 style={{ margin: 0, color: '#333', fontSize: '24px' }}>Your Achievements</h3>
      </div>

      {/* Earned and Locked Badges */}
      {earnedBadges.length === 0 && lockedBadges.length === 0 ? (
        <div style={{
          color: '#888',
          fontStyle: 'italic',
          padding: '2rem',
          textAlign: 'center'
        }}>
          No badges earned yet.
        </div>
      ) : (
        <>
          {/* Earned Badges */}
          {earnedBadges.length > 0 && (
            <>
              <h4 style={{ margin: '20px 0 10px', color: '#333' }}>Unlocked Badges</h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px'
              }}>
                {earnedBadges.map((achievement) => (
                  <div key={achievement.id} style={{
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    borderRadius: '15px',
                    padding: '20px',
                    color: 'white',
                    transform: 'scale(1.02)',
                    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                      <div style={{ fontSize: '32px', flexShrink: 0 }}>{achievement.icon}</div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold' }}>
                          {achievement.title}
                        </h4>
                        <p style={{ margin: '0 0 12px 0', fontSize: '14px', opacity: 0.9, lineHeight: '1.4' }}>
                          {achievement.description}
                        </p>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          <CheckCircle size={16} />
                          <span>Earned</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Locked Badges */}
          {lockedBadges.length > 0 && (
            <>
              <h4 style={{ margin: '30px 0 10px', color: '#666' }}>Locked Badges</h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px'
              }}>
                {lockedBadges.map((achievement) => (
                  <div key={achievement.id} style={{
                    background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
                    borderRadius: '15px',
                    padding: '20px',
                    color: '#666',
                    transform: 'scale(1)',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    opacity: 0.7
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                      <div style={{ fontSize: '32px', flexShrink: 0 }}>{achievement.icon}</div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold' }}>
                          {achievement.title}
                        </h4>
                        <p style={{ margin: '0 0 12px 0', fontSize: '14px', opacity: 0.9, lineHeight: '1.4' }}>
                          {achievement.description}
                        </p>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          <Trophy size={16} />
                          <span>Not earned yet</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Achievement Stats */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
        borderRadius: '15px',
        display: 'flex',
        justifyContent: 'center',
        gap: '40px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#667eea' }}>
            {earnedBadges.length}
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>Badges Earned</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#667eea' }}>
            {achievements.length > 0
              ? Math.round((earnedBadges.length / achievements.length) * 100)
              : 0}%
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>Completion Rate</div>
        </div>
      </div>
    </div>
  );
})()}


              {activeTab === 'settings' && (
                <div className="settings-card">
                  <h3 className="settings-title">Account Settings</h3>
                  <div className="settings-list">
                    {/* Email Notifications */}
                    <div className="setting-item">
                      <div className="setting-info">
                        <div className="setting-icon">
                          <Bell size={20} />
                        </div>
                        <div className="setting-content">
                          <div className="setting-text">
                            <h4 className="setting-name">Email Notifications</h4>
                            <p className="setting-desc">Receive email updates about your financial progress</p>
                          </div>
                          <button
                            onClick={() => handleSettingToggle('emailNotifications')}
                            className={`toggle-btn ${settings.emailNotifications ? 'toggle-active' : 'toggle-inactive'}`}
                          >
                            {settings.emailNotifications ? 'Enabled' : 'Disabled'}
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Mobile Notifications */}
                    <div className="setting-item">
                      <div className="setting-info">
                        <div className="setting-icon">
                          <Smartphone size={20} />
                        </div>
                        <div className="setting-content">
                          <div className="setting-text">
                            <h4 className="setting-name">Mobile Notifications</h4>
                            <p className="setting-desc">Get push notifications on your mobile device</p>
                          </div>
                          <button
                            onClick={() => handleSettingToggle('mobileNotifications')}
                            className={`toggle-btn ${settings.mobileNotifications ? 'toggle-active' : 'toggle-inactive'}`}
                          >
                            {settings.mobileNotifications ? 'Enabled' : 'Disabled'}
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Reset Profile */}
                    <div className="setting-item">
                      <div className="setting-info">
                        <div className="setting-icon">
                          <Star size={20} />
                        </div>
                        <div className="setting-content">
                          <div className="setting-text">
                            <h4 className="setting-name">Reset Profile</h4>
                            <p className="setting-desc">This will permanently delete all your data</p>
                          </div>
                          <button 
                            onClick={() => {
                              if (window.confirm('Are you sure you want to reset your profile? This action cannot be undone.')) {
                                localStorage.clear();
                                window.location.reload();
                              }
                            }}
                            className={`toggle-btn toggle-inactive`}
                            style={{background: 'linear-gradient(135deg, #ef4444, #f59e42)', color: 'white', minWidth: 120}}
                          >
                            Reset Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
  };
  export default Profile;