import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { verifyEmail } from '../services/authService';
import { AuthShell, Banner, btnCls } from './Login';

type Status = 'verifying' | 'success' | 'error';

export default function VerifyEmail() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !token) return;
    ran.current = true;
    void (async () => {
      try {
        const msg = await verifyEmail(token);
        setMessage(msg);
        setStatus('success');
      } catch (err) {
        const msg =
          err instanceof AxiosError
            ? (err.response?.data?.error ?? 'Verification failed')
            : 'Verification failed';
        setMessage(msg);
        setStatus('error');
      }
    })();
  }, [token]);

  return (
    <AuthShell title="Email verification" subtitle="Confirming your account">
      {status === 'verifying' && <p className="text-slate-500">Verifying…</p>}
      {status === 'success' && (
        <>
          <Banner tone="success">{message}</Banner>
          <Link to="/login" className={`inline-block ${btnCls} text-center`}>
            Go to login
          </Link>
        </>
      )}
      {status === 'error' && (
        <>
          <Banner tone="error">{message}</Banner>
          <Link to="/register" className="text-sm font-medium text-brand-600 hover:underline">
            Back to sign up
          </Link>
        </>
      )}
    </AuthShell>
  );
}
