CREATE TYPE "PaymentPurpose" AS ENUM ('FULL_ORDER', 'COD_ADVANCE', 'COD_REMAINDER');

ALTER TABLE "Order"
ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'COD',
ADD COLUMN "advanceAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "advanceAppliedToShipping" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "remainingCodAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

UPDATE "Order"
SET "remainingCodAmount" = "totalAmount"
WHERE "paymentMethod" = 'COD';

ALTER TABLE "Payment"
ADD COLUMN "purpose" "PaymentPurpose" NOT NULL DEFAULT 'FULL_ORDER',
ADD COLUMN "providerReference" TEXT,
ADD COLUMN "providerStatus" TEXT,
ADD COLUMN "gatewayUrl" TEXT,
ADD COLUMN "verifiedAt" TIMESTAMP(3);

UPDATE "Payment"
SET "purpose" = 'COD_REMAINDER'
WHERE "method" = 'COD';
