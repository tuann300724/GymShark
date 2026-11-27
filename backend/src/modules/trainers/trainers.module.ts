import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { TrainersService } from "./trainers.service";
import { TrainersController } from "./trainers.controller";
import { TrainerApplicationsService } from "./trainer-applications.service";
import { TrainerApplicationsController } from "./trainer-applications.controller";

@Module({
  imports: [NotificationsModule],
  controllers: [TrainersController, TrainerApplicationsController],
  providers: [TrainersService, TrainerApplicationsService],
  exports: [TrainersService],
})
export class TrainersModule {}
