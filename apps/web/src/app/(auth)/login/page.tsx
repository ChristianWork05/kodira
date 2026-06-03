'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { LoginRequest } from '@kodira/types';
import { getKodiraApiClient } from '@kodira/hooks';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Separator } from '@kodira/ui';
import { toAuthErrorMessage } from '../../../lib/apiError';
import { isValidEmail, isValidPassword } from '../../../lib/validators';

type FieldErrors = Partial<Record<keyof LoginRequest, string>>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    if (!isValidPassword(values.password)) errors.password = 'Mínimo 8 caracteres y al menos 1 número.';
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
      const next = searchParams.get('next');
      const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
      router.push(target);
    } catch (err) {
      setSubmitError(toAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="mb-7">
        <div className="inline-flex items-center gap-2 rounded-full border border-line-strong/14 bg-white/4 px-3 py-1 text-xs font-semibold text-fg-muted">
          <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_0_0_rgba(59,130,246,0.7)]" />
          Cuenta
        </div>
        <h1 className="mt-5 font-display text-[40px] font-black leading-[1.05] tracking-[-0.03em] text-fg">
          Iniciar sesión
        </h1>
        <p className="mt-3 text-[15px] leading-7 text-fg-muted">
          Entra con tu email y contraseña para continuar.
        </p>
      </header>

      <Card variant="glass">
        <CardHeader>
          <div>
            <CardTitle>Acceso</CardTitle>
            <CardDescription>Tu sesión se mantiene con refresh automático.</CardDescription>
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
              {fieldErrors.email ? <p className="text-xs text-danger">{fieldErrors.email}</p> : null}
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
                <p className="text-xs text-fg-dim">Mínimo 8 caracteres y al menos 1 número.</p>
              )}
            </div>

            {submitError ? (
              <div className="rounded-[14px] border border-danger/35 bg-danger/10 px-3 py-2">
                <p className="text-sm text-danger-fg">{submitError}</p>
              </div>
            ) : null}

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando…' : 'Entrar'}
            </Button>

            <Separator className="my-2" />

            <p className="text-sm text-fg-muted">
              ¿No tienes cuenta?{' '}
              <Link className="text-fg underline decoration-line/40 underline-offset-4 hover:opacity-90" href="/register">
                Crear cuenta
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
