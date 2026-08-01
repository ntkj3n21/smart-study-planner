import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import { authApi } from '../../api/authApi';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
  }, []);

  const getErrorMessage = (requestError: any) =>
    requestError.response?.data?.message || 'Something went wrong. Please try again.';

  const requestReset = async () => {
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      await authApi.requestPasswordReset(email.trim());
      setSuccess(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setError('');
    if (password.length < 6 || !/\d/.test(password)) {
      setError('Password must contain at least 6 characters and one number.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await authApi.resetPassword({
        token: token!,
        newPassword: password,
        confirmNewPassword: confirmPassword,
      });
      setSuccess(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const title = token ? 'Set a new password' : 'Forgot password';
  const description = token
    ? 'Choose a strong password for your account.'
    : 'Enter your registered email. We will send you a secure reset link.';

  if (success) {
    return (
      <AuthLayout>
        <div className="flex flex-col gap-6 !bg-white">
          <h1 className="text-2xl font-bold !text-primary">Smart Study Planner</h1>
          <div className="flex flex-col gap-2">
            <h2 className="text-[32px] font-bold !text-[#111827]">
              {token ? 'Password reset!' : 'Check your email'}
            </h2>
            <p className="text-base !text-[#6B7280]">
              {token
                ? 'Your password has been updated successfully.'
                : 'If an account exists for that email, a reset link is on its way.'}
            </p>
          </div>
          <Button onClick={() => navigate('/login')} className="w-full h-12 rounded-xl">
            Go to Sign In
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <form
        className="flex flex-col gap-6 !bg-white"
        onSubmit={(event) => {
          event.preventDefault();
          token ? resetPassword() : requestReset();
        }}
      >
        <h1 className="text-2xl font-bold !text-primary">Smart Study Planner</h1>
        <div className="flex flex-col gap-2">
          <h2 className="text-[32px] font-bold !text-[#111827]">{title}</h2>
          <p className="text-base !text-[#6B7280]">{description}</p>
        </div>

        {!token ? (
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            label="Email"
            onChange={(event: any) => setEmail(event.target.value)}
          />
        ) : (
          <>
            <Input
              type="password"
              placeholder="Enter new password"
              value={password}
              label="New Password"
              showPasswordToggle
              onChange={(event: any) => setPassword(event.target.value)}
            />
            <Input
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              label="Confirm Password"
              showPasswordToggle
              onChange={(event: any) => setConfirmPassword(event.target.value)}
            />
          </>
        )}

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl">
          {loading ? 'Please wait…' : token ? 'Reset Password' : 'Send Reset Link'}
        </Button>
        <button type="button" onClick={() => navigate('/login')} className="text-sm !text-primary">
          Back to Sign In
        </button>
      </form>
    </AuthLayout>
  );
}
