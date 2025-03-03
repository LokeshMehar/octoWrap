"use server";

import { db } from "@/db";
import { auth } from "@clerk/nextjs/server";

export const getPaymentStatus = async ({ orderId }: { orderId: string }) =>
{
  console.log("first");

  const { userId } = await auth();
  console.log("second");

  if (!userId)
  {
    throw new Error("You need to be logged in to view this page.");
  }

  console.log("third");

  const order = await db.order.findFirst({
    where: { id: orderId, userId },
    include: {
      billingAddress: true,
      configuration: true,
      shippingAddress: true,
      user: true,
    },
  });

  console.log("fourth");

  if (!order) throw new Error("This order does not exist.");

  console.log(order);
  console.log("fifth");

  return order.isPaid ? order : false;
};
