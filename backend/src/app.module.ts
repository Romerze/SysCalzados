import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { RawMaterialsModule } from './raw-materials/raw-materials.module';
import { ClientsModule } from './clients/clients.module';
import { ProductsModule } from './products/products.module';
import { StockMovementsModule } from './stock-movements/stock-movements.module';
import { ProductCompositionModule } from './product-composition/product-composition.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    SuppliersModule,
    RawMaterialsModule,
    ClientsModule,
    ProductsModule,
    StockMovementsModule,
    ProductCompositionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
