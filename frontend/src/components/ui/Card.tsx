/**
 * Surface container with optional title and subtitle.
 * Used on the dashboard, forms, health plan sections, diet meals, and medicine rows
 * so content sits in a consistent white card.
 */
import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, subtitle, children, className = '' }: CardProps) {
  return (
    <section className={`card ${className}`.trim()}>
      {(title || subtitle) && (
        <header className="card-header">
          {title ? <h2 className="card-title">{title}</h2> : null}
          {subtitle ? <p className="card-subtitle">{subtitle}</p> : null}
        </header>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}
