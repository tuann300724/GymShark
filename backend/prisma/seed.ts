import { PrismaClient, UserRole, Gender, MemberStatus, PackageType, PaymentMethod, PaymentStatus, EquipmentStatus } from '@prisma/client';
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
      openingHours: '05:30 - 21:30 (Tất cả các ngày)',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Created branch:', branch.name);

  // 2. Room
  const cardioRoom = await prisma.room.upsert({
    where: { id: 'room-cardio-01' },
    update: {},
    create: {
      id: 'room-cardio-01',
      name: 'Phòng Cardio & Máy Chạy',
      capacity: 30,
      branchId: branch.id,
      status: 'AVAILABLE',
    },
  });

  const weightRoom = await prisma.room.upsert({
    where: { id: 'room-weight-01' },
    update: {},
    create: {
      id: 'room-weight-01',
      name: 'Phòng Tạ Tự Do (Free Weight)',
      capacity: 40,
      branchId: branch.id,
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
        status: 'ACTIVE',
      },
    });
  } else {
    membership = await prisma.membership.findFirst({
      where: { memberId: member.id },
      orderBy: { createdAt: 'asc' },
    });
  }

  // 8. Payment (chỉ tạo nếu chưa có)
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
        status: PaymentStatus.COMPLETED,
        transactionRef: 'VCB-987123984',
        notes: 'Thanh toán chuyển khoản qua ngân hàng Vietcombank',
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
      category: 'Cardio',
      branchId: branch.id,
      roomId: cardioRoom.id,
      purchasePrice: 45000000,
      status: EquipmentStatus.OPERATIONAL,
    },
  });

  await prisma.equipment.upsert({
    where: { code: 'EQ-BENCH-01' },
    update: {},
    create: {
      code: 'EQ-BENCH-01',
      name: 'Ghế Đẩy Tạ Đa Năng Olympic Bench Press',
      category: 'Free Weight',
      branchId: branch.id,
      roomId: weightRoom.id,
      purchasePrice: 18000000,
      status: EquipmentStatus.OPERATIONAL,
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
      usedCount: 1,
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
    await prisma.checkIn.createMany({
      data: [
        {
          memberId: member.id,
          branchId: branch.id,
          checkInTime: daysAgo(1),
          checkOutTime: new Date(daysAgo(1).getTime() + 90 * 60 * 1000),
          status: 'CHECKED_OUT',
          notes: 'Tập gym cá nhân',
        },
        {
          memberId: member.id,
          branchId: branch.id,
          checkInTime: daysAgo(3),
          checkOutTime: new Date(daysAgo(3).getTime() + 75 * 60 * 1000),
          status: 'CHECKED_OUT',
          notes: 'Lớp Yoga',
        },
        {
          memberId: member.id,
          branchId: branch.id,
          checkInTime: daysAgo(5),
          checkOutTime: new Date(daysAgo(5).getTime() + 120 * 60 * 1000),
          status: 'CHECKED_OUT',
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
