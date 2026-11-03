CREATE TYPE "PaymentRefundStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

ALTER TABLE "Payment"
ADD COLUMN "sessionKey" TEXT,
ADD COLUMN "validationId" TEXT,
ADD COLUMN "bankTransactionId" TEXT;

CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");
CREATE INDEX "Payment_sessionKey_idx" ON "Payment"("sessionKey");
CREATE INDEX "Payment_bankTransactionId_idx" ON "Payment"("bankTransactionId");

CREATE TABLE "PaymentRefund" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "providerReference" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "status" "PaymentRefundStatus" NOT NULL DEFAULT 'PENDING',
    "providerStatus" TEXT,
    "checkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRefund_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentRefund_referenceId_key" ON "PaymentRefund"("referenceId");
CREATE INDEX "PaymentRefund_paymentId_idx" ON "PaymentRefund"("paymentId");
CREATE INDEX "PaymentRefund_status_idx" ON "PaymentRefund"("status");

ALTER TABLE "PaymentRefund"
ADD CONSTRAINT "PaymentRefund_paymentId_fkey"
FOREIGN KEY ("paymentId") REFERENCES "Payment"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
