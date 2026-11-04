import { Module } from "@nestjs/common";
import { ChatModule } from "../chat/chat.module";
import { StaffShiftsController } from "./staff-shifts.controller";
import { StaffShiftsService } from "./staff-shifts.service";

@Module({
  imports: [ChatModule],
  controllers: [StaffShiftsController],
  providers: [StaffShiftsService],
})
export class StaffShiftsModule {}
