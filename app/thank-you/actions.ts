'use server'

import { db } from '@/db'
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export const getPaymentStatus = async ({ orderId }: { orderId: string }) =>
{
  console.log("first")
  const { getUser } = getKindeServerSession();
  console.log("second")
  const user = await getUser();
  console.log("third")

  if (!user?.id || !user.email)
  {
    throw new Error('You need to be logged in to view this page.')
  }

  console.log("fourth")

  const order = await db.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: {
      billingAddress: true,
      configuration: true,
      shippingAddress: true,
      user: true,
    },
  })

  console.log("fifth")

  if (!order) throw new Error('This order does not exist.')

  console.log(order)

  console.log("sixth")

  if (order.isPaid)
  {
    console.log("seventh")
    return order
  } else
  {
    return false
  }
}
