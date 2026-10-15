import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import {
  ConversationQueryDto,
  MessageQueryDto,
  SendMessageDto,
  StartConversationDto,
} from './dto/chat.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Chat')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TRAINER, Role.MEMBER)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({
    summary: 'Danh sách cuộc trò chuyện của tôi (HLV: từng hội viên; hội viên: HLV phụ trách)',
  })
  listConversations(@CurrentUser() user: { id: string; role: string }, @Query() query: ConversationQueryDto) {
    return this.chatService.listConversations(user, query);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'HLV mở một cuộc trò chuyện với hội viên được phân công' })
  startConversation(
    @CurrentUser() user: { id: string; role: string },
    @Body() dto: StartConversationDto,
  ) {
    return this.chatService.startConversation(user, dto);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Tổng số tin nhắn chưa đọc của tôi' })
  unreadCount(@CurrentUser() user: { id: string; role: string }) {
    return this.chatService.unreadCount(user);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Lịch sử tin nhắn của một cuộc trò chuyện (phân trang, mới nhất trước)' })
  listMessages(
    @CurrentUser() user: { id: string; role: string },
    @Param('id') id: string,
    @Query() query: MessageQueryDto,
  ) {
    return this.chatService.listMessages(user, id, query);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Gửi tin nhắn (văn bản hoặc hình ảnh) trong cuộc trò chuyện' })
  sendMessage(
    @CurrentUser() user: { id: string; role: string },
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(user, id, dto);
  }

  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'Đánh dấu đã đọc toàn bộ tin nhắn nhận được trong cuộc trò chuyện' })
  markRead(@CurrentUser() user: { id: string; role: string }, @Param('id') id: string) {
    return this.chatService.markRead(user, id);
  }
}
