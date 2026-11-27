import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TrainersService } from './trainers.service';
import {
  CreateTrainerDto,
  TrainerQueryDto,
  TrainerReviewDto,
  UpdateMyTrainerProfileDto,
  UpdateTrainerDto,
} from './dto/trainer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveOwnerScope, type ScopeActor } from '../../common/utils/partner-scope';

@ApiTags('Trainers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trainers')
export class TrainersController {
  constructor(
    private readonly trainersService: TrainersService,
    private readonly prisma: PrismaService,
  ) {}

  /** Đối tác chỉ thao tác PT của phòng gym mình */
  private scope(actor: ScopeActor) {
    return resolveOwnerScope(this.prisma, actor);
  }

  // ---------------------------------------------------------------------------
  // Self endpoints (khai báo trước :id để không bị route động nuốt)
  // ---------------------------------------------------------------------------

  @Get('me')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'HLV đang phụ trách tài khoản hội viên đang đăng nhập' })
  getMyTrainer(@CurrentUser('id') userId: string) {
    return this.trainersService.getMyTrainer(userId);
  }

  @Get('me/members')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'Danh sách hội viên mà HLV đang đăng nhập được phụ trách' })
  getMyMembers(@CurrentUser('id') userId: string) {
    return this.trainersService.getMyMembers(userId);
  }

  @Get('me/profile')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'Hồ sơ + thống kê của HLV đang đăng nhập (trang hồ sơ)' })
  getMyProfile(@CurrentUser('id') userId: string) {
    return this.trainersService.getMyProfile(userId);
  }

  @Patch('me/profile')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'HLV tự chỉnh hồ sơ công khai + phí kèm riêng (VND/buổi)' })
  updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMyTrainerProfileDto,
  ) {
    return this.trainersService.updateMyProfile(userId, dto);
  }

  @Delete('me/profile/pending')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'HLV huỷ bản chỉnh sửa hồ sơ đang chờ duyệt' })
  cancelMyProfileDraft(@CurrentUser('id') userId: string) {
    return this.trainersService.cancelMyProfileDraft(userId);
  }

  // ---------------------------------------------------------------------------
  // Admin duyệt chỉnh sửa hồ sơ công khai của PT
  // ---------------------------------------------------------------------------

  @Get('profile-changes')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Các bản chỉnh sửa hồ sơ PT đang chờ duyệt' })
  async getProfileChanges(@CurrentUser() actor: ScopeActor) {
    await this.assertSystemActor(actor);
    return this.trainersService.getProfileChanges();
  }

  @Post(':id/profile-review')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Duyệt / từ chối chỉnh sửa hồ sơ công khai của PT (gửi email kết quả)' })
  async reviewProfileChange(
    @Param('id') id: string,
    @Body() dto: TrainerReviewDto,
    @CurrentUser() actor: ScopeActor,
  ) {
    await this.assertSystemActor(actor);
    return this.trainersService.reviewProfileChange(id, dto, actor.id);
  }

  /** Chỉ quản trị hệ thống GymMaster duyệt PT tự do (đối tác không được) */
  private async assertSystemActor(actor: ScopeActor) {
    if ((await this.scope(actor)) !== null) {
      throw new ForbiddenException('Chỉ quản trị viên GymMaster được duyệt hồ sơ PT.');
    }
  }

  // ---------------------------------------------------------------------------
  // List / Detail
  // ---------------------------------------------------------------------------

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Danh sách huấn luyện viên (tìm kiếm, lọc, phân trang)' })
  async findAll(@Query() query: TrainerQueryDto, @CurrentUser() actor: ScopeActor) {
    return this.trainersService.findAll(query, await this.scope(actor));
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Chi tiết huấn luyện viên + thống kê + hội viên phụ trách + lịch' })
  async findOne(@Param('id') id: string, @CurrentUser() actor: ScopeActor) {
    return this.trainersService.findOne(id, await this.scope(actor));
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Tạo huấn luyện viên mới (kèm tài khoản đăng nhập TRAINER)' })
  @ApiResponse({ status: 201, description: 'Tạo thành công, trả về tempPassword để cấp cho HLV' })
  async create(@Body() dto: CreateTrainerDto, @CurrentUser() actor: ScopeActor) {
    return this.trainersService.create(dto, actor.id, await this.scope(actor));
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Cập nhật hồ sơ / trạng thái huấn luyện viên' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTrainerDto,
    @CurrentUser() actor: ScopeActor,
  ) {
    return this.trainersService.update(id, dto, actor.id, await this.scope(actor));
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Ngừng hoạt động HLV (soft delete — giữ lịch sử)' })
  async remove(@Param('id') id: string, @CurrentUser() actor: ScopeActor) {
    return this.trainersService.remove(id, actor.id, await this.scope(actor));
  }

  // ---------------------------------------------------------------------------
  // Trainer ↔ Member assignments
  // ---------------------------------------------------------------------------

  @Get(':id/members')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Danh sách phân công (lịch sử) của một HLV' })
  async getMembers(@Param('id') id: string, @CurrentUser() actor: ScopeActor) {
    return this.trainersService.getMembers(id, await this.scope(actor));
  }

  @Post(':id/members/:memberId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Gán HLV cho hội viên (kiểm tra trùng lặp ACTIVE)' })
  @ApiParam({ name: 'id', description: 'ID huấn luyện viên' })
  @ApiParam({ name: 'memberId', description: 'ID hội viên' })
  async assignMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() actor: ScopeActor,
  ) {
    return this.trainersService.assignMember(id, memberId, await this.scope(actor));
  }

  @Delete(':id/members/:memberId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Kết thúc phân công HLV cho hội viên (giữ lịch sử)' })
  @ApiParam({ name: 'id', description: 'ID huấn luyện viên' })
  @ApiParam({ name: 'memberId', description: 'ID hội viên' })
  async unassignMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() actor: ScopeActor,
  ) {
    return this.trainersService.unassignMember(id, memberId, await this.scope(actor));
  }
}
