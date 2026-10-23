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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TrainersService } from './trainers.service';
import { CreateTrainerDto, TrainerQueryDto, UpdateTrainerDto } from './dto/trainer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Trainers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trainers')
export class TrainersController {
  constructor(private readonly trainersService: TrainersService) {}

  // ---------------------------------------------------------------------------
  // Self endpoints (khai bÃ¡o trÆ°á»›c :id Ä‘á»ƒ khÃ´ng bá»‹ route Ä‘á»™ng nuá»‘t)
  // ---------------------------------------------------------------------------

  @Get('me')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'HLV Ä‘ang phá»¥ trÃ¡ch tÃ i khoáº£n há»™i viÃªn Ä‘ang Ä‘Äƒng nháº­p' })
  getMyTrainer(@CurrentUser('id') userId: string) {
    return this.trainersService.getMyTrainer(userId);
  }

  @Get('me/members')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'Danh sÃ¡ch há»™i viÃªn mÃ  HLV Ä‘ang Ä‘Äƒng nháº­p Ä‘Æ°á»£c phá»¥ trÃ¡ch' })
  getMyMembers(@CurrentUser('id') userId: string) {
    return this.trainersService.getMyMembers(userId);
  }

  @Get('me/profile')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'Há»“ sÆ¡ + thá»‘ng kÃª cá»§a HLV Ä‘ang Ä‘Äƒng nháº­p (trang há»“ sÆ¡)' })
  getMyProfile(@CurrentUser('id') userId: string) {
    return this.trainersService.getMyProfile(userId);
  }

  // ---------------------------------------------------------------------------
  // List / Detail
  // ---------------------------------------------------------------------------

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Danh sÃ¡ch huáº¥n luyá»‡n viÃªn (tÃ¬m kiáº¿m, lá»c, phÃ¢n trang)' })
  findAll(@Query() query: TrainerQueryDto) {
    return this.trainersService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Chi tiáº¿t huáº¥n luyá»‡n viÃªn + thá»‘ng kÃª + há»™i viÃªn phá»¥ trÃ¡ch + lá»‹ch' })
  findOne(@Param('id') id: string) {
    return this.trainersService.findOne(id);
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Táº¡o huáº¥n luyá»‡n viÃªn má»›i (kÃ¨m tÃ i khoáº£n Ä‘Äƒng nháº­p TRAINER)' })
  @ApiResponse({ status: 201, description: 'Táº¡o thÃ nh cÃ´ng, tráº£ vá» tempPassword Ä‘á»ƒ cáº¥p cho HLV' })
  create(@Body() dto: CreateTrainerDto, @CurrentUser('id') actorId: string) {
    return this.trainersService.create(dto, actorId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Cáº­p nháº­t há»“ sÆ¡ / tráº¡ng thÃ¡i huáº¥n luyá»‡n viÃªn' })
  update(@Param('id') id: string, @Body() dto: UpdateTrainerDto, @CurrentUser('id') actorId: string) {
    return this.trainersService.update(id, dto, actorId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Ngá»«ng hoáº¡t Ä‘á»™ng HLV (soft delete â€” giá»¯ lá»‹ch sá»­)' })
  remove(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.trainersService.remove(id, actorId);
  }

  // ---------------------------------------------------------------------------
  // Trainer â†” Member assignments
  // ---------------------------------------------------------------------------

  @Get(':id/members')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Danh sÃ¡ch phÃ¢n cÃ´ng (lá»‹ch sá»­) cá»§a má»™t HLV' })
  getMembers(@Param('id') id: string) {
    return this.trainersService.getMembers(id);
  }

  @Post(':id/members/:memberId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'GÃ¡n HLV cho há»™i viÃªn (kiá»ƒm tra trÃ¹ng láº·p ACTIVE)' })
  @ApiParam({ name: 'id', description: 'ID huáº¥n luyá»‡n viÃªn' })
  @ApiParam({ name: 'memberId', description: 'ID há»™i viÃªn' })
  assignMember(@Param('id') id: string, @Param('memberId') memberId: string) {
    return this.trainersService.assignMember(id, memberId);
  }

  @Delete(':id/members/:memberId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Káº¿t thÃºc phÃ¢n cÃ´ng HLV cho há»™i viÃªn (giá»¯ lá»‹ch sá»­)' })
  @ApiParam({ name: 'id', description: 'ID huáº¥n luyá»‡n viÃªn' })
  @ApiParam({ name: 'memberId', description: 'ID há»™i viÃªn' })
  unassignMember(@Param('id') id: string, @Param('memberId') memberId: string) {
    return this.trainersService.unassignMember(id, memberId);
  }
}
