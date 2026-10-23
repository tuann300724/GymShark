import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { MembersService, StaffActor } from './members.service';
import { UpdateMemberDto } from './dto/update-member.dto';
import { CreateMemberDto } from './dto/create-member.dto';
import { RegisterCardDto } from './dto/register-card.dto';
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
  @ApiOperation({ summary: 'Danh sÃ¡ch há»™i viÃªn (tÃ¬m kiáº¿m, lá»c, sáº¯p xáº¿p, phÃ¢n trang)' })
  @ApiQuery({ name: 'search', required: false, description: 'TÃ¬m theo tÃªn/email/SÄT/mÃ£ há»™i viÃªn' })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED'] })
  @ApiQuery({ name: 'membershipStatus', required: false, description: 'Lá»c theo tráº¡ng thÃ¡i membership' })
  @ApiQuery({ name: 'packageId', required: false, description: 'Lá»c theo gÃ³i táº­p' })
  @ApiQuery({ name: 'page', required: false, description: 'Trang hiá»‡n táº¡i (máº·c Ä‘á»‹nh 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Sá»‘ báº£n ghi má»—i trang (máº·c Ä‘á»‹nh 20)' })
  @ApiQuery({ name: 'sort', required: false, description: 'Sáº¯p xáº¿p: name | code | joinedAt | createdAt, thÃªm - Ä‘á»ƒ giáº£m dáº§n' })
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('membershipStatus') membershipStatus?: string,
    @Query('packageId') packageId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    return this.membersService.findAll({
      search,
      status,
      membershipStatus,
      packageId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      sort,
    });
  }

  @Get(':id/trainers')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Lá»‹ch sá»­ HLV phá»¥ trÃ¡ch cá»§a há»™i viÃªn (TrainerMember)' })
  getTrainers(@Param('id') id: string) {
    return this.membersService.getTrainers(id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Chi tiáº¿t há»“ sÆ¡ há»™i viÃªn: gÃ³i táº­p, hoÃ¡ Ä‘Æ¡n, check-in, lá»‹ch PT' })
  findOne(@Param('id') id: string) {
    return this.membersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Cáº­p nháº­t há»“ sÆ¡ / tráº¡ng thÃ¡i há»™i viÃªn (khÃ³a, kÃ­ch hoáº¡t, háº¿t háº¡n...) â€” admin toÃ n quyá»n' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.membersService.update(id, dto, actorId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary: 'Táº¡o há»™i viÃªn má»›i táº¡i quáº§y (táº¡o tÃ i khoáº£n + há»“ sÆ¡ há»™i viÃªn)',
    description:
      'KhÃ´ng truyá»n máº­t kháº©u â†’ há»‡ thá»‘ng sinh máº­t kháº©u táº¡m vÃ  tráº£ vá» 1 láº§n (tempPassword) cho lá»… tÃ¢n Ä‘Æ°a há»™i viÃªn.',
  })
  @ApiResponse({ status: 201, description: 'ÄÃ£ táº¡o há»™i viÃªn' })
  @ApiResponse({ status: 409, description: 'Email Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng' })
  create(@Body() dto: CreateMemberDto, @CurrentUser() actor: StaffActor) {
    return this.membersService.create(dto, actor);
  }

  @Post(':id/memberships')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary: 'Lá»… tÃ¢n táº¡o tháº» táº­p cho há»™i viÃªn táº¡i quáº§y (admin toÃ n quyá»n)',
    description:
      'payNow=false â†’ tháº» PENDING + hoÃ¡ Ä‘Æ¡n chá» xÃ¡c nháº­n. payNow=true â†’ thu tiá»n ngay vÃ  kÃ­ch hoáº¡t tháº» (chá»‰ Tiá»n máº·t / Chuyá»ƒn khoáº£n).',
  })
  @ApiResponse({ status: 201, description: 'ÄÃ£ táº¡o tháº»' })
  @ApiResponse({ status: 409, description: 'Há»™i viÃªn Ä‘ang cÃ³ gÃ³i hoáº¡t Ä‘á»™ng hoáº·c gÃ³i chá» xÃ¡c nháº­n' })
  registerCard(@Param('id') id: string, @Body() dto: RegisterCardDto, @CurrentUser() actor: StaffActor) {
    return this.membersService.registerCard(id, dto, actor);
  }
}
