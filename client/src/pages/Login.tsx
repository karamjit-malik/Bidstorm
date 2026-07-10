import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AxiosError } from 'axios';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch (err) {
      const msg =
        err instanceof AxiosError
          ? (err.response?.data?.error ?? 'Login failed')
          : 'Login failed';
      setServerError(msg);
    }
  });

  return (
    <AuthShell title="Welcome back" subtitle="Log in to keep bidding">
      {params.get('verified') === '1' && (
        <Banner tone="success">Email verified — you can log in now.</Banner>
      )}
      {serverError && <Banner tone="error">{serverError}</Banner>}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email" error={errors.email?.message}>
          <input type="email" autoComplete="email" className={inputCls} {...register('email')} />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <input
            type="password"
            autoComplete="current-password"
            className={inputCls}
            {...register('password')}
          />
        </Field>
        <button type="submit" disabled={isSubmitting} className={btnCls}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-black/50">
        No account?{' '}
        <Link to="/register" className="font-medium text-black underline underline-offset-2 hover:opacity-60">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}

// --- Small shared UI primitives (promoted to components/ui in a later phase). ---

export const inputCls =
  'w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/10';

export const btnCls =
  'w-full rounded-full border border-black bg-black px-4 py-2.5 font-medium text-white transition-colors hover:bg-transparent hover:text-black disabled:opacity-60';

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-black/70">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-red-500">{error}</span>}
    </label>
  );
}

export function Banner({ tone, children }: { tone: 'success' | 'error'; children: React.ReactNode }) {
  const cls =
    tone === 'success'
      ? 'border-green-600/30 bg-green-50 text-green-800'
      : 'border-red-600/30 bg-red-50 text-red-700';
  return <div className={`mb-4 rounded-lg border px-4 py-2 text-sm ${cls}`}>{children}</div>;
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-[#efedea] px-4">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 shadow-card">
        <div className="mb-6">
          <Link to="/" className="flex items-center gap-1.5">
            <span className="font-display text-xl tracking-tight text-black">BidStorm</span>
            <span className="select-none text-[22px] text-black" style={{ letterSpacing: '-0.02em' }}>
              ✳︎
            </span>
          </Link>
          <h1 className="mt-5 font-display text-2xl tracking-tight text-black">{title}</h1>
          <p className="mt-1 text-sm text-black/50">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
