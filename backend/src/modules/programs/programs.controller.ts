import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/program-create.dto';
import { SendProgramDto } from './dto/program-send.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Programs')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'Danh sách buổi tập của HLV' })
  listForTrainer(@CurrentUser() user: { id: string; role: string }, @Query() query?: any) {
    return this.programsService.listForTrainer(user.id, query);
  }

  @Post()
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'HLV tạo buổi tập mới' })
  create(@CurrentUser() user: { id: string; role: string }, @Body() dto: CreateProgramDto) {
    return this.programsService.create(user, dto);
  }

  @Get(':id')
  @Roles(Role.TRAINER, Role.MEMBER, Role.ADMIN, Role.STAFF, Role.MANAGER)
  @ApiOperation({ summary: 'Chi tiết buổi tập' })
  findOne(@CurrentUser() user: { id: string; role: string }, @Param('id') id: string) {
    return this.programsService.findOne(user, id);
  }

  @Patch(':id')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'Chỉnh sửa buổi tập (thay danh sách bài tập)' })
  update(@CurrentUser() user: { id: string; role: string }, @Param('id') id: string, @Body() dto: any) {
    return this.programsService.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'Xóa buổi tập' })
  remove(@CurrentUser() user: { id: string; role: string }, @Param('id') id: string) {
    return this.programsService.remove(user, id);
  }

  @Post(':id/duplicate')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'Nhân bản buổi tập (sửa) hoặc lưu mẫu cho hội viên' })
  duplicate(@CurrentUser() user: { id: string; role: string }, @Param('id') id: string, @Body() dto?: any) {
    return this.programsService.duplicate(user, id, dto);
  }

  @Post(':id/send')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'Gửi bài tập qua tin nhắn chat cho các hội viên được chọn (status → ASSIGNED)' })
  send(@CurrentUser() user: { id: string; role: string }, @Param('id') id: string, @Body() dto?: SendProgramDto) {
    return this.programsService.send(user, id, dto?.content, dto?.memberIds);
  }

  @Post(':id/confirm')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Hội viên xác nhận buổi tập' })
  confirm(@CurrentUser() user: { id: string; role: string }, @Param('id') id: string) {
    return this.programsService.confirm(user, id);
  }
}
