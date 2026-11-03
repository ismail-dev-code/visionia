import { handleSslCommerzSuccess } from "@/lib/payments/sslcommerz-route-handlers";

export async function POST(request: Request) {
  return handleSslCommerzSuccess(request);
}
