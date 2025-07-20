const mongoose = require('mongoose');
const achievementSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  earned: { type: Boolean, default: false },
  icon: { type: String, required: true }
});
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


const userProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },

  annualSavingsAmount: { type: Number, default: 0 },
  monthlyIncome: { type: Number, default: 0 },
  preferredCurrency: { type: String, default: 'INR' },

  occupation: { type: String, default: '' },
  bio: { type: String, default: '' },
  financialGoal: { type: String, default: '' },

  profileImage: { type: String, default: '' },
  dateOfBirth: { type: String, default: '' },
  joinDate: { type: String, default: new Date().toISOString().split('T')[0] },
  membershipLevel: { type: String, default: 'Basic' },

  // Achievements/Badges
  achievements: { type: [achievementSchema], default: defaultAchievements },

  // Settings
  settings: {
    emailNotifications: { type: Boolean, default: true },
    mobileNotifications: { type: Boolean, default: true },
  },

  // Financial summary
  financialData: {
    totalSaved: { type: Number, default: 0 },
    savingsGoal: { type: Number, default: 0 },
    monthlySpent: { type: Number, default: 0 },
    savingsRate: { type: Number, default: 0 },
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.UserProfile || mongoose.model('UserProfile', userProfileSchema);
