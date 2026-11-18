import { Module } from "@nestjs/common";
import { MembershipsService } from "./memberships.service";
import { MembershipsController } from "./memberships.controller";
import { MembershipChangesController } from "./membership-changes.controller";
import { MembershipChangesService } from "./membership-changes.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { PaymentsModule } from "../payments/payments.module";

@Module({
  imports: [NotificationsModule, PaymentsModule],
  controllers: [MembershipsController, MembershipChangesController],
  providers: [MembershipsService, MembershipChangesService],
  exports: [MembershipsService],
})
export class MembershipsModule {}
