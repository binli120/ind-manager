// Author: Bin Lee
// Email: binlee120@gmail.com
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { AuthProvider } from '@/components/auth/auth-provider';

export default function ResetPasswordPage() {
  return (
    <AuthProvider>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <ResetPasswordForm />
            </div>
        </div>
    </AuthProvider>
  );
}