export function validateKycPayload(body) {
  const errors = [];
  const { panNumber, bankAccountNumber, ifsc } = body;
  if (!panNumber || !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber)) errors.push('valid PAN number is required (e.g. ABCDE1234F)');
  if (!bankAccountNumber) errors.push('bankAccountNumber is required');
  if (!ifsc) errors.push('ifsc is required');
  return errors;
}