import { Controller, Get, NotFoundException, Param, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { PublicService } from "./public.service";
import { Public } from "../../common/decorators/public.decorator";
import { TrainerReviewQueryDto } from "../trainer-reviews/dto/trainer-review.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { AVATAR_DATA_URL_PATTERN } from "../../common/utils/avatar";

@ApiTags("Public Website")
@Controller("public")
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    private readonly prisma: PrismaService,
  ) {}

  /** Ảnh đại diện người dùng tải lên (User.avatarUrl trỏ tới đây) — trả về file ảnh */
  @Public()
  @Get("avatars/:userId")
  @ApiOperation({ summary: "Ảnh đại diện người dùng tải lên (image/*)" })
  @ApiResponse({ status: 404, description: "Người dùng chưa tải ảnh đại diện" })
  async getAvatar(@Param("userId") userId: string, @Res() res: Response) {
    const row = await this.prisma.userAvatar.findUnique({ where: { userId } });
    const match = row?.dataUrl.match(AVATAR_DATA_URL_PATTERN);
    if (!row || !match) throw new NotFoundException("Không có ảnh đại diện.");
    const base64 = row.dataUrl.slice(row.dataUrl.indexOf(",") + 1);
    res.setHeader("Content-Type", `image/${match[1]}`);
    // URL có ?v= đổi theo mỗi lần cập nhật nên cache lâu an toàn
    res.setHeader("Cache-Control", "public, max-age=604800, immutable");
    // helmet mặc định same-origin — cho phép frontend (khác cổng) nhúng ảnh
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.send(Buffer.from(base64, "base64"));
  }

  @Public()
  @Get("packages")
  @ApiOperation({
    summary: "Danh sách gói tập hiển thị trên website công khai",
  })
  @ApiResponse({ status: 200, description: "Danh sách gói tập ACTIVE" })
  getPackages() {
    return this.publicService.getPackages();
  }

  @Public()
  @Get("branches")
  @ApiOperation({
    summary: "Danh sách chi nhánh đang hoạt động để hội viên đăng ký gói tập",
  })
  @ApiResponse({
    status: 200,
    description: "Danh sách chi nhánh của đối tác đã được duyệt",
  })
  getBranches() {
    return this.publicService.getBranches();
  }

  @Public()
  @Get("partnership-plans")
  @ApiOperation({ summary: "Bảng giá 2 gói hợp tác (trang đăng ký đối tác)" })
  getPartnershipPlans() {
    return this.publicService.getPartnershipPlans();
  }

  @Public()
  @Get("trainers")
  @ApiOperation({ summary: "Danh sách huấn luyện viên công khai" })
  @ApiResponse({ status: 200, description: "Danh sách HLV đang ACTIVE" })
  getTrainers() {
    return this.publicService.getTrainers();
  }

  @Public()
  @Get("trainers/:id")
  @ApiOperation({ summary: "Hồ sơ công khai của 1 huấn luyện viên" })
  @ApiResponse({
    status: 200,
    description: "Thông tin HLV đã lọc, kèm số liệu công khai",
  })
  @ApiResponse({ status: 404, description: "Không tìm thấy HLV đang ACTIVE" })
  getTrainer(@Param("id") id: string) {
    return this.publicService.getTrainer(id);
  }

  @Public()
  @Get("trainers/:id/reviews")
  @ApiOperation({ summary: "Đánh giá công khai của 1 huấn luyện viên" })
  @ApiResponse({
    status: 200,
    description: "Danh sách đánh giá + điểm trung bình",
  })
  getTrainerReviews(
    @Param("id") id: string,
    @Query() query: TrainerReviewQueryDto,
  ) {
    return this.publicService.getTrainerReviews(id, query);
  }

  @Public()
  @Get("schedule")
  @ApiOperation({ summary: "Lịch lớp học công khai" })
  @ApiResponse({
    status: 200,
    description: "Lịch các lớp học chưa được đặt riêng",
  })
  getClassSchedule() {
    return this.publicService.getClassSchedule();
  }

  @Public()
  @Get("home-stats")
  @ApiOperation({ summary: "Thống kê nhanh cho trang chủ" })
  @ApiResponse({ status: 200, description: "Số liệu hội viên, HLV" })
  getHomeStats() {
    return this.publicService.getHomeStats();
  }
}
