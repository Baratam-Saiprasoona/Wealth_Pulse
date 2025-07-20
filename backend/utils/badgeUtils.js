// backend/utils/badgeUtils.js
function awardBadge(profile, badgeTitle) {
  let badge = profile.achievements.find(b => b.title === badgeTitle);
  if (!badge) {
    badge = { title: badgeTitle, earned: true };
    profile.achievements.push(badge);
    console.log(`Badge created and awarded: ${badgeTitle}`);
  } else if (!badge.earned) {
    badge.earned = true;
    console.log(`Badge awarded: ${badgeTitle}`);
  }
}

function checkAndAwardBadges(profile) {
  const totalSaved = profile.financialData.totalSaved;
  const savingsGoal = profile.annualSavingsAmount;
  const savingsRate = profile.financialData.savingsRate;

  // Goal Achiever Badge (90% of annual savings goal)
  if (savingsGoal > 0 && totalSaved >= 0.9 * savingsGoal) {
    awardBadge(profile, 'Goal Achiever');
  }

  // Savings Champion (if savings rate is >= 60%)
  if (savingsRate >= 60) {
    awardBadge(profile, 'Savings Champion');
  }

  // Budget Master (if monthlySpent <= monthlyIncome)
  if (profile.financialData.monthlySpent <= profile.monthlyIncome) {
    awardBadge(profile, 'Budget Master');
  }
}

module.exports = { checkAndAwardBadges };
