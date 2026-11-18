import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { ApproveMembershipChangeDto } from "./dto/approve-membership-change.dto";
import { CreateMembershipChangeDto } from "./dto/create-membership-change.dto";
import { ProposeMembershipRefundDto } from "./dto/propose-membership-refund.dto";
import { ReconcileMembershipPtDto } from "./dto/reconcile-membership-pt.dto";
import { RecordMembershipRefundDto } from "./dto/record-membership-refund.dto";
import { RejectMembershipChangeDto } from "./dto/reject-membership-change.dto";
import { MembershipChangesService } from "./membership-changes.service";

@ApiTags("Membership changes")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("membership-changes")
export class MembershipChangesController {
  constructor(
    private readonly membershipChangesService: MembershipChangesService,
  ) {}

  @Get("mine")
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: "Lịch sử yêu cầu thay đổi hợp đồng của hội viên" })
  findMine(@CurrentUser("id") userId: string) {
    return this.membershipChangesService.findMine(userId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: "Danh sách yêu cầu thay đổi hợp đồng đang chờ xử lý",
  })
  findAll() {
    return this.membershipChangesService.findAll();
  }

  @Get(":id/pt-reconciliation")
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: "Xem dữ liệu đối soát quota PT trước khi hoàn tiền",
  })
  getPtReconciliation(@Param("id") id: string) {
    return this.membershipChangesService.getPtReconciliation(id);
  }

  @Post("for/:membershipId")
  @Roles(Role.MEMBER)
  @ApiOperation({
    summary: "Gửi yêu cầu chấm dứt hoặc bảo lưu hợp đồng",
  })
  create(
    @Param("membershipId") membershipId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: CreateMembershipChangeDto,
  ) {
    return this.membershipChangesService.create(userId, membershipId, dto);
  }

  @Post(":id/propose-refund")
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: "Đề xuất số tiền hoàn theo thời gian và quota PT còn lại",
  })
  proposeRefund(
    @Param("id") id: string,
    @CurrentUser("id") actorId: string,
    @Body() dto: ProposeMembershipRefundDto,
  ) {
    return this.membershipChangesService.proposeRefund(id, actorId, dto);
  }

  @Post(":id/reconcile-pt")
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: "Lưu kết quả đối soát quota và số buổi PT" })
  reconcilePt(
    @Param("id") id: string,
    @CurrentUser("id") actorId: string,
    @Body() dto: ReconcileMembershipPtDto,
  ) {
    return this.membershipChangesService.reconcilePt(id, actorId, dto);
  }

  @Post(":id/confirm")
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: "Hội viên xác nhận đề xuất hoàn tiền" })
  confirm(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.membershipChangesService.confirm(id, userId);
  }

  @Post(":id/decline")
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: "Hội viên từ chối đề xuất hoàn tiền" })
  decline(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @Body() dto: ApproveMembershipChangeDto,
  ) {
    return this.membershipChangesService.decline(id, userId, dto);
  }

  @Post(":id/approve")
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: "Quản lý phê duyệt chấm dứt hoặc bảo lưu hợp đồng",
  })
  approve(
    @Param("id") id: string,
    @CurrentUser("id") actorId: string,
    @Body() dto: ApproveMembershipChangeDto,
  ) {
    return this.membershipChangesService.approve(id, actorId, dto);
  }

  @Post(":id/reject")
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: "Từ chối yêu cầu thay đổi hợp đồng" })
  reject(
    @Param("id") id: string,
    @CurrentUser("id") actorId: string,
    @Body() dto: RejectMembershipChangeDto,
  ) {
    return this.membershipChangesService.reject(id, actorId, dto);
  }

  @Post(":id/payout")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "ADMIN ghi nhận khoản hoàn tiền đã chi thực tế" })
  recordPayout(
    @Param("id") id: string,
    @CurrentUser("id") actorId: string,
    @Body() dto: RecordMembershipRefundDto,
  ) {
    return this.membershipChangesService.recordPayout(id, actorId, dto);
  }
}
