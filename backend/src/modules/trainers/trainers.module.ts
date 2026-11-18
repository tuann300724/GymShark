import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { TrainersService } from "./trainers.service";
import { TrainersController } from "./trainers.controller";

@Module({
  imports: [NotificationsModule],
  controllers: [TrainersController],
  providers: [TrainersService],
  exports: [TrainersService],
})
export class TrainersModule {}
