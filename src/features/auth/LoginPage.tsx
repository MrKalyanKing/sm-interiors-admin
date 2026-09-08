import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { getErrorMessage } from '@/lib/api';
import { useAuth } from './AuthProvider';

const schema = z.object({
  email: z.string().min(1, 'Enter your email address.').email('That does not look like an email.'),
  password: z.string().min(1, 'Enter your password.'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (user) {
    // Send them back where they were headed before the login wall.
    const from = (location.state as { from?: string })?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values.email, values.password);
      navigate((location.state as { from?: string })?.from ?? '/', { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not sign you in.'));
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-[26rem] animate-fade-in">
        <div className="mb-8 text-center">
          <div className="font-display text-2xl font-extrabold uppercase tracking-[0.16em] text-frost">
            SM <span className="azure-text">Interiors</span>
          </div>
          <p className="kicker mt-2">Content administration</p>
        </div>

        <div className="glass-raised rounded-2xl p-6 sm:p-8">
          <h1 className="font-display text-lg font-semibold text-frost">Sign in</h1>
          <p className="mt-1 text-sm text-frost-dim">
            Manage the website content, enquiries and settings.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <Input
              label="Email address"
              type="email"
              autoComplete="username"
              autoFocus
              placeholder="you@sminteriors.in"
              leading={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                leading={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                className="pr-11"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-[2.1rem] text-frost-dim transition-colors hover:text-frost"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="rounded-lg border border-danger/25 bg-danger/[0.08] px-3.5 py-2.5 text-sm text-danger"
              >
                {formError}
              </div>
            )}

            <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-frost-dim">
          Forgotten your password? Ask whoever set up your account to reset it from
          <br />
          Admin → Team.
        </p>
      </div>
    </div>
  );
}
