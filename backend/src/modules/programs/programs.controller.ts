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
  @ApiOperation({ summary: 'Danh sáº±ch bá»«i tÃªm do HLV' })
  listForTrainer(@CurrentUser() user: { id: string; role: string }, @Query() query?: any) {
    return this.programsService.listForTrainer(user.id, query);
  }

  @Post()
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'HLV lÃ m bÃ i tÃªm' })
  create(@CurrentUser() user: { id: string; role: string }, @Body() dto: CreateProgramDto) {
    return this.programsService.create(user, dto);
  }

  @Get(':id')
  @Roles(Role.TRAINER, Role.MEMBER, Role.ADMIN, Role.STAFF, Role.MANAGER)
  @ApiOperation({ summary: 'Chi tiáº¿t bá»«i tÃªm' })
  findOne(@CurrentUser() user: { id: string; role: string }, @Param('id') id: string) {
    return this.programsService.findOne(user, id);
  }

  @Patch(':id')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'Chá»‰nh sá»­a bá»«i tÃªm (thay danh sáº½ chá»¬a)' })
  update(@CurrentUser() user: { id: string; role: string }, @Param('id') id: string, @Body() dto: any) {
    return this.programsService.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'Xoá bá»«i tÃªm' })
  remove(@CurrentUser() user: { id: string; role: string }, @Param('id') id: string) {
    return this.programsService.remove(user, id);
  }

  @Post(':id/duplicate')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'Nhá»›n bá»«i tÃªm (saá»·a) hoáº·c lÃºu máº«u cho há»™i viá»n)' })
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
  @ApiOperation({ summary: 'Há»™i viá»n xÃ¡c nháº­n bá»«i tÃªm' })
  confirm(@CurrentUser() user: { id: string; role: string }, @Param('id') id: string) {
    return this.programsService.confirm(user, id);
  }
}
