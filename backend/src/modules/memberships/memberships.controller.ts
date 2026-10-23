import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { MembershipsService } from './memberships.service';
import { UpdateMembershipStatusDto } from './dto/update-membership-status.dto';
import { ExtendMembershipDto } from './dto/extend-membership.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Memberships')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Láº¥y danh sÃ¡ch cÃ¡c há»£p Ä‘á»“ng/tháº» há»™i viÃªn' })
  findAll() {
    return this.membershipsService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Láº¥y chi tiáº¿t má»™t há»£p Ä‘á»“ng/tháº» há»™i viÃªn' })
  findOne(@Param('id') id: string) {
    return this.membershipsService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Cáº­p nháº­t tráº¡ng thÃ¡i: SUSPENDED / ACTIVE / CANCELLED / EXPIRED' })
  @ApiResponse({ status: 200, description: 'Cáº­p nháº­t thÃ nh cÃ´ng' })
  @ApiResponse({ status: 409, description: 'Tráº¡ng thÃ¡i chuyá»ƒn Ä‘á»•i khÃ´ng há»£p lá»‡' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateMembershipStatusDto, @CurrentUser('id') actorId: string) {
    return this.membershipsService.updateStatus(id, dto, actorId);
  }

  @Patch(':id/extend')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Gia háº¡n thÃªm N ngÃ y (táº¡o hÃ³a Ä‘Æ¡n chá» thu tiá»n)' })
  @ApiResponse({ status: 200, description: 'Gia háº¡n thÃ nh cÃ´ng' })
  extend(@Param('id') id: string, @Body() dto: ExtendMembershipDto, @CurrentUser('id') actorId: string) {
    return this.membershipsService.extend(id, dto, actorId);
  }
}
