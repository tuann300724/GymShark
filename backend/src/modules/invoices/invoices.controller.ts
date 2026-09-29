import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InvoiceListQueryDto } from './dto/invoice-list-query.dto';

@ApiTags('Invoices')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Danh sách hóa đơn (admin) — filter, search, phân trang' })
  findAll(@Query() query: InvoiceListQueryDto) {
    return this.invoicesService.findAll(query);
  }

  @Get('me')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Lịch sử hóa đơn của hội viên đang đăng nhập' })
  getMyInvoices(@CurrentUser('id') userId: string, @Query() query: InvoiceListQueryDto) {
    return this.invoicesService.getMemberInvoices(userId, query);
  }

  @Get('me/:id')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Chi tiết hóa đơn của hội viên (chỉ xem được của chính mình)' })
  getMyInvoice(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.invoicesService.getMemberInvoice(userId, id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Chi tiết một hóa đơn (admin)' })
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }
}