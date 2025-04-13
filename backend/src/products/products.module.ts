import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { RawMaterialsModule } from '../raw-materials/raw-materials.module';
import { ProductCompositionModule } from '../product-composition/product-composition.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    RawMaterialsModule,
    ProductCompositionModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
