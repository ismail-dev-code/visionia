CREATE INDEX "CartItem_productId_idx" ON "CartItem"("productId");
CREATE INDEX "WishlistItem_productId_idx" ON "WishlistItem"("productId");
CREATE INDEX "Order_addressId_idx" ON "Order"("addressId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");
CREATE INDEX "CheckoutIntent_productId_idx" ON "CheckoutIntent"("productId");
CREATE INDEX "CheckoutIntent_variantId_idx" ON "CheckoutIntent"("variantId");
CREATE INDEX "Coupon_createdById_idx" ON "Coupon"("createdById");
CREATE INDEX "Review_productId_idx" ON "Review"("productId");
