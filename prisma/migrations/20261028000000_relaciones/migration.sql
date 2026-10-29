-- Evolución incremental del Lab 2 al Lab 3 sin borrar prendas existentes.
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'DELIVERED', 'CANCELLED');
ALTER TABLE "prendas" ALTER COLUMN "precio" TYPE DECIMAL(10,2) USING ROUND("precio"::numeric, 2);
ALTER TABLE "prendas" ADD COLUMN "categoria_id" INTEGER;
CREATE TABLE "users" (
 "id" SERIAL NOT NULL, "email" VARCHAR(120) NOT NULL,
 "password" TEXT NOT NULL, "name" VARCHAR(100) NOT NULL,
 "role" "Role" NOT NULL DEFAULT 'USER', "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "customers" (
 "id" SERIAL NOT NULL, "full_name" VARCHAR(100) NOT NULL,
 "email" VARCHAR(120) NOT NULL, "phone" VARCHAR(15),
 "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "user_id" INTEGER NOT NULL,
 CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "orders" (
 "id" SERIAL NOT NULL, "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
 "total" DECIMAL(10,2) NOT NULL,
 "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "customer_id" INTEGER NOT NULL,
 CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "order_items" (
 "order_id" INTEGER NOT NULL, "prenda_id" INTEGER NOT NULL,
 "quantity" INTEGER NOT NULL, "unit_price" DECIMAL(10,2) NOT NULL,
 CONSTRAINT "order_items_pkey" PRIMARY KEY ("order_id","prenda_id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");
CREATE UNIQUE INDEX "customers_user_id_key" ON "customers"("user_id");
CREATE INDEX "prendas_categoria_id_idx" ON "prendas"("categoria_id");
CREATE INDEX "orders_customer_id_idx" ON "orders"("customer_id");
CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at");
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_prenda_id_fkey" FOREIGN KEY ("prenda_id") REFERENCES "prendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prendas" ADD CONSTRAINT "prendas_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;
UPDATE "prendas" p SET "categoria_id" = c."id" FROM "categorias" c WHERE p."categoria" = c."nombre";
