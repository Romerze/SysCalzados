import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ProductCompositionService } from './product-composition.service';
import { CreateProductCompositionDto } from './dto/create-product-composition.dto';
import { UpdateProductCompositionDto } from './dto/update-product-composition.dto';

@Controller('product-composition') // Ruta base
export class ProductCompositionController {
  constructor(private readonly compositionService: ProductCompositionService) {}

  // Endpoint para crear UN item de composición
  @Post()
  create(@Body() createDto: CreateProductCompositionDto) {
    return this.compositionService.create(createDto);
  }

  // Endpoint para obtener toda la composición de un producto
  @Get('by-product/:productId')
  findAllByProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.compositionService.findAllByProduct(productId);
  }

  // Endpoint para obtener UN item específico por su ID
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.compositionService.findOne(id);
  }

  // Endpoint para actualizar UN item específico (solo cantidad)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateProductCompositionDto) {
    return this.compositionService.update(id, updateDto);
  }

  // Endpoint para eliminar UN item específico
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    // Devuelve void, Nest por defecto responde 200 OK si no hay error
    return this.compositionService.remove(id); 
  }
} 