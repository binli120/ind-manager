// Author: Bin Lee
// Email: binlee120@gmail.com
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/components/auth/auth-provider';
import { useAsyncTask } from '@/hooks/useAsyncTask';
import { validatePassword } from '@/utils/validatePassword';

export function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const { updatePassword } = useAuth();
  const updatePasswordTask = useAsyncTask(
    async (nextPassword: string) => {
      const { error } = await updatePassword(nextPassword);
      if (error) {
        throw error;
      }
    },
    undefined,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const validationError = validatePassword(password, confirmPassword);
    if (validationError) {
      updatePasswordTask.setError(validationError);
      return;
    }

    const result = await updatePasswordTask.run(password);
    if (!result.error) {
      setMessage('Password updated successfully! Redirecting...');
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Set New Password</CardTitle>
        <CardDescription className="text-center">Enter your new password below</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {updatePasswordTask.error && (
            <Alert variant="destructive">
              <AlertDescription>{updatePasswordTask.error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={updatePasswordTask.isLoading}>
            {updatePasswordTask.isLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
