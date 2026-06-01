'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { LoginRequest } from '@kodira/types';
import { getKodiraApiClient } from '@kodira/hooks';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Separator,
} from '@kodira/ui';
import { toAuthErrorMessage } from '../../lib/apiError';
import { isValidEmail, isValidPassword } from '../../lib/validators';

type FieldErrors = Partial<Record<keyof LoginRequest, string>>;

export default function LoginPage() {
  const router = useRouter();
  const [values, setValues] = React.useState<LoginRequest>({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onChange = (key: keyof LoginRequest) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    setSubmitError(null);
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!isValidEmail(values.email)) errors.email = 'Escribe un email válido.';
    if (!isValidPassword(values.password))
      errors.password = 'Mínimo 8 caracteres y al menos 1 número.';
    return errors;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    setSubmitError(null);
    if (Object.values(errors).some(Boolean)) return;

    setIsSubmitting(true);
    try {
      const client = getKodiraApiClient();
      await client.auth.login({
        email: values.email.trim(),
        password: values.password,
      });
      router.push('/dashboard');
    } catch (err) {
      setSubmitError(toAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-10 sm:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(80%_60%_at_50%_0%,hsl(var(--primary)_/_0.22),transparent_55%)]"
      />

      <div className="relative mx-auto w-full max-w-md">
        <header className="mb-7">
          <p className="font-mono text-xs tracking-wide text-muted-fg">KODIRA • Cuenta</p>
          <h1 className="font-display text-2xl leading-tight text-fg">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-muted-fg">
            Entra con tu email y contraseña para continuar.
          </p>
        </header>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Acceso</CardTitle>
              <CardDescription>Usa el mismo contrato que /api/v1/auth/login.</CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-1.5">
                <label className="text-sm text-fg" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={values.email}
                  onChange={onChange('email')}
                  aria-invalid={fieldErrors.email ? true : undefined}
                />
                {fieldErrors.email ? (
                  <p className="text-xs text-danger">{fieldErrors.email}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-fg" htmlFor="password">
                  Contraseña
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={values.password}
                  onChange={onChange('password')}
                  aria-invalid={fieldErrors.password ? true : undefined}
                />
                {fieldErrors.password ? (
                  <p className="text-xs text-danger">{fieldErrors.password}</p>
                ) : (
                  <p className="text-xs text-muted-fg">Mínimo 8 caracteres y al menos 1 número.</p>
                )}
              </div>

              {submitError ? (
                <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2">
                  <p className="text-sm text-danger-fg">{submitError}</p>
                </div>
              ) : null}

              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Entrando…' : 'Entrar'}
              </Button>

              <Separator />

              <p className="text-sm text-muted-fg">
                ¿No tienes cuenta?{' '}
                <Link
                  className="text-fg underline decoration-border underline-offset-4 hover:opacity-90"
                  href="/register"
                >
                  Crear cuenta
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

