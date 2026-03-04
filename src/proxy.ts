import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhooks/clerk(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
    const authObject = await auth();   // 👈 IMPORTANT

    if (!isPublicRoute(req) && !authObject.userId) {
        return authObject.redirectToSignIn(); // 👈 use resolved object
    }
});

export const config = {
    matcher: [
        "/((?!_next|.*\\..*).*)",
        "/(api|trpc)(.*)",
    ],
};