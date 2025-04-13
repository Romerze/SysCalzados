import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RawMaterial } from './entities/raw-material.entity';
import { RawMaterialsService } from './raw-materials.service';
import { RawMaterialsController } from './raw-materials.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RawMaterial])],
  providers: [RawMaterialsService],
  controllers: [RawMaterialsController],
  // controllers y providers se añadirán aquí
})
export class RawMaterialsModule {}
