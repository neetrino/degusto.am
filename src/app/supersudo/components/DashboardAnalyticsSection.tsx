'use client';

import { Card } from '@shop/ui';
import { formatCurrency } from '../utils/dashboardUtils';

interface Stats {
  users: { total: number };
  products: { total: number; lowStock: number };
  orders: { total: number; recent: number; pending: number };
  revenue: { total: number; currency: string };
}

interface RecentOrder {
  total: number;
  createdAt: string;
}

interface DashboardAnalyticsSectionProps {
  stats: Stats | null;
  recentOrders: RecentOrder[];
  loading: boolean;
}

interface TrendPoint {
  label: string;
  value: number;
}

interface SegmentItem {
  label: string;
  color: string;
  value: number;
}

function buildTrendPoints(recentOrders: RecentOrder[]): TrendPoint[] {
  const now = new Date();
  const points: TrendPoint[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    const dayTotal = recentOrders
      .filter((order) => order.createdAt.slice(0, 10) === key)
      .reduce((sum, order) => sum + order.total, 0);
    points.push({
      label: new Intl.DateTimeFormat('hy-AM', { month: 'short', day: 'numeric' }).format(date),
      value: dayTotal,
    });
  }
  return points;
}

function buildPath(points: TrendPoint[]): string {
  if (!points.length) {
    return '';
  }

  const maxValue = Math.max(...points.map((point) => point.value), 1);
  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 100 - (point.value / maxValue) * 80;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

function buildSegments(stats: Stats | null): SegmentItem[] {
  if (!stats) {
    return [
      { label: 'Ակտիվ պատվերներ', color: '#2f8a57', value: 42 },
      { label: 'Օգտատերեր', color: '#f3a548', value: 25 },
      { label: 'Ապրանքներ', color: '#9f7bd7', value: 15 },
      { label: 'Սպասման մեջ', color: '#79a5df', value: 10 },
      { label: 'Քիչ մնացորդ', color: '#f0ca59', value: 8 },
    ];
  }

  const items = [
    { label: 'Ակտիվ պատվերներ', color: '#2f8a57', value: stats.orders.recent || 1 },
    { label: 'Օգտատերեր', color: '#f3a548', value: stats.users.total || 1 },
    { label: 'Ապրանքներ', color: '#9f7bd7', value: stats.products.total || 1 },
    { label: 'Սպասման մեջ', color: '#79a5df', value: stats.orders.pending || 1 },
    { label: 'Քիչ մնացորդ', color: '#f0ca59', value: stats.products.lowStock || 1 },
  ];
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return items.map((item) => ({
    ...item,
    value: Math.max(1, Math.round((item.value / total) * 100)),
  }));
}

export function DashboardAnalyticsSection({ stats, recentOrders, loading }: DashboardAnalyticsSectionProps) {
  const trendPoints = buildTrendPoints(recentOrders);
  const maxValue = Math.max(...trendPoints.map((point) => point.value), 1);
  const avgOrderValue = stats && stats.orders.total > 0 ? stats.revenue.total / stats.orders.total : 0;
  const segments = buildSegments(stats);
  const donutBackground = `conic-gradient(${segments
    .map((segment, index) => {
      const start = segments.slice(0, index).reduce((sum, item) => sum + item.value, 0);
      const end = start + segment.value;
      return `${segment.color} ${start}% ${end}%`;
    })
    .join(', ')})`;

  return (
    <div className="grid grid-cols-1 gap-6 pb-8 xl:grid-cols-[1.15fr_1fr]">
      <Card className="rounded-2xl border border-[#e3e8e3] bg-[#f9fcf9] p-5 shadow-[0_8px_24px_rgba(24,46,34,0.06)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-[#1b3a2b]">
            <span className="text-[#2b8d64]">❦</span>
            Օգտատիրական ակտիվություն
          </h3>
          <button type="button" className="rounded-lg border border-[#dbe4dc] bg-white px-3 py-1.5 text-xs font-semibold text-[#446251]">
            7 օր
          </button>
        </div>

        {loading ? (
          <div className="h-[260px] animate-pulse rounded-xl bg-[#e1e7e2]" />
        ) : (
          <>
            <div className="relative h-[210px] rounded-xl border border-[#e6ece7] bg-white p-4">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                <path d={`${buildPath(trendPoints)} L 100 100 L 0 100 Z`} fill="rgba(47,138,87,0.18)" />
                <path d={buildPath(trendPoints)} fill="none" stroke="#2f8a57" strokeWidth="1.7" />
              </svg>
              <div className="mt-2 grid grid-cols-7 text-[10px] font-medium text-[#6e8074]">
                {trendPoints.map((point) => (
                  <span key={point.label} className="truncate text-center">
                    {point.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-[#e5ece7] bg-white p-3">
                <p className="text-xs font-semibold text-[#758679]">Ընդհանուր եկամուտ</p>
                <p className="mt-1 text-lg font-semibold text-[#1f2c24]">
                  {stats ? formatCurrency(stats.revenue.total, stats.revenue.currency) : 'AMD 0'}
                </p>
              </div>
              <div className="rounded-xl border border-[#e5ece7] bg-white p-3">
                <p className="text-xs font-semibold text-[#758679]">Ընդհանուր պատվերներ</p>
                <p className="mt-1 text-lg font-semibold text-[#1f2c24]">{stats?.orders.total ?? 0}</p>
              </div>
              <div className="rounded-xl border border-[#e5ece7] bg-white p-3">
                <p className="text-xs font-semibold text-[#758679]">Միջին պատվեր</p>
                <p className="mt-1 text-lg font-semibold text-[#1f2c24]">
                  {stats ? formatCurrency(avgOrderValue, stats.revenue.currency) : 'AMD 0'}
                </p>
              </div>
            </div>
          </>
        )}
      </Card>

      <Card className="rounded-2xl border border-[#e3e8e3] bg-[#f9fcf9] p-5 shadow-[0_8px_24px_rgba(24,46,34,0.06)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-[#1b3a2b]">Սեգմենտների բաշխում</h3>
          <button type="button" className="rounded-lg border border-[#dbe4dc] bg-white px-3 py-1.5 text-xs font-semibold text-[#446251]">
            Այս ամիս
          </button>
        </div>
        {loading ? (
          <div className="h-[260px] animate-pulse rounded-xl bg-[#e1e7e2]" />
        ) : (
          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="grid place-items-center rounded-xl border border-[#e6ece7] bg-white py-6">
              <div
                className="grid h-40 w-40 place-items-center rounded-full"
                style={{ background: donutBackground }}
              >
                <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center">
                  <span className="text-3xl font-bold text-[#1f2c24]">{stats?.orders.total ?? 0}</span>
                  <span className="text-xs font-medium text-[#6a7f72]">Պատվերներ</span>
                </div>
              </div>
            </div>
            <div className="space-y-3 rounded-xl border border-[#e6ece7] bg-white p-4">
              {segments.map((segment) => (
                <div key={segment.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-[#2d4638]">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
                    {segment.label}
                  </span>
                  <span className="font-semibold text-[#445c4e]">{segment.value}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
