'use client';
import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Dumbbell, CheckCircle2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import apiClient from '@/lib/axios';
import { cn } from '@/lib/utils';

interface ExerciseItem {
  id: string;
  name: string;
  enName?: string;
  group?: string;
  equipment?: string;
  description?: string;
}

export default function AdminExercisesPage() {
  const [items, setItems] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name: '', group: '', equipment: '', description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', group: '', equipment: '', description: '' });
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const { data } = await apiClient.get<ExerciseItem[]>('/exercises');
      setItems(data);
      return true;
    } catch {
      setLoadError(true);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    if (!form.name.trim()) {
      setMsg('Nhập tên bài tập');
      setTimeout(() => setMsg(''), 2000);
      return;
    }
    try {
      await apiClient.post('/exercises', {
        name: form.name.trim(),
        group: form.group.trim() || 'Tổng quát',
        equipment: form.equipment.trim() || '',
        description: form.description.trim() || '',
      });
      setForm({ name: '', group: '', equipment: '', description: '' });
      if (await load()) {
        setMsg('Đã thêm bài tập mới');
        setTimeout(() => setMsg(''), 2500);
      }
    } catch {
      setMsg('Lỗi khi thêm bài tập. Vui lòng thử lại.');
    }
  };

  const delItem = async (id: string) => {
    try {
      await apiClient.delete(`/exercises/${id}`);
      if (await load()) {
        setMsg('Đã xóa bài tập');
        setTimeout(() => setMsg(''), 1500);
      }
    } catch {
      setMsg('Lỗi khi xóa bài tập. Vui lòng thử lại.');
    }
  };

  const startEdit = (ex: ExerciseItem) => {
    setEditingId(ex.id);
    setEditForm({
      name: ex.name,
      group: ex.group || '',
      equipment: ex.equipment || '',
      description: ex.description || '',
    });
  };
  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await apiClient.put(`/exercises/${editingId}`, editForm);
      setEditingId(null);
      if (await load()) {
        setMsg('Đã cập nhật');
        setTimeout(() => setMsg(''), 1500);
      }
    } catch {
      setMsg('Lỗi khi cập nhật bài tập. Vui lòng thử lại.');
    }
  };

  const GROUP_OPTIONS = [
    'Legs',
    'Ngực',
    'Lưng',
    'Vai',
    'Tay trước',
    'Tay sau',
    'Bụng',
    'Toàn thân',
    'Tổng quát',
  ];
  const EQUIP_OPTIONS = [
    'Barbell',
    'Dumbbell',
    'Máy cáp',
    'Máy Leg Press',
    'Xà đơn / Kéo',
    'Thảm / Sàn',
    'Tạ đơn',
    'Barbell + Rack',
    'Tạ đơn + Ghế nghiêng',
    'Barbell + Ghế phẳng',
  ];

  const filtered = items.filter(
    (i) =>
      !search ||
      i.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.group?.toLowerCase().includes(search.toLowerCase()),
  );

  const stats = [
    { label: 'Tổng bài tập', value: items.length, color: 'neon' },
    { label: 'Nhóm cơ', value: new Set(items.map((i) => i.group)).size || 0, color: 'muted' },
    { label: 'Bài mới hôm nay', value: 0, color: 'danger' },
  ];

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <section>
        <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-neon mb-3">
          <span className="w-6 h-[2px] bg-neon inline-block" /> Quản trị / Bài tập
        </div>
        <h1 className="font-display text-[clamp(2.5rem,7vw,5rem)] font-extrabold uppercase tracking-tighter text-chalk leading-[0.92]">
          BÀI TẬP <span className="text-neon">.</span>
        </h1>
        <p className="text-muted max-w-xl text-base leading-relaxed mt-4">
          Quản lý danh mục bài tập, liên kết chương trình tập và cập nhật dữ liệu vận hành.
        </p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card
            key={s.label}
            className="bg-surface border border-line rounded-2xl p-6 relative overflow-hidden group hover:border-neon/30 transition-colors"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-neon/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted mb-1">
              {s.label}
            </div>
            <div
              className={cn(
                'font-display text-4xl font-extrabold tracking-tight',
                s.color === 'neon'
                  ? 'text-neon'
                  : s.color === 'danger'
                    ? 'text-danger'
                    : 'text-chalk',
              )}
            >
              {s.value}
            </div>
          </Card>
        ))}
      </div>

      <Card className="bg-surface border border-line rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-neon/10 to-transparent px-6 py-4 border-b border-line flex items-center gap-3">
          <div className="w-8 h-8 rounded-[10px] bg-neon/10 text-neon flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          <h2 className="font-display text-xl font-bold uppercase text-chalk tracking-tight">
            Thêm bài tập mới
          </h2>
        </div>
        <CardContent className="p-6 space-y-4">
          <div className="grid sm:grid-cols-4 gap-3">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Tên bài tập (VD: Squat)"
              className="bg-ink border border-line rounded-[10px] px-3 py-3 text-sm text-chalk placeholder:text-muted focus:border-neon outline-none transition-colors"
            />
            <select
              value={form.group}
              onChange={(e) => setForm({ ...form, group: e.target.value })}
              className="bg-ink border border-line rounded-[10px] px-3 py-3 text-sm text-chalk focus:border-neon outline-none transition-colors appearance-none"
            >
              <option value="">Chọn nhóm cơ</option>
              {GROUP_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <select
              value={form.equipment}
              onChange={(e) => setForm({ ...form, equipment: e.target.value })}
              className="bg-ink border border-line rounded-[10px] px-3 py-3 text-sm text-chalk focus:border-neon outline-none transition-colors appearance-none"
            >
              <option value="">Chọn dụng cụ</option>
              {EQUIP_OPTIONS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            <Button
              onClick={create}
              className="bg-neon text-ink font-extrabold hover:bg-neon-hover rounded-[10px] h-[46px] tracking-tight shadow-[0_0_24px_-12px_rgba(183,255,0,0.4)]"
            >
              <Plus className="w-4 h-4 mr-2" /> Thêm
            </Button>
          </div>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Mô tả, mẹo thực hiện (tuỳ chọn)"
            className="w-full bg-ink border border-line rounded-[10px] px-3 py-2.5 text-sm text-chalk placeholder:text-muted focus:border-neon outline-none transition-colors"
          />
          {msg && (
            <div
              className={cn(
                'text-sm font-bold flex items-center gap-2',
                msg.includes('Lỗi') ? 'text-danger' : 'text-neon',
              )}
            >
              <CheckCircle2 className="w-4 h-4" /> {msg}
            </div>
          )}
        </CardContent>
      </Card>

      <section>
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="font-display text-2xl font-bold uppercase text-chalk tracking-tight">
            Danh sách bài tập{' '}
            <span className="text-muted font-normal text-base">({items.length})</span>
          </h2>
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm bài tập / nhóm cơ…"
              className="bg-ink border border-line rounded-[10px] pl-9 pr-3 py-2 text-sm text-chalk placeholder:text-muted focus:border-neon outline-none w-64 transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-surface border border-line rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : loadError ? (
          <ErrorState
            title="Không tải được danh sách bài tập"
            description="Không thể kết nối tới Backend. Vui lòng thử lại."
            onRetry={() => void load()}
          />
        ) : filtered.length === 0 ? (
          <Card className="bg-surface border border-line rounded-2xl p-10 text-center text-muted">
            <Dumbbell className="w-12 h-12 mx-auto text-neon/40 mb-3" />
            <p className="font-display text-xl font-bold uppercase text-chalk">Chưa có bài tập</p>
            <p className="text-sm mt-1">Thêm bài tập mới bằng form phía trên.</p>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface text-muted uppercase text-[11px] font-extrabold tracking-[0.12em]">
                <tr>
                  <th className="px-5 py-3.5">Tên bài tập</th>
                  <th className="px-5 py-3.5">Nhóm cơ</th>
                  <th className="px-5 py-3.5">Dụng cụ</th>
                  <th className="px-5 py-3.5">Mô tả</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {filtered.map((ex) => (
                  <tr key={ex.id} className="hover:bg-ink/50 transition-colors">
                    <td className="px-5 py-4 font-display font-bold text-chalk uppercase tracking-tight whitespace-nowrap">
                      {ex.name}
                    </td>
                    <td className="px-5 py-4 text-muted whitespace-nowrap">{ex.group || '-'}</td>
                    <td className="px-5 py-4 text-muted whitespace-nowrap">
                      {ex.equipment || '-'}
                    </td>
                    <td className="px-5 py-4 text-chalk/80 max-w-xs truncate">
                      {ex.description || '-'}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingId(ex.id);
                            setEditForm({
                              name: ex.name,
                              group: ex.group || '',
                              equipment: ex.equipment || '',
                              description: ex.description || '',
                            });
                          }}
                          className="p-2 rounded-[10px] hover:bg-line/40 text-muted hover:text-chalk"
                          title="Sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => delItem(ex.id)}
                          className="p-2 rounded-[10px] hover:bg-danger/10 text-danger hover:text-red-300"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editingId && (
        <Card className="bg-ink border border-neon/30 rounded-2xl p-5">
          <h3 className="font-display text-lg font-bold uppercase text-chalk mb-3">
            Chỉnh sửa bài tập
          </h3>
          <div className="grid sm:grid-cols-4 gap-3 mb-3">
            <input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="bg-surface border border-line rounded-[10px] px-3 py-2 text-sm text-chalk focus:border-neon outline-none"
              placeholder="Tên"
            />
            <select
              value={editForm.group}
              onChange={(e) => setEditForm({ ...editForm, group: e.target.value })}
              className="bg-surface border border-line rounded-[10px] px-3 py-2 text-sm text-chalk focus:border-neon outline-none appearance-none"
            >
              <option value="">Nhóm</option>
              {GROUP_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <select
              value={editForm.equipment}
              onChange={(e) => setEditForm({ ...editForm, equipment: e.target.value })}
              className="bg-surface border border-line rounded-[10px] px-3 py-2 text-sm text-chalk focus:border-neon outline-none appearance-none"
            >
              <option value="">Dụng cụ</option>
              {EQUIP_OPTIONS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            <Button onClick={saveEdit} className="bg-neon text-ink font-extrabold rounded-[10px]">
              Lưu
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => setEditingId(null)}
            className="border-line text-chalk rounded-[10px]"
          >
            Hủy
          </Button>
        </Card>
      )}
    </div>
  );
}
