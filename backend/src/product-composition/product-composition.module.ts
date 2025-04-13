import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductComposition } from './entities/product-composition.entity';
import { ProductCompositionService } from './product-composition.service';
import { ProductCompositionController } from './product-composition.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductComposition])],
  controllers: [ProductCompositionController],
  providers: [ProductCompositionService],
  exports: [ProductCompositionService] // Exportar si otros módulos lo necesitan
})
export class ProductCompositionModule {} 