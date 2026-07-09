import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useAuth } from '../hooks/useAuth';
import { AuthShell, Banner, Field, inputCls, btnCls } from './Login';

const schema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  username: z
    .string()
    .min(3, 'At least 3 characters')
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, and underscores only'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[a-z]/, 'Needs a lowercase letter')
    .regex(/[A-Z]/, 'Needs an uppercase letter')
    .regex(/[0-9]/, 'Needs a number'),
  role: z.enum(['buyer', 'seller']),
});
type FormValues = z.infer<typeof schema>;

export default function Register() {
  const { register: registerUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'buyer' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await registerUser(values);
      setDone(true);
    } catch (err) {
      const msg =
        err instanceof AxiosError
          ? (err.response?.data?.error ?? 'Registration failed')
          : 'Registration failed';
      setServerError(msg);
    }
  });

  if (done) {
    return (
      <AuthShell title="Almost there" subtitle="Verify your email to continue">
        <Banner tone="success">
          Account created! We&apos;ve sent a verification link to your email. Click it, then log in.
        </Banner>
        <p className="text-sm text-slate-500">
          (In development, the verification link is printed in the server console.)
        </p>
        <Link to="/login" className={`mt-4 inline-block ${btnCls} text-center`}>
          Go to login
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="Join BidStorm to bid and sell">
      {serverError && <Banner tone="error">{serverError}</Banner>}
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Full name" error={errors.fullName?.message}>
          <input type="text" autoComplete="name" className={inputCls} {...register('fullName')} />
        </Field>
        <Field label="Username" error={errors.username?.message}>
          <input type="text" autoComplete="username" className={inputCls} {...register('username')} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input type="email" autoComplete="email" className={inputCls} {...register('email')} />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <input
            type="password"
            autoComplete="new-password"
            className={inputCls}
            {...register('password')}
          />
        </Field>
        <Field label="I want to" error={errors.role?.message}>
          <select className={inputCls} {...register('role')}>
            <option value="buyer">Buy items</option>
            <option value="seller">Sell items</option>
          </select>
        </Field>
        <button type="submit" disabled={isSubmitting} className={btnCls}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
