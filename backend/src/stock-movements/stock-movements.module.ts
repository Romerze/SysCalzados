import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockMovementsController } from './stock-movements.controller';
import { StockMovementsService } from './stock-movements.service';
import { StockMovement } from './entities/stock-movement.entity';
import { RawMaterialsModule } from '../raw-materials/raw-materials.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockMovement]),
    RawMaterialsModule,
  ],
  controllers: [StockMovementsController],
  providers: [StockMovementsService],
})
export class StockMovementsModule {}
