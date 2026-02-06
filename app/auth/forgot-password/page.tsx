// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { AuthProvider } from '@/components/auth/auth-provider';

export default function ForgotPasswordPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </AuthProvider>
  );
}
