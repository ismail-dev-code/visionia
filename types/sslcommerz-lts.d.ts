declare module "sslcommerz-lts" {
  class SSLCommerzPayment {
    constructor(storeId: string, storePassword: string, isLive?: boolean);

    init(data: Record<string, string | number>): Promise<unknown>;
    validate(data: { val_id: string }): Promise<unknown>;
    initiateRefund(data: {
      refund_amount: string;
      refund_remarks: string;
      bank_tran_id: string;
      refe_id: string;
    }): Promise<unknown>;
    refundQuery(data: { refund_ref_id: string }): Promise<unknown>;
    transactionQueryByTransactionId(data: { tran_id: string }): Promise<unknown>;
    transactionQueryBySessionId(data: { sessionkey: string }): Promise<unknown>;
  }

  export default SSLCommerzPayment;
}
