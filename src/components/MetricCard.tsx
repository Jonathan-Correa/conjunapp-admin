import type { ReactNode } from "react";

type Props = {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
};

export function MetricCard({ label, value, hint, icon }: Props) {
  return (
    <section className="metric-card">
      <div className="metric-icon">{icon}</div>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{hint}</span>
    </section>
  );
}

