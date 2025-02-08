import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import { resend } from "@/lib/resend";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { CreateEmailResponse } from "resend";
import { Readable } from "stream";
import OrderReceivedEmail from "@/components/emails/OrderReceivedEmail";

const RESEND_EMAIL = process.env.RESEND_EMAIL!;


async function getRawBody(readable: Readable)
{
  const chunks: Buffer[] = [];
  for await (const chunk of readable)
  {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest)
{
  try
  {
    const headersList = headers();
    const signature = headersList.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret)
    {
      return new Response("Invalid signature", { status: 400 });
    }

    const rawBody = await getRawBody(req.body as any);

    let event: Stripe.Event;
    try
    {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any)
    {
      console.error("⚠️ Signature verification failed:", err.message);
      return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
    }

    console.log("✅ Webhook received:", event.type);

    if (event.type === "checkout.session.completed")
    {
      const session = event.data.object as Stripe.Checkout.Session;

      if (!session.customer_details?.email)
      {
        throw new Error("Missing user email");
      }

      const { userId, orderId } = session.metadata || { userId: null, orderId: null };

      if (!userId || !orderId)
      {
        throw new Error(`Invalid metadata: ${JSON.stringify(session.metadata)}`);
      }


      const billingAddress = session.customer_details!.address;
      const shippingAddress = session.shipping_details!.address;

      console.log("🔥 Webhook processing order:", orderId);

      // ✅ Update Order in Database
      const updatedOrder = await db.order.update({
        where: { id: orderId },
        data: {
          isPaid: true,
          shippingAddress: {
            create: {
              name: session.customer_details!.name!,
              city: shippingAddress!.city!,
              country: shippingAddress!.country!,
              postalCode: shippingAddress!.postal_code!,
              street: shippingAddress!.line1!,
              state: shippingAddress!.state,
            },
          },
          billingAddress: {
            create: {
              name: session.customer_details!.name!,
              city: billingAddress!.city!,
              country: billingAddress!.country!,
              postalCode: billingAddress!.postal_code!,
              street: billingAddress!.line1!,
              state: billingAddress!.state,
            },
          },
        },
      });

      console.log("✅ Order updated in DB:", updatedOrder.id);

      // ✅ Send Order Confirmation Email
      const email: CreateEmailResponse = await resend.emails.send({
        from: `OctoWrap <${RESEND_EMAIL}>`,
        to: [session.customer_details.email],
        subject: "Thanks for your order!",
        react: OrderReceivedEmail({
          orderId,
          orderDate: updatedOrder.createdAt.toLocaleDateString(),
          shippingAddress: {
            name: session.customer_details!.name!,
            city: shippingAddress!.city!,
            country: shippingAddress!.country!,
            postalCode: shippingAddress!.postal_code!,
            street: shippingAddress!.line1!,
            state: shippingAddress!.state,
            id: "",
            createdAt: null,
            phoneNumber: null,
            updatedAt: null
          },
        }),
      });

      console.log("📩 Email sent to:", session.customer_details.email);

      return NextResponse.json({ result: event, email, ok: true });
    }

    return NextResponse.json({ result: event, ok: true });
  } catch (err)
  {
    console.error("❌ Error processing webhook:", err);
    return NextResponse.json({ message: "Something went wrong", ok: false }, { status: 500 });
  }
}
