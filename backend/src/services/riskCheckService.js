export function checkSufficientFunds({ availableBalance, quantity, price }) {
  const estimatedCost = quantity * price;
  if (estimatedCost > availableBalance) {
    return {
      passed: false,
      reason: `Insufficient balance: need ~₹${estimatedCost.toFixed(2)}, available ₹${availableBalance.toFixed(2)}`,
    };
  }
  return { passed: true, estimatedCost };
}