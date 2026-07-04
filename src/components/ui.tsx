import Image from "next/image";
import Link from "next/link";

const variants = {
  primary:
    "bg-sage-800 text-white hover:bg-sage-700 shadow-sm",
  secondary:
    "bg-white text-sage-800 border border-sage-200 hover:bg-sage-50",
  cedar:
    "bg-cedar-600 text-white hover:bg-cedar-500 shadow-sm",
};

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof variants;
  external?: boolean;
  className?: string;
};

export function Button({
  href,
  children,
  variant = "primary",
  external,
  className = "",
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-colors ${variants[variant]} ${className}`;

  if (external) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="border-b border-sage-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl tracking-tight text-sage-900 sm:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-sage-600">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export function PageHero({
  src,
  alt = "",
  title,
  subtitle,
  children,
}: {
  src: string;
  alt?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative min-h-[55vh] overflow-hidden">
      <Image src={src} alt={alt} fill className="object-cover" sizes="100vw" />
      <div className="absolute inset-0 bg-gradient-to-t from-sage-950/90 via-sage-950/30 to-sage-950/10" />
      <div className="relative mx-auto flex min-h-[55vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-24 text-white sm:px-6 sm:pb-24 sm:pt-32">
        <div className="max-w-3xl">
          <h1 className="font-display text-4xl tracking-tight text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-lg leading-relaxed text-sage-200 sm:text-xl">
              {subtitle}
            </p>
          )}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </div>
    </section>
  );
}

export function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`py-16 sm:py-20 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
    </section>
  );
}

export function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-10">
      <h2 className="font-display text-3xl tracking-tight text-sage-900 sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-sage-600">
          {subtitle}
        </p>
      )}
    </div>
  );
}
