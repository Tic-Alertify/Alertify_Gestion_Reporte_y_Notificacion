import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityService } from './identity.service';
import { IdentityController } from './identity.controller';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [IdentityController],
  providers: [IdentityService],
  exports: [TypeOrmModule, IdentityService],
})
export class IdentityModule {}