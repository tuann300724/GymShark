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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnnouncementDto } from './dto/announcement.dto';
import { NotificationListQueryDto } from './dto/notification-query.dto';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ---------------- Cá nhân ----------------

  @Get('me')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER, Role.MEMBER)
  @ApiOperation({
    summary:
      'Thông báo của tài khoản đang đăng nhập (tab all/unread/read, lọc theo type). Member chỉ thấy của chính mình.',
  })
  getMine(@CurrentUser('id') userId: string, @Query() query: NotificationListQueryDto) {
    return this.notificationsService.getMine(userId, query);
  }

  @Get('me/unread')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER, Role.MEMBER)
  @ApiOperation({ summary: 'Số thông báo chưa đọc (cho bell icon)' })
  async getUnread(@CurrentUser('id') userId: string) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch('read-all')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER, Role.MEMBER)
  @ApiOperation({ summary: 'Đánh dấu tất cả đã đọc' })
  markAllRead(@CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.notificationsService.markAllRead(userId, role);
  }

  @Patch(':id/read')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER, Role.MEMBER)
  @ApiOperation({ summary: 'Đánh dấu một thông báo đã đọc (chỉ của chính mình / admin)' })
  markRead(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markRead(userId, role, id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER, Role.MEMBER)
  @ApiOperation({ summary: 'Xóa thông báo (chỉ của chính mình / admin)' })
  remove(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.remove(userId, role, id);
  }

  // ---------------- Admin ----------------

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Danh sách thông báo toàn hệ thống (lọc type/ngày/unread/role) — dành cho admin',
  })
  findAllAdmin(@Query() query: NotificationListQueryDto) {
    return this.notificationsService.findAllAdmin(query);
  }

  @Post('announce')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary:
      'Tạo thông báo hàng loạt (announcement) — target ALL/MEMBERS/TRAINERS/STAFF/MANAGERS/SPECIFIC_BRANCH',
  })
  announce(@Body() dto: AnnouncementDto) {
    return this.notificationsService.announce(dto);
  }
}