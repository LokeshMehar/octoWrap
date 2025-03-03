"use server";

import { BASE_PRICE, PRODUCT_PRICES } from "@/config/products";
import { db } from "@/db";
import { stripe } from "@/lib/stripe";
import { currentUser } from "@clerk/nextjs/server";
import { Order } from "@prisma/client";

export const createCheckoutSession = async ({
  configId,
}: {
  configId: string;
}) =>
{
  try
  {
    const configuration = await db.configuration.findUnique({
      where: { id: configId },
    });

    if (!configuration)
    {
      throw new Error("No such configuration found");
    }

    // Get the authenticated user from Clerk
    const user = await currentUser();
    if (!user)
    {
      throw new Error("You need to be logged in");
    }

    const userId = user.id;

    const { finish, material } = configuration;

    let price = BASE_PRICE;
    if (finish === "textured") price += PRODUCT_PRICES.finish.textured;
    if (material === "polycarbonate")
      price += PRODUCT_PRICES.material.polycarbonate;

    let order: Order | undefined = undefined;
    console.log(userId);

    const existingOrder = await db.order.findFirst({
      where: {
        userId: userId,
        configurationId: configuration.id,
      },
    });

    if (existingOrder)
    {
      order = existingOrder;
    } else
    {
      order = await db.order.create({
        data: {
          amount: price / 100,
          userId: userId,
          configurationId: configuration.id,
        },
      });
    }

    const product = await stripe.products.create({
      name: "Custom iPhone Case",
      images: [configuration.imageUrl],
      default_price_data: {
        currency: "usd",
        unit_amount: price,
      },
    });

    const stripeSession = await stripe.checkout.sessions.create({
      success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/thank-you?orderId=${order.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/configure/preview?id=${configuration.id}`,
      payment_method_types: ["card"],
      mode: "payment",
      shipping_address_collection: { allowed_countries: ["NG", "US", "GB"] },
      metadata: {
        userId: userId,
        orderId: order.id,
      },
      line_items: [{ price: product.default_price as string, quantity: 1 }],
    });

    return { url: stripeSession.url };
  } catch (error: any)
  {
    console.error("Error creating checkout session: ", error.message);
    return { url: null };
  }
};
