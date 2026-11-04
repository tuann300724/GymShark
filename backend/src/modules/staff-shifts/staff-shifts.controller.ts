import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import {
  CreateStaffShiftDto,
  SettleStaffShiftDto,
  StaffShiftQueryDto,
  UpdateStaffShiftDto,
} from "./dto/staff-shift.dto";
import { StaffShiftsService } from "./staff-shifts.service";

interface ShiftActor {
  id: string;
  role: string;
}

@ApiTags("Staff Shifts")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("staff-shifts")
export class StaffShiftsController {
  constructor(private readonly shiftsService: StaffShiftsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: "Danh sách ca làm và báo cáo doanh thu theo ca" })
  list(@Query() query: StaffShiftQueryDto, @CurrentUser() actor: ShiftActor) {
    return this.shiftsService.list(query, actor);
  }

  @Get("options")
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary: "Danh sách nhân viên và chi nhánh cho bộ lọc/phân ca",
  })
  options(@CurrentUser() actor: ShiftActor) {
    return this.shiftsService.options(actor);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: "Tạo và phân công ca làm" })
  create(@Body() dto: CreateStaffShiftDto, @CurrentUser() actor: ShiftActor) {
    return this.shiftsService.create(dto, actor);
  }

  @Patch(":id")
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: "Sửa ca làm chưa bắt đầu" })
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateStaffShiftDto,
    @CurrentUser() actor: ShiftActor,
  ) {
    return this.shiftsService.update(id, dto, actor);
  }

  @Delete(":id")
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: "Xóa ca đã lên lịch, chưa bắt đầu và chưa phát sinh thanh toán",
  })
  remove(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: ShiftActor,
  ) {
    return this.shiftsService.remove(id, actor);
  }

  @Post(":id/cancel")
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: "Hủy ca làm đã lên lịch hoặc đang diễn ra" })
  cancel(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: ShiftActor,
  ) {
    return this.shiftsService.cancel(id, actor);
  }

  @Post(":id/start")
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: "Nhân viên bắt đầu ca được phân công" })
  start(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: ShiftActor,
  ) {
    return this.shiftsService.start(id, actor);
  }

  @Post(":id/end")
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: "Kiểm quỹ và chốt ca đang làm" })
  end(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: SettleStaffShiftDto,
    @CurrentUser() actor: ShiftActor,
  ) {
    return this.shiftsService.end(id, dto, actor);
  }

  @Get(":id/settlement-preview")
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: "Xem tiền mặt dự kiến trước khi chốt ca" })
  settlementPreview(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: ShiftActor,
  ) {
    return this.shiftsService.settlementPreview(id, actor);
  }
}
