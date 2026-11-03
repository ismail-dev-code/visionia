import { NextResponse } from "next/server";

import {
  processSslCommerzFailure,
  processSslCommerzSuccess,
} from "@/lib/payments/sslcommerz-callback";
import { getSslCommerzCallbackBaseUrl } from "@/lib/payments/sslcommerz";

export async function handleSslCommerzSuccess(request: Request) {
  try {
    const result = await processSslCommerzSuccess(await request.formData());
    const destination = result.orderId
      ? `/orders/${encodeURIComponent(result.orderId)}?payment=${result.verified ? "success" : "failed"}`
      : "/checkout?payment=unverified";

    return NextResponse.redirect(
      new URL(destination, getSslCommerzCallbackBaseUrl()),
      303,
    );
  } catch (error) {
    console.error("Could not process SSLCommerz success callback.", error);
    try {
      return NextResponse.redirect(
        new URL("/checkout?payment=pending", getSslCommerzCallbackBaseUrl()),
        303,
      );
    } catch (configurationError) {
      console.error("SSLCommerz callback site URL is invalid.", configurationError);
      return new NextResponse("Unable to process payment callback", { status: 500 });
    }
  }
}

export async function handleSslCommerzFailure(
  request: Request,
  status: "FAILED" | "CANCELLED",
) {
  try {
    const orderId = await processSslCommerzFailure(await request.formData(), status);
    const destination = orderId
      ? `/orders/${encodeURIComponent(orderId)}?payment=${status === "CANCELLED" ? "cancelled" : "failed"}`
      : `/checkout?payment=${status === "CANCELLED" ? "cancelled" : "failed"}`;
    return NextResponse.redirect(
      new URL(destination, getSslCommerzCallbackBaseUrl()),
      303,
    );
  } catch (error) {
    console.error(`Could not process SSLCommerz ${status.toLowerCase()} callback.`, error);
    try {
      return NextResponse.redirect(
        new URL("/checkout?payment=pending", getSslCommerzCallbackBaseUrl()),
        303,
      );
    } catch (configurationError) {
      console.error("SSLCommerz callback site URL is invalid.", configurationError);
      return new NextResponse("Unable to process payment callback", { status: 500 });
    }
  }
}

export async function handleSslCommerzIpn(request: Request) {
  try {
    const form = await request.formData();
    const status = form.get("status");

    if (status === "VALID" || form.get("val_id")) {
      const result = await processSslCommerzSuccess(form);
      return result.verified
        ? new NextResponse("OK", { status: 200 })
        : new NextResponse("Invalid transaction", { status: 400 });
    }

    if (status === "FAILED" || status === "CANCELLED") {
      const orderId = await processSslCommerzFailure(
        form,
        status === "CANCELLED" ? "CANCELLED" : "FAILED",
      );
      return orderId
        ? new NextResponse("OK", { status: 200 })
        : new NextResponse("Unknown transaction", { status: 404 });
    }

    return new NextResponse("Pending", { status: 202 });
  } catch (error) {
    console.error("Could not process SSLCommerz IPN.", error);
    return new NextResponse("Unable to process notification", { status: 500 });
  }
}
