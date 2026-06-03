'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { RegisterRequest } from '@kodira/types';
import { getKodiraApiClient } from '@kodira/hooks';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Separator } from '@kodira/ui';
import { toAuthErrorMessage } from '../../../lib/apiError';
import { isValidEmail, isValidPassword, isValidUsername } from '../../../lib/validators';

type RegisterFormValues = Pick<RegisterRequest, 'email' | 'password' | 'username' | 'fullName'>;
type FieldErrors = Partial<Record<keyof RegisterFormValues, string>>;

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    if (!isValidUsername(values.username)) errors.username = '3-20 caracteres. Letras, números o underscore.';
    if (!isValidPassword(values.password)) errors.password = 'Mínimo 8 caracteres y al menos 1 número.';

    if (values.fullName && values.fullName.trim().length > 80) errors.fullName = 'Máximo 80 caracteres.';
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
          <span className="h-2 w-2 rounded-full bg-violet shadow-[0_0_0_0_rgba(99,102,241,0.7)]" />
          Cuenta
        </div>
        <h1 className="mt-5 font-display text-[40px] font-black leading-[1.05] tracking-[-0.03em] text-fg">
          Crear cuenta
        </h1>
        <p className="mt-3 text-[15px] leading-7 text-fg-muted">
          Empieza con tu usuario y credenciales. Puedes completar tu perfil después.
        </p>
      </header>

      <Card variant="glass">
        <CardHeader>
          <div>
            <CardTitle>Registro</CardTitle>
            <CardDescription>Se crea tu usuario y quedas logueado al terminar.</CardDescription>
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
              {fieldErrors.fullName ? <p className="text-xs text-danger">{fieldErrors.fullName}</p> : null}
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
                <p className="text-xs text-fg-dim">3-20 caracteres. Letras, números o _</p>
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
                autoComplete="new-password"
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
              {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
            </Button>

            <Separator className="my-2" />

            <p className="text-sm text-fg-muted">
              ¿Ya tienes cuenta?{' '}
              <Link className="text-fg underline decoration-line/40 underline-offset-4 hover:opacity-90" href="/login">
                Iniciar sesión
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
