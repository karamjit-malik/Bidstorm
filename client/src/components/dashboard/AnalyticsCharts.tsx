import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { formatCurrency } from '../../utils/formatCurrency';

// Single-hue magnitude marks (brand indigo) — readable on light and dark
// surfaces. Grid/axis stay recessive; these charts are all single-series so no
// legend is needed (the card title names the measure).
const MARK = '#1a1815';
const MARK_SOFT = '#b6b1a8';
const AXIS = '#78726a';
const GRID = 'rgba(0,0,0,0.1)';

const axisTick = { fill: AXIS, fontSize: 12 };

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
      {children}
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.4)',
  background: 'rgba(15,23,42,0.92)',
  color: '#fff',
  fontSize: 12,
};

export function RevenueLineChart({ data }: { data: { date: string; revenue: number }[] }) {
  return (
    <ChartCard title="Revenue (last 14 days)">
      {data.length === 0 ? (
        <EmptyChart text="No completed sales yet." />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={{ stroke: GRID }} />
            <YAxis
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v) => [formatCurrency(Number(v)), 'Revenue']}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke={MARK}
              strokeWidth={2}
              dot={{ r: 3, fill: MARK }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function BidsByHourChart({ data }: { data: { hour: number; count: number }[] }) {
  const hasData = data.some((d) => d.count > 0);
  return (
    <ChartCard title="Bid activity by hour (UTC)">
      {!hasData ? (
        <EmptyChart text="No bids on your auctions yet." />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis
              dataKey="hour"
              tick={axisTick}
              tickLine={false}
              axisLine={{ stroke: GRID }}
              interval={2}
              tickFormatter={(h) => `${h}:00`}
            />
            <YAxis tick={axisTick} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: 'rgba(148,163,184,0.12)' }}
              contentStyle={tooltipStyle}
              formatter={(v) => [Number(v), 'Bids']}
              labelFormatter={(h) => `${h}:00–${Number(h) + 1}:00 UTC`}
            />
            <Bar dataKey="count" fill={MARK} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function CategoryBarChart({ data }: { data: { category: string; count: number }[] }) {
  return (
    <ChartCard title="Auctions by category">
      {data.length === 0 ? (
        <EmptyChart text="No auctions yet." />
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(160, data.length * 40)}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
          >
            <CartesianGrid stroke={GRID} horizontal={false} />
            <XAxis type="number" tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="category"
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              width={120}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148,163,184,0.12)' }}
              contentStyle={tooltipStyle}
              formatter={(v) => [Number(v), 'Auctions']}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={i === 0 ? MARK : MARK_SOFT} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

/** Simple single-hue category bar used on the admin overview. */
export function CountBarChart({
  title,
  data,
}: {
  title: string;
  data: { label: string; count: number }[];
}) {
  return (
    <ChartCard title={title}>
      {data.length === 0 ? (
        <EmptyChart text="No data." />
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(160, data.length * 38)}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
            <CartesianGrid stroke={GRID} horizontal={false} />
            <XAxis type="number" tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="label" tick={axisTick} tickLine={false} axisLine={false} width={110} />
            <Tooltip cursor={{ fill: 'rgba(148,163,184,0.12)' }} contentStyle={tooltipStyle} />
            <Bar dataKey="count" fill={MARK} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="grid h-[180px] place-items-center text-sm text-slate-400">{text}</div>
  );
}
