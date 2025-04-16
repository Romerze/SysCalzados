import { Module } from '@nestjs/common';
import { SalesOrdersController } from './sales-orders.controller';
import { SalesOrdersService } from './sales-orders.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrder } from './entities/sales-order.entity';
import { SalesOrderItem } from './entities/sales-order-item.entity';
import { Client } from '../clients/entities/client.entity';
import { Product } from '../products/entities/product.entity';
import { ProductionOrdersModule } from '../production-orders/production-orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesOrder,
      SalesOrderItem,
      Client,
      Product,
    ]),
    ProductionOrdersModule,
  ],
  controllers: [SalesOrdersController],
  providers: [SalesOrdersService]
})
export class SalesOrdersModule {}
