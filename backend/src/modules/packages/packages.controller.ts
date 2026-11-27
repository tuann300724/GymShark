import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveOwnerScope, type ScopeActor } from '../../common/utils/partner-scope';

@ApiTags('Membership Packages')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('membership-packages')
export class PackagesController {
  constructor(
    private readonly packagesService: PackagesService,
    private readonly prisma: PrismaService,
  ) {}

  /** Đối tác chỉ thao tác gói riêng của phòng mình; tài khoản hệ thống thao tác gói hệ thống */
  private scope(actor: ScopeActor) {
    return resolveOwnerScope(this.prisma, actor);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Lấy danh sách các gói tập gym (Membership Packages)' })
  async findAll(@CurrentUser() actor: ScopeActor) {
    return this.packagesService.findAll(await this.scope(actor));
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Lấy chi tiết một gói tập' })
  async findOne(@Param('id') id: string, @CurrentUser() actor: ScopeActor) {
    return this.packagesService.findOne(id, await this.scope(actor));
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Tạo gói tập mới (backend tự sinh mã gói)' })
  @ApiResponse({ status: 201, description: 'Tạo gói thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  async create(@Body() dto: CreatePackageDto, @CurrentUser() actor: ScopeActor) {
    return this.packagesService.create(dto, await this.scope(actor));
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Cập nhật gói tập (giá, thời hạn, tính năng, trạng thái...)' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePackageDto,
    @CurrentUser() actor: ScopeActor,
  ) {
    return this.packagesService.update(id, dto, await this.scope(actor));
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Xoá gói tập (chỉ khi chưa được hội viên nào đăng ký)' })
  @ApiResponse({ status: 200, description: 'Đã xoá gói tập' })
  @ApiResponse({ status: 409, description: 'Gói đã được sử dụng, không thể xoá' })
  async remove(@Param('id') id: string, @CurrentUser() actor: ScopeActor) {
    return this.packagesService.remove(id, await this.scope(actor));
  }
}
