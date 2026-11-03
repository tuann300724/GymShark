import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExercisesService } from './exercises.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Exercises')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly svc: ExercisesService) {}

  @Post()
  @Roles(Role.TRAINER, Role.ADMIN)
  @ApiOperation({ summary: 'Tạo bài tập (HLV / ADMIN)' })
  create(@Body() d: CreateExerciseDto) { return this.svc.create(d); }

  @Get()
  @Roles(Role.TRAINER, Role.ADMIN)
  @ApiOperation({ summary: 'Danh sách bài tập (danh mục có sẵn)' })
  findAll() { return this.svc.findAll(); }

  @Get(':id')
  @Roles(Role.TRAINER, Role.ADMIN)
  @ApiOperation({ summary: 'Chi tiết bài tập' })
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Put(':id')
  @Roles(Role.TRAINER, Role.ADMIN)
  @ApiOperation({ summary: 'Chỉnh sửa bài tập' })
  update(@Param('id') id: string, @Body() d: UpdateExerciseDto) { return this.svc.update(id, d); }

  @Delete(':id')
  @Roles(Role.TRAINER, Role.ADMIN)
  @ApiOperation({ summary: 'Xóa bài tập' })
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
