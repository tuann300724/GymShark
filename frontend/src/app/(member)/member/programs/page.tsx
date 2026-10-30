export default function MemberProgramsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold uppercase text-chalk">Bài tập của tôi</h1>
      <div className="rounded-xl border border-line bg-surface p-6 space-y-4 text-chalk">
        <p>Bài tập được HLV gửi sẽ hiển thị tại đây. Khi nhận được, bạn có thể xác nhận.</p>
        <div className="rounded-lg border border-line bg-ink/50 p-4">
          <h3 className="font-semibold text-chalk">Tập ngực cơ bản</h3>
          <p className="text-sm text-muted">HLV: Lê Văn A · Trạng thái: Đang chờ xác nhận</p>
          <button className="mt-3 inline-flex items-center gap-2 rounded-sm bg-neon px-4 py-2 text-sm font-bold uppercase text-ink hover:bg-lime-500 transition-colors">
            Xác nhận đã nhận bài
          </button>
        </div>
      </div>
    </div>
  );
}
