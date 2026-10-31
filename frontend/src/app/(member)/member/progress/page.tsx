'use client';
import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { bodyMetricApi } from '@/services/body-metric.service';
import type { BodyMetric } from '@/services/types';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Scale,
  TrendingUp,
  Trash2,
  ChevronDown,
  ChevronUp,
  Ruler,
  Percent,
  CalendarDays,
  Info,
} from 'lucide-react';

/** Các chỉ số có thể ghi — thứ tự hiển thị trong form & biểu đồ */
const METRIC_DEFS = [
  { key: 'weightKg', label: 'Cân nặng', unit: 'kg', icon: Scale, min: 20, max: 300 },
  { key: 'waistCm', label: 'Vòng eo', unit: 'cm', icon: Ruler, min: 30, max: 250 },
  { key: 'bodyFatPercent', label: '% mỡ', unit: '%', icon: Percent, min: 1, max: 80 },
  { key: 'chestCm', label: 'Vòng ngực', unit: 'cm', icon: Ruler, min: 30, max: 250 },
  { key: 'armCm', label: 'Bắp tay', unit: 'cm', icon: Ruler, min: 10, max: 100 },
  { key: 'thighCm', label: 'Vòng đùi', unit: 'cm', icon: Ruler, min: 20, max: 150 },
] as const;

type MetricKey = (typeof METRIC_DEFS)[number]['key'];

/** Gợi ý cách đo — để người không chuyên biết làm thế nào */
const MEASURE_HINTS: Record<MetricKey, string> = {
  weightKg: 'Nên cân buổi sáng, sau khi đi vệ sinh, trước khi ăn, mặc ít đồ.',
  waistCm: 'Đo ngay rốn, đứng thẳng, thở ra tự nhiên — thước ôm sát nhưng không siết.',
  bodyFatPercent: 'Không bắt buộc. Chỉ ghi nếu bạn có máy đo; không có thì để trống.',
  chestCm: 'Đo quanh phần rộng nhất của ngực, thước song song sàn.',
  armCm: 'Tay thả lỏng dọc thân, đo phần to nhất của bắp tay.',
  thighCm: 'Đo phần to nhất của đùi, đứng phân bổ đều trọng lượng 2 chân.',
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmtNum = (n: number) => String(Number(n.toFixed(1)));

const fmtDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '--';

/** So sánh với 1 mốc: trả về text kèm mũi tên, màu trung tính (không phán tốt/xấu) */
const deltaText = (cur?: number, base?: number, unit = '') => {
  if (cur == null || base == null) return null;
  const d = Number((cur - base).toFixed(1));
  if (d === 0) return `Không đổi (${fmtNum(cur)} ${unit})`;
  return `${d > 0 ? '↑' : '↓'} ${fmtNum(Math.abs(d))} ${unit} (${fmtNum(base)} → ${fmtNum(cur)})`;
};

export default function MemberProgressPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['body-metrics-me'],
    queryFn: () => bodyMetricApi.listMine(120),
    retry: 0,
  });

  // ===== Form state =====
  const [date, setDate] = useState(todayStr());
  const [showMore, setShowMore] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [note, setNote] = useState('');

  const setField = (key: string, v: string) => {
    setFormValues((p) => ({ ...p, [key]: v }));
    setFormErrors((p) => ({ ...p, [key]: '' }));
    setFormError('');
  };

  const metrics = useMemo(() => data?.data || [], [data]);
  // Mới nhất trước (desc) — dùng cho form, biểu đồ, lịch sử
  const sorted = useMemo(
    () => [...metrics].sort((a, b) => (b.recordedAt || '').localeCompare(a.recordedAt || '')),
    [metrics],
  );
  // Cũ nhất trước (asc) — dùng cho biểu đồ & so sánh
  const asc = useMemo(() => [...sorted].reverse(), [sorted]);

  /** Giá trị gần nhất & lần đầu của 1 chỉ số */
  const latestOf = (k: MetricKey) =>
    asc
      .map((m) => m[k])
      .filter((v): v is number => v != null)
      .pop();
  const firstOf = (k: MetricKey) => asc.map((m) => m[k]).filter((v): v is number => v != null)[0];
  const countOf = (k: MetricKey) => asc.filter((m) => m[k] != null).length;

  // ===== Mutations =====
  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => bodyMetricApi.create(payload as any),
    onSuccess: (_, payload) => {
      const w = payload.weightKg as number | undefined;
      const desc = w != null ? deltaText(w, latestOf('weightKg'), 'kg') : undefined;
      toast.success(
        'Đã ghi số đo',
        desc ? `Cân nặng của bạn: ${desc}` : 'Bạn có thể xem biểu đồ bên dưới.',
      );
      qc.invalidateQueries({ queryKey: ['body-metrics-me'] });
      setFormValues({});
      setNote('');
      setFormError('');
      setDate(todayStr());
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message;
      setFormError(
        Array.isArray(msg) ? msg.join(', ') : msg || e?.message || 'Không ghi được số đo.',
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bodyMetricApi.remove(id),
    onSuccess: () => {
      toast.success('Đã xóa bản ghi');
      qc.invalidateQueries({ queryKey: ['body-metrics-me'] });
      setDeleteTarget(null);
    },
    onError: (e: any) =>
      toast.error(
        'Không xóa được',
        e?.response?.data?.message || e?.message || 'Vui lòng thử lại.',
      ),
  });

  const [deleteTarget, setDeleteTarget] = useState<BodyMetric | null>(null);

  const submit = () => {
    const payload: Record<string, unknown> = {};
    const errors: Record<string, string> = {};
    let filled = 0;

    for (const def of METRIC_DEFS) {
      const raw = (formValues[def.key] || '').trim();
      if (!raw) continue;
      const n = Number(raw);
      if (Number.isNaN(n)) {
        errors[def.key] = 'Nhập số hợp lệ';
      } else if (n < def.min || n > def.max) {
        errors[def.key] = `Từ ${def.min} đến ${def.max} ${def.unit}`;
      } else {
        payload[def.key] = n;
        filled++;
      }
    }

    if (filled === 0) {
      setFormError('Nhập ít nhất 1 chỉ số — thường chỉ cần cân nặng là đủ.');
      setFormErrors(errors);
      return;
    }

    if (date) payload.recordedAt = new Date(`${date}T12:00:00`).toISOString();
    if (note.trim()) payload.note = note.trim();

    setFormErrors(errors);
    setFormError('');
    createMutation.mutate(payload);
  };

  // ===== Biểu đồ: chọn chỉ số qua Tabs =====
  const chartTabs = METRIC_DEFS.filter((d) => countOf(d.key) >= 1).map((d) => ({
    value: d.key,
    label: d.label,
    count: countOf(d.key),
  }));
  const [chartKey, setChartKey] = useState<MetricKey>('weightKg');
  const activeChartKey =
    (chartTabs.find((t) => t.value === chartKey)?.value as MetricKey) || chartTabs[0]?.value;
  const activeDef = METRIC_DEFS.find((d) => d.key === activeChartKey)!;

  const chartPoints = useMemo(() => {
    if (!activeChartKey) return [];
    return asc
      .filter((m) => m[activeChartKey] != null)
      .map((m) => ({ v: m[activeChartKey] as number, at: m.recordedAt || '' })); // asc = cũ trước → mới sau
  }, [asc, activeChartKey]);

  const chartGeom = useMemo(() => {
    if (chartPoints.length < 2) return null;
    const vals = chartPoints.map((p) => p.v);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const W = 640;
    const H = 220;
    const PL = 46;
    const PR = 16;
    const PT = 18;
    const PB = 34;
    const x = (i: number) => PL + (i / (chartPoints.length - 1)) * (W - PL - PR);
    const y = (v: number) => PT + (1 - (v - min) / range) * (H - PT - PB);
    const ptsStr = chartPoints.map((p, i) => `${x(i)},${y(p.v)}`).join(' ');
    const areaStr = `${PL},${H - PB} ${ptsStr} ${x(chartPoints.length - 1)},${H - PB}`;
    return { W, H, PL, PR, PT, PB, min, max, x, y, ptsStr, areaStr };
  }, [chartPoints]);

  const chartLatest = chartPoints.length ? chartPoints[chartPoints.length - 1] : undefined;
  const chartFirst = chartPoints.length ? chartPoints[0] : undefined;

  // ===== Lịch sử: hiển thị tối đa 20 bản ghi, bấm để xem thêm =====
  const [showAllHistory, setShowAllHistory] = useState(false);
  const history = showAllHistory ? sorted : sorted.slice(0, 20);

  /** So sánh với bản ghi CŨ HƠN (idx + 1 vì sorted giảm dần) */
  const prevOf = (idx: number) => sorted[idx + 1];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk">
          Tiến trình cơ thể
        </h1>
        <p className="mt-1 text-sm text-muted">
          Ghi lại định kỳ để thấy cơ thể thay đổi — không cần chuyên môn, chỉ cần 1 cái cân.
        </p>
      </div>

      {/* ===== Tóm tắt hiện tại ===== */}
      {!isLoading && sorted.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {METRIC_DEFS.slice(0, 3).map((def) => {
            const latest = latestOf(def.key);
            const first = firstOf(def.key);
            const count = countOf(def.key);
            const Icon = def.icon;
            return (
              <Card key={def.key} className="transition-colors hover:border-neon/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                      {def.label}
                    </p>
                    <Icon className="size-4 text-neon" aria-hidden />
                  </div>
                  <p className="mt-2 font-display text-3xl font-bold text-chalk">
                    {latest != null ? fmtNum(latest) : '--'}
                    <span className="ml-1 text-base font-medium text-muted">{def.unit}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {count === 0
                      ? 'Chưa ghi'
                      : count === 1
                        ? 'Mới ghi 1 lần'
                        : deltaText(latest, first, def.unit) || '—'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ===== Form ghi số đo ===== */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <h3 className="font-display text-lg font-bold uppercase tracking-tight text-chalk">
            Ghi số đo mới
          </h3>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Cân nặng (kg)"
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder={
                latestOf('weightKg') != null ? `Lần trước: ${latestOf('weightKg')}` : 'VD: 65'
              }
              value={formValues.weightKg || ''}
              onChange={(e) => setField('weightKg', e.target.value)}
              error={formErrors.weightKg}
            />
            <Input
              label="Ngày đo"
              type="date"
              max={todayStr()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-muted">
            <CalendarDays className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {MEASURE_HINTS.weightKg}
          </p>

          {/* Bỏ trống ô cân nặng nếu chỉ muốn ghi số đo khác? → cho phép, nhưng cần ít nhất 1 chỉ số */}

          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="mt-4 flex w-full items-center justify-between gap-2 rounded-[10px] border border-line bg-ink px-3.5 py-2.5 text-left text-sm font-semibold text-chalk transition-colors hover:border-neon/40"
            aria-expanded={showMore}
          >
            <span>Thêm số đo khác (không bắt buộc)</span>
            {showMore ? (
              <ChevronUp className="size-4 text-neon" aria-hidden />
            ) : (
              <ChevronDown className="size-4 text-muted" aria-hidden />
            )}
          </button>

          {showMore && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {METRIC_DEFS.slice(1).map((def) => (
                  <div key={def.key} className="min-w-0">
                    <Input
                      label={`${def.label} (${def.unit})`}
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      placeholder={
                        latestOf(def.key) != null
                          ? `Lần trước: ${latestOf(def.key)}`
                          : 'Để trống nếu chưa biết'
                      }
                      value={formValues[def.key] || ''}
                      onChange={(e) => setField(def.key, e.target.value)}
                      error={formErrors[def.key]}
                    />
                    <p className="mt-1 text-[11px] leading-snug text-muted">
                      {MEASURE_HINTS[def.key]}
                    </p>
                  </div>
                ))}
              </div>
              <Textarea
                label="Ghi chú (không bắt buộc)"
                rows={2}
                placeholder="VD: sau 1 tháng tập, quần rộng hơn 1 size"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          )}

          {formError && (
            <p className="mt-4 rounded-[10px] border border-danger/40 bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
              {formError}
            </p>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted">
              Ít nhất 1 chỉ số. Không biết % mỡ hay số đo khác? Cân nặng là đủ.
            </p>
            <Button
              onClick={submit}
              isLoading={createMutation.isPending}
              className="w-full sm:w-auto"
            >
              <Scale className="mr-1.5 size-4" /> Ghi số đo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ===== Biểu đồ ===== */}
      {isLoading ? (
        <Skeleton className="h-56 rounded-2xl" />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Chưa có số đo"
          description="Ghi số đo đầu tiên ở phía trên để bắt đầu theo dõi tiến trình."
        />
      ) : (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-display text-lg font-bold uppercase tracking-tight text-chalk">
                Biểu đồ tiến trình
              </h3>
              {chartTabs.length > 1 && (
                <Tabs
                  tabs={chartTabs}
                  value={activeChartKey}
                  onChange={(v) => setChartKey(v as MetricKey)}
                />
              )}
            </div>

            {chartGeom && chartLatest && chartFirst ? (
              <>
                <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <p className="font-display text-3xl font-bold text-chalk">
                    {fmtNum(chartLatest.v)}
                    <span className="ml-1 text-base font-medium text-muted">{activeDef.unit}</span>
                  </p>
                  <Badge className="border-line text-muted">
                    {deltaText(chartLatest.v, chartFirst.v, activeDef.unit)}
                  </Badge>
                  <span className="text-xs text-muted">
                    {fmtNum(chartGeom.min)} – {fmtNum(chartGeom.max)} {activeDef.unit} ·{' '}
                    {chartPoints.length} lần ghi
                  </span>
                </div>

                <svg
                  viewBox={`0 0 ${chartGeom.W} ${chartGeom.H}`}
                  className="mt-3 w-full"
                  role="img"
                  aria-label={`Biểu đồ ${activeDef.label}`}
                >
                  {/* lưới ngang */}
                  {[0, 0.5, 1].map((t) => {
                    const val = chartGeom.max - t * (chartGeom.max - chartGeom.min);
                    const yy = chartGeom.PT + t * (chartGeom.H - chartGeom.PT - chartGeom.PB);
                    return (
                      <g key={t}>
                        <line
                          x1={chartGeom.PL}
                          x2={chartGeom.W - chartGeom.PR}
                          y1={yy}
                          y2={yy}
                          stroke="currentColor"
                          className="text-line"
                          strokeDasharray="4 6"
                        />
                        <text
                          x={chartGeom.PL - 8}
                          y={yy + 4}
                          textAnchor="end"
                          className="fill-muted"
                          style={{ fontSize: 11 }}
                        >
                          {fmtNum(val)}
                        </text>
                      </g>
                    );
                  })}
                  <polygon points={chartGeom.areaStr} className="fill-neon/10" />
                  <polyline
                    points={chartGeom.ptsStr}
                    fill="none"
                    stroke="#B7FF00"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {chartPoints.map((p, i) => (
                    <circle
                      key={i}
                      cx={chartGeom.x(i)}
                      cy={chartGeom.y(p.v)}
                      r="4"
                      fill="#B7FF00"
                      className="stroke-ink"
                      strokeWidth="1.5"
                    />
                  ))}
                  {/* nhãn trục X: ngày cũ nhất & mới nhất */}
                  <text
                    x={chartGeom.PL}
                    y={chartGeom.H - 10}
                    className="fill-muted"
                    style={{ fontSize: 11 }}
                  >
                    {fmtDate(chartFirst.at)}
                  </text>
                  <text
                    x={chartGeom.W - chartGeom.PR}
                    y={chartGeom.H - 10}
                    textAnchor="end"
                    className="fill-muted"
                    style={{ fontSize: 11 }}
                  >
                    {fmtDate(chartLatest.at)}
                  </text>
                </svg>
              </>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-line bg-ink px-4 py-6 text-center text-sm text-muted">
                <strong className="text-chalk">{activeDef.label}</strong> mới có 1 lần ghi — ghi
                thêm 1 lần nữa để thấy đường tiến trình.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===== Lịch sử ===== */}
      {!isLoading && sorted.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold uppercase tracking-tight text-chalk">
              Lịch sử ({sorted.length})
            </h3>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              Làm mới
            </Button>
          </div>
          <div className="grid gap-3">
            {history.map((m, idx) => {
              const prev = prevOf(idx);
              return (
                <Card key={m.id || idx}>
                  <CardContent className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-xs text-muted">{fmtDate(m.recordedAt)}</p>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        {METRIC_DEFS.filter((d) => m[d.key] != null).map((d) => {
                          const cur = m[d.key] as number;
                          const base = prev ? (prev[d.key] as number | undefined) : undefined;
                          const dText = base != null ? deltaText(cur, base, d.unit) : null;
                          return (
                            <span key={d.key} className="text-chalk">
                              <b className="font-semibold">
                                {fmtNum(cur)} {d.unit}
                              </b>
                              {dText && (
                                <span className="ml-1.5 text-xs text-muted">
                                  {dText.split(' ')[0]} {dText.split(' ').slice(1).join(' ')}
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                      {m.note && <p className="mt-1.5 text-xs italic text-muted">{m.note}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(m)}
                      className="shrink-0 rounded-lg p-2 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                      aria-label={`Xóa số đo ${fmtDate(m.recordedAt)}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {sorted.length > 20 && (
            <div className="mt-3 text-center">
              <Button variant="outline" size="sm" onClick={() => setShowAllHistory((v) => !v)}>
                {showAllHistory ? 'Thu gọn' : `Xem tất cả ${sorted.length} bản ghi`}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ===== Mẹo cho người mới ===== */}
      <Card className="border-neon/20">
        <CardContent className="p-4 sm:p-6">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-tight text-chalk">
            <Info className="size-4 text-neon" aria-hidden /> Mẹo ghi số đo đúng
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
            <li>
              <b className="text-chalk">Cùng một thời điểm:</b> cân vào buổi sáng, sau khi đi vệ
              sinh, trước khi ăn — số liệu mới so sánh được với nhau.
            </li>
            <li>
              <b className="text-chalk">Ghi đều 1–2 lần/tuần:</b> cân mỗi ngày dễ gây lo lắng vì cân
              lên xuống do nước trong người.
            </li>
            <li>
              <b className="text-chalk">Vòng eo:</b> đo ngay rốn, thở ra tự nhiên, đừng siết thước —
              đo cùng cách mỗi lần.
            </li>
            <li>
              <b className="text-chalk">% mỡ:</b> không bắt buộc. Không có máy đo thì chỉ cần cân
              nặng và vòng eo là đủ theo dõi.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* ===== Dialog xác nhận xóa ===== */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Xóa bản ghi số đo?"
        description={`Số đo ngày ${deleteTarget ? fmtDate(deleteTarget.recordedAt) : ''} sẽ bị xóa vĩnh viễn.`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Hủy
          </Button>
          <Button
            variant="danger"
            isLoading={deleteMutation.isPending}
            onClick={() => deleteTarget?.id && deleteMutation.mutate(deleteTarget.id)}
          >
            <Trash2 className="mr-1.5 size-4" /> Xóa
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
