import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductionOrdersService } from './production-orders.service';
import { CreateProductionOrderDto } from './dto/create-production-order.dto';
import { UpdateProductionOrderDto } from './dto/update-production-order.dto';

@Controller('production-orders')
export class ProductionOrdersController {
  constructor(private readonly ordersService: ProductionOrdersService) {}

  @Post()
  create(@Body() createDto: CreateProductionOrderDto) {
    return this.ordersService.create(createDto);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProductionOrderDto,
  ) {
    // El servicio maneja la lógica de cambio de estado (start, complete, cancel)
    return this.ordersService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Devolver 204 No Content en borrado exitoso
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.remove(id);
  }
} 