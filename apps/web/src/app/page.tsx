'use client';

import * as React from 'react';
import Link from 'next/link';
import type { CourseListItem } from '@kodira/types';
import { getKodiraApiClient, useCoursesQuery } from '@kodira/hooks';
import {
  AnimatedNumber,
  Atmosphere,
  Aurora,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  HoverLift,
  Input,
  Logo,
  NoiseOverlay,
  Reveal,
  RevealItem,
  Separator,
  Skeleton,
} from '@kodira/ui';
import { getApiStatus } from '../lib/apiError';

type SessionState = 'checking' | 'guest' | 'authed';

type FormState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success' }
  | { status: 'error'; message: string };

type Tint = 'primary' | 'violet';

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function usePrefersReducedMotion() {
  const [reduce, setReduce] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduce(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  return reduce;
}


type IconProps = Omit<React.SVGProps<SVGSVGElement>, 'children'> & {
  strokeWidth?: number;
};

function IconArrowRight({ className, strokeWidth = 1.8, ...props }: IconProps) {
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
      <path d="M5 12h12" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

function IconArrowDown({ className, strokeWidth = 1.8, ...props }: IconProps) {
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
      <path d="M12 5v14" />
      <path d="M6 13l6 6 6-6" />
    </svg>
  );
}

function IconCheck({ className, strokeWidth = 1.9, ...props }: IconProps) {
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
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function IconWorld({ className, strokeWidth = 1.6, ...props }: IconProps) {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c3.2 3.6 3.2 13.4 0 18" />
      <path d="M12 3c-3.2 3.6-3.2 13.4 0 18" />
    </svg>
  );
}

function IconDeviceMobile({ className, strokeWidth = 1.6, ...props }: IconProps) {
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
      <rect x="7" y="3" width="10" height="18" rx="2.5" />
      <path d="M11 18h2" />
    </svg>
  );
}

function IconStack2({ className, strokeWidth = 1.6, ...props }: IconProps) {
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
      <path d="M12 4l8 4-8 4-8-4 8-4z" />
      <path d="M4 12l8 4 8-4" />
      <path d="M4 16l8 4 8-4" />
    </svg>
  );
}

function IconDeviceGamepad2({ className, strokeWidth = 1.6, ...props }: IconProps) {
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
      <path d="M6.6 11.2a4.2 4.2 0 0 1 3.8-2.2h3.2a4.2 4.2 0 0 1 3.8 2.2l1.2 2.2a4 4 0 0 1-.4 4.4 3.2 3.2 0 0 1-4.6.4l-1.6-1.4a2.4 2.4 0 0 0-3.2 0l-1.6 1.4a3.2 3.2 0 0 1-4.6-.4 4 4 0 0 1-.4-4.4l1.2-2.2z" />
      <path d="M8.5 13.5h3" />
      <path d="M10 12v3" />
      <path d="M16.4 13.2h.01" />
      <path d="M18 14.6h.01" />
    </svg>
  );
}

function SectionHeader({
  title,
  description,
  right,
}: {
  title: string;
  description: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
      <header className="max-w-2xl text-balance">
        <h2 className="font-display text-xl leading-tight text-fg sm:text-2xl">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-fg">{description}</p>
      </header>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function GradientBorder({
  tint,
  className,
  children,
}: {
  tint: Tint;
  className?: string;
  children: React.ReactNode;
}) {
  const ring =
    tint === 'primary'
      ? 'bg-gradient-to-br from-primary/35 via-border/20 to-violet/20'
      : 'bg-gradient-to-br from-violet/35 via-border/20 to-primary/20';

  return (
    <div className={cx('rounded-2xl p-px', ring, className)}>
      <div className="rounded-[calc(theme(borderRadius.2xl)-1px)]">{children}</div>
    </div>
  );
}


function Spotlight() {
  const reduce = usePrefersReducedMotion();
  const ref = React.useRef<HTMLDivElement | null>(null);
  const target = React.useRef({ x: 0, y: 0 });
  const current = React.useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    if (reduce) return;
    target.current = { x: window.innerWidth * 0.65, y: window.innerHeight * 0.3 };
    current.current = { ...target.current };

    let raf = 0;
    const loop = () => {
      const el = ref.current;
      if (!el) return;
      const tx = target.current.x;
      const ty = target.current.y;
      const nx = current.current.x + (tx - current.current.x) * 0.12;
      const ny = current.current.y + (ty - current.current.y) * 0.12;
      current.current = { x: nx, y: ny };
      el.style.transform = `translate3d(${nx}px, ${ny}px, 0) translate3d(-50%, -50%, 0)`;
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [reduce]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="spotlight pointer-events-none absolute -inset-40 opacity-60 motion-reduce:opacity-40"
    >
      <div className="h-[520px] w-[520px] rounded-full [background:radial-gradient(circle_at_center,rgba(59,130,246,0.20),transparent_62%)] blur-[24px]" />
    </div>
  );
}

function ScrollAwareNav({
  session,
  scrolled,
}: {
  session: SessionState;
  scrolled: boolean;
}) {
  const reduce = usePrefersReducedMotion();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-40 px-4 pt-3 sm:px-6">
      <nav
        className={cx(
          'mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-3 rounded-2xl px-3 sm:px-4',
          'transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
          !reduce && !mounted && 'opacity-0 -translate-y-2',
          !reduce && mounted && 'opacity-100 translate-y-0',
          scrolled
            ? 'border border-border/60 bg-card/55 backdrop-blur-xl'
            : 'border border-transparent bg-transparent',
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label="KODIRA"
        >
          <Logo markSize={28} className="text-fg" />
          <Badge variant="neutral">Estudio</Badge>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <Button asChild variant="ghost" size="sm">
            <a href="#services">Servicios</a>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href="#work">Portafolio</a>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href="#team">Equipo</a>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href="#academy">Academia</a>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {session === 'authed' ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/login?next=%2Fdashboard">Dashboard</Link>
            </Button>
          )}
          <Button asChild variant="primary" size="sm" className="relative overflow-hidden">
            <a href="#contact" className="group">
              <span className="relative z-10">Cuéntanos tu proyecto</span>
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-10 opacity-0 transition-opacity duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:opacity-100 motion-reduce:transition-none [background:radial-gradient(60%_60%_at_50%_50%,rgba(99,102,241,0.28),transparent_62%)]"
              />
            </a>
          </Button>
        </div>
      </nav>
    </div>
  );
}

function TechMarquee() {
  const reduce = usePrefersReducedMotion();
  const items = [
    'Next.js',
    'React',
    'TypeScript',
    'Node.js',
    'Odoo',
    'Python',
    'Unity',
    'Flutter',
    'PostgreSQL',
    'MongoDB',
    'Docker',
    'CI/CD',
    'Stripe',
    'Mercado Pago',
  ];
  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-y border-border/50 bg-card/25 py-4">
      <div aria-hidden className="pointer-events-none absolute inset-0 [background:radial-gradient(80%_120%_at_10%_50%,rgba(59,130,246,0.10),transparent_60%)]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-20 [background:linear-gradient(90deg,hsl(var(--card)/0.25),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-20 [background:linear-gradient(270deg,hsl(var(--card)/0.25),transparent)]"
      />
      <div className="relative">
        <div className={cx('flex w-max gap-3 pr-3', !reduce && 'marquee-track')}>
          {doubled.map((label, idx) => (
            <span
              key={`${label}-${idx}`}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/35 px-3 py-1.5 text-xs text-fg/90"
            >
              <span className="font-mono">{label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}


function ServiceCard({
  icon,
  title,
  description,
  bullets,
  tint,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  bullets: string[];
  tint: Tint;
  className?: string;
}) {
  return (
    <GradientBorder tint={tint} className={className}>
      <Card
        variant="tilt"
        className="relative overflow-hidden rounded-2xl bg-card/45 backdrop-blur-xl supports-[backdrop-filter]:bg-card/35"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(120%_80%_at_0%_0%,rgba(255,255,255,0.06),transparent_60%)]" />
        <CardHeader className="items-start">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div
                aria-hidden
                className="grid h-10 w-10 place-items-center rounded-xl border border-border/60 bg-bg/35 text-fg transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-rotate-2 group-hover:scale-[1.04] motion-reduce:transition-none"
              >
                {icon}
              </div>
              <CardTitle className="text-base">{title}</CardTitle>
            </div>
            <CardDescription className="mt-2">{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-fg">
            {bullets.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span aria-hidden className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/60 bg-muted/35">
                  <IconCheck className="h-3.5 w-3.5 text-fg/90" strokeWidth={2} />
                </span>
                <span className="pt-0.5">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </GradientBorder>
  );
}

function ProjectTile({
  title,
  subtitle,
  service,
  tint,
  size,
}: {
  title: string;
  subtitle: string;
  service: string;
  tint: Tint;
  size: 'lg' | 'md' | 'sm';
}) {
  const hue =
    tint === 'primary'
      ? '[background:radial-gradient(90%_70%_at_20%_0%,rgba(59,130,246,0.22),transparent_62%),radial-gradient(70%_60%_at_100%_0%,rgba(99,102,241,0.14),transparent_64%)]'
      : '[background:radial-gradient(90%_70%_at_20%_0%,rgba(99,102,241,0.24),transparent_62%),radial-gradient(70%_60%_at_100%_0%,rgba(59,130,246,0.12),transparent_64%)]';

  const span =
    size === 'lg'
      ? 'col-span-12 md:col-span-7'
      : size === 'md'
        ? 'col-span-12 md:col-span-5'
        : 'col-span-12 md:col-span-4';

  return (
    <RevealItem className={span}>
      <GradientBorder tint={tint}>
        <HoverLift>
          <Card className="group relative overflow-hidden rounded-2xl bg-card/45 supports-[backdrop-filter]:bg-card/35 hover:translate-y-0 hover:scale-100">
            <div aria-hidden className={cx('pointer-events-none absolute inset-0 opacity-100', hue)} />
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:opacity-100 motion-reduce:transition-none [background:radial-gradient(60%_60%_at_50%_50%,rgba(255,255,255,0.08),transparent_62%)]" />
            <div className="relative px-5 pb-5 pt-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-fg">{title}</p>
                <Badge variant="neutral">Ejemplo</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-fg">{subtitle}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs text-muted-fg">
                  Servicio: <span className="text-fg">{service}</span>
                </p>
                <span className="text-xs text-muted-fg">Caso (placeholder)</span>
              </div>
            </div>
          </Card>
        </HoverLift>
      </GradientBorder>
    </RevealItem>
  );
}

function Metric({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/35 px-5 py-5 backdrop-blur">
      <div className="font-display text-3xl text-fg">
        <AnimatedNumber value={value} suffix={suffix} durationMs={1350} />
      </div>
      <p className="mt-2 text-sm text-muted-fg">{label}</p>
    </div>
  );
}

function CourseCard({ course }: { course: CourseListItem }) {
  const instructorName = course.instructor.fullName?.trim() || course.instructor.username;
  const courseInitial = course.title.trim().slice(0, 1).toUpperCase();
  const categoryLabel = course.category?.name?.trim() ? course.category.name.trim() : 'KODIRA';

  return (
    <Link
      href={`/courses/${course.slug}`}
      className={cx(
        'group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        'transition-[opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]',
        'motion-reduce:transition-none',
      )}
    >
      <GradientBorder tint="primary">
        <HoverLift>
          <Card className="h-full rounded-2xl bg-card/45 supports-[backdrop-filter]:bg-card/35 hover:translate-y-0 hover:scale-100">
            <div className="relative overflow-hidden rounded-t-2xl border-b border-border/60 bg-card/30">
              <div
                aria-hidden
                className="absolute inset-0 opacity-95 [background:radial-gradient(80%_70%_at_15%_15%,rgba(59,130,246,0.26),transparent_55%),radial-gradient(70%_60%_at_85%_0%,rgba(99,102,241,0.22),transparent_60%)]"
              />
              <div className="relative flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-border/60 bg-bg/35">
                    <span className="font-display text-base text-fg">{courseInitial || 'K'}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-fg/90">{categoryLabel}</p>
                    <p className="truncate text-[11px] text-muted-fg">{instructorName}</p>
                  </div>
                </div>
                <Badge variant={course.isFree ? 'ok' : 'neutral'}>{course.isFree ? 'Gratis' : 'Pro'}</Badge>
              </div>
            </div>

            <CardHeader className="items-start">
              <div className="min-w-0">
                <CardTitle className="text-base">{course.title}</CardTitle>
                <CardDescription className="mt-1">
                  {course.shortDescription?.trim() ? course.shortDescription.trim() : 'Sin descripción.'}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {course.category ? <Badge variant="neutral">{course.category.name}</Badge> : <Badge variant="neutral">Sin categoría</Badge>}
              </div>
              <div className="text-xs text-muted-fg">
                <span className="text-fg">{instructorName}</span>
                <span className="px-2 text-border/80">|</span>
                <span>{course.metrics.lessonCount} lecciones</span>
                <span className="px-2 text-border/80">|</span>
                <span>{course.metrics.durationHours}h</span>
              </div>
            </CardContent>
          </Card>
        </HoverLift>
      </GradientBorder>
    </Link>
  );
}

export default function HomePage() {
  const reduce = usePrefersReducedMotion();
  const [session, setSession] = React.useState<SessionState>('checking');
  const [newsletter, setNewsletter] = React.useState<FormState>({ status: 'idle' });
  const [newsletterEmail, setNewsletterEmail] = React.useState('');
  const [contact, setContact] = React.useState<FormState>({ status: 'idle' });
  const [contactValues, setContactValues] = React.useState({
    fullName: '',
    email: '',
    service: 'Desarrollo Web',
    message: '',
  });

  const featured = useCoursesQuery({ page: 1, limit: 4, sort: 'popular' });

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const api = getKodiraApiClient();
        await api.users.getMe();
        if (cancelled) return;
        setSession('authed');
      } catch (err) {
        if (cancelled) return;
        const status = getApiStatus(err);
        setSession(status === 401 ? 'guest' : 'guest');
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const onNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = newsletterEmail.trim().toLowerCase();
    if (!normalized) {
      setNewsletter({ status: 'error', message: 'Introduce un email.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setNewsletter({ status: 'error', message: 'Ese email no parece válido.' });
      return;
    }
    setNewsletter({ status: 'submitting' });
    window.setTimeout(() => {
      setNewsletter({ status: 'success' });
    }, 420);
  };

  const onContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactValues.fullName.trim()) {
      setContact({ status: 'error', message: 'Dinos tu nombre.' });
      return;
    }
    const normalized = contactValues.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setContact({ status: 'error', message: 'Ese email no parece válido.' });
      return;
    }
    if (contactValues.message.trim().length < 10) {
      setContact({ status: 'error', message: 'Cuéntanos un poco más (mínimo 10 caracteres).' });
      return;
    }
    setContact({ status: 'submitting' });
    window.setTimeout(() => {
      setContact({ status: 'success' });
    }, 620);
  };

  const services = [
    {
      key: 'web',
      title: 'Desarrollo Web',
      description: 'Productos web modernos con foco en rendimiento, SEO y mantenimiento.',
      icon: <IconWorld className="h-5 w-5" strokeWidth={1.6} />,
      bullets: ['Next.js + TypeScript', 'Dashboards y APIs', 'Performance y accesibilidad'],
      tint: 'primary' as const,
    },
    {
      key: 'mobile',
      title: 'Desarrollo Mobile',
      description: 'Apps nativas o multiplataforma, diseño de UX y ciclos de entrega claros.',
      icon: <IconDeviceMobile className="h-5 w-5" strokeWidth={1.6} />,
      bullets: ['UX y offline', 'Integraciones y auth', 'Publicación y soporte'],
      tint: 'violet' as const,
    },
    {
      key: 'odoo',
      title: 'Odoo ERP',
      description: 'Consultoría e implementación completa. Procesos, módulos y datos.',
      icon: <IconStack2 className="h-5 w-5" strokeWidth={1.6} />,
      bullets: ['CRM, ventas, compras', 'Inventario y manufactura', 'Contabilidad y RRHH'],
      tint: 'violet' as const,
    },
    {
      key: 'games',
      title: 'Videojuegos (Unity)',
      description: 'Prototipos, producción y despliegue con un pipeline práctico.',
      icon: <IconDeviceGamepad2 className="h-5 w-5" strokeWidth={1.6} />,
      bullets: ['Gameplay y UI', 'Optimización', 'Builds y publicación'],
      tint: 'primary' as const,
    },
  ];

  const projects = [
    { title: 'Atlas Retail', subtitle: 'E-commerce B2C con panel de operaciones.', service: 'Desarrollo Web', tint: 'primary' as const, size: 'lg' as const },
    { title: 'Odoo LATAM Suite', subtitle: 'Implementación Odoo con localización regional.', service: 'Odoo ERP', tint: 'violet' as const, size: 'md' as const },
    { title: 'RutaPro', subtitle: 'App de logística con modo offline.', service: 'Desarrollo Mobile', tint: 'violet' as const, size: 'sm' as const },
    { title: 'Forge Arena', subtitle: 'Juego competitivo con builds multiplataforma.', service: 'Videojuegos (Unity)', tint: 'primary' as const, size: 'sm' as const },
    { title: 'Nexo Health', subtitle: 'Portal y agenda médica con integraciones.', service: 'Desarrollo Web', tint: 'primary' as const, size: 'md' as const },
    { title: 'Kiosk Companion', subtitle: 'App interna para equipos en campo.', service: 'Desarrollo Mobile', tint: 'violet' as const, size: 'sm' as const },
  ];

  const team = [
    { name: 'Christian Lanza', role: 'Fundador', bio: 'Desarrollo web, mobile y videojuegos con Unity.', initials: 'CL', tint: 'primary' as const },
    { name: 'Jhuliana Delgado', role: 'Ingeniera en Sistemas', bio: 'Especialista en Odoo ERP y transformación digital. +20 años.', initials: 'JD', tint: 'violet' as const },
    { name: 'Boris Silva', role: 'Consultor Senior Odoo', bio: 'Implementación y despliegue Odoo en LATAM. APIs, facturación electrónica y localización regional. +25 años.', initials: 'BS', tint: 'primary' as const },
  ];

  const navMarkerRef = React.useRef<HTMLDivElement | null>(null);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const el = navMarkerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setScrolled(!entry.isIntersecting);
      },
      { threshold: 1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const heroSpotlightRef = React.useRef<HTMLDivElement | null>(null);
  const heroSpotlightTarget = React.useRef({ x: 860, y: 210 });
  const heroSpotlightCurrent = React.useRef({ x: 860, y: 210 });

  const onHeroPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reduce) return;
    if (e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    heroSpotlightTarget.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  React.useEffect(() => {
    if (reduce) return;
    heroSpotlightTarget.current = { x: 860, y: 210 };
    heroSpotlightCurrent.current = { x: 860, y: 210 };

    let raf = 0;
    const loop = () => {
      const el = heroSpotlightRef.current;
      if (!el) return;
      const t = heroSpotlightTarget.current;
      const c = heroSpotlightCurrent.current;
      const nx = c.x + (t.x - c.x) * 0.14;
      const ny = c.y + (t.y - c.y) * 0.14;
      heroSpotlightCurrent.current = { x: nx, y: ny };
      el.style.transform = `translate3d(${nx}px, ${ny}px, 0) translate3d(-50%, -50%, 0)`;
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [reduce]);

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-bg px-4 pb-20 pt-24 sm:px-6">
      <div ref={navMarkerRef} aria-hidden className="pointer-events-none absolute left-0 top-2 h-px w-px" />
      <Atmosphere />
      <NoiseOverlay />
      <ScrollAwareNav session={session} scrolled={scrolled} />

      <div className="absolute inset-0">
        <Aurora intensity={0.62} />
      </div>

      <div className="relative mx-auto w-full max-w-6xl">
        <section
          className="relative grid min-h-[92dvh] gap-10 pb-14 pt-10 md:grid-cols-[1.05fr_0.95fr] md:items-center md:pt-12"
          onPointerMove={onHeroPointerMove}
        >
          <div
            ref={heroSpotlightRef}
            aria-hidden
            className="pointer-events-none absolute -inset-10 opacity-70"
          >
            <div className="h-[680px] w-[680px] rounded-full [background:radial-gradient(circle_at_center,rgba(59,130,246,0.16),transparent_62%)] blur-[26px]" />
          </div>

          <Reveal className="relative" stagger={0.095}>
            <RevealItem>
              <p className="font-mono text-xs tracking-wide text-muted-fg">Estudio de desarrollo de software</p>
            </RevealItem>
            <RevealItem>
              <h1 className="mt-4 font-display text-4xl leading-[1.06] text-fg sm:text-5xl lg:text-6xl">
                Construimos{' '}
                <span className="bg-gradient-to-r from-primary via-violet to-primary bg-clip-text text-transparent">
                  software
                </span>{' '}
                a medida, con estándar de producto.
              </h1>
            </RevealItem>
            <RevealItem>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-fg">
                Web, mobile, Odoo ERP y Unity. Equipo senior, ejecución por hitos, calidad medible.
              </p>
            </RevealItem>
            <RevealItem>
              <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  asChild
                  className="sm:w-auto bg-gradient-to-r from-primary to-violet shadow-[0_18px_60px_rgba(59,130,246,0.25)] hover:opacity-100 hover:shadow-[0_22px_70px_rgba(99,102,241,0.22)] hover:scale-[1.02] active:scale-[0.99]"
                >
                  <a href="#contact">Cuéntanos tu proyecto</a>
                </Button>
                <Button asChild variant="secondary" className="sm:w-auto">
                  <Link href="/courses">Ver cursos</Link>
                </Button>
                {session === 'checking' ? (
                  <Skeleton className="h-10 w-44 rounded-md" />
                ) : session === 'authed' ? (
                  <Link
                    href="/dashboard"
                    className="rounded-md text-sm text-fg/90 underline decoration-border/60 underline-offset-4 transition-opacity duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
                  >
                    Ir a mi dashboard
                  </Link>
                ) : null}
              </div>
            </RevealItem>
            <RevealItem>
              <div className="mt-7 flex flex-wrap gap-2">
                <Badge variant="neutral">Presupuesto a medida</Badge>
                <Badge variant="neutral">Entrega por hitos</Badge>
                <Badge variant="neutral">Stack moderno</Badge>
              </div>
            </RevealItem>
          </Reveal>

          <Reveal className="relative">
            <RevealItem className="relative">
              <Spotlight />
              <div className="relative">
                <GradientBorder tint="primary" className="shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
                  <HoverLift>
                    <Card className="relative overflow-hidden rounded-2xl bg-card/40 supports-[backdrop-filter]:bg-card/30 hover:translate-y-0 hover:scale-100">
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-95 [background:radial-gradient(90%_80%_at_10%_10%,rgba(59,130,246,0.22),transparent_62%),radial-gradient(70%_60%_at_92%_0%,rgba(99,102,241,0.18),transparent_62%)]"
                      />
                      <div className="relative grid gap-3 p-4 sm:p-6">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-border/60 bg-bg/30 px-4 py-4">
                            <p className="text-xs font-medium text-fg">Web</p>
                            <p className="mt-1 text-xs text-muted-fg">Next.js, performance, SEO</p>
                          </div>
                          <div className="rounded-2xl border border-border/60 bg-bg/30 px-4 py-4">
                            <p className="text-xs font-medium text-fg">Mobile</p>
                            <p className="mt-1 text-xs text-muted-fg">Apps nativas y multiplataforma</p>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-border/60 bg-bg/30 px-4 py-4">
                            <p className="text-xs font-medium text-fg">Odoo ERP</p>
                            <p className="mt-1 text-xs text-muted-fg">Implementación y consultoría</p>
                          </div>
                          <div className="rounded-2xl border border-border/60 bg-bg/30 px-4 py-4">
                            <p className="text-xs font-medium text-fg">Unity</p>
                            <p className="mt-1 text-xs text-muted-fg">Videojuegos y experiencias</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </HoverLift>
                </GradientBorder>
              </div>
            </RevealItem>
          </Reveal>

          <div
            aria-hidden
            className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 items-center md:flex"
          >
            <span className={cx(
              'scroll-indicator grid h-8 w-8 place-items-center rounded-full border border-border/60 bg-muted/25',
              reduce && 'motion-reduce:animate-none',
            )}>
              <IconArrowDown className="h-4 w-4 text-fg/90" />
            </span>
          </div>
        </section>

        <TechMarquee />

        <section id="services" className="relative py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(70%_120%_at_20%_0%,rgba(59,130,246,0.08),transparent_60%),radial-gradient(60%_80%_at_90%_60%,rgba(99,102,241,0.06),transparent_55%)]"
          />
          <Reveal>
            <RevealItem>
              <SectionHeader
                title="Servicios"
                description="El negocio principal es construir productos. La academia existe como brazo secundario."
                right={
                  <Button asChild variant="secondary">
                    <a href="#contact">Cuéntanos tu proyecto</a>
                  </Button>
                }
              />
            </RevealItem>
          </Reveal>

          <Reveal className="mt-10 grid grid-cols-12 gap-4">
            <RevealItem className="col-span-12 md:col-span-7">
              <ServiceCard
                tint="primary"
                icon={<IconWorld className="h-5 w-5" strokeWidth={1.6} />}
                title="Desarrollo Web"
                description="Next.js 14, TypeScript y entrega con foco en performance y mantenimiento."
                bullets={['Arquitectura limpia', 'SEO y Core Web Vitals', 'Paneles internos y producto']}
              />
            </RevealItem>
            <RevealItem className="col-span-12 md:col-span-5">
              <ServiceCard
                tint="violet"
                icon={<IconDeviceMobile className="h-5 w-5" strokeWidth={1.6} />}
                title="Desarrollo Mobile"
                description="Apps rápidas, con UX cuidada. Integraciones, auth y publicación."
                bullets={['Offline y sincronización', 'Push y analytics', 'Release y soporte']}
              />
            </RevealItem>
            <RevealItem className="col-span-12 md:col-span-5">
              <ServiceCard
                tint="violet"
                icon={<IconStack2 className="h-5 w-5" strokeWidth={1.6} />}
                title="Odoo ERP"
                description="Diagnóstico, implementación, personalización y despliegue en LATAM."
                bullets={['CRM, ventas, compras', 'Inventario y manufactura', 'Contabilidad y RRHH']}
              />
            </RevealItem>
            <RevealItem className="col-span-12 md:col-span-7">
              <ServiceCard
                tint="primary"
                icon={<IconDeviceGamepad2 className="h-5 w-5" strokeWidth={1.6} />}
                title="Videojuegos (Unity)"
                description="Prototipos a producción con un pipeline claro y rendimiento real."
                bullets={['Gameplay y UI', 'Optimización', 'Builds multiplataforma']}
              />
            </RevealItem>
          </Reveal>
        </section>

        <section className="py-16">
          <Reveal>
            <RevealItem>
              <SectionHeader
                title="Señales de seniority"
                description="Pocas promesas. Mucha ejecución. Lo medible primero."
              />
            </RevealItem>
          </Reveal>
          <Reveal className="mt-8 grid gap-4 md:grid-cols-3">
            <RevealItem>
              <Metric label="Años combinados en Odoo (mínimo)" value={45} suffix="+" />
            </RevealItem>
            <RevealItem>
              <Metric label="Líneas de servicio activas" value={4} suffix="" />
            </RevealItem>
            <RevealItem>
              <Metric label="Cadencia de demo" value={1} suffix=" semana" />
            </RevealItem>
          </Reveal>
        </section>

        <section id="work" className="relative py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-80 [background:radial-gradient(70%_120%_at_60%_0%,rgba(99,102,241,0.08),transparent_62%),radial-gradient(60%_90%_at_10%_70%,rgba(59,130,246,0.06),transparent_58%)]"
          />
          <Reveal>
            <RevealItem>
              <SectionHeader
                title="Portafolio"
                description="Proyectos de ejemplo, sustituibles. Representan cada servicio."
                right={
                  <Button asChild variant="secondary">
                    <a href="#contact">Cuéntanos tu proyecto</a>
                  </Button>
                }
              />
            </RevealItem>
          </Reveal>
          <Reveal className="mt-10 grid grid-cols-12 gap-4">
            {projects.map((p) => (
              <ProjectTile
                key={p.title}
                title={p.title}
                subtitle={p.subtitle}
                service={p.service}
                tint={p.tint}
                size={p.size}
              />
            ))}
          </Reveal>
        </section>

        <section id="team" className="relative py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(70%_100%_at_15%_20%,rgba(59,130,246,0.06),transparent_60%),radial-gradient(60%_90%_at_80%_0%,rgba(99,102,241,0.07),transparent_55%)]"
          />
          <Reveal>
            <RevealItem>
              <SectionHeader
                title="Equipo"
                description="Trabajo directo con perfiles senior. Sin capas innecesarias."
              />
            </RevealItem>
          </Reveal>

          <Reveal className="mt-10 grid gap-4 md:grid-cols-3">
            {team.map((member) => {
              const tint = member.tint;
              const ring =
                tint === 'primary'
                  ? 'bg-gradient-to-br from-primary/40 via-border/25 to-violet/25'
                  : 'bg-gradient-to-br from-violet/40 via-border/25 to-primary/25';

              return (
                <RevealItem key={member.name}>
                  <GradientBorder tint={tint}>
                    <HoverLift>
                      <Card className="group relative overflow-hidden rounded-2xl bg-card/45 supports-[backdrop-filter]:bg-card/35 hover:translate-y-0 hover:scale-100">
                        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-85 [background:radial-gradient(90%_70%_at_20%_0%,rgba(255,255,255,0.06),transparent_60%)]" />
                        <CardHeader className="items-start">
                          <div className="flex items-start gap-3">
                            <div className={cx('rounded-2xl p-px', ring)}>
                              <div className="grid h-12 w-12 place-items-center rounded-[calc(theme(borderRadius.2xl)-1px)] border border-border/60 bg-bg/35">
                                <span className="font-mono text-sm text-fg">{member.initials}</span>
                              </div>
                            </div>
                            <div className="min-w-0">
                              <CardTitle className="text-base">{member.name}</CardTitle>
                              <CardDescription className="mt-1">{member.role}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm leading-relaxed text-muted-fg">{member.bio}</p>
                        </CardContent>
                      </Card>
                    </HoverLift>
                  </GradientBorder>
                </RevealItem>
              );
            })}
          </Reveal>
        </section>

        <section id="academy" className="py-16">
          <Reveal>
            <RevealItem>
              <SectionHeader
                title="Academia"
                description="También formamos developers. Cursos destacados desde el backend real."
                right={
                  <Button asChild variant="secondary">
                    <Link href="/courses">Ver todos los cursos</Link>
                  </Button>
                }
              />
            </RevealItem>
          </Reveal>

          <div className="mt-10">
            {featured.isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="rounded-2xl">
                    <CardHeader>
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-56" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Skeleton className="h-6 w-24 rounded-full" />
                      <Skeleton className="h-4 w-40" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : featured.isError ? (
              <Card className="rounded-2xl">
                <CardHeader>
                  <div>
                    <CardTitle>No se pudieron cargar los cursos</CardTitle>
                    <CardDescription>Verifica la API y vuelve a intentar.</CardDescription>
                  </div>
                  <Badge variant="danger">Error</Badge>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => featured.refetch()}>
                    Reintentar
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href="/courses">Ir a /courses</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : !featured.data || featured.data.items.length === 0 ? (
              <Card className="rounded-2xl">
                <CardHeader>
                  <div>
                    <CardTitle>Sin cursos publicados</CardTitle>
                    <CardDescription>Cuando haya cursos, se verán aquí sin inventar contenido.</CardDescription>
                  </div>
                  <Badge variant="neutral">Vacío</Badge>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button asChild variant="secondary">
                    <Link href="/courses">Explorar cursos</Link>
                  </Button>
                  <Button asChild variant="ghost">
                    <a href="#contact">Pedir formación in-company</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Reveal className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {featured.data.items.map((course) => (
                  <RevealItem key={course.id}>
                    <CourseCard course={course} />
                  </RevealItem>
                ))}
              </Reveal>
            )}
          </div>
        </section>

        <section className="py-16">
          <Reveal>
            <RevealItem>
              <SectionHeader
                title="Comunidad y KODI"
                description="Lo estamos preparando. Se marca como próximamente, sin prometer fechas."
              />
            </RevealItem>
          </Reveal>
          <Reveal className="mt-10 grid gap-4 md:grid-cols-2">
            <RevealItem>
              <GradientBorder tint="violet">
                <HoverLift>
                  <Card className="rounded-2xl bg-card/45 supports-[backdrop-filter]:bg-card/35 hover:translate-y-0 hover:scale-100">
                    <CardHeader>
                      <div>
                        <CardTitle>Comunidad</CardTitle>
                        <CardDescription>Espacio para compartir progreso y resolver bloqueos.</CardDescription>
                      </div>
                      <Badge variant="neutral">Próximamente</Badge>
                    </CardHeader>
                  </Card>
                </HoverLift>
              </GradientBorder>
            </RevealItem>
            <RevealItem>
              <GradientBorder tint="primary">
                <HoverLift>
                  <Card className="rounded-2xl bg-card/45 supports-[backdrop-filter]:bg-card/35 hover:translate-y-0 hover:scale-100">
                    <CardHeader>
                      <div>
                        <CardTitle>KODI</CardTitle>
                        <CardDescription>Asistente IA conectado al ecosistema.</CardDescription>
                      </div>
                      <Badge variant="neutral">Próximamente</Badge>
                    </CardHeader>
                  </Card>
                </HoverLift>
              </GradientBorder>
            </RevealItem>
          </Reveal>
        </section>

        <section id="contact" className="py-16">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="space-y-4">
              <SectionHeader
                title="Hablemos de tu proyecto"
                description="Cuéntanos el tipo de servicio y el contexto. Confirmamos recepción aquí mismo."
              />
              <GradientBorder tint="primary">
                <Card className="rounded-2xl bg-card/45 supports-[backdrop-filter]:bg-card/35">
                  <CardContent className="pt-5">
                    <form onSubmit={onContactSubmit} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-sm text-fg" htmlFor="contact-name">
                            Nombre
                          </label>
                          <Input
                            id="contact-name"
                            value={contactValues.fullName}
                            onChange={(e) => setContactValues((prev) => ({ ...prev, fullName: e.target.value }))}
                            autoComplete="name"
                            disabled={contact.status === 'submitting' || contact.status === 'success'}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm text-fg" htmlFor="contact-email">
                            Email
                          </label>
                          <Input
                            id="contact-email"
                            type="email"
                            value={contactValues.email}
                            onChange={(e) => setContactValues((prev) => ({ ...prev, email: e.target.value }))}
                            autoComplete="email"
                            inputMode="email"
                            disabled={contact.status === 'submitting' || contact.status === 'success'}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm text-fg" htmlFor="contact-service">
                          Tipo de servicio
                        </label>
                        <select
                          id="contact-service"
                          className={cx(
                            'h-10 w-full rounded-md border border-border/70 bg-muted/40 px-3 text-sm text-fg',
                            'transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-0',
                            'motion-reduce:transition-none',
                          )}
                          value={contactValues.service}
                          onChange={(e) => setContactValues((prev) => ({ ...prev, service: e.target.value }))}
                          disabled={contact.status === 'submitting' || contact.status === 'success'}
                        >
                          {services.map((s) => (
                            <option key={s.key} value={s.title}>
                              {s.title}
                            </option>
                          ))}
                          <option value="Otro">Otro</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm text-fg" htmlFor="contact-message">
                          Mensaje
                        </label>
                        <textarea
                          id="contact-message"
                          className={cx(
                            'min-h-28 w-full resize-none rounded-md border border-border/70 bg-muted/40 px-3 py-2 text-sm text-fg',
                            'transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-0',
                            'motion-reduce:transition-none',
                          )}
                          value={contactValues.message}
                          onChange={(e) => setContactValues((prev) => ({ ...prev, message: e.target.value }))}
                          disabled={contact.status === 'submitting' || contact.status === 'success'}
                        />
                        <p className="text-xs text-muted-fg">No se envía al backend todavía. Solo confirmamos recepción.</p>
                      </div>

                      {contact.status === 'error' ? (
                        <p className="text-sm text-danger-fg" role="status" aria-live="polite">
                          {contact.message}
                        </p>
                      ) : contact.status === 'success' ? (
                        <p className="text-sm text-success-fg" role="status" aria-live="polite">
                          Recibido. Te responderemos al email indicado.
                        </p>
                      ) : null}

                      <div className="flex flex-wrap gap-2">
                        <Button type="submit" disabled={contact.status === 'submitting' || contact.status === 'success'}>
                          {contact.status === 'submitting'
                            ? 'Enviando...'
                            : contact.status === 'success'
                              ? 'Enviado'
                              : 'Enviar'}
                        </Button>
                        <Button asChild variant="secondary" disabled={contact.status === 'submitting'}>
                          <a href="#services">Ver servicios</a>
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </GradientBorder>
            </div>

            <Reveal>
              <RevealItem>
                <GradientBorder tint="violet">
                  <HoverLift>
                    <Card className="rounded-2xl bg-card/45 supports-[backdrop-filter]:bg-card/35 hover:translate-y-0 hover:scale-100">
                      <CardHeader className="items-start">
                        <div>
                          <CardTitle className="text-base">Qué incluye</CardTitle>
                          <CardDescription>Para responderte más rápido.</CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-muted-fg">
                        {[
                          'Objetivo, público y fecha objetivo.',
                          'Integraciones necesarias (pagos, APIs, ERP, auth).',
                          'Si ya hay diseño, código o infraestructura existente.',
                        ].map((line) => (
                          <div key={line} className="flex items-start gap-2">
                            <span aria-hidden className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/60 bg-muted/35">
                              <IconCheck className="h-3.5 w-3.5 text-fg/90" strokeWidth={2} />
                            </span>
                            <p className="pt-0.5">{line}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </HoverLift>
                </GradientBorder>
              </RevealItem>
            </Reveal>
          </div>
        </section>

        <footer className="pt-16">
          <GradientBorder tint="primary" className="shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
            <Card className="relative overflow-hidden rounded-2xl bg-card/45 supports-[backdrop-filter]:bg-card/35">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-100 [background:radial-gradient(90%_70%_at_0%_0%,rgba(59,130,246,0.22),transparent_62%),radial-gradient(70%_60%_at_100%_0%,rgba(99,102,241,0.18),transparent_64%)]"
              />
              <div className="relative grid gap-4 px-6 py-8 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="font-display text-2xl text-fg">¿Listo para construir?</p>
                  <p className="mt-2 max-w-[60ch] text-sm text-muted-fg">
                    Te respondemos con un plan claro: alcance, hitos y la primera propuesta técnica.
                  </p>
                </div>
                <Button
                  asChild
                  className="w-full md:w-auto bg-gradient-to-r from-primary to-violet shadow-[0_18px_60px_rgba(59,130,246,0.25)] hover:opacity-100 hover:shadow-[0_22px_70px_rgba(99,102,241,0.22)] hover:scale-[1.02] active:scale-[0.99]"
                >
                  <a href="#contact" className="inline-flex items-center gap-2">
                    Cuéntanos tu proyecto
                    <IconArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </Card>
          </GradientBorder>

          <div className="mt-10">
            <Separator />
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="space-y-2">
              <p className="font-display text-lg text-fg">KODIRA</p>
              <p className="text-sm text-muted-fg">Estudio de desarrollo de software y academia. Servicios primero, formación como brazo secundario.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-fg">Enlaces</p>
                <div className="flex flex-col items-start gap-1">
                  <a className="text-fg/90 hover:opacity-90" href="#services">
                    Servicios
                  </a>
                  <a className="text-fg/90 hover:opacity-90" href="#work">
                    Portafolio
                  </a>
                  <a className="text-fg/90 hover:opacity-90" href="#team">
                    Equipo
                  </a>
                  <Link className="text-fg/90 hover:opacity-90" href="/courses">
                    Cursos
                  </Link>
                  <a className="text-fg/90 hover:opacity-90" href="#contact">
                    Contacto
                  </a>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-fg">Servicios</p>
                <div className="flex flex-col items-start gap-1">
                  <a className="text-fg/90 hover:opacity-90" href="#services">
                    Web
                  </a>
                  <a className="text-fg/90 hover:opacity-90" href="#services">
                    Mobile
                  </a>
                  <a className="text-fg/90 hover:opacity-90" href="#services">
                    Odoo ERP
                  </a>
                  <a className="text-fg/90 hover:opacity-90" href="#services">
                    Unity
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-fg">Novedades</p>
              <form onSubmit={onNewsletterSubmit} className="space-y-2">
                <div className="space-y-1.5">
                  <label className="text-sm text-fg" htmlFor="newsletter-email">
                    Email
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="newsletter-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      disabled={newsletter.status === 'submitting' || newsletter.status === 'success'}
                    />
                    <Button type="submit" disabled={newsletter.status === 'submitting' || newsletter.status === 'success'}>
                      {newsletter.status === 'success' ? 'Listo' : 'Apuntarme'}
                    </Button>
                  </div>
                </div>

                {newsletter.status === 'error' ? (
                  <p className="text-sm text-danger-fg" role="status" aria-live="polite">
                    {newsletter.message}
                  </p>
                ) : newsletter.status === 'success' ? (
                  <p className="text-sm text-success-fg" role="status" aria-live="polite">
                    Recibido. Te avisaremos.
                  </p>
                ) : (
                  <p className="text-xs text-muted-fg">Guardado local por ahora. Lo conectamos al backend más adelante.</p>
                )}
              </form>
            </div>
          </div>

          <p className="mt-10 text-xs text-muted-fg">© {new Date().getFullYear()} KODIRA</p>
        </footer>
      </div>
    </main>
  );
}

