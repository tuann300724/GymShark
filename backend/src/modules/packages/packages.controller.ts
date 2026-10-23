import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Membership Packages')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('membership-packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Láº¥y danh sÃ¡ch cÃ¡c gÃ³i táº­p gym (Membership Packages)' })
  findAll() {
    return this.packagesService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Láº¥y chi tiáº¿t má»™t gÃ³i táº­p' })
  findOne(@Param('id') id: string) {
    return this.packagesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Táº¡o gÃ³i táº­p má»›i (backend tá»± sinh mÃ£ gÃ³i)' })
  @ApiResponse({ status: 201, description: 'Táº¡o gÃ³i thÃ nh cÃ´ng' })
  @ApiResponse({ status: 400, description: 'Dá»¯ liá»‡u khÃ´ng há»£p lá»‡' })
  create(@Body() dto: CreatePackageDto) {
    return this.packagesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Cáº­p nháº­t gÃ³i táº­p (giÃ¡, thá»i háº¡n, tÃ­nh nÄƒng, tráº¡ng thÃ¡i...)' })
  @ApiResponse({ status: 200, description: 'Cáº­p nháº­t thÃ nh cÃ´ng' })
  update(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.packagesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'XoÃ¡ gÃ³i táº­p (chá»‰ khi chÆ°a Ä‘Æ°á»£c há»™i viÃªn nÃ o Ä‘Äƒng kÃ½)' })
  @ApiResponse({ status: 200, description: 'ÄÃ£ xoÃ¡ gÃ³i táº­p' })
  @ApiResponse({ status: 409, description: 'GÃ³i Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng, khÃ´ng thá»ƒ xoÃ¡' })
  remove(@Param('id') id: string) {
    return this.packagesService.remove(id);
  }
}
