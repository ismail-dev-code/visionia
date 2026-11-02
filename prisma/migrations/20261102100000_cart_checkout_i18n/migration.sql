ALTER TABLE "Category"
ADD COLUMN "translations" JSONB;

ALTER TABLE "Product"
ADD COLUMN "translations" JSONB;

ALTER TABLE "CartItem"
ADD COLUMN "variantId" TEXT,
ADD COLUMN "variantKey" TEXT NOT NULL DEFAULT '';

DROP INDEX "CartItem_cartId_productId_key";

CREATE UNIQUE INDEX "CartItem_cartId_productId_variantKey_key"
ON "CartItem"("cartId", "productId", "variantKey");

ALTER TABLE "Order"
ADD COLUMN "checkoutIntentId" TEXT;

ALTER TABLE "OrderItem"
ADD COLUMN "variantId" TEXT,
ADD COLUMN "variantName" TEXT,
ADD COLUMN "variantValue" TEXT;

CREATE TABLE "CheckoutIntent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckoutIntent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Order_checkoutIntentId_key" ON "Order"("checkoutIntentId");
CREATE INDEX "CheckoutIntent_userId_idx" ON "CheckoutIntent"("userId");
CREATE INDEX "CheckoutIntent_expiresAt_idx" ON "CheckoutIntent"("expiresAt");
CREATE INDEX "CartItem_variantId_idx" ON "CartItem"("variantId");
CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem"("variantId");

ALTER TABLE "CartItem"
ADD CONSTRAINT "CartItem_variantId_fkey"
FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
ADD CONSTRAINT "OrderItem_variantId_fkey"
FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CheckoutIntent"
ADD CONSTRAINT "CheckoutIntent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CheckoutIntent"
ADD CONSTRAINT "CheckoutIntent_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CheckoutIntent"
ADD CONSTRAINT "CheckoutIntent_variantId_fkey"
FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Order"
ADD CONSTRAINT "Order_checkoutIntentId_fkey"
FOREIGN KEY ("checkoutIntentId") REFERENCES "CheckoutIntent"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
