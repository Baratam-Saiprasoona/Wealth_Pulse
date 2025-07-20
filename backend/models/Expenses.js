const mongoose = require('mongoose');

const ExpensesSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true,
    index: true  // Add index for better query performance
  },
  category: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0  // Ensure amount is non-negative
  },
  date: { 
    type: Date, 
    required: true,
    default: Date.now  // Auto-set current date if not provided
  }
}, {
  timestamps: true  // Automatically add createdAt and updatedAt fields
});

// Create compound index for efficient queries
ExpensesSchema.index({ username: 1, category: 1 });

module.exports = mongoose.model('Expenses', ExpensesSchema);
