'use client';
import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Dumbbell, CheckSquare, Square, Send, Save, Plus } from 'lucide-react';

export default function Builder() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [chosen, setChosen] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editGroup, setEditGroup] = useState('');
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [pickedMembers, setPickedMembers] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    axios
      .get('/exercises')
      .then((r) => setItems(r.data || []))
      .catch(() => setItems([]));
    axios
      .get('/trainers/me/members')
      .then((r) => {
        const arr = Array.isArray(r.data) ? r.data : r.data?.data || [];
        setMembers(arr.filter((a: any) => a.status === 'ACTIVE'));
      })
      .catch(() => setMembers([]));
  }, []);

  const toggle = (id: string) =>
    setChosen((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleMember = (id: string) =>
    setPickedMembers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleAllMembers = () =>
    setPickedMembers((prev) =>
      prev.length === members.length ? [] : members.map((a) => a.memberId),
    );

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setStatus('Vui lòng nhập tên bài tập.');
      return;
    }
    const trimmedGroup = group.trim() || 'Tổng hợp';
    setSaving(true);
    try {
      const res = await axios.post('/exercises', {
        name: trimmedName,
        group: trimmedGroup,
      });
      const newExercise = res.data;
      setItems((prev) => [newExercise, ...prev.filter((x) => x.id !== newExercise.id)]);
      setName('');
      setGroup('');
      setStatus(`Đã lưu bài tập "${newExercise.name}" vào danh sách bài tập.`);
    } catch (e: any) {
      setStatus('Lỗi lưu: ' + (e?.response?.data?.message || 'Không thể lưu bài tập'));
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (chosen.length === 0) {
      setStatus('Vui lòng chọn ít nhất một bài tập.');
      return;
    }
    if (pickedMembers.length === 0) {
      setStatus('Hãy chọn ít nhất một hội viên muốn gửi bài ở mục "Người nhận".');
      return;
    }
    setSending(true);
    try {
      const title = name.trim() || 'Bài tập mới';
      const res = await axios.post('/programs', {
        slug: 'pg-' + Date.now(),
        name: title,
        group: group.trim() || null,
        exercises: chosen.map((id, idx) => ({
          exerciseId: id,
          sets: 3,
          reps: 12,
          restSeconds: 60,
          order: idx,
        })),
        isTemplate: false,
      });
      const pid = res.data.id;
      const r = await axios.post(`/programs/${pid}/send`, { memberIds: pickedMembers });
      const sentTo = r.data?.sentTo ?? pickedMembers.length;
      setStatus(
        `Đã gửi bài tập "${title}" cho ${sentTo} hội viên qua tin nhắn chat — mở "Tin nhắn" để trao đổi trực tiếp.`,
      );
    } catch (e: any) {
      setStatus('Lỗi gửi: ' + (e?.response?.data?.message || 'Không gửi được, thử lại'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-ink text-chalk">
      <div className="border-b border-line bg-ink/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-6 md:p-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-neon/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-neon border border-neon/20 mb-2">
            <Dumbbell className="size-3" /> Huấn luyện viên
          </span>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-chalk">
            Xây dựng bài tập
          </h1>
          <p className="mt-2 text-sm text-muted max-w-xl">
            Tạo bài mới từ danh sách bài tập có sẵn hoặc thiết kế hoàn toàn mới. Chọn hội viên muốn
            gửi, bài tập sẽ đến thẳng tin nhắn chat để hai bên trao đổi.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6 items-start">
          {/* LEFT: Info */}
          <div className="rounded-2xl border border-line/70 bg-surface/80 p-6 md:p-8 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-2.5 mb-6">
              <span className="h-8 w-[3px] rounded-full bg-neon" />
              <h2 className="font-display text-xl font-extrabold uppercase tracking-tight">
                Thông tin bài tập
              </h2>
            </div>
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="prog-name"
                  className="block text-[11px] font-extrabold uppercase tracking-widest text-muted mb-1.5"
                >
                  Tên bài tập
                </label>
                <input
                  id="prog-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Kéo cáp xô (Lat Pulldown)"
                  className="w-full rounded-lg border border-line bg-ink px-4 py-3 text-sm font-medium text-chalk placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-neon/30"
                />
              </div>
              <div>
                <label
                  htmlFor="prog-group"
                  className="block text-[11px] font-extrabold uppercase tracking-widest text-muted mb-1.5"
                >
                  Nhóm / Mục tiêu
                </label>
                <input
                  id="prog-group"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  placeholder="Ví dụ: Lưng xô / Tay trước"
                  className="w-full rounded-lg border border-line bg-ink px-4 py-3 text-sm font-medium text-chalk placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-neon/30"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="block text-[11px] font-extrabold uppercase tracking-widest text-muted">
                    Người nhận — hội viên đang phụ trách
                  </span>
                  {members.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleAllMembers}
                      className="text-[10px] font-extrabold uppercase tracking-wider text-neon hover:underline"
                    >
                      {pickedMembers.length === members.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </button>
                  )}
                </div>
                {members.length === 0 ? (
                  <p className="rounded-lg border border-line/60 bg-ink px-4 py-3 text-xs font-medium text-muted">
                    Bạn chưa có hội viên ACTIVE nào được phân công — hãy liên hệ quản trị viên.
                  </p>
                ) : (
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-line bg-ink divide-y divide-line/20">
                    {members.map((a: any) => {
                      const mid = a.memberId;
                      const selected = pickedMembers.includes(mid);
                      const mName = a.member?.fullName || a.member?.user?.fullName || 'Hội viên';
                      const mCode = a.member?.code || '';
                      const pkg = a.member?.memberships?.[0]?.package?.name || '';
                      return (
                        <button
                          key={mid}
                          type="button"
                          onClick={() => toggleMember(mid)}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface/60 ${
                            selected ? 'bg-neon/[0.06]' : ''
                          }`}
                        >
                          {selected ? (
                            <CheckSquare className="size-4 shrink-0 text-neon" />
                          ) : (
                            <Square className="size-4 shrink-0 text-muted/60" />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-chalk">
                              {mName}
                            </span>
                            <span className="block truncate text-[11px] text-muted">
                              {[mCode, pkg].filter(Boolean).join(' · ') || 'ACTIVE'}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="mt-1.5 text-[11px] text-muted">
                  Đã chọn <span className="font-extrabold text-neon">{pickedMembers.length}</span>/
                  {members.length} hội viên nhận bài qua tin nhắn chat.
                </p>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-line/40">
              <h3 className="font-display text-base font-extrabold uppercase tracking-tight mb-3">
                Thao tác
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-neon px-5 py-2.5 text-sm font-extrabold uppercase text-ink shadow-[0_0_15px_-3px_rgba(183,255,0,0.35)] hover:brightness-110 disabled:opacity-50"
                >
                  <Save className="size-4" /> {saving ? 'Đang lưu...' : 'Lưu bài / Tạo mới'}
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending}
                  className="inline-flex items-center gap-2 rounded-lg border border-neon/40 bg-ink px-5 py-2.5 text-sm font-extrabold uppercase text-neon hover:bg-neon/10 disabled:opacity-50"
                >
                  <Send className="size-4" />
                  {sending ? 'Đang gửi...' : 'Gửi cho hội viên'}
                </button>
              </div>
              {status ? (
                <div className="mt-4 rounded-lg border border-line/60 bg-ink/50 px-4 py-3 text-sm font-medium text-chalk">
                  {status}
                </div>
              ) : null}
            </div>
          </div>

          {/* RIGHT: Picker */}
          <div className="rounded-2xl border border-line/70 bg-surface/80 p-6 md:p-8 shadow-2xl shadow-black/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="h-8 w-[3px] rounded-full bg-chalk/30" />
                <h2 className="font-display text-xl font-extrabold uppercase tracking-tight">
                  Danh sách bài tập
                </h2>
              </div>
              <span className="rounded-full bg-ink border border-line px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-muted">
                {chosen.length} đã chọn
              </span>
            </div>

            <div className="rounded-xl border border-line/50 bg-ink overflow-hidden">
              <div className="px-5 py-3 border-b border-line/30 bg-ink/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="size-3.5 text-muted" />
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-muted">
                    Chọn bài có sẵn để thêm vào bài tập
                  </span>
                </div>
                {items.length > 0 && (
                  <span className="text-[11px] text-muted">Tổng: {items.length} bài</span>
                )}
              </div>
              {items.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-muted">Chưa có bài tập nào trong danh sách.</p>
                  <p className="text-xs text-muted/70 mt-1">
                    Bạn có thể tạo bài mới từ phần thông tin bên trái.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-line/20 max-h-[26rem] overflow-y-auto">
                  {items.map((ex: any) => {
                    const selected = chosen.includes(ex.id);
                    const isEdit = editingId === ex.id;
                    return (
                      <div
                        key={ex.id}
                        className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-surface/60 ${selected ? 'bg-neon/[0.05]' : ''}`}
                      >
                        <button
                          type="button"
                          onClick={() => toggle(ex.id)}
                          className="mt-0.5 shrink-0 text-muted/60 hover:text-neon transition-colors"
                          aria-label="Chọn"
                        >
                          {selected ? (
                            <CheckSquare className="size-5 text-neon" />
                          ) : (
                            <Square className="size-5" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          {isEdit ? (
                            <div className="space-y-2">
                              <input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full rounded-md border border-neon bg-ink px-3 py-1.5 text-sm text-chalk focus:outline-none focus:ring-2 focus:ring-neon/30"
                                placeholder="Tên bài tập"
                              />
                              <input
                                value={editGroup}
                                onChange={(e) => setEditGroup(e.target.value)}
                                className="w-full rounded-md border border-line bg-ink px-3 py-1.5 text-sm text-chalk placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-neon/30"
                                placeholder="Nhóm"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    axios
                                      .put(`/exercises/${ex.id}`, {
                                        name: editName,
                                        group: editGroup || null,
                                      })
                                      .then(() => {
                                        setItems((prev) =>
                                          prev.map((i) =>
                                            i.id === ex.id
                                              ? {
                                                  ...i,
                                                  name: editName,
                                                  group: editGroup || i.group,
                                                }
                                              : i,
                                          ),
                                        );
                                        setStatus('Đã sửa bài tập');
                                        setEditingId(null);
                                      })
                                      .catch(() => setStatus('Lỗi sửa bài'));
                                  }}
                                  className="rounded-md bg-neon px-3 py-1 text-[10px] font-extrabold uppercase text-ink hover:brightness-110"
                                >
                                  Lưu
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="rounded-md border border-chalk/30 px-3 py-1 text-[10px] font-extrabold uppercase text-chalk hover:border-danger hover:text-danger"
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <h4 className="text-sm font-extrabold text-chalk truncate">
                                {ex.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="inline-block rounded-full bg-ink border border-line px-2 py-0.5 text-[10px] font-bold uppercase text-muted">
                                  {ex.group || 'Tổng hợp'}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(ex.id);
                              setEditName(ex.name);
                              setEditGroup(ex.group || '');
                            }}
                            className="rounded-md border border-chalk/30 px-2 py-1 text-[10px] font-extrabold uppercase text-chalk hover:border-neon hover:text-neon transition-colors"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              axios
                                .delete(`/exercises/${ex.id}`)
                                .then(() => {
                                  setItems((prev) => prev.filter((i) => i.id !== ex.id));
                                  setChosen((prev) => prev.filter((id) => id !== ex.id));
                                  setStatus('Đã xoá bài tập khỏi danh sách');
                                })
                                .catch(() => setStatus('Lỗi khi xoá bài tập'));
                            }}
                            className="rounded-md border border-danger/40 px-2 py-1 text-[10px] font-extrabold uppercase text-danger hover:bg-danger/10 transition-colors"
                          >
                            Xoá
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-line/30 bg-ink/30 px-5 py-4">
              <h4 className="font-display text-sm font-extrabold uppercase tracking-wide mb-3">
                Cách hoạt động
              </h4>
              <ul className="space-y-2 text-xs text-muted leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-neon font-extrabold shrink-0">1.</span>
                  <span className="min-w-0">Nhập tên bài tập và nhóm mục tiêu ở bên trái.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-neon font-extrabold shrink-0">2.</span>
                  <span className="min-w-0">
                    Bấm <strong className="text-chalk">Lưu bài / Tạo mới</strong> để lưu bài tập vào
                    danh sách bên phải.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-neon font-extrabold shrink-0">3.</span>
                  <span className="min-w-0">
                    Chọn các bài tập có sẵn từ danh sách bên phải (có thể chọn nhiều).
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-neon font-extrabold shrink-0">4.</span>
                  <span className="min-w-0">
                    Chọn hội viên muốn gửi ở mục <strong className="text-chalk">Người nhận</strong>{' '}
                    (chọn nhiều người cũng được).
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-neon font-extrabold shrink-0">5.</span>
                  <span className="min-w-0">
                    Bấm <strong className="text-chalk">Gửi cho hội viên</strong> — bài tập kèm đầy
                    đủ danh sách sẽ vào <strong className="text-chalk">tin nhắn chat</strong> của
                    từng hội viên; hai bên trao đổi, hỏi đáp trực tiếp ngay trong cuộc trò chuyện
                    đó.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
