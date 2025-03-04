import { db } from "@/db";
import { WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request)
{
    try
    {
        const clerkEvent: WebhookEvent = await req.json();
        if (clerkEvent.type === "user.created")
        {
            const { id, email_addresses } = clerkEvent.data;

            console.log("here in the route of the webhook");

            // Store user in DB
            await db.user.create({
                data: {
                    id,
                    email: email_addresses[0]?.email_address,
                },
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, message: "Event not handled" });
    } catch (error)
    {
        if (error instanceof Error)
        {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: false, error: "Unknown error" }, { status: 500 });
    }
}
