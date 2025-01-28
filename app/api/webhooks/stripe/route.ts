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
    let email: CreateEmailResponse;

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
      if (!event.data.object.customer_details?.email)
      {
        throw new Error("Missing user email");
      }

      const session = event.data.object as Stripe.Checkout.Session;

      const { userId, orderId } = session.metadata || {
        userId: null,
        orderId: null,
      };

      if (!userId || !orderId)
      {
        throw new Error("Invalid request metadata");
      }

      const billingAddress = session.customer_details!.address;
      const shippingAddress = session.shipping_details!.address;

      const updatedOrder = await db.order.update({
        where: {
          id: orderId,
        },
        data: {
          isPaid: true,
          shippingAddress: {
            create: {
              name: session.customer_details?.name ?? "N/A",
              city: shippingAddress?.city ?? "N/A",
              country: shippingAddress?.country ?? "N/A",
              postalCode: shippingAddress?.postal_code ?? "N/A",
              street: shippingAddress?.line1 ?? "N/A",
              state: shippingAddress?.state ?? "N/A",
            },
          },
          billingAddress: {
            create: {
              name: session.customer_details?.name ?? "N/A",
              city: billingAddress?.city ?? "N/A",
              country: billingAddress?.country ?? "N/A",
              postalCode: billingAddress?.postal_code ?? "N/A",
              street: billingAddress?.line1 ?? "N/A",
              state: billingAddress?.state ?? "N/A",
            },
          },
        },
      });

      email = await resend.emails.send({
        from: `CaseCobra <${RESEND_EMAIL}>`,
        to: [event.data.object.customer_details.email],
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
            phoneNumber: null
          },
        }),
      });

      return NextResponse.json({ result: event, email, ok: true });
    }

    return NextResponse.json({ result: event, ok: true });
  } catch (err)
  {
    console.error("An error occured while processing webhook: ", err);

    return NextResponse.json(
      { message: "Something went wrong", ok: false },
      { status: 500 }
    );
  }
}
