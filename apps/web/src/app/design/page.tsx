'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import {
  AppShell,
  Atmosphere,
  Aurora,
  AnimatedNumber,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  Input,
  Layer,
  LoadingState,
  NoiseOverlay,
  Progress,
  Reveal,
  RevealItem,
  Skeleton,
  Spinner,
  Tabs,
  Toggle,
} from '@kodira/ui';

type IconProps = Omit<React.SVGProps<SVGSVGElement>, 'children'> & {
  strokeWidth?: number;
};

function IconDashboard({ className, strokeWidth = 1.8, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
      {...props}
    >
      <path d="M4 4h7v7H4z" />
      <path d="M13 4h7v4h-7z" />
      <path d="M13 10h7v10h-7z" />
      <path d="M4 13h7v7H4z" />
    </svg>
  );
}

function IconReader({ className, strokeWidth = 1.8, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
      {...props}
    >
      <path d="M5 5.5c0-1 1-2 2-2h11c.6 0 1 .4 1 1v15c0 .6-.4 1-1 1H7c-1 0-2-1-2-2z" />
      <path d="M7 3.5v16" />
      <path d="M10 7.5h7" />
      <path d="M10 10.5h7" />
    </svg>
  );
}

function IconMixer({ className, strokeWidth = 1.8, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
      {...props}
    >
      <path d="M4 6h16" />
      <path d="M8 6v12" />
      <path d="M4 12h16" />
      <path d="M16 12v6" />
      <path d="M4 18h16" />
      <path d="M12 18v-8" />
      <path d="M7 10h2" />
      <path d="M11 8h2" />
      <path d="M15 15h2" />
    </svg>
  );
}

function IconGear({ className, strokeWidth = 1.7, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
      {...props}
    >
      <path d="M12 14.7a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4z" />
      <path d="M19.4 13.4v-2.8l-2.1-.7a7.4 7.4 0 0 0-.7-1.2l1-2-2-2-2 1a7.4 7.4 0 0 0-1.2-.7L10.6 3H7.8l-.7 2.1c-.4.2-.8.4-1.2.7l-2-1-2 2 1 2c-.3.4-.5.8-.7 1.2l-2.1.7v2.8l2.1.7c.2.4.4.8.7 1.2l-1 2 2 2 2-1c.4.3.8.5 1.2.7l.7 2.1h2.8l.7-2.1c.4-.2.8-.4 1.2-.7l2 1 2-2-1-2c.3-.4.5-.8.7-1.2z" />
    </svg>
  );
}

export default function DesignPage() {
  const pathname = usePathname();
  const [tab, setTab] = React.useState('components');
  const [toggle, setToggle] = React.useState(true);

  return (
    <>
      <Atmosphere />
      <NoiseOverlay />
      <Layer>
        <div className="relative">
          <Aurora intensity={0.45} />
          <AppShell
            routeKey={pathname}
            currentPath={pathname}
            title="Design System"
            topbarActions={
              <>
                <Button variant="glass" size="sm">
                  Docs
                </Button>
                <Button variant="primary" size="sm" magnetic>
                  Usar en la app
                </Button>
              </>
            }
            nav={[
              { href: '/dashboard', label: 'Inicio', icon: <IconDashboard className="h-4 w-4" /> },
              { href: '/courses', label: 'Cursos', icon: <IconReader className="h-4 w-4" /> },
              { href: '/studio', label: 'Studio', icon: <IconMixer className="h-4 w-4" /> },
              { href: '/settings', label: 'Ajustes', icon: <IconGear className="h-4 w-4" /> },
            ]}
          >
            <div className="pb-24">
              <div className="mx-auto max-w-[1080px] px-1">
                <Reveal className="mb-10">
                  <RevealItem>
                    <div className="inline-flex items-center gap-2 rounded-full border border-line-strong/14 bg-white/4 px-3 py-1 text-xs font-semibold text-fg-muted">
                      <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_0_0_rgba(52,211,153,0.7)]" />
                      Base de UI para toda la app
                    </div>
                  </RevealItem>
                  <RevealItem>
                    <h1 className="mt-5 max-w-[18ch] font-display text-[42px] font-black leading-[1.05] tracking-[-0.03em] text-fg md:text-[64px]">
                      Oscuro, profundo y táctil. Como el showcase.
                    </h1>
                  </RevealItem>
                  <RevealItem>
                    <p className="mt-4 max-w-[62ch] text-[16px] leading-7 text-fg-muted md:text-[18px]">
                      Tokens, motion, componentes base y un app shell listo para escalar.
                    </p>
                  </RevealItem>
                  <RevealItem>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button variant="primary" magnetic>
                        Primary
                      </Button>
                      <Button variant="glass">Glass</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="danger">Danger</Button>
                    </div>
                  </RevealItem>
                </Reveal>

                <div className="mb-10">
                  <Tabs
                    value={tab}
                    onValueChange={setTab}
                    items={[
                      { value: 'components', label: 'Componentes' },
                      { value: 'states', label: 'Estados' },
                      { value: 'shell', label: 'App Shell' },
                    ]}
                  />
                </div>

                {tab === 'components' ? (
                  <div className="grid gap-6">
                    <Reveal className="grid gap-6 md:grid-cols-2" stagger={0.08}>
                      <RevealItem>
                        <Card variant="solid">
                          <CardHeader>
                            <div>
                              <CardTitle>Inputs + badges</CardTitle>
                              <CardDescription>Contraste y foco visibles, sin look Tailwind por defecto.</CardDescription>
                            </div>
                            <Badge variant="available">Disponible</Badge>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-3">
                              <Input placeholder="Nombre del curso" />
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="inProgress">En curso</Badge>
                                <Badge variant="soon">Próximamente</Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </RevealItem>
                      <RevealItem>
                        <Card variant="glass">
                          <CardHeader>
                            <div>
                              <CardTitle>Toggle + progress</CardTitle>
                              <CardDescription>Feedback con easing de marca y sin jank.</CardDescription>
                            </div>
                            <Toggle checked={toggle} onCheckedChange={setToggle} />
                          </CardHeader>
                          <CardContent>
                            <Progress value={toggle ? 72 : 34} />
                          </CardContent>
                        </Card>
                      </RevealItem>
                    </Reveal>

                    <Reveal className="grid gap-6 md:grid-cols-3" stagger={0.06}>
                      <RevealItem>
                        <Card variant="solid">
                          <CardTitle>Solid</CardTitle>
                          <CardDescription className="mt-2">
                            Surface limpia con borde sutil y brillo interno.
                          </CardDescription>
                        </Card>
                      </RevealItem>
                      <RevealItem>
                        <Card variant="gradient">
                          <CardTitle>Gradient Border</CardTitle>
                          <CardDescription className="mt-2">
                            Borde con gradiente de marca y halo en hover.
                          </CardDescription>
                        </Card>
                      </RevealItem>
                      <RevealItem>
                        <Card variant="tilt">
                          <CardTitle>Tilt 3D</CardTitle>
                          <CardDescription className="mt-2">
                            Profundidad ligera. Solo transform y con reduce motion.
                          </CardDescription>
                        </Card>
                      </RevealItem>
                    </Reveal>
                  </div>
                ) : null}

                {tab === 'states' ? (
                  <div className="grid gap-6 md:grid-cols-3">
                    <LoadingState label="Cargando datos">
                      <Skeleton className="h-24 w-full rounded-[14px]" />
                      <Skeleton className="mt-3 h-4 w-4/5" />
                      <Skeleton className="mt-2 h-4 w-2/3" />
                    </LoadingState>
                    <div className="rounded-lg border border-line/10 bg-surface p-6">
                      <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
                        <Spinner />
                        <div className="text-sm text-fg-muted">Procesando</div>
                      </div>
                    </div>
                    <EmptyState
                      title="Aún no hay nada aquí"
                      description="Cuando publiques tu primer curso, aparecerá aquí."
                      action={<Button variant="glass">Crear curso</Button>}
                    />
                    <ErrorState
                      className="md:col-span-3"
                      title="No se pudo cargar"
                      description="Revisa tu conexión o inténtalo de nuevo."
                      action={
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button variant="primary">Reintentar</Button>
                          <Button variant="ghost">Volver</Button>
                        </div>
                      }
                    />
                  </div>
                ) : null}

                {tab === 'shell' ? (
                  <div className="grid gap-6">
                    <Card variant="gradient" className="p-0">
                      <div className="grid gap-3 p-7 md:grid-cols-[minmax(0,1fr)_360px]">
                        <div>
                          <CardTitle>Patrón de dashboard</CardTitle>
                          <CardDescription className="mt-2">
                            Una maqueta rápida para validar ritmo, profundidad y estados.
                          </CardDescription>
                          <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            <Card variant="solid" className="p-5">
                              <div className="text-sm font-semibold text-fg-muted">Cursos</div>
                              <div className="mt-2 font-display text-[34px] font-black tracking-[-0.03em]">
                                <AnimatedNumber value={12} durationMs={1200} />
                              </div>
                            </Card>
                            <Card variant="solid" className="p-5">
                              <div className="text-sm font-semibold text-fg-muted">Progreso</div>
                              <div className="mt-2 font-display text-[34px] font-black tracking-[-0.03em]">
                                <AnimatedNumber value={72} suffix="%" durationMs={1200} />
                              </div>
                            </Card>
                          </div>
                        </div>
                        <Card variant="glass" className="p-5">
                          <div className="text-sm font-semibold text-fg-muted">Continuar</div>
                          <div className="mt-3">
                            <div className="text-[15px] font-semibold text-fg">Fundamentos de React</div>
                            <div className="mt-1 text-sm text-fg-muted">Lección 7</div>
                            <Progress className="mt-4" value={62} />
                            <div className="mt-4 flex gap-2">
                              <Button size="sm" variant="primary" magnetic>
                                Continuar
                              </Button>
                              <Button size="sm" variant="glass">
                                Ver temario
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </Card>
                  </div>
                ) : null}
              </div>
            </div>
          </AppShell>
        </div>
      </Layer>
    </>
  );
}
