import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { getStatusMeta, reservationStatusOrder } from '../lib/status';
import type { ReservationStatus } from '../lib/types';

export type ReservationStatusDatum = { name: ReservationStatus; value: number };

function DonutTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ReservationStatusDatum }> }) {
  if (!active || !payload?.[0]) return null;
  const item = payload[0].payload;
  const meta = getStatusMeta(item.name);
  return (
    <div className="chart-tooltip min-w-36 p-3 text-sm">
      <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.chartColor }} /><strong>{item.name}</strong></div>
      <p className="mt-1 text-xs text-muted">{item.value} {item.value === 1 ? 'reserva' : 'reservas'}</p>
    </div>
  );
}

export function ReservationStatusDonut({ data }: { data: ReservationStatusDatum[] }) {
  const ordered = reservationStatusOrder.map((status) => data.find((item) => item.name === status) ?? { name: status, value: 0 });
  const total = ordered.reduce((sum, item) => sum + item.value, 0);
  const chartData = total > 0 ? ordered.filter((item) => item.value > 0) : [{ name: 'Concluída' as const, value: 1 }];

  return (
    <figure aria-label={`Reservas por status. Total de ${total} reservas.`}>
      <div className="relative mx-auto h-52 max-w-xs sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 12, right: 20, bottom: 12, left: 20 }}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="86%"
              paddingAngle={total > 0 ? 2 : 0}
              stroke="var(--surface-elevated)"
              strokeWidth={3}
              isAnimationActive
            >
              {chartData.map((item) => <Cell key={item.name} fill={total > 0 ? getStatusMeta(item.name).chartColor : 'var(--line-strong)'} />)}
            </Pie>
            <RechartsTooltip content={<DonutTooltip />} allowEscapeViewBox={{ x: true, y: true }} wrapperStyle={{ zIndex: 20 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div><strong className="metric-value block text-3xl font-black">{total}</strong><span className="text-xs font-semibold text-muted">reservas</span></div>
        </div>
      </div>
      <figcaption className="mt-3 grid grid-cols-2 gap-2">
        {ordered.map((item) => {
          const meta = getStatusMeta(item.name);
          const percentage = total ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={item.name} className="flex min-w-0 items-center gap-2 rounded-lg border border-line bg-[var(--surface-1)] px-2.5 py-2 text-xs">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: meta.chartColor }} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate font-semibold">{item.name}</span>
              <strong className="metric-value">{item.value}</strong>
              <span className="w-8 text-right text-muted">{percentage}%</span>
            </div>
          );
        })}
      </figcaption>
    </figure>
  );
}
