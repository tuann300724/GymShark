import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CreatePartnerLeadDto } from "./dto/create-partner-lead.dto";
import { CreatePartnerAccountDto } from "./dto/create-partner-account.dto";
import { QueryPartnerLeadsDto } from "./dto/query-partner-leads.dto";
import {
  AssessPartnerLeadDto,
  TransitionPartnerLeadDto,
  UpdatePartnerLeadDto,
} from "./dto/update-partner-lead.dto";
import { PartnerLeadsService } from "./partner-leads.service";

@ApiTags("Partner leads")
@Controller("partner-leads")
export class PartnerLeadsController {
  constructor(private readonly service: PartnerLeadsService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: "Gửi yêu cầu tư vấn hợp tác phòng gym" })
  create(@Body() dto: CreatePartnerLeadDto, @Req() request: Request) {
    return this.service.create(dto, request.ip);
  }

  @Get("admin")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: "Danh sách yêu cầu hợp tác (admin/manager)" })
  adminList(@Query() query: QueryPartnerLeadsDto) {
    return this.service.adminList(query);
  }

  @Patch("admin/:id")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: "Cập nhật ghi chú nội bộ của yêu cầu hợp tác" })
  adminUpdate(
    @Param("id") id: string,
    @Body() dto: UpdatePartnerLeadDto,
    @CurrentUser("id") actorId: string,
  ) {
    return this.service.adminUpdate(id, dto, actorId);
  }

  @Post("admin/:id/transition")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary:
      "Chuyển yêu cầu sang bước tiếp theo: Mới nhận → Đã liên hệ → Đang tư vấn → Đã chốt hợp tác (hoặc Đóng)",
  })
  transition(
    @Param("id") id: string,
    @Body() dto: TransitionPartnerLeadDto,
    @CurrentUser("id") actorId: string,
  ) {
    return this.service.transition(id, dto, actorId);
  }

  @Get("admin/:id/photos")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: "Ảnh cơ sở vật chất đối tác gửi kèm yêu cầu" })
  photos(@Param("id") id: string) {
    return this.service.photos(id);
  }

  @Post("admin/:id/assessment")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: "Đánh giá hạng phòng gym (Standard/Plus/Premium) cho yêu cầu Gym Cộng đồng",
  })
  assess(
    @Param("id") id: string,
    @Body() dto: AssessPartnerLeadDto,
    @CurrentUser("id") actorId: string,
  ) {
    return this.service.assess(id, dto, actorId);
  }

  @Get("admin/:id/history")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: "Lịch sử xử lý của một yêu cầu hợp tác" })
  history(@Param("id") id: string) {
    return this.service.history(id);
  }

  @Post("admin/:id/create-account")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: "Tạo tài khoản đối tác từ yêu cầu đã chốt hợp đồng",
  })
  createAccount(
    @Param("id") id: string,
    @Body() dto: CreatePartnerAccountDto,
    @CurrentUser("id") actorId: string,
  ) {
    return this.service.createPartnerAccount(id, dto.businessName, actorId, dto.termMonths);
  }
}
