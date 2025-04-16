import { Controller, Post, Body, ValidationPipe, Get, Param, ParseIntPipe, Patch, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { SalesOrdersService } from './sales-orders.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { UpdateSalesOrderNotesDto } from './dto/update-sales-order-notes.dto';

@Controller('sales-orders')
export class SalesOrdersController {
  constructor(private readonly salesOrdersService: SalesOrdersService) {}

  @Post()
  create(@Body(ValidationPipe) createSalesOrderDto: CreateSalesOrderDto) {
    // El ValidationPipe aquí (o globalmente) valida el DTO entrante
    // incluyendo la validación anidada de los items gracias a los decoradores
    return this.salesOrdersService.create(createSalesOrderDto);
  }

  @Get()
  findAll() {
    return this.salesOrdersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    // ParseIntPipe valida que id sea un número entero
    return this.salesOrdersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateSalesOrderDto: UpdateSalesOrderDto,
  ) {
    return this.salesOrdersService.update(id, updateSalesOrderDto);
  }

  @Patch(':id/notes')
  updateNotes(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateNotesDto: UpdateSalesOrderNotesDto,
  ) {
    return this.salesOrdersService.updateNotes(id, updateNotesDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Set success status code to 204
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.salesOrdersService.remove(id);
  }
}
