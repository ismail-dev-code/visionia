import { handleSslCommerzFailure } from "@/lib/payments/sslcommerz-route-handlers";

export async function POST(request: Request) {
  return handleSslCommerzFailure(request, "FAILED");
}
