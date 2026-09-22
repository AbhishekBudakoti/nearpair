// Mirrors the backend's STRONG_PASSWORD_RE in Backend/controllers/auth.controller.js —
// keep the two in sync if the policy ever changes.
export function checkPasswordStrength(password) {
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  return {
    ...checks,
    valid: Object.values(checks).every(Boolean),
  };
}
