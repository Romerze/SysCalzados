import { MigrationInterface, QueryRunner } from "typeorm";

export class  $npmConfigName1744570604162 implements MigrationInterface {
    name = ' $npmConfigName1744570604162'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."production_orders_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "production_orders" ("id" SERIAL NOT NULL, "orderNumber" character varying(50), "productId" integer NOT NULL, "quantityToProduce" integer NOT NULL, "status" "public"."production_orders_status_enum" NOT NULL DEFAULT 'PENDING', "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "startedAt" TIMESTAMP, "completedAt" TIMESTAMP, CONSTRAINT "UQ_de6985f5e09e50407ea221c6e22" UNIQUE ("orderNumber"), CONSTRAINT "PK_44d72e026027e3448b5d655e16e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_de6985f5e09e50407ea221c6e2" ON "production_orders" ("orderNumber") `);
        await queryRunner.query(`ALTER TABLE "production_orders" ADD CONSTRAINT "FK_8584be8f232016b2c24a4e12589" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "production_orders" DROP CONSTRAINT "FK_8584be8f232016b2c24a4e12589"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_de6985f5e09e50407ea221c6e2"`);
        await queryRunner.query(`DROP TABLE "production_orders"`);
        await queryRunner.query(`DROP TYPE "public"."production_orders_status_enum"`);
    }

}
