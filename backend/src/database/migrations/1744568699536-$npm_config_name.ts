import { MigrationInterface, QueryRunner } from "typeorm";

export class  $npmConfigName1744568699536 implements MigrationInterface {
    name = ' $npmConfigName1744568699536'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "product_composition" ("id" SERIAL NOT NULL, "quantity" numeric(10,3) NOT NULL, "productId" integer NOT NULL, "rawMaterialId" integer NOT NULL, CONSTRAINT "PK_c2321fa3dd8382d8acac5ef8a49" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "product_composition" ADD CONSTRAINT "FK_1c6c0d2c8f13797909981da0dc6" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_composition" ADD CONSTRAINT "FK_14b43986f7dbd682881ced604e8" FOREIGN KEY ("rawMaterialId") REFERENCES "raw_materials"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_composition" DROP CONSTRAINT "FK_14b43986f7dbd682881ced604e8"`);
        await queryRunner.query(`ALTER TABLE "product_composition" DROP CONSTRAINT "FK_1c6c0d2c8f13797909981da0dc6"`);
        await queryRunner.query(`DROP TABLE "product_composition"`);
    }

}
