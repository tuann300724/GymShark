import { PrismaClient, Prisma } from '@prisma/client';

process.loadEnvFile('.env');

const prisma = new PrismaClient();

type PkgInput = {
  code: string;
  name: string;
  description: string;
  features: { title: string; items: string[] };
  durationDays: number;
  price: number;
  sessions: number | null;
};

const PACKAGES: PkgInput[] = [
  // ===== FIXED_TERM (Theo thời hạn) =====
  {
    code: 'PKG-1M',
    name: 'Gói Cơ Bản 1 Tháng',
    description: 'Tập luyện không giới hạn thời gian trong 1 tháng tại 1 chi nhánh.',
    features: {
      title: 'Gói Cơ Bản 1 Tháng',
      items: [
        'Tập luyện không giới hạn khung giờ',
        '1 chi nhánh',
        'Phòng Gym + Cardio',
        'Tủ đồ cá nhân',
        'Hướng dẫn sử dụng máy cơ bản',
      ],
    },
    durationDays: 30,
    price: 450000,
    sessions: null,
  },
  {
    code: 'PKG-3M',
    name: 'Gói Tiện Lợi 3 Tháng',
    description: 'Tiết kiệm 10% so với đóng theo tháng, kèm 1 buổi tư vấn kế hoạch tập với HLV.',
    features: {
      title: 'Gói Tiện Lợi 3 Tháng',
      items: [
        'Tập luyện không giới hạn khung giờ',
        '1 chi nhánh',
        'Phòng Gym + Cardio + lớp Group Class',
        '1 buổi tư vấn kế hoạch tập với HLV',
        'Tủ đồ cá nhân',
      ],
    },
    durationDays: 90,
    price: 1200000,
    sessions: null,
  },
  {
    code: 'PKG-6M',
    name: 'Gói Phổ Biến 6 Tháng',
    description: 'Gói bán chạy nhất — tập tất cả chi nhánh, kèm 3 buổi tập cùng HLV.',
    features: {
      title: 'Gói Phổ Biến 6 Tháng',
      items: [
        'Tập luyện không giới hạn khung giờ',
        'Tất cả chi nhánh',
        'Gym + Cardio + Group Class + Yoga',
        '3 buổi tập cùng HLV',
        'Ưu đãi 10% dịch vụ bổ sung',
        'Tủ đồ cá nhân',
      ],
    },
    durationDays: 180,
    price: 2100000,
    sessions: 3,
  },
  {
    code: 'PKG-12M',
    name: 'Gói Cao Cấp 12 Tháng',
    description: 'Trọn gói cao cấp — toàn bộ dịch vụ, 6 buổi PT và ưu đãi VIP.',
    features: {
      title: 'Gói Cao Cấp 12 Tháng',
      items: [
        'Tập luyện không giới hạn khung giờ',
        'Tất cả chi nhánh',
        'Toàn bộ dịch vụ (Gym, Cardio, Group Class, Yoga, Sauna)',
        '6 buổi tập cùng HLV',
        'Tặng khăn tập & tủ đồ VIP',
        'Ưu đãi 15% dịch vụ bổ sung',
      ],
    },
    durationDays: 365,
    price: 3600000,
    sessions: 6,
  },
];

async function main() {
  const retired = await prisma.membershipPackage.updateMany({
    where: { type: 'SESSION_BASED', status: 'ACTIVE' },
    data: { status: 'INACTIVE' },
  });
  if (retired.count) console.log(`Đã ngừng bán ${retired.count} gói cũ tính theo lượt.`);

  for (const pkg of PACKAGES) {
    const data = {
      name: pkg.name,
      description: pkg.description,
      features: JSON.stringify(pkg.features),
      durationDays: pkg.durationDays,
      price: new Prisma.Decimal(pkg.price.toFixed(2)),
      sessions: pkg.sessions,
      type: 'FIXED_TERM',
      status: 'ACTIVE',
    };

    const existing = await prisma.membershipPackage.findUnique({ where: { code: pkg.code } });
    if (existing) {
      await prisma.membershipPackage.update({ where: { code: pkg.code }, data });
      console.log(`UPDATE ${pkg.code} — ${pkg.name}`);
    } else {
      await prisma.membershipPackage.create({ data: { code: pkg.code, ...data } });
      console.log(`CREATE ${pkg.code} — ${pkg.name}`);
    }
  }

  const all = await prisma.membershipPackage.findMany({ orderBy: { price: 'asc' } });
  console.log(`\nTổng ${all.length} gói:`);
  all.forEach((p) =>
    console.log(
      `  ${p.code.padEnd(14)} | ${String(p.price).padStart(10)}đ | ${p.durationDays}d | ${p.sessions ?? '-'} buổi PT | ${p.name}`,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
