import type { ReactNode } from "react";

type Props = {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string | number | null;
  color?: string;
};

export function MetricCard({ title, value, icon, trend = null, color = "#176b5c" }: Props) {
  const hint =
    trend === null || trend === undefined || trend === ""
      ? null
      : String(trend);

  return (
    <section className="metric-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="metric-icon" style={{ color }}>
        {icon}
      </div>
      <p>{title}</p>
      <strong>{value}</strong>
      {hint ? <span>{hint}</span> : null}
    </section>
  );
}
