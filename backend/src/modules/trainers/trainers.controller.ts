import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TrainersService } from './trainers.service';
import { CreateTrainerDto, TrainerQueryDto, UpdateTrainerDto } from './dto/trainer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Trainers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trainers')
export class TrainersController {
  constructor(private readonly trainersService: TrainersService) {}

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

  // ---------------------------------------------------------------------------
  // List / Detail
  // ---------------------------------------------------------------------------

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Danh sách huấn luyện viên (tìm kiếm, lọc, phân trang)' })
  findAll(@Query() query: TrainerQueryDto) {
    return this.trainersService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Chi tiết huấn luyện viên + thống kê + hội viên phụ trách + lịch' })
  findOne(@Param('id') id: string) {
    return this.trainersService.findOne(id);
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Tạo huấn luyện viên mới (kèm tài khoản đăng nhập TRAINER)' })
  @ApiResponse({ status: 201, description: 'Tạo thành công, trả về tempPassword để cấp cho HLV' })
  create(@Body() dto: CreateTrainerDto, @CurrentUser('id') actorId: string) {
    return this.trainersService.create(dto, actorId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Cập nhật hồ sơ / trạng thái huấn luyện viên' })
  update(@Param('id') id: string, @Body() dto: UpdateTrainerDto, @CurrentUser('id') actorId: string) {
    return this.trainersService.update(id, dto, actorId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Ngừng hoạt động HLV (soft delete — giữ lịch sử)' })
  remove(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.trainersService.remove(id, actorId);
  }

  // ---------------------------------------------------------------------------
  // Trainer ↔ Member assignments
  // ---------------------------------------------------------------------------

  @Get(':id/members')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Danh sách phân công (lịch sử) của một HLV' })
  getMembers(@Param('id') id: string) {
    return this.trainersService.getMembers(id);
  }

  @Post(':id/members/:memberId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Gán HLV cho hội viên (kiểm tra trùng lặp ACTIVE)' })
  @ApiParam({ name: 'id', description: 'ID huấn luyện viên' })
  @ApiParam({ name: 'memberId', description: 'ID hội viên' })
  assignMember(@Param('id') id: string, @Param('memberId') memberId: string) {
    return this.trainersService.assignMember(id, memberId);
  }

  @Delete(':id/members/:memberId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Kết thúc phân công HLV cho hội viên (giữ lịch sử)' })
  @ApiParam({ name: 'id', description: 'ID huấn luyện viên' })
  @ApiParam({ name: 'memberId', description: 'ID hội viên' })
  unassignMember(@Param('id') id: string, @Param('memberId') memberId: string) {
    return this.trainersService.unassignMember(id, memberId);
  }
}