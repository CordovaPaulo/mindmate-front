'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import notify from '@/lib/toast';
import styles from './resetpass.module.css';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams<{ token?: string }>();
  const searchParams = useSearchParams();

  // State declarations
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [verifying, setVerifying] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Effects
  useEffect(() => {
    const routeToken = (params?.token as string) || '';
    const queryToken = searchParams.get('token') || '';
    const t = routeToken || queryToken;

    if (!t) {
      setError('Invalid reset link'); 
      setVerifying(false);
      return;
    }

    setToken(t);
    (async () => {
      try {
        setVerifying(true);
        await api.get('/api/auth/reset-password/verify', { params: { token: t } });
        setError('');
      } catch (e: any) {
        const msg = e?.response?.data?.message || 'Invalid or expired reset link';
        setError(msg);
        notify.error(msg);
      } finally {
        setVerifying(false);
      }
    })();
  }, [params?.token, searchParams]);

  // Handler functions
  const resetUserPass = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!token) {
      setError('Missing reset token');
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }
    if (password !== passwordConfirmation) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const body = { token, newPassword: password, confirmPassword: passwordConfirmation };
      const res = await api.post('/api/auth/reset-password', body);
      if (res.status === 200) {
        setSuccess('Password reset successfully! Redirecting to login...');
        notify.success('Password reset successfully!');
        setTimeout(() => router.push('/auth/login'), 2000);
      } else {
        const msg = res.data?.message || 'Failed to reset password';
        setError(msg); notify.error(msg);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to reset password';
      setError(msg); notify.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // JSX Return
  return (
    <div className={`reset-password-global ${styles.resetPasswordContainer}`}>
      <header className={styles.brandHeader}>
        <img src="/logo_gccoed.png" alt="GCCoed Logo" className={styles.logoImg} />
        <span className={styles.brandName}>MindMates</span>
      </header>

      <div className={styles.formWrapper}>
        <h2 className={styles.heading}>Reset Password</h2>

        {verifying ? (
          <div className={styles.infoMessage}>Verifying link...</div>
        ) : error ? (
          <div className={styles.errorMessage}>{error}</div>
        ) : (
          <form onSubmit={resetUserPass}>
            <div className={styles.formGroup}>
              <div className={styles.inputWithIcon}>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New Password"
                  required
                  minLength={8}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.inputWithIcon}>
                <input
                  type="password"
                  id="password_confirmation"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Confirm Password"
                  required
                  className={styles.input}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            {success && <div className={styles.successMessage}>{success}</div>}
          </form>
        )}
      </div>
    </div>
  );
}