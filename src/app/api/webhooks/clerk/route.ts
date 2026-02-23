export const runtime = "nodejs";

import { headers } from "next/headers";
import { Webhook } from "svix";
import { NextResponse } from "next/server";
import { api } from "../../../../../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

export async function POST(req: Request) {
    try {
        const payload = await req.text();
        const headerList = await headers();

        const svixId = headerList.get("svix-id");
        const svixTimestamp = headerList.get("svix-timestamp");
        const svixSignature = headerList.get("svix-signature");

        if (!svixId || !svixTimestamp || !svixSignature) {
            return new NextResponse("Missing svix headers", { status: 400 });
        }

        const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

        if (!webhookSecret || !convexUrl) {
            console.error("Missing ENV variables");
            return new NextResponse("Server misconfigured", { status: 500 });
        }

        const wh = new Webhook(webhookSecret);

        const evt = wh.verify(payload, {
            "svix-id": svixId,
            "svix-timestamp": svixTimestamp,
            "svix-signature": svixSignature,
        }) as any;

        const convex = new ConvexHttpClient(convexUrl);

        if (evt.type === "user.updated") {
            const { id, first_name, last_name, image_url } = evt.data;

            await convex.mutation(api.users.updateUserFromClerk, {
                clerkId: id,
                name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
                image: image_url ?? "",
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Webhook error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}