import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockMovementsController } from './stock-movements.controller';
import { StockMovementsService } from './stock-movements.service';
import { StockMovement } from './entities/stock-movement.entity';
import { RawMaterial } from '../raw-materials/entities/raw-material.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StockMovement, RawMaterial])],
  controllers: [StockMovementsController],
  providers: [StockMovementsService],
  exports: [StockMovementsService],
})
export class StockMovementsModule {}
