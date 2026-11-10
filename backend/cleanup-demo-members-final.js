/**
 * cleanup-demo-members-final.js
 * Mặc định chỉ xem trước hội viên demo/test. Chỉ xóa khi truyền --execute.
 * Chạy từ thư mục backend/: node cleanup-demo-members-final.js [--execute]
 */
require("dotenv").config({ path: "./.env" });
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // ── 1. Liệt kê tất cả member ──────────────────────────────────────────────
  const allMembers = await prisma.member.findMany({
    include: { user: true },
    orderBy: { code: "asc" },
  });

  console.log(`\n📋 Tổng member trong DB: ${allMembers.length}`);
  console.log("=".repeat(65));

  const demoMembers = [];
  const realMembers = [];

  for (const m of allMembers) {
    const memberEmail = (m.email || "").trim().toLowerCase();
    const userEmail = (m.user?.email || "").trim().toLowerCase();
    const emails = [memberEmail, userEmail].filter(Boolean);
    const hasDemoEmail =
      emails.length > 0 &&
      emails.every((email) => email.endsWith("@gym.local"));
    const hasDemoPhone = /^090000000\d$/.test(m.phone || "");
    const hasLinkedUser = Boolean(m.userId);
    const isDemo = hasLinkedUser
      ? Boolean(memberEmail || userEmail) && hasDemoEmail
      : hasDemoEmail || hasDemoPhone;
    const email = memberEmail || userEmail;

    if (isDemo) {
      demoMembers.push({ ...m, _email: email });
      console.log(
        `  🗑️  DEMO  | ${m.code.padEnd(10)} | ${m.fullName.padEnd(20)} | ${email}`,
      );
    } else {
      realMembers.push({ ...m, _email: email });
      console.log(
        `  ✅ REAL  | ${m.code.padEnd(10)} | ${m.fullName.padEnd(20)} | ${email}`,
      );
    }
  }

  console.log("=".repeat(65));
  console.log(`\n🗑️  Sẽ xóa  : ${demoMembers.length} member demo`);
  console.log(`✅ Giữ lại : ${realMembers.length} member thực\n`);

  if (demoMembers.length === 0) {
    console.log("✨ Không có demo member nào — không cần xóa gì!");
    return;
  }

  if (!process.argv.includes("--execute")) {
    console.log("Chế độ xem trước: chưa có dữ liệu nào bị xóa.");
    console.log(
      "Kiểm tra danh sách trên rồi chạy lại với --execute để xác nhận xóa.",
    );
    return;
  }

  const demoMemberIds = demoMembers.map((m) => m.id);
  const demoUserIds = demoMembers.filter((m) => m.userId).map((m) => m.userId);

  console.log("🚀 Bắt đầu xóa trong transaction...\n");

  // ── 3. Xóa cascade đúng thứ tự FK ─────────────────────────────────────────
  const counts = await prisma.$transaction(async (tx) => {
    const c = {};

    const del = async (label, fn) => {
      const r = await fn();
      c[label] = r.count;
    };

    await del("faceEmbedding", () =>
      tx.faceEmbedding.deleteMany({
        where: { memberId: { in: demoMemberIds } },
      }),
    );
    await del("trainingProgress", () =>
      tx.trainingProgress.deleteMany({
        where: { memberId: { in: demoMemberIds } },
      }),
    );
    await del("trainerMember", () =>
      tx.trainerMember.deleteMany({
        where: { memberId: { in: demoMemberIds } },
      }),
    );
    await del("checkIn", () =>
      tx.checkIn.deleteMany({ where: { memberId: { in: demoMemberIds } } }),
    );
    await del("auditLog", () =>
      tx.auditLog.deleteMany({ where: { userId: { in: demoUserIds } } }),
    );
    await del("notification", () =>
      tx.notification.deleteMany({ where: { userId: { in: demoUserIds } } }),
    );

    // Invoice phụ thuộc Payment → lấy paymentIds trước
    const pmts = await tx.payment.findMany({
      where: { memberId: { in: demoMemberIds } },
      select: { id: true },
    });
    const paymentIds = pmts.map((p) => p.id);
    await del("invoice", () =>
      tx.invoice.deleteMany({ where: { paymentId: { in: paymentIds } } }),
    );
    await del("payment", () =>
      tx.payment.deleteMany({ where: { memberId: { in: demoMemberIds } } }),
    );
    await del("membership", () =>
      tx.membership.deleteMany({ where: { memberId: { in: demoMemberIds } } }),
    );

    // Xóa member
    const rm = await tx.member.deleteMany({
      where: { id: { in: demoMemberIds } },
    });
    c["member"] = rm.count;

    // Xóa user accounts demo
    if (demoUserIds.length > 0) {
      const ru = await tx.user.deleteMany({
        where: { id: { in: demoUserIds } },
      });
      c["user"] = ru.count;
    } else {
      c["user"] = 0;
    }

    return c;
  });

  // ── 4. Báo cáo kết quả ────────────────────────────────────────────────────
  console.log("✅ Xóa thành công! Thống kê:\n");
  for (const [table, count] of Object.entries(counts)) {
    console.log(`   ${table.padEnd(22)}: ${count} bản ghi đã xóa`);
  }

  // ── 5. Xác nhận member còn lại ────────────────────────────────────────────
  const remaining = await prisma.member.findMany({ orderBy: { code: "asc" } });
  console.log(`\n📋 Member còn lại (${remaining.length}):`);
  for (const m of remaining) {
    console.log(`   ✅ ${m.code} | ${m.fullName} | ${m.email}`);
  }
  console.log("\n🎉 Dọn dẹp hoàn tất!");
}

main()
  .catch((e) => {
    console.error("\n❌ Lỗi:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
