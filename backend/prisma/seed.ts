import { PrismaClient, UserRole, Gender, MemberStatus, PackageType, PaymentMethod, PaymentStatus, EquipmentStatus, SessionType, InvoiceStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Branch
  const branch = await prisma.branch.upsert({
    where: { code: 'BR-BH01' },
    update: {},
    create: {
      code: 'BR-BH01',
      name: 'LHU Fitness & Gym Center - Biên Hòa',
      address: 'Số 10 Huỳnh Văn Nghệ, Phường Bửu Long, TP. Biên Hòa, Đồng Nai',
      phone: '0251.3952.778',
      email: 'contact@lhugym.vn',
      description: 'Cơ sở chính trực thuộc Trường Đại Học Lạc Hồng - khu vực tập luyện hiện đại 3 tầng.',
      openingTime: '05:30',
      closingTime: '21:30',
      openingHours: '05:30 - 21:30 (Tất cả các ngày)',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Created branch:', branch.name);

  // Branch phụ phục vụ demo Branch Selector / lọc đa chi nhánh
  const branch2 = await prisma.branch.upsert({
    where: { code: 'BR-TD01' },
    update: {},
    create: {
      code: 'BR-TD01',
      name: 'GymMaster - Thủ Đức',
      address: '52 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP. Hồ Chí Minh',
      phone: '028.3727.1886',
      email: 'thuduc@gymmaster.vn',
      description: 'Cơ sở phía Đông TP.HCM, nổi bật khu Group Class và phòng Yoga riêng.',
      openingTime: '05:00',
      closingTime: '22:00',
      openingHours: '05:00 - 22:00 (Thứ 2 - CN)',
      status: 'ACTIVE',
    },
  });

  const branch3 = await prisma.branch.upsert({
    where: { code: 'BR-Q101' },
    update: {},
    create: {
      code: 'BR-Q101',
      name: 'GymMaster - Quận 1',
      address: '7 Nguyễn Bỉnh Khiêm, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      phone: '028.3829.2080',
      email: 'q1@gymmaster.vn',
      description: 'Cơ sở trung tâm thành phố - trọng tâm đào tạo cá nhân (PT Studio).',
      openingTime: '06:00',
      closingTime: '22:30',
      openingHours: '06:00 - 22:30 (Tất cả các ngày)',
      status: 'ACTIVE',
    },
  });

  // 2. Rooms
  const cardioRoom = await prisma.room.upsert({
    where: { id: 'room-cardio-01' },
    update: {},
    create: {
      id: 'room-cardio-01',
      code: 'BR-BH01-R01',
      name: 'Phòng Cardio & Máy Chạy',
      type: 'CARDIO',
      capacity: 30,
      floor: '1',
      description: 'Khu máy chạy bộ, xe đạp và máy tập cardio đa năng.',
      branchId: branch.id,
      status: 'AVAILABLE',
    },
  });

  const weightRoom = await prisma.room.upsert({
    where: { id: 'room-weight-01' },
    update: {},
    create: {
      id: 'room-weight-01',
      code: 'BR-BH01-R02',
      name: 'Phòng Tạ Tự Do (Free Weight)',
      type: 'WEIGHT_AREA',
      capacity: 40,
      floor: '2',
      description: 'Khu tạ đơn, tạ đòn và khu vực bench press chuyên dụng.',
      branchId: branch.id,
      status: 'AVAILABLE',
    },
  });

  // Rooms cho branch phụ
  const tdClassRoom = await prisma.room.upsert({
    where: { id: 'room-td-class-01' },
    update: {},
    create: {
      id: 'room-td-class-01',
      code: 'BR-TD01-R01',
      name: 'Studio Group Class',
      type: 'GROUP_CLASS',
      capacity: 25,
      floor: '1',
      description: 'Phòng tập lớp nhóm: HIIT, Zumba, Body Combat.',
      branchId: branch2.id,
      status: 'AVAILABLE',
    },
  });

  const tdYogaRoom = await prisma.room.upsert({
    where: { id: 'room-td-yoga-01' },
    update: {},
    create: {
      id: 'room-td-yoga-01',
      code: 'BR-TD01-R02',
      name: 'Phòng Yoga & Pilates',
      type: 'YOGA',
      capacity: 18,
      floor: '2',
      description: 'Không gian yên tĩnh, thảm tập và dụng cụ hỗ trợ yoga.',
      branchId: branch2.id,
      status: 'AVAILABLE',
    },
  });

  const q1PtRoom = await prisma.room.upsert({
    where: { id: 'room-q1-pt-01' },
    update: {},
    create: {
      id: 'room-q1-pt-01',
      code: 'BR-Q101-R01',
      name: 'PT Studio',
      type: 'PERSONAL_TRAINING',
      capacity: 6,
      floor: '1',
      description: 'Studio huấn luyện cá nhân 1-1 với HLV.',
      branchId: branch3.id,
      status: 'AVAILABLE',
    },
  });

  // 3. Users (RBAC: ADMIN, MANAGER, STAFF, TRAINER)
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@123456', salt);
  const managerPassword = await bcrypt.hash('Manager@123456', salt);
  const staffPassword = await bcrypt.hash('Staff@123456', salt);
  const trainerPassword = await bcrypt.hash('Trainer@123456', salt);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gym.com' },
    update: {},
    create: {
      email: 'admin@gym.com',
      passwordHash: adminPassword,
      fullName: 'Tổng Quản Trị Hệ Thống',
      phone: '0901234567',
      role: UserRole.ADMIN,
      branchId: branch.id,
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@gym.com' },
    update: {},
    create: {
      email: 'manager@gym.com',
      passwordHash: managerPassword,
      fullName: 'Quản Lý Chi Nhánh',
      phone: '0902345678',
      role: UserRole.MANAGER,
      branchId: branch.id,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@gym.com' },
    update: {},
    create: {
      email: 'staff@gym.com',
      passwordHash: staffPassword,
      fullName: 'Nhân Viên Lễ Tân',
      phone: '0903456789',
      role: UserRole.STAFF,
      branchId: branch.id,
    },
  });

  const trainerUser = await prisma.user.upsert({
    where: { email: 'trainer@gym.com' },
    update: {},
    create: {
      email: 'trainer@gym.com',
      passwordHash: trainerPassword,
      fullName: 'HLV Nguyễn Văn Thể',
      phone: '0904567890',
      role: UserRole.TRAINER,
      branchId: branch.id,
    },
  });

  // Thêm 2 HLV nữa để trang public trainers phong phú
  const trainerUser2 = await prisma.user.upsert({
    where: { email: 'trainer2@gym.com' },
    update: {},
    create: {
      email: 'trainer2@gym.com',
      passwordHash: trainerPassword,
      fullName: 'HLV Trần Thị Mai',
      phone: '0905567890',
      role: UserRole.TRAINER,
      branchId: branch.id,
    },
  });

  const trainerUser3 = await prisma.user.upsert({
    where: { email: 'trainer3@gym.com' },
    update: {},
    create: {
      email: 'trainer3@gym.com',
      passwordHash: trainerPassword,
      fullName: 'HLV Lê Minh Hoàng',
      phone: '0906567890',
      role: UserRole.TRAINER,
      branchId: branch.id,
    },
  });

  // 4. Trainer Profile
  await prisma.trainer.upsert({
    where: { userId: trainerUser.id },
    update: { certification: 'ISSA Certified Personal Trainer, WFF-Asia' },
    create: {
      userId: trainerUser.id,
      specialization: 'Tăng cơ giảm mỡ, Thể hình chuyên nghiệp (Bodybuilding)',
      certification: 'ISSA Certified Personal Trainer, WFF-Asia',
      experienceYears: 5,
      bio: 'Chứng chỉ HLV Thể hình Quốc tế, cựu vận động viên thể hình Đông Nam Á. Chuyên gia thiết kế giáo án tăng cơ, giảm mỡ cho hơn 500 học viên.',
      rating: 4.9,
      hourlyRate: 350000,
    },
  });

  await prisma.trainer.upsert({
    where: { userId: trainerUser2.id },
    update: {},
    create: {
      userId: trainerUser2.id,
      specialization: 'Yoga, Pilates & Giãn cơ phục hồi',
      certification: 'RYT-500 Yoga Alliance, ACE Group Fitness',
      experienceYears: 4,
      bio: 'HLV Yoga & Pilates chứng nhận quốc tế. Chuyên cải thiện sự linh hoạt, tư thế và phục hồi sau chấn thương cho học viên mọi lứa tuổi.',
      rating: 4.8,
      hourlyRate: 300000,
    },
  });

  await prisma.trainer.upsert({
    where: { userId: trainerUser3.id },
    update: {},
    create: {
      userId: trainerUser3.id,
      specialization: 'HIIT, CrossFit & Rèn luyện sức bền',
      certification: 'CrossFit L2 Trainer, NSCA-CPT',
      experienceYears: 6,
      bio: 'Cựu vận động viên điền kinh quốc gia. Chuyên các lớp HIIT, CrossFit, rèn thể lực tổng hợp và tinh thần thép.',
      rating: 4.7,
      hourlyRate: 320000,
    },
  });
  console.log('✅ Created users and trainer profiles');

  // 5. Membership Packages
  const pkg1M = await prisma.membershipPackage.upsert({
    where: { code: 'PKG-1M' },
    update: {
      features: {
        title: 'Gói Cơ Bản 1 Tháng (Basic)',
        items: ['Tập luyện không giới hạn thời gian', '1 chi nhánh', 'Phòng Gym + Cardio', 'Tủ đồ cá nhân', 'Hướng dẫn sử dụng máy cơ bản'],
      },
    },
    create: {
      code: 'PKG-1M',
      name: 'Gói Cơ Bản 1 Tháng (Basic)',
      description: 'Tập luyện không giới hạn thời gian tại 1 chi nhánh',
      features: {
        title: 'Gói Cơ Bản 1 Tháng (Basic)',
        items: ['Tập luyện không giới hạn thời gian', '1 chi nhánh', 'Phòng Gym + Cardio', 'Tủ đồ cá nhân', 'Hướng dẫn sử dụng máy cơ bản'],
      },
      durationDays: 30,
      price: 450000,
      type: PackageType.FIXED_TERM,
    },
  });

  const pkg6M = await prisma.membershipPackage.upsert({
    where: { code: 'PKG-6M-VIP' },
    update: {
      features: {
        title: 'Gói VIP 6 Tháng',
        items: ['Toàn quyền sử dụng dịch vụ gym', 'Khu xông hơi & massage', 'Tặng 3 buổi tập cùng HLV', '1 chi nhánh', 'Ưu đãi 10% dịch vụ bổ sung'],
      },
    },
    create: {
      code: 'PKG-6M-VIP',
      name: 'Gói VIP 6 Tháng',
      description: 'Toàn quyền sử dụng dịch vụ gym, xông hơi và tặng 3 buổi cùng HLV',
      features: {
        title: 'Gói VIP 6 Tháng',
        items: ['Toàn quyền sử dụng dịch vụ gym', 'Khu xông hơi & massage', 'Tặng 3 buổi tập cùng HLV', '1 chi nhánh', 'Ưu đãi 10% dịch vụ bổ sung'],
      },
      durationDays: 180,
      price: 2400000,
      type: PackageType.FIXED_TERM,
    },
  });

  const pkg12M = await prisma.membershipPackage.upsert({
    where: { code: 'PKG-12M-DIAMOND' },
    update: {
      features: {
        title: 'Gói Kim Cương 12 Tháng',
        items: ['Trọn gói cao cấp', 'Không giới hạn CHI NHÁNH', 'Tặng khăn tập & tủ đồ VIP', 'Tặng 6 buổi PT trị giá 2.100.000đ', 'Ưu tiên đặt phòng & lớp học'],
      },
    },
    create: {
      code: 'PKG-12M-DIAMOND',
      name: 'Gói Kim Cương 12 Tháng',
      description: 'Trọn gói cao cấp không giới hạn chi nhánh, tặng khăn tập và tủ đồ VIP',
      features: {
        title: 'Gói Kim Cương 12 Tháng',
        items: ['Trọn gói cao cấp', 'Không giới hạn CHI NHÁNH', 'Tặng khăn tập & tủ đồ VIP', 'Tặng 6 buổi PT trị giá 2.100.000đ', 'Ưu tiên đặt phòng & lớp học'],
      },
      durationDays: 365,
      price: 4200000,
      type: PackageType.FIXED_TERM,
    },
  });
  console.log('✅ Created membership packages');

  // 6. Sample Member (+ tài khoản đăng nhập MEMBER để test member portal)
  const memberPassword = await bcrypt.hash('Member@123456', salt);
  const memberUser = await prisma.user.upsert({
    where: { email: 'member@gym.com' },
    update: {},
    create: {
      email: 'member@gym.com',
      passwordHash: memberPassword,
      fullName: 'Trần Minh Quân',
      phone: '0987654321',
      role: UserRole.MEMBER,
      branchId: branch.id,
    },
  });

  const member = await prisma.member.upsert({
    where: { code: 'MEM-0001' },
    update: { userId: memberUser.id },
    create: {
      code: 'MEM-0001',
      userId: memberUser.id,
      fullName: 'Trần Minh Quân',
      email: 'member@gym.com',
      phone: '0987654321',
      gender: Gender.MALE,
      dateOfBirth: new Date('1998-05-15'),
      address: 'Phường Tân Tiến, TP. Biên Hòa, Đồng Nai',
      emergencyContact: 'Nguyễn Văn Ba - 0911222333',
      status: MemberStatus.ACTIVE,
      branchId: branch.id,
    },
  });

  // 7. Active Membership (chỉ tạo nếu chưa có để tránh trùng lặp khi seed lại)
  const existingMembershipCount = await prisma.membership.count({
    where: { memberId: member.id },
  });

  let membership: any = null;
  if (existingMembershipCount === 0) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 180);

    membership = await prisma.membership.create({
      data: {
        memberId: member.id,
        packageId: pkg6M.id,
        startDate: startDate,
        endDate: endDate,
        price: pkg6M.price,
        finalAmount: pkg6M.price,
        status: 'ACTIVE',
      },
    });
  } else {
    membership = await prisma.membership.findFirst({
      where: { memberId: member.id },
      orderBy: { createdAt: 'asc' },
    });
  }

  // 8. Payment (chỉ tạo nếu chưa có) + Invoice đi kèm (1-1)
  const existingPayment = await prisma.payment.findUnique({
    where: { code: 'INV-2026-0001' },
  });
  if (!existingPayment) {
    await prisma.payment.create({
      data: {
        code: 'INV-2026-0001',
        memberId: member.id,
        membershipId: membership.id,
        amount: pkg6M.price,
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PAID,
        transactionRef: 'VCB-987123984',
        paidAt: new Date(),
        notes: 'Thanh toán chuyển khoản qua ngân hàng Vietcombank',
      },
    });
  }

  const existingInvoice = await prisma.invoice.findUnique({
    where: { invoiceNumber: 'INV-2026-0001' },
  });
  if (!existingInvoice) {
    const seedPayment = await prisma.payment.findUnique({
      where: { code: 'INV-2026-0001' },
    });
    await prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2026-0001',
        memberId: member.id,
        membershipId: membership.id,
        paymentId: seedPayment?.id,
        subtotal: pkg6M.price,
        discount: 0,
        total: pkg6M.price,
        status: InvoiceStatus.PAID,
        issuedAt: new Date(),
      },
    });
  }

  // 9. Equipment
  await prisma.equipment.upsert({
    where: { code: 'EQ-RUN-01' },
    update: {},
    create: {
      code: 'EQ-RUN-01',
      name: 'Máy Chạy Bộ Điện Cao Cấp Matrix T70',
      category: 'CARDIO',
      branchId: branch.id,
      roomId: cardioRoom.id,
      brand: 'Matrix',
      model: 'T70-XR',
      serialNumber: 'MTX-T70-2024-001',
      purchaseDate: new Date('2024-01-15'),
      purchasePrice: 45000000,
      warrantyExpiry: new Date('2027-01-15'),
      condition: 'GOOD',
      status: EquipmentStatus.AVAILABLE,
      nextMaintenanceAt: new Date(new Date().getTime() + 20 * 24 * 60 * 60 * 1000),
      description: 'Máy chạy bộ điện cao cấp dành cho khu cardio.',
    },
  });

  await prisma.equipment.upsert({
    where: { code: 'EQ-BENCH-01' },
    update: {},
    create: {
      code: 'EQ-BENCH-01',
      name: 'Ghế Đẩy Tạ Đa Năng Olympic Bench Press',
      category: 'FREE_WEIGHT',
      branchId: branch.id,
      roomId: weightRoom.id,
      brand: 'Inspire',
      model: 'BENCH-PRO',
      serialNumber: 'ISP-BN-2023-088',
      purchaseDate: new Date('2023-11-20'),
      purchasePrice: 18000000,
      warrantyExpiry: new Date('2026-11-20'),
      condition: 'GOOD',
      status: EquipmentStatus.AVAILABLE,
      nextMaintenanceAt: new Date(new Date().getTime() - 5 * 24 * 60 * 60 * 1000),
      description: 'Ghế đẩy tạ đa năng sử dụng tại khu free weight.',
    },
  });

  await prisma.equipment.upsert({
    where: { code: 'EQ-SQUAT-01' },
    update: {},
    create: {
      code: 'EQ-SQUAT-01',
      name: 'Khung Squat Rack An Toàn',
      category: 'FREE_WEIGHT',
      branchId: branch.id,
      roomId: weightRoom.id,
      brand: 'Rogue',
      model: 'RM-6',
      serialNumber: 'RGE-RM6-2025-014',
      purchaseDate: new Date('2025-03-01'),
      purchasePrice: 65000000,
      warrantyExpiry: new Date('2028-03-01'),
      condition: 'EXCELLENT',
      status: EquipmentStatus.IN_USE,
      nextMaintenanceAt: new Date(new Date().getTime() + 45 * 24 * 60 * 60 * 1000),
      description: 'Khung squat an toàn với thanh đòn Olympic.',
    },
  });

  // Equipment cho branch phụ (Thủ Đức)
  await prisma.equipment.upsert({
    where: { code: 'EQ-TD-CYCLE-01' },
    update: {},
    create: {
      code: 'EQ-TD-CYCLE-01',
      name: 'Xe Đạp Trong Nhà Keiser M3i',
      category: 'CARDIO',
      branchId: branch2.id,
      roomId: tdClassRoom.id,
      brand: 'Keiser',
      model: 'M3i',
      serialNumber: 'KSR-M3I-2024-220',
      purchaseDate: new Date('2024-06-10'),
      purchasePrice: 38000000,
      warrantyExpiry: new Date('2027-06-10'),
      condition: 'GOOD',
      status: EquipmentStatus.AVAILABLE,
      nextMaintenanceAt: new Date(new Date().getTime() + 60 * 24 * 60 * 60 * 1000),
      description: 'Xe đạp trong nhà chuyên dụng cho lớp spinning.',
    },
  });

  await prisma.equipment.upsert({
    where: { code: 'EQ-TD-MAT-01' },
    update: {},
    create: {
      code: 'EQ-TD-MAT-01',
      name: 'Bộ Thảm Tập Yoga Cao Su TPE',
      category: 'ACCESSORY',
      branchId: branch2.id,
      roomId: tdYogaRoom.id,
      brand: 'Manduka',
      model: 'PRO 6mm',
      serialNumber: 'MDK-PRO-2025-050',
      purchaseDate: new Date('2025-01-05'),
      purchasePrice: 2500000,
      warrantyExpiry: new Date('2028-01-05'),
      condition: 'EXCELLENT',
      status: EquipmentStatus.AVAILABLE,
      nextMaintenanceAt: new Date(new Date().getTime() + 90 * 24 * 60 * 60 * 1000),
      description: 'Thảm tập cao su cao cấp cho phòng yoga.',
    },
  });

  // 10. Promotion
  await prisma.promotion.upsert({
    where: { code: 'SUMMER2026' },
    update: {},
    create: {
      code: 'SUMMER2026',
      name: 'Chào Hè 2026 - Giảm 15% tất cả gói tập',
      description: 'Áp dụng cho học viên đăng ký mới các gói từ 6 tháng trở lên',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-08-31'),
      usageLimit: 100,
      perMemberLimit: 2,
      usedCount: 1,
    },
  });

  // STEP 8 — thêm mã KM đang hiệu lực (chạy nhiều lần không trùng, không reset DB)
  await prisma.promotion.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      name: 'Chào mừng hội viên mới - Giảm 10%',
      description: 'Giảm 10% cho hội viên đăng ký gói tập lần đầu (mỗi người dùng 1 lần)',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxDiscount: 500000,
      minOrderValue: 1000000,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      usageLimit: 100,
      perMemberLimit: 1,
      status: 'ACTIVE',
    },
  });

  await prisma.promotion.upsert({
    where: { code: 'FIXED500' },
    update: {},
    create: {
      code: 'FIXED500',
      name: 'Ưu đãi Tết - Giảm 500.000đ',
      description: 'Giảm cố định 500.000đ cho mọi đơn đăng ký gói từ 3 tháng',
      discountType: 'FIXED_AMOUNT',
      discountValue: 500000,
      minOrderValue: 2000000,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      usageLimit: 50,
      perMemberLimit: 1,
      status: 'ACTIVE',
    },
  });

  // Mã sắp hết hạn (2 ngày) để ticker sinh thông báo PROMOTION_ENDING
  const endSoonDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  await prisma.promotion.upsert({
    where: { code: 'ENDSOON7' },
    update: {},
    create: {
      code: 'ENDSOON7',
      name: 'Flash Sale cuối tháng - Giảm 20%',
      description: 'Chỉ còn 2 ngày cuối! Giảm 20% toàn bộ gói tập.',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      maxDiscount: 800000,
      startDate: new Date('2026-01-01'),
      endDate: endSoonDate,
      usageLimit: 30,
      perMemberLimit: 1,
      status: 'ACTIVE',
    },
  });

  // 11. Lịch tập mẫu (cho member + lớp học công khai)
  const scheduleCount = await prisma.trainingSchedule.count();
  if (scheduleCount === 0) {
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    const trainer1 = await prisma.trainer.findUnique({
      where: { userId: trainerUser.id },
    });

    // Buổi PT riêng cho member
    await prisma.trainingSchedule.create({
      data: {
        title: 'PT - Tăng cơ toàn thân',
        trainerId: trainer1.id,
        memberId: member.id,
        roomId: weightRoom.id,
        startTime: new Date(now.getTime() + 1 * dayMs),
        endTime: new Date(now.getTime() + 1 * dayMs + 60 * 60 * 1000),
        status: 'SCHEDULED',
      },
    });

    await prisma.trainingSchedule.create({
      data: {
        title: 'PT - Cardio & Đốt mỡ',
        trainerId: trainer1.id,
        memberId: member.id,
        roomId: cardioRoom.id,
        startTime: new Date(now.getTime() + 3 * dayMs),
        endTime: new Date(now.getTime() + 3 * dayMs + 60 * 60 * 1000),
        status: 'SCHEDULED',
      },
    });

    // Lớp học công khai (không gắn member)
    const trainer2 = await prisma.trainer.findUnique({
      where: { userId: trainerUser2.id },
    });
    const trainer3 = await prisma.trainer.findUnique({
      where: { userId: trainerUser3.id },
    });

    await prisma.trainingSchedule.createMany({
      data: [
        {
          title: 'Yoga Thư Giãn & Giãn Cơ',
          trainerId: trainer2.id,
          memberId: null,
          roomId: cardioRoom.id,
          startTime: new Date(now.getTime() + 1 * dayMs + 2 * 60 * 60 * 1000),
          endTime: new Date(now.getTime() + 1 * dayMs + 3 * 60 * 60 * 1000),
          status: 'SCHEDULED',
        },
        {
          title: 'HIIT Burn - Đốt mỡ toàn thân',
          trainerId: trainer3.id,
          memberId: null,
          roomId: weightRoom.id,
          startTime: new Date(now.getTime() + 2 * dayMs + 7 * 60 * 60 * 1000),
          endTime: new Date(now.getTime() + 2 * dayMs + 8 * 60 * 60 * 1000),
          status: 'SCHEDULED',
        },
        {
          title: 'CrossFit Functional Training',
          trainerId: trainer3.id,
          memberId: null,
          roomId: weightRoom.id,
          startTime: new Date(now.getTime() + 4 * dayMs + 7 * 60 * 60 * 1000),
          endTime: new Date(now.getTime() + 4 * dayMs + 8 * 60 * 60 * 1000),
          status: 'SCHEDULED',
        },
        {
          title: 'Pilates Core & Posture',
          trainerId: trainer2.id,
          memberId: null,
          roomId: cardioRoom.id,
          startTime: new Date(now.getTime() + 5 * dayMs + 2 * 60 * 60 * 1000),
          endTime: new Date(now.getTime() + 5 * dayMs + 3 * 60 * 60 * 1000),
          status: 'SCHEDULED',
        },
      ],
    });

    console.log('✅ Created schedules (member PT + public classes)');
  }

  // 12. Check-in lịch sử cho member (chỉ tạo lần đầu)
  const memberCheckInCount = await prisma.checkIn.count({
    where: { memberId: member.id },
  });
  if (memberCheckInCount === 0) {
    const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
    const atTime = (d: Date, hour: number, minute = 0) => {
      const copy = new Date(d);
      copy.setHours(hour, minute, 0, 0);
      return copy;
    };
    const today = new Date();
    await prisma.checkIn.createMany({
      data: [
        {
          memberId: member.id,
          branchId: branch.id,
          checkInTime: atTime(today, 8, 15),
          checkOutTime: atTime(today, 9, 55),
          status: 'CHECKED_OUT',
          method: 'MANUAL',
          notes: 'Tập gym buổi sáng',
        },
        {
          memberId: member.id,
          branchId: branch.id,
          checkInTime: daysAgo(1),
          checkOutTime: new Date(daysAgo(1).getTime() + 90 * 60 * 1000),
          status: 'CHECKED_OUT',
          method: 'QR_CODE',
          notes: 'Tập gym cá nhân',
        },
        {
          memberId: member.id,
          branchId: branch.id,
          checkInTime: daysAgo(3),
          checkOutTime: new Date(daysAgo(3).getTime() + 75 * 60 * 1000),
          status: 'CHECKED_OUT',
          method: 'STAFF',
          notes: 'Lớp Yoga',
        },
        {
          memberId: member.id,
          branchId: branch.id,
          checkInTime: daysAgo(5),
          checkOutTime: new Date(daysAgo(5).getTime() + 120 * 60 * 1000),
          status: 'CHECKED_OUT',
          method: 'MANUAL',
          notes: 'Buổi tập với PT',
        },
      ],
    });
    console.log('✅ Created check-in history for member');
  }

  // 13. Thông báo mẫu cho member
  const memberNotifCount = await prisma.notification.count({
    where: { memberId: member.id },
  });
  if (memberNotifCount === 0) {
    await prisma.notification.createMany({
      data: [
        {
          memberId: member.id,
          title: 'Thanh toán thành công 💳',
          content: 'Hóa đơn INV-2026-0001 (gói VIP 6 Tháng) đã được thanh toán thành công qua chuyển khoản ngân hàng.',
          type: 'PAYMENT',
          link: '/member/payments',
          isRead: true,
          readAt: new Date(),
          referenceType: 'PAYMENT_CONFIRMED',
          referenceId: 'seed-inv-0001',
        },
        {
          memberId: member.id,
          title: 'Nhắc lịch tập 📅',
          content: 'Bạn có buổi tập PT "Tăng cơ toàn thân" vào ngày mai. Đừng quên đến đúng giờ nhé!',
          type: 'SCHEDULE',
          link: '/member/schedule',
          isRead: false,
        },
        {
          memberId: member.id,
          title: 'Chào mừng đến với GymMaster Pro 💪',
          content: 'Cảm ơn bạn đã đăng ký làm hội viên. Chúc bạn có những buổi tập hiệu quả!',
          type: 'SYSTEM',
          link: '/member/dashboard',
          isRead: false,
        },
      ],
    });
    console.log('✅ Created notifications for member');
  }

  // 14. Phân công HLV ↔ hội viên + lịch sử buổi PT (chỉ tạo lần đầu)
  const assignmentCount = await prisma.trainerMember.count({
    where: { memberId: member.id },
  });
  if (assignmentCount === 0) {
    const trainer1 = await prisma.trainer.findUnique({ where: { userId: trainerUser.id } });
    await prisma.trainerMember.create({
      data: {
        trainerId: trainer1.id,
        memberId: member.id,
        status: 'ACTIVE',
        note: 'Phân công mặc định khi seed dữ liệu mẫu',
      },
    });
    console.log('✅ Created trainer-member assignment');
  }

  // Cập nhật loại buổi tập + chi nhánh cho lịch mẫu (không xóa dữ liệu)
  await prisma.trainingSchedule.updateMany({
    where: { memberId: { not: null } },
    data: { type: SessionType.PERSONAL_TRAINING, branchId: branch.id },
  });
  await prisma.trainingSchedule.updateMany({
    where: { memberId: null },
    data: { type: SessionType.GROUP_CLASS, branchId: branch.id },
  });

  // Lịch sử buổi tập đã hoàn thành + ghi chú tiến trình (chỉ tạo lần đầu)
  const completedCount = await prisma.trainingSchedule.count({
    where: { memberId: member.id, status: 'COMPLETED' },
  });
  if (completedCount === 0) {
    const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
    const atTime = (d: Date, hour: number, minute = 0) => {
      const copy = new Date(d);
      copy.setHours(hour, minute, 0, 0);
      return copy;
    };
    const trainer1 = await prisma.trainer.findUnique({ where: { userId: trainerUser.id } });

    const past1 = await prisma.trainingSchedule.create({
      data: {
        title: 'PT - Kỹ thuật Squat & Deadlift',
        trainerId: trainer1.id,
        memberId: member.id,
        branchId: branch.id,
        roomId: weightRoom.id,
        type: SessionType.PERSONAL_TRAINING,
        startTime: atTime(daysAgo(4), 17),
        endTime: atTime(daysAgo(4), 18),
        status: 'COMPLETED',
        completedAt: atTime(daysAgo(4), 18),
        description: 'Tập trung kỹ thuật squat sâu và deadlift an toàn.',
      },
    });

    await prisma.trainingSchedule.create({
      data: {
        title: 'PT - Cardio cường độ trung bình',
        trainerId: trainer1.id,
        memberId: member.id,
        branchId: branch.id,
        roomId: cardioRoom.id,
        type: SessionType.PERSONAL_TRAINING,
        startTime: atTime(daysAgo(7), 18),
        endTime: atTime(daysAgo(7), 19),
        status: 'COMPLETED',
        completedAt: atTime(daysAgo(7), 19),
        description: 'Rèn luyện sức bền tim mạch, giữ nhịp 130-140 bpm.',
      },
    });

    await prisma.trainingProgress.create({
      data: {
        sessionId: past1.id,
        memberId: member.id,
        trainerId: trainer1.id,
        note: 'Buổi tập trọng tâm: kỹ thuật squat & deadlift.',
        performance:
          'Member hoàn thành tốt bài tập chân. Squat 4 hiệp × 8 reps với 80% sức tối đa, kỹ thuật giữ lưng thẳng tốt.',
        recommendation:
          'Cần tăng dần mức tạ 5kg trong các buổi tiếp theo và giãn cơ đùi sau 10 phút sau buổi tập.',
      },
    });
    console.log('✅ Created completed PT history + training progress');
  }

  // 15. Backfill STEP 7 (idempotent, KHÔNG xóa dữ liệu cũ)
  // - Gán code cho phòng chưa có code (VD: BR-BH01-R01) — unique trong branch
  const allBranches = await prisma.branch.findMany({ include: { rooms: true } });
  for (const b of allBranches) {
    let idx = 1;
    for (const r of b.rooms) {
      if (!r.code || r.code.trim() === '') {
        const newCode = `${b.code}-R${String(idx).padStart(2, '0')}`;
        await prisma.room.update({
          where: { id: r.id },
          data: { code: newCode },
        });
      }
      idx += 1;
    }
  }
  // - Đổi status equipment legacy sang chuẩn STEP 7 (giữ nguyên bản ghi)
  await prisma.equipment.updateMany({
    where: { status: EquipmentStatus.OPERATIONAL },
    data: { status: EquipmentStatus.AVAILABLE },
  });
  await prisma.equipment.updateMany({
    where: { status: EquipmentStatus.UNDER_MAINTENANCE },
    data: { status: EquipmentStatus.MAINTENANCE },
  });
  console.log('✅ Backfill STEP 7 (room codes + equipment status)');

  // -------------------------------------------------------------
  // 16. STEP 9 — Làm phong phú dữ liệu demo (graduation demo)
  //     Thêm ~10 hội viên + membership đa trạng thái + payment/invoice
  //     + check-in + lịch tập + phân công HLV + bảo trì + mã KM hết hạn.
  //     Idempotent: upsert / đếm trước khi create, KHÔNG xóa dữ liệu cũ.
  // -------------------------------------------------------------
  const dayMs = 24 * 60 * 60 * 1000;
  // Marker cho dữ liệu do block STEP 9 sinh ra. Đặt ở field KHÔNG hiển thị ra
  // giao diện (notes/description) để seed idempotent mà tiêu đề/URL demo vẫn sạch.
  const SEED9_MARKER = 'seed-step9';
  const daysAgo9 = (n: number) => new Date(Date.now() - n * dayMs);
  const daysFromNow9 = (n: number) => new Date(Date.now() + n * dayMs);
  const atHour9 = (d: Date, hour: number, minute = 0) => {
    const c = new Date(d);
    c.setHours(hour, minute, 0, 0);
    return c;
  };

  const pkg9_1m = await prisma.membershipPackage.findUnique({ where: { code: 'PKG-1M' } });
  const pkg9_6m = await prisma.membershipPackage.findUnique({ where: { code: 'PKG-6M-VIP' } });
  const pkg9_12m = await prisma.membershipPackage.findUnique({ where: { code: 'PKG-12M-DIAMOND' } });

  // 16.1 Hội viên demo
  const demoMembers = [
    { code: 'MEM-0002', name: 'Lê Hoàng Anh', branchRef: branch, email: 'member2@gym.com', phone: '0912000002', gender: Gender.MALE, dob: '1996-03-12' },
    { code: 'MEM-0003', name: 'Phạm Thị Ngọc', branchRef: branch, email: 'member3@gym.com', phone: '0912000003', gender: Gender.FEMALE, dob: '1999-07-25' },
    { code: 'MEM-0004', name: 'Võ Đức Thịnh', branchRef: branch, email: 'member4@gym.com', phone: '0912000004', gender: Gender.MALE, dob: '1994-11-02' },
    { code: 'MEM-0005', name: 'Đặng Quốc Huy', branchRef: branch, email: 'member5@gym.com', phone: '0912000005', gender: Gender.MALE, dob: '1997-01-19' },
    { code: 'MEM-0006', name: 'Bùi Thanh Tâm', branchRef: branch, email: 'member6@gym.com', phone: '0912000006', gender: Gender.FEMALE, dob: '2000-09-08' },
    { code: 'MEM-0007', name: 'Hoàng Văn Dũng', branchRef: branch, email: 'member7@gym.com', phone: '0912000007', gender: Gender.MALE, dob: '1992-05-30' },
    { code: 'MEM-0008', name: 'Trương Thị Hồng', branchRef: branch, email: 'member8@gym.com', phone: '0912000008', gender: Gender.FEMALE, dob: '1998-12-14' },
    { code: 'MEM-0009', name: 'Nguyễn Phương Linh', branchRef: branch, email: 'member9@gym.com', phone: '0912000009', gender: Gender.FEMALE, dob: '2001-02-23' },
    { code: 'MEM-0010', name: 'Đỗ Minh Khôi', branchRef: branch2, email: 'member10@gym.com', phone: '0912000010', gender: Gender.MALE, dob: '1995-08-17' },
    { code: 'MEM-0011', name: 'Hà Thị Bích', branchRef: branch3, email: 'member11@gym.com', phone: '0912000011', gender: Gender.FEMALE, dob: '1993-04-05' },
  ];

  const memberRecords9: Record<string, any> = {};
  for (const dm of demoMembers) {
    const u = await prisma.user.upsert({
      where: { email: dm.email },
      update: {},
      create: {
        email: dm.email,
        passwordHash: memberPassword,
        fullName: dm.name,
        phone: dm.phone,
        role: UserRole.MEMBER,
        branchId: dm.branchRef.id,
      },
    });
    const mRec = await prisma.member.upsert({
      where: { code: dm.code },
      update: { userId: u.id },
      create: {
        code: dm.code,
        userId: u.id,
        fullName: dm.name,
        email: dm.email,
        phone: dm.phone,
        gender: dm.gender,
        dateOfBirth: new Date(dm.dob),
        status: MemberStatus.ACTIVE,
        branchId: dm.branchRef.id,
      },
    });
    memberRecords9[dm.code] = mRec;
  }
  console.log('✅ Created demo members (STEP 9):', demoMembers.length);

  // 16.2 Membership đa trạng thái + Payment + Invoice
  // Mã hoá đơn sinh tự động ở DẢI 1xxx (INV-2026-1001…1010) — cố tình KHÔNG dùng
  // INV-2026-0001…0006 vì block gốc (mục 8) đã chiếm dải đó cho MEM-0001; nếu dùng
  // trùng, `findUnique` sẽ thấy payment có sẵn và âm thầm bỏ qua (thiếu dữ liệu).
  const membershipSeeds = [
    { code: 'MEM-0002', pkg: pkg9_12m, status: 'ACTIVE', startOffset: -90, payStatus: PaymentStatus.PAID, method: PaymentMethod.BANK_TRANSFER, ref: 'VCB-8812002', paidOffset: -88 },
    { code: 'MEM-0003', pkg: pkg9_6m, status: 'ACTIVE', startOffset: -45, payStatus: PaymentStatus.PAID, method: PaymentMethod.CASH, ref: null, paidOffset: -45 },
    { code: 'MEM-0004', pkg: pkg9_1m, status: 'ACTIVE', startOffset: -12, payStatus: PaymentStatus.PAID, method: PaymentMethod.MOMO, ref: 'MOMO-55210', paidOffset: -12 },
    { code: 'MEM-0005', pkg: pkg9_1m, status: 'EXPIRED', startOffset: -50, payStatus: PaymentStatus.PAID, method: PaymentMethod.CASH, ref: null, paidOffset: -50 },
    { code: 'MEM-0006', pkg: pkg9_6m, status: 'PENDING', startOffset: 0, payStatus: PaymentStatus.PENDING, method: PaymentMethod.BANK_TRANSFER, ref: null, paidOffset: 0 },
    { code: 'MEM-0007', pkg: pkg9_12m, status: 'ACTIVE', startOffset: -120, payStatus: PaymentStatus.PAID, method: PaymentMethod.VNPAY, ref: 'VNP-77112', paidOffset: -118 },
    { code: 'MEM-0008', pkg: pkg9_6m, status: 'EXPIRED', startOffset: -200, payStatus: PaymentStatus.PAID, method: PaymentMethod.CASH, ref: null, paidOffset: -200 },
    { code: 'MEM-0009', pkg: pkg9_1m, status: 'CANCELLED', startOffset: -60, payStatus: PaymentStatus.REFUNDED, method: PaymentMethod.CASH, ref: null, paidOffset: -58 },
    { code: 'MEM-0010', pkg: pkg9_6m, status: 'ACTIVE', startOffset: -30, payStatus: PaymentStatus.PAID, method: PaymentMethod.BANK_TRANSFER, ref: 'VCB-99331', paidOffset: -30 },
    { code: 'MEM-0011', pkg: pkg9_1m, status: 'ACTIVE', startOffset: -5, payStatus: PaymentStatus.PAID, method: PaymentMethod.CASH, ref: null, paidOffset: -5 },
  ];

  for (const [i, s] of membershipSeeds.entries()) {
    if (!s.pkg) continue;
    const memberRec = memberRecords9[s.code];
    const start = daysFromNow9(s.startOffset);
    const end = daysFromNow9(s.startOffset + s.pkg.durationDays);

    // Membership chỉ tạo nếu member chưa có
    const msCount = await prisma.membership.count({ where: { memberId: memberRec.id } });
    let msId: string | null = null;
    if (msCount === 0) {
      const ms = await prisma.membership.create({
        data: {
          memberId: memberRec.id,
          packageId: s.pkg.id,
          startDate: start,
          endDate: end,
          price: s.pkg.price,
          finalAmount: s.pkg.price,
          status: s.status as any,
        },
      });
      msId = ms.id;
    } else {
      const ms = await prisma.membership.findFirst({
        where: { memberId: memberRec.id },
        orderBy: { createdAt: 'asc' },
      });
      msId = ms?.id ?? null;
    }

    // Payment — số tiền lấy từ THẺ THỰC TẾ đang gắn (không phải `s.pkg.price`),
    // vì khi tái chạy seed thẻ cũ có thể thuộc gói khác → nếu hardcode sẽ lệch với hoá đơn.
    // Quy tắc: 1 thẻ = 1 đơn thanh toán (nếu thẻ đã có payment thì không tạo thêm).
    const payCode = `INV-2026-1${String(i + 1).padStart(3, '0')}`;
    const linked = msId
      ? await prisma.membership.findUnique({
          where: { id: msId },
          select: { finalAmount: true, price: true },
        })
      : null;
    const amount = linked?.finalAmount ?? linked?.price ?? s.pkg?.price ?? 0;

    let payment = await prisma.payment.findFirst({
      where: msId ? { membershipId: msId } : { code: payCode },
      orderBy: { createdAt: 'asc' },
    });
    if (!payment && msId) {
      const paidAt = s.payStatus === PaymentStatus.PAID ? daysFromNow9(s.paidOffset) : null;
      payment = await prisma.payment.create({
        data: {
          code: payCode,
          memberId: memberRec.id,
          membershipId: msId,
          amount,
          method: s.method,
          status: s.payStatus,
          transactionRef: s.ref ?? null,
          notes: 'Thanh toán gói tập (dữ liệu mẫu)',
          paidAt,
          confirmedById: s.payStatus === PaymentStatus.PAID ? adminUser.id : null,
          confirmedAt: paidAt,
        },
      });
    }

    // Invoice tương ứng (quan hệ 1-1 với Payment)
    const existingInv = await prisma.invoice.findFirst({
      where: payment ? { paymentId: payment.id } : { invoiceNumber: payCode },
    });
    if (!existingInv && payment) {
      await prisma.invoice.create({
        data: {
          invoiceNumber: payCode,
          memberId: memberRec.id,
          membershipId: msId,
          paymentId: payment.id,
          subtotal: amount,
          discount: 0,
          total: amount,
          status:
            s.payStatus === PaymentStatus.PAID
              ? InvoiceStatus.PAID
              : s.payStatus === PaymentStatus.PENDING
                ? InvoiceStatus.ISSUED
                : InvoiceStatus.CANCELLED,
          issuedAt: daysFromNow9(s.paidOffset),
          dueDate: daysFromNow9(s.paidOffset + 7),
        },
      });
    }
  }

  // Giao dịch thất bại (demo status FAILED — không kèm membership)
  const failedPay = await prisma.payment.findUnique({ where: { code: 'INV-2026-0099' } });
  if (!failedPay) {
    await prisma.payment.create({
      data: {
        code: 'INV-2026-0099',
        memberId: memberRecords9['MEM-0006'].id,
        amount: pkg9_6m?.price ?? 0,
        method: PaymentMethod.VNPAY,
        status: PaymentStatus.FAILED,
        transactionRef: 'VNP-FAIL-01',
        notes: 'Giao dịch thất bại (người dùng hủy thanh toán cổng VNPAY) - demo STEP 9',
      },
    });
  }
  console.log('✅ Created demo memberships + payments + invoices (STEP 9)');

  // 16.3 Check-in lịch sử cho các hội viên ACTIVE
  const checkinMembers = ['MEM-0002', 'MEM-0003', 'MEM-0004', 'MEM-0007', 'MEM-0010', 'MEM-0011'];
  const dayPattern = [1, 2, 3, 5, 6, 7, 8, 9, 10, 12, 13];
  const hourPattern = [7, 8, 17, 18, 19];
  for (const code of checkinMembers) {
    const memberRec = memberRecords9[code];
    const cnt = await prisma.checkIn.count({ where: { memberId: memberRec.id } });
    if (cnt > 0) continue;
    const rows: any[] = [];
    dayPattern.forEach((day, i) => {
      const hour = hourPattern[i % hourPattern.length];
      rows.push({
        memberId: memberRec.id,
        branchId: memberRec.branchId,
        checkInTime: atHour9(daysAgo9(day), hour, 10),
        checkOutTime: atHour9(daysAgo9(day), hour + 1 + (i % 2), 25),
        status: 'CHECKED_OUT',
        method: i % 3 === 0 ? 'QR_CODE' : i % 3 === 1 ? 'MANUAL' : 'STAFF',
        notes: 'Buổi tập demo STEP 9',
      });
    });
    await prisma.checkIn.createMany({ data: rows });
  }
  console.log('✅ Created check-in history for demo members (STEP 9)');

  // 16.4 Phân công HLV + lịch tập (upcoming/completed) + tiến trình
  const trainer1Rec = await prisma.trainer.findUnique({ where: { userId: trainerUser.id } });
  const trainer2Rec = await prisma.trainer.findUnique({ where: { userId: trainerUser2.id } });
  const trainer3Rec = await prisma.trainer.findUnique({ where: { userId: trainerUser3.id } });

  const assignSeeds = [
    { trainer: trainer1Rec, memberCode: 'MEM-0002', note: 'Chương trình tăng cơ - demo STEP 9' },
    { trainer: trainer3Rec, memberCode: 'MEM-0003', note: 'Chương trình giảm mỡ cấp thân' },
    { trainer: trainer2Rec, memberCode: 'MEM-0010', note: 'Yoga & linh hoạt' },
  ];
  for (const a of assignSeeds) {
    if (!a.trainer) continue;
    const memberRec = memberRecords9[a.memberCode];
    const ex = await prisma.trainerMember.findFirst({
      where: { trainerId: a.trainer.id, memberId: memberRec.id },
    });
    if (!ex) {
      await prisma.trainerMember.create({
        data: { trainerId: a.trainer.id, memberId: memberRec.id, status: 'ACTIVE', note: a.note },
      });
    }
  }

  // Idempotent: marker đặt ở `notes` (KHÔNG nhúng vào title) để dữ liệu demo
  // hiển thị sạch cho khách/giảng viên, nhưng vẫn không tạo trùng khi chạy lại seed.
  const sched9Count = await prisma.trainingSchedule.count({
    where: { notes: SEED9_MARKER },
  });
  if (sched9Count === 0 && trainer1Rec && trainer2Rec && trainer3Rec) {
    const m2 = memberRecords9['MEM-0002'];
    const m3 = memberRecords9['MEM-0003'];
    const weight = await prisma.room.findUnique({ where: { id: 'room-weight-01' } });
    const cardio = await prisma.room.findUnique({ where: { id: 'room-cardio-01' } });
    const tdClass = await prisma.room.findUnique({ where: { id: 'room-td-class-01' } });

    await prisma.trainingSchedule.createMany({
      data: [
        {
          title: 'PT - Tăng cơ toàn thân',
          trainerId: trainer1Rec.id,
          memberId: m2.id,
          branchId: branch.id,
          roomId: weight?.id,
          type: SessionType.PERSONAL_TRAINING,
          startTime: daysFromNow9(1),
          endTime: new Date(daysFromNow9(1).getTime() + 3600000),
          status: 'SCHEDULED',
          notes: SEED9_MARKER,
        },
        {
          title: 'PT - Kỹ thuật Deadlift',
          trainerId: trainer1Rec.id,
          memberId: m2.id,
          branchId: branch.id,
          roomId: weight?.id,
          type: SessionType.PERSONAL_TRAINING,
          startTime: daysFromNow9(4),
          endTime: new Date(daysFromNow9(4).getTime() + 3600000),
          status: 'SCHEDULED',
          notes: SEED9_MARKER,
        },
        {
          title: 'PT - Giảm mỡ toàn thân',
          trainerId: trainer3Rec.id,
          memberId: m3.id,
          branchId: branch.id,
          roomId: cardio?.id,
          type: SessionType.PERSONAL_TRAINING,
          startTime: daysFromNow9(2),
          endTime: new Date(daysFromNow9(2).getTime() + 3600000),
          status: 'SCHEDULED',
          notes: SEED9_MARKER,
        },
        {
          title: 'Yoga Năng Lượng Buổi Sáng',
          trainerId: trainer2Rec.id,
          branchId: branch2.id,
          roomId: tdClass?.id,
          type: SessionType.GROUP_CLASS,
          startTime: daysFromNow9(3),
          endTime: new Date(daysFromNow9(3).getTime() + 3600000),
          status: 'SCHEDULED',
          notes: SEED9_MARKER,
        },
      ],
    });

    const pastDemo = await prisma.trainingSchedule.create({
      data: {
        title: 'PT - Buổi đánh giá thể lực',
        trainerId: trainer1Rec.id,
        memberId: m2.id,
        branchId: branch.id,
        roomId: weight?.id,
        type: SessionType.PERSONAL_TRAINING,
        startTime: daysAgo9(5),
        endTime: new Date(daysAgo9(5).getTime() + 3600000),
        status: 'COMPLETED',
        completedAt: new Date(daysAgo9(5).getTime() + 3600000),
        notes: SEED9_MARKER,
      },
    });

    await prisma.trainingProgress.create({
      data: {
        sessionId: pastDemo.id,
        memberId: m2.id,
        trainerId: trainer1Rec.id,
        note: 'Đánh giá thể lực đầu khóa.',
        performance: 'Sức bền tốt, kỹ thuật bench press cần chỉnh tư thế vai.',
        recommendation: 'Tập trung các bài vai sau và tăng dần khối lượng theo giáo án.',
      },
    });
    console.log('✅ Created trainer assignments + schedules (STEP 9)');
  }

  // 16.5 Mã khuyến mãi đã hết hạn (demo)
  await prisma.promotion.upsert({
    where: { code: 'LUNAR2025' },
    update: {},
    create: {
      code: 'LUNAR2025',
      name: 'Ưu đãi Tết Nguyên Đán 2025',
      description: 'Chương trình khuyến mãi Tết 2025 đã kết thúc (hiển thị ở mục thống kê EXPIRED).',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-02-28'),
      usageLimit: 200,
      perMemberLimit: 1,
      usedCount: 150,
      status: 'EXPIRED',
    },
  });

  // 16.6 Bảo trì thiết bị (demo: completed / scheduled / in-progress)
  const eqRun = await prisma.equipment.findUnique({ where: { code: 'EQ-RUN-01' } });
  const eqBench = await prisma.equipment.findUnique({ where: { code: 'EQ-BENCH-01' } });
  const eqSquat = await prisma.equipment.findUnique({ where: { code: 'EQ-SQUAT-01' } });
  // Idempotent: khoá theo (equipmentId, description) — mô tả đã viết sạch và
  // duy nhất nên không cần marker ẩn.
  const maintSeeds = [
    { equipmentId: eqRun?.id, type: 'REPAIR', maintenanceDate: daysAgo9(25), cost: 1150000, description: 'Thay băng tải và siết khung máy chạy.', status: 'COMPLETED' },
    { equipmentId: eqBench?.id, type: 'ROUTINE', maintenanceDate: daysFromNow9(10), cost: 450000, description: 'Bảo dưỡng định kỳ 6 tháng.', status: 'SCHEDULED' },
    { equipmentId: eqSquat?.id, type: 'INSPECTION', maintenanceDate: daysAgo9(1), cost: 300000, description: 'Kiểm tra khung squat rack sau phản hồi tiếng kêu.', status: 'IN_PROGRESS' },
  ];
  for (const m of maintSeeds) {
    if (!m.equipmentId) continue;
    const ex = await prisma.equipmentMaintenance.findFirst({
      where: { equipmentId: m.equipmentId, description: m.description },
    });
    if (!ex) {
      await prisma.equipmentMaintenance.create({ data: m as any });
    }
  }

  // 16.7 Thông báo mẫu cho hội viên demo
  const notifSeeds = [
    {
      memberId: memberRecords9['MEM-0002'].id,
      title: 'Thanh toán thành công 💳',
      content: 'Hóa đơn INV-2026-0002 (Gói Kim Cương 12 Tháng) đã được thanh toán thành công qua chuyển khoản.',
      type: 'PAYMENT',
      link: '/member/payments',
      isRead: true,
      readAt: new Date(),
      referenceType: 'PAYMENT_CONFIRMED',
      referenceId: 'seed-inv-0002',
    },
    {
      memberId: memberRecords9['MEM-0002'].id,
      title: 'Buổi PT sắp diễn ra 📅',
      content: 'Bạn có buổi "PT - Tăng cơ toàn thân" vào ngày mai. Đừng quên đến đúng giờ nhé!',
      type: 'SCHEDULE',
      link: '/member/schedule',
      isRead: false,
      referenceType: 'SCHEDULE_REMINDER',
      referenceId: 'seed-sched-1',
    },
    {
      memberId: memberRecords9['MEM-0003'].id,
      title: 'Chào mừng hội viên mới 💪',
      content: 'Chào mừng Phạm Thị Ngọc đến với GymMaster Pro! Hãy bắt đầu hành trình fitness nào.',
      type: 'SYSTEM',
      link: '/member/dashboard',
      isRead: false,
    },
  ];
  for (const n of notifSeeds) {
    const ex = await prisma.notification.findFirst({
      where: { memberId: n.memberId as string, title: n.title as string },
    });
    if (!ex) {
      const { memberId, title, ...rest } = n;
      await prisma.notification.create({ data: { memberId: memberId as string, title: title as string, ...rest } });
    }
  }
  console.log('✅ Created promotions expired + maintenance + notifications (STEP 9)');

  // 16.8 Nhật ký hệ thống (AuditLog) — để trang /admin/audit-logs có dữ liệu demo ngay sau khi seed.
  // Idempotent: chỉ tạo khi bảng còn trống.
  const auditCount = await prisma.auditLog.count();
  if (auditCount === 0) {
    const m2 = memberRecords9['MEM-0002'];
    const m3 = memberRecords9['MEM-0003'];
    const m6 = memberRecords9['MEM-0006'];
    const pay2 = await prisma.payment.findFirst({ where: { memberId: m2.id, status: 'PAID' }, orderBy: { createdAt: 'asc' } });
    const pay6 = await prisma.payment.findFirst({ where: { memberId: m6.id }, orderBy: { createdAt: 'asc' } });
    const payFail = await prisma.payment.findUnique({ where: { code: 'INV-2026-0099' } });
    const ms2 = await prisma.membership.findFirst({ where: { memberId: m2.id }, orderBy: { createdAt: 'asc' } });
    const sched1 = await prisma.trainingSchedule.findFirst({ where: { memberId: m2.id } });
    const eqSquat = await prisma.equipment.findFirst({ where: { code: { contains: 'SQ' } } });
    // thiết bị lâu đời nhất -> dùng cho log EQUIPMENT_RETIRE
    const eqOldest = await prisma.equipment.findFirst({ orderBy: { purchaseDate: 'asc' } });

    type AuditSeed = {
      userId: string | null;
      action: string;
      entity: string;
      entityId?: string | null;
      metadata?: Record<string, unknown>;
      ip: string;
      at: Date;
    };

    const auditSeeds: AuditSeed[] = [
      // --- Đăng nhập (đầu/cuối ngày) ---
      { userId: adminUser.id, action: 'AUTH_LOGIN', entity: 'Auth', metadata: { method: 'password' }, ip: '127.0.0.1', at: daysAgo9(1) },
      { userId: managerUser.id, action: 'AUTH_LOGIN', entity: 'Auth', metadata: { method: 'password' }, ip: '127.0.0.1', at: daysAgo9(1) },
      { userId: staffUser.id, action: 'AUTH_LOGIN', entity: 'Auth', metadata: { method: 'password' }, ip: '127.0.0.1', at: daysAgo9(0) },
      { userId: trainerUser.id, action: 'AUTH_LOGIN', entity: 'Auth', metadata: { method: 'password' }, ip: '127.0.0.1', at: daysAgo9(0) },
      { userId: memberUser.id, action: 'AUTH_LOGIN', entity: 'Auth', metadata: { method: 'password' }, ip: '127.0.0.1', at: daysAgo9(0) },

      // --- Tài khoản ---
      { userId: adminUser.id, action: 'USER_CREATE', entity: 'User', metadata: { email: 'staff@gym.com', role: 'STAFF' }, ip: '127.0.0.1', at: daysAgo9(120) },
      { userId: memberUser.id, action: 'PASSWORD_CHANGE', entity: 'User', metadata: { method: 'self-service' }, ip: '127.0.0.1', at: daysAgo9(70) },

      // --- Hồ sơ hội viên ---
      { userId: staffUser.id, action: 'MEMBER_REGISTER', entity: 'Member', entityId: m2.id, metadata: { code: 'MEM-0002', fullName: 'Lê Hoàng Anh' }, ip: '127.0.0.1', at: daysAgo9(88) },
      { userId: staffUser.id, action: 'MEMBER_REGISTER', entity: 'Member', entityId: m3.id, metadata: { code: 'MEM-0003', fullName: 'Phạm Thị Ngọc' }, ip: '127.0.0.1', at: daysAgo9(45) },
      { userId: m3.userId, action: 'MEMBER_PROFILE_UPDATE', entity: 'Member', entityId: m3.id, metadata: { fields: ['phone', 'address'] }, ip: '127.0.0.1', at: daysAgo9(30) },
      { userId: managerUser.id, action: 'MEMBER_UPDATE', entity: 'Member', entityId: m2.id, metadata: { fields: ['emergencyContact'] }, ip: '127.0.0.1', at: daysAgo9(12) },

      // --- Gói tập & thanh toán ---
      { userId: m2.userId, action: 'MEMBERSHIP_REGISTER', entity: 'Membership', entityId: ms2?.id, metadata: { packageName: pkg9_12m?.name, amount: Number(pkg9_12m?.price ?? 0) }, ip: '127.0.0.1', at: daysAgo9(90) },
      { userId: adminUser.id, action: 'PAYMENT_CONFIRM', entity: 'Payment', entityId: pay2?.id, metadata: { code: 'INV-2026-0002', method: 'BANK_TRANSFER', transactionRef: 'VCB-8812002' }, ip: '127.0.0.1', at: daysAgo9(88) },
      { userId: m2.userId, action: 'MEMBERSHIP_RENEW', entity: 'Membership', entityId: ms2?.id, metadata: { packageName: pkg9_6m?.name, extraDays: 180 }, ip: '127.0.0.1', at: daysAgo9(0) },
      { userId: m6.userId, action: 'MEMBERSHIP_REGISTER', entity: 'Membership', entityId: null, metadata: { packageName: pkg9_6m?.name, amount: Number(pkg9_6m?.price ?? 0) }, ip: '127.0.0.1', at: daysAgo9(0) },
      { userId: adminUser.id, action: 'PAYMENT_REJECT', entity: 'Payment', entityId: payFail?.id, metadata: { code: 'INV-2026-0099', reason: 'Giao dịch thất bại từ cổng VNPAY' }, ip: '127.0.0.1', at: daysAgo9(0) },
      { userId: adminUser.id, action: 'MEMBERSHIP_STATUS_CHANGE', entity: 'Membership', entityId: ms2?.id, metadata: { from: 'PENDING', to: 'ACTIVE' }, ip: '127.0.0.1', at: daysAgo9(88) },
      { userId: managerUser.id, action: 'MEMBERSHIP_EXTEND', entity: 'Membership', entityId: ms2?.id, metadata: { extraDays: 7, reason: 'Bù buổi tập do thiết bị bảo trì' }, ip: '127.0.0.1', at: daysAgo9(6) },
      { userId: adminUser.id, action: 'PAYMENT_REFUND', entity: 'Payment', entityId: pay6?.id, metadata: { code: 'INV-2026-0006', reason: 'Hội viên hủy trong 7 ngày' }, ip: '127.0.0.1', at: daysAgo9(58) },

      // --- Check-in / check-out ---
      { userId: memberUser.id, action: 'CHECK_IN', entity: 'CheckIn', entityId: null, metadata: { method: 'QR_CODE' }, ip: '127.0.0.1', at: atHour9(daysAgo9(0), 7, 12) },
      { userId: memberUser.id, action: 'CHECK_OUT', entity: 'CheckIn', entityId: null, metadata: { durationMinutes: 65 }, ip: '127.0.0.1', at: atHour9(daysAgo9(0), 8, 17) },
      { userId: staffUser.id, action: 'CHECK_IN', entity: 'CheckIn', entityId: null, metadata: { method: 'MANUAL', memberCode: 'MEM-0002' }, ip: '127.0.0.1', at: atHour9(daysAgo9(0), 18, 5) },

      // --- HLV & lịch tập ---
      { userId: adminUser.id, action: 'TRAINER_CREATE', entity: 'Trainer', entityId: trainer1Rec?.id, metadata: { fullName: trainerUser.fullName, specialization: trainer1Rec?.specialization }, ip: '127.0.0.1', at: daysAgo9(150) },
      { userId: adminUser.id, action: 'TRAINER_UPDATE', entity: 'Trainer', entityId: trainer2Rec?.id, metadata: { fields: ['experienceYears'] }, ip: '127.0.0.1', at: daysAgo9(20) },
      { userId: adminUser.id, action: 'TRAINER_REMOVE', entity: 'Trainer', entityId: trainer3Rec?.id, metadata: { fullName: trainerUser3.fullName, reason: 'Nghỉ việc (chuyển công ty)' }, ip: '127.0.0.1', at: daysAgo9(15) },
      { userId: managerUser.id, action: 'SCHEDULE_CREATE', entity: 'TrainingSchedule', entityId: sched1?.id, metadata: { title: sched1?.title, type: sched1?.type }, ip: '127.0.0.1', at: daysAgo9(7) },
      { userId: managerUser.id, action: 'SCHEDULE_UPDATE', entity: 'TrainingSchedule', entityId: sched1?.id, metadata: { fields: ['startTime', 'roomId'] }, ip: '127.0.0.1', at: daysAgo9(5) },
      { userId: managerUser.id, action: 'SCHEDULE_CANCEL', entity: 'TrainingSchedule', entityId: sched1?.id, metadata: { reason: 'HLV bận việc đột xuất' }, ip: '127.0.0.1', at: daysAgo9(2) },
      { userId: trainerUser.id, action: 'SCHEDULE_COMPLETE', entity: 'TrainingSchedule', entityId: sched1?.id, metadata: { attendance: 1 }, ip: '127.0.0.1', at: daysAgo9(1) },
      { userId: managerUser.id, action: 'SCHEDULE_DELETE', entity: 'TrainingSchedule', entityId: sched1?.id, metadata: { reason: 'Xoá lịch trùng do nhập liệu sai' }, ip: '127.0.0.1', at: daysAgo9(4) },

      // --- Thiết bị & bảo trì ---
      { userId: adminUser.id, action: 'EQUIPMENT_CREATE', entity: 'Equipment', entityId: eqSquat?.id, metadata: { code: eqSquat?.code, name: eqSquat?.name }, ip: '127.0.0.1', at: daysAgo9(200) },
      { userId: staffUser.id, action: 'EQUIPMENT_UPDATE', entity: 'Equipment', entityId: eqSquat?.id, metadata: { fields: ['location', 'condition'] }, ip: '127.0.0.1', at: daysAgo9(100) },
      { userId: staffUser.id, action: 'EQUIPMENT_STATUS_CHANGE', entity: 'Equipment', entityId: eqSquat?.id, metadata: { from: 'AVAILABLE', to: 'BROKEN', reason: 'Tiếng kêu bất thường khi nâng tạ' }, ip: '127.0.0.1', at: daysAgo9(2) },
      { userId: adminUser.id, action: 'MAINTENANCE_CREATE', entity: 'EquipmentMaintenance', entityId: null, metadata: { equipmentCode: eqSquat?.code, type: 'INSPECTION' }, ip: '127.0.0.1', at: daysAgo9(1) },
      { userId: adminUser.id, action: 'MAINTENANCE_COMPLETE', entity: 'EquipmentMaintenance', entityId: null, metadata: { cost: 300000, note: 'Vặn lại bulong khung, đã kiểm tra tải trọng' }, ip: '127.0.0.1', at: daysAgo9(0) },
      { userId: managerUser.id, action: 'MAINTENANCE_CANCEL', entity: 'EquipmentMaintenance', entityId: null, metadata: { equipmentCode: eqSquat?.code, reason: 'Dời lịch sang tuần sau' }, ip: '127.0.0.1', at: daysAgo9(0) },
      { userId: adminUser.id, action: 'EQUIPMENT_RETIRE', entity: 'Equipment', entityId: eqOldest?.id, metadata: { code: eqOldest?.code, name: eqOldest?.name, reason: 'Hết hạn sử dụng (>8 năm)' }, ip: '127.0.0.1', at: daysAgo9(40) },

      // --- Khuyến mãi ---
      { userId: adminUser.id, action: 'PROMOTION_CREATE', entity: 'Promotion', entityId: null, metadata: { code: 'LUNAR2025', name: 'Khuyến mãi đầu năm' }, ip: '127.0.0.1', at: daysAgo9(60) },
      { userId: adminUser.id, action: 'PROMOTION_UPDATE', entity: 'Promotion', entityId: null, metadata: { code: 'LUNAR2025', fields: ['discountValue'] }, ip: '127.0.0.1', at: daysAgo9(50) },
      { userId: adminUser.id, action: 'PROMOTION_ACTIVATE', entity: 'Promotion', entityId: null, metadata: { code: 'LUNAR2025' }, ip: '127.0.0.1', at: daysAgo9(45) },
      { userId: adminUser.id, action: 'PROMOTION_DEACTIVATE', entity: 'Promotion', entityId: null, metadata: { code: 'LUNAR2025', reason: 'Đã hết hạn' }, ip: '127.0.0.1', at: daysAgo9(3) },
    ];

    await prisma.auditLog.createMany({
      data: auditSeeds.map((a) => ({
        userId: a.userId,
        action: a.action,
        entity: a.entity,
        entityId: a.entityId ?? null,
        metadata: a.metadata as any,
        ip: a.ip,
        createdAt: a.at,
      })),
    });
    console.log(`✅ Created ${auditSeeds.length} demo audit logs (STEP 9)`);
  } else {
    console.log(`⏭️  Skipped audit logs — bảng đã có ${auditCount} bản ghi (idempotent)`);
  }

  console.log('🚀 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
