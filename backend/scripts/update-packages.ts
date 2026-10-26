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
  type: 'FIXED_TERM' | 'SESSION_BASED';
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
    type: 'FIXED_TERM',
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
    type: 'FIXED_TERM',
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
    sessions: null,
    type: 'FIXED_TERM',
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
    sessions: null,
    type: 'FIXED_TERM',
  },

  // ===== SESSION_BASED (Theo buổi tập) =====
  {
    code: 'PKG-DROPIN',
    name: 'Vé Tập Lẻ (1 Buổi)',
    description: 'Tập 1 buổi không giới hạn khung giờ — phù hợp khách vãng lai.',
    features: {
      title: 'Vé Tập Lẻ (1 Buổi)',
      items: [
        'Tập 1 buổi không giới hạn khung giờ',
        'Sử dụng tủ đồ và phòng tắm nóng lạnh',
        'Hướng dẫn sử dụng máy cơ bản',
      ],
    },
    durationDays: 1,
    price: 80000,
    sessions: 1,
    type: 'SESSION_BASED',
  },
  {
    code: 'PKG-10S',
    name: 'Gói 10 Buổi',
    description: 'Chỉ 70.000đ/buổi — thời hạn 60 ngày, linh hoạt cho người bận rộn.',
    features: {
      title: 'Gói 10 Buổi',
      items: [
        '10 buổi tập (70.000đ/buổi)',
        'Thời hạn 60 ngày',
        'Sử dụng toàn bộ thiết bị Gym + Cardio',
        'Hướng dẫn sử dụng máy cơ bản',
      ],
    },
    durationDays: 60,
    price: 700000,
    sessions: 10,
    type: 'SESSION_BASED',
  },
  {
    code: 'PKG-20S',
    name: 'Gói 20 Buổi',
    description: 'Chỉ 65.000đ/buổi — kèm 1 buổi tư vấn kế hoạch tập với HLV.',
    features: {
      title: 'Gói 20 Buổi',
      items: [
        '20 buổi tập (65.000đ/buổi)',
        'Thời hạn 120 ngày',
        'Sử dụng toàn bộ thiết bị Gym + Cardio',
        '1 buổi tư vấn kế hoạch tập với HLV',
      ],
    },
    durationDays: 120,
    price: 1300000,
    sessions: 20,
    type: 'SESSION_BASED',
  },
  {
    code: 'PKG-50S',
    name: 'Gói 50 Buổi',
    description: 'Chỉ 60.000đ/buổi — tối ưu nhất cho người tập đều đặn cả năm.',
    features: {
      title: 'Gói 50 Buổi',
      items: [
        '50 buổi tập (60.000đ/buổi)',
        'Thời hạn 365 ngày',
        'Sử dụng toàn bộ thiết bị Gym + Cardio',
        '2 buổi tư vấn kế hoạch tập với HLV',
        'Tặng khăn tập',
      ],
    },
    durationDays: 365,
    price: 3000000,
    sessions: 50,
    type: 'SESSION_BASED',
  },
];

async function main() {
  // Không có membership nào tham chiếu → an toàn xoá hết gói cũ
  const membershipCount = await prisma.membership.count();
  if (membershipCount > 0) {
    console.log(`Có ${membershipCount} membership — chỉ update, không xoá gói cũ.`);
  } else {
    const deleted = await prisma.membershipPackage.deleteMany({});
    console.log(`Đã xoá ${deleted.count} gói cũ (không có membership tham chiếu).`);
  }

  for (const pkg of PACKAGES) {
    const data = {
      name: pkg.name,
      description: pkg.description,
      features: JSON.stringify(pkg.features),
      durationDays: pkg.durationDays,
      price: new Prisma.Decimal(pkg.price.toFixed(2)),
      sessions: pkg.sessions,
      type: pkg.type,
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
      `  ${p.code.padEnd(14)} | ${p.type.padEnd(13)} | ${String(p.price).padStart(10)}đ | ${p.durationDays}d | ${p.sessions ?? '-'} buổi | ${p.name}`,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
