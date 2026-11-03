import { handleSslCommerzIpn } from "@/lib/payments/sslcommerz-route-handlers";

export async function POST(request: Request) {
  return handleSslCommerzIpn(request);
}
