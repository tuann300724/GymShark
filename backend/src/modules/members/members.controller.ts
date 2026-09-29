import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Members')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Danh sách hội viên (tìm kiếm, lọc, sắp xếp, phân trang)' })
  @ApiQuery({ name: 'search', required: false, description: 'Tìm theo tên/email/SĐT/mã hội viên' })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED'] })
  @ApiQuery({ name: 'membershipStatus', required: false, description: 'Lọc theo trạng thái membership' })
  @ApiQuery({ name: 'packageId', required: false, description: 'Lọc theo gói tập' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Lọc theo chi nhánh (STEP 7)' })
  @ApiQuery({ name: 'page', required: false, description: 'Trang hiện tại (mặc định 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Số bản ghi mỗi trang (mặc định 20)' })
  @ApiQuery({ name: 'sort', required: false, description: 'Sắp xếp: name | code | joinedAt | createdAt, thêm - để giảm dần' })
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('membershipStatus') membershipStatus?: string,
    @Query('packageId') packageId?: string,
    @Query('branchId') branchId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    return this.membersService.findAll({
      search,
      status,
      membershipStatus,
      packageId,
      branchId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      sort,
    });
  }

  @Get(':id/trainers')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Lịch sử HLV phụ trách của hội viên (TrainerMember)' })
  getTrainers(@Param('id') id: string) {
    return this.membersService.getTrainers(id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Chi tiết hồ sơ hội viên: gói tập, hoá đơn, check-in, lịch PT' })
  findOne(@Param('id') id: string) {
    return this.membersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Cập nhật hồ sơ / trạng thái hội viên (khóa, kích hoạt...)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.membersService.update(id, dto, actorId);
  }
}