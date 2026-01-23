import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Clerk webhook handler
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.json();
    const eventType = payload.type;

    switch (eventType) {
      case "user.created":
      case "user.updated": {
        const { id, email_addresses, first_name, last_name, image_url } = payload.data;
        const email = email_addresses?.[0]?.email_address;
        const name = [first_name, last_name].filter(Boolean).join(" ") || email?.split("@")[0] || "User";

        if (email) {
          await ctx.runMutation(api.users.syncUser, {
            clerkId: id,
            email,
            name,
            imageUrl: image_url,
          });
        }
        break;
      }

      case "user.deleted": {
        const { id } = payload.data;
        await ctx.runMutation(api.users.deleteUser, {
          clerkId: id,
        });
        break;
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
