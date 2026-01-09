// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
export function validatePassword(password: string, confirmPassword: string): string | null {
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters long';
  }

  return null;
}