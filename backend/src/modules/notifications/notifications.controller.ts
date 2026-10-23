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

  // ---------------- CÃ¡ nhÃ¢n ----------------

  @Get('me')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER, Role.MEMBER)
  @ApiOperation({
    summary:
      'ThÃ´ng bÃ¡o cá»§a tÃ i khoáº£n Ä‘ang Ä‘Äƒng nháº­p (tab all/unread/read, lá»c theo type). Member chá»‰ tháº¥y cá»§a chÃ­nh mÃ¬nh.',
  })
  getMine(@CurrentUser('id') userId: string, @Query() query: NotificationListQueryDto) {
    return this.notificationsService.getMine(userId, query);
  }

  @Get('me/unread')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER, Role.MEMBER)
  @ApiOperation({ summary: 'Sá»‘ thÃ´ng bÃ¡o chÆ°a Ä‘á»c (cho bell icon)' })
  async getUnread(@CurrentUser('id') userId: string) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch('read-all')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER, Role.MEMBER)
  @ApiOperation({ summary: 'ÄÃ¡nh dáº¥u táº¥t cáº£ Ä‘Ã£ Ä‘á»c' })
  markAllRead(@CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.notificationsService.markAllRead(userId, role);
  }

  @Patch(':id/read')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER, Role.MEMBER)
  @ApiOperation({ summary: 'ÄÃ¡nh dáº¥u má»™t thÃ´ng bÃ¡o Ä‘Ã£ Ä‘á»c (chá»‰ cá»§a chÃ­nh mÃ¬nh / admin)' })
  markRead(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markRead(userId, role, id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER, Role.MEMBER)
  @ApiOperation({ summary: 'XÃ³a thÃ´ng bÃ¡o (chá»‰ cá»§a chÃ­nh mÃ¬nh / admin)' })
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
    summary: 'Danh sÃ¡ch thÃ´ng bÃ¡o toÃ n há»‡ thá»‘ng (lá»c type/ngÃ y/unread/role) â€” dÃ nh cho admin',
  })
  findAllAdmin(@Query() query: NotificationListQueryDto) {
    return this.notificationsService.findAllAdmin(query);
  }

  @Post('announce')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary:
      'Táº¡o thÃ´ng bÃ¡o hÃ ng loáº¡t (announcement) â€” target ALL/MEMBERS/TRAINERS',
  })
  announce(@Body() dto: AnnouncementDto) {
    return this.notificationsService.announce(dto);
  }
}
