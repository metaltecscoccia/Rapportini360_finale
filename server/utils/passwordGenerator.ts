/**
 * Generate a secure temporary password
 *
 * Format: 12 characters with:
 * - Uppercase letters (A-Z)
 * - Lowercase letters (a-z)
 * - Numbers (0-9)
 * - Symbols (!@#$%^&*)
 *
 * Example: "Temp2024-Xy9"
 */
export function generateTemporaryPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';

  const allChars = uppercase + lowercase + numbers + symbols;

  // Ensure at least one character from each category
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill remaining 8 characters randomly
  for (let i = 0; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password to avoid predictable pattern
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
