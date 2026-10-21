import { Module } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { PackagesController } from './packages.controller';
import { PackagesRepository } from './repository/packages.repository';
import { TypeOrmPackagesRepository } from './repository/typeorm-packages.repository';
import { PACKAGES_REPOSITORY } from './repository/packages.tokens';

@Module({
  controllers: [PackagesController],
  providers: [
    PackagesService,
    { provide: PACKAGES_REPOSITORY, useClass: TypeOrmPackagesRepository },
  ],
  exports: [PackagesService],
})
export class PackagesModule {}
