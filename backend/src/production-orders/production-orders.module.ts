import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionOrder } from './entities/production-order.entity';
import { ProductionOrdersService } from './production-orders.service';
import { ProductionOrdersController } from './production-orders.controller';
import { ProductsModule } from '../products/products.module';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';
import { RawMaterialsModule } from '../raw-materials/raw-materials.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductionOrder]),
    ProductsModule,
    StockMovementsModule,
    RawMaterialsModule,
  ],
  controllers: [ProductionOrdersController],
  providers: [ProductionOrdersService],
  exports: [
    ProductionOrdersService,
    TypeOrmModule
  ]
})
export class ProductionOrdersModule {} 