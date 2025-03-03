"use server";

import { db } from "@/db";
import { currentUser } from '@clerk/nextjs/server'

export const getAuthStatus = async () =>
{
  const user = await currentUser()

  if (!user)
  {
    throw new Error("Invalid user data");
  }

  if (!user || !user.emailAddresses.length)
  {
    throw new Error("Invalid user data from Clerk");
  }

  const email = user.emailAddresses[0].emailAddress;

  const existingUser = await db.user.findFirst({
    where: { id: user.id },
  });

  if (!existingUser)
  {
    await db.user.create({
      data: {
        id: user.id,
        email: email,
      },
    });
  }

  return { success: true };
};
