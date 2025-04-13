import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { StockMovementsService } from './stock-movements.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';

@Controller('stock-movements')
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  // Usar UsePipes aquí si no está globalmente o se necesita configuración específica
  // @UsePipes(new ValidationPipe({ transform: true, whitelist: true })) 
  @Post()
  create(@Body() createStockMovementDto: CreateStockMovementDto) {
    // La validación y transformación (si se configuró) ocurren automáticamente
    return this.stockMovementsService.createMovement(createStockMovementDto);
  }

  @Get()
  findAll(@Query('rawMaterialId') rawMaterialId?: string) {
    // Validar y transformar el query param opcional
    let materialId: number | undefined;
    if (rawMaterialId) {
        try {
            // Usar ParseIntPipe manualmente o validación simple
            materialId = parseInt(rawMaterialId, 10);
            if (isNaN(materialId)) {
                throw new Error(); // Lanzar error si no es número válido
            }
        } catch (e) {
            // Devolver un error si el ID no es un número válido
            // O simplemente ignorarlo y devolver todos los movimientos
             console.warn('Invalid rawMaterialId query param received:', rawMaterialId);
             // throw new BadRequestException('El parámetro rawMaterialId debe ser un número.');
             materialId = undefined; // Ignorar filtro si no es válido
        }
    }
    return this.stockMovementsService.findAllMovements(materialId);
  }
}
