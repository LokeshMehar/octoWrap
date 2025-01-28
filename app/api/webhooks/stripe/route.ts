import OrderReceivedEmail from "@/components/emails/OrderReceivedEmail";
import { db } from "@/db";
import { resend } from "@/lib/resend";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { CreateEmailResponse } from "resend";
import Stripe from "stripe";

const RESEND_EMAIL = process.env.RESEND_EMAIL!;

export async function POST(req: Request)
{
  try
  {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature)
    {
      return new Response("Invalid signature", { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log("Received event:", event);

    if (event.type === "checkout.session.completed")
    {
      const session = event.data.object as Stripe.Checkout.Session;

      if (!session.customer_details?.email)
      {
        throw new Error("Missing user email");
      }

      const { userId, orderId } = session.metadata || {
        userId: null,
        orderId: null,
      };

      if (!userId || !orderId)
      {
        throw new Error("Invalid request metadata");
      }

      const billingAddress = session.customer_details.address;
      const shippingAddress = session.shipping_details?.address;

      const updatedOrder = await db.order.update({
        where: {
          id: orderId,
        },
        data: {
          isPaid: true,
          shippingAddress: {
            create: {
              name: session.customer_details.name || "Unknown Name",
              street: shippingAddress?.line1 || "Unknown Street",
              city: shippingAddress?.city || "Unknown City",
              postalCode: shippingAddress?.postal_code || "00000",
              country: shippingAddress?.country || "Unknown Country",
              state: shippingAddress?.state || null,
              phoneNumber: session.customer_details.phone || null,
            },
          },
          billingAddress: {
            create: {
              name: session.customer_details.name || "Unknown Name",
              street: billingAddress?.line1 || "Unknown Street",
              city: billingAddress?.city || "Unknown City",
              postalCode: billingAddress?.postal_code || "00000",
              country: billingAddress?.country || "Unknown Country",
              state: billingAddress?.state || null,
              phoneNumber: session.customer_details.phone || null,
            },
          },
        },
      });

      const email = await resend.emails.send({
        from: `OctoWrap <${RESEND_EMAIL}>`,
        to: [session.customer_details.email],
        subject: "Thanks for your order!",
        react: OrderReceivedEmail({
          orderId,
          orderDate: updatedOrder.createdAt.toLocaleDateString(),
          shippingAddress: {
            name: session.customer_details.name || "Unknown Name",
            street: shippingAddress?.line1 || "Unknown Street",
            city: shippingAddress?.city || "Unknown City",
            postalCode: shippingAddress?.postal_code || "00000",
            country: shippingAddress?.country || "Unknown Country",
            state: shippingAddress?.state || null,
            id: "",
            createdAt: null,
            updatedAt: null,
            phoneNumber: null
          },
        }),
      });

      return NextResponse.json({ result: event, email, ok: true });
    }

    return NextResponse.json({ result: event, ok: true });
  } catch (err)
  {
    console.error("An error occurred while processing webhook:", err);

    return NextResponse.json(
      { message: "Something went wrong", ok: false },
      { status: 500 }
    );
  }
}
