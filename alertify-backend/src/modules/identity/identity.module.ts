import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityService } from './identity.service';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [IdentityService],
  exports: [TypeOrmModule, IdentityService], // Exportamos para que el Worker pueda usarlo
})
export class IdentityModule {}