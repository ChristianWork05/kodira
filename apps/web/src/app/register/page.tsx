'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { RegisterRequest } from '@kodira/types';
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
import { isValidEmail, isValidPassword, isValidUsername } from '../../lib/validators';

type RegisterFormValues = Pick<RegisterRequest, 'email' | 'password' | 'username' | 'fullName'>;
type FieldErrors = Partial<Record<keyof RegisterFormValues, string>>;

export default function RegisterPage() {
  const router = useRouter();
  const [values, setValues] = React.useState<RegisterFormValues>({
    email: '',
    password: '',
    username: '',
    fullName: '',
  });
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onChange =
    (key: keyof RegisterFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [key]: e.target.value }));
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
      setSubmitError(null);
    };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!isValidEmail(values.email)) errors.email = 'Escribe un email válido.';
    if (!isValidUsername(values.username))
      errors.username = '3–20 caracteres. Letras, números o underscore.';
    if (!isValidPassword(values.password))
      errors.password = 'Mínimo 8 caracteres y al menos 1 número.';

    if (values.fullName && values.fullName.trim().length > 80) {
      errors.fullName = 'Máximo 80 caracteres.';
    }
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
      await client.auth.register({
        email: values.email.trim(),
        password: values.password,
        username: values.username.trim(),
        fullName: values.fullName ? values.fullName.trim() : null,
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
        className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(80%_60%_at_50%_0%,hsl(var(--violet)_/_0.20),transparent_55%)]"
      />

      <div className="relative mx-auto w-full max-w-md">
        <header className="mb-7">
          <p className="font-mono text-xs tracking-wide text-muted-fg">KODIRA • Cuenta</p>
          <h1 className="font-display text-2xl leading-tight text-fg">Crear cuenta</h1>
          <p className="mt-1 text-sm text-muted-fg">
            Tu referral code se genera automáticamente en el backend.
          </p>
        </header>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Registro</CardTitle>
              <CardDescription>Usa el contrato /api/v1/auth/register.</CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-1.5">
                <label className="text-sm text-fg" htmlFor="fullName">
                  Nombre (opcional)
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={values.fullName ?? ''}
                  onChange={onChange('fullName')}
                  aria-invalid={fieldErrors.fullName ? true : undefined}
                />
                {fieldErrors.fullName ? (
                  <p className="text-xs text-danger">{fieldErrors.fullName}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-fg" htmlFor="username">
                  Username
                </label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={values.username}
                  onChange={onChange('username')}
                  aria-invalid={fieldErrors.username ? true : undefined}
                />
                {fieldErrors.username ? (
                  <p className="text-xs text-danger">{fieldErrors.username}</p>
                ) : (
                  <p className="text-xs text-muted-fg">3–20 caracteres. Letras, números o _</p>
                )}
              </div>

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
                  autoComplete="new-password"
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
                {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
              </Button>

              <Separator />

              <p className="text-sm text-muted-fg">
                ¿Ya tienes cuenta?{' '}
                <Link
                  className="text-fg underline decoration-border underline-offset-4 hover:opacity-90"
                  href="/login"
                >
                  Iniciar sesión
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

