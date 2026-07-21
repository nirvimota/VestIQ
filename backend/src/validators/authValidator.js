export function validateEmailPassword(body) {
  const errors = [];
  const { email, password } = body;
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.push('valid email is required');
  if (!password || password.length < 8) errors.push('password must be at least 8 characters');
  return errors;
}