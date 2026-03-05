import { createClient } from '@/utils/supabase/middleware';
import { NextResponse } from 'next/server';

export async function middleware(req) {
    // 1. Create the client and refresh the session cookies
    const { supabase, response } = createClient(req);

    // 2. Fast Edge Auth: Use getSession() instead of getUser()
    // getSession() decodes the JWT locally without a database round-trip,
    // which significantly reduces latency on every page load.
    // NOTE: Strict validation (getUser) should still be used in protected API routes/Server Actions.
    const {
        data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user || null;

    // 3. Define Protected vs. Public Routes
    const url = req.nextUrl.clone();
    const path = url.pathname;

    // List of public paths that do not require authentication
    // Note: We also exclude static assets and API webhooks via the matcher config below,
    // but explicit checks here are safer for navigation logic.
    const publicPaths = [
        '/',
        '/login',
        '/signup',
        '/pricing',
        '/contact',
        '/terms',
        '/help',
        '/landing',
        '/journal',
        '/tasks',
        '/pomodoro',
        '/auth/callback',
        '/api/paypal/webhook' // Crucial: ensure payment webhooks aren't blocked
    ];

    // Helper to check if the current path is public
    const isPublic = publicPaths.some((p) => path === p || path.startsWith(p + '/'));

    // 4. Redirect Logic

    // SCENARIO A: Unauthenticated User trying to access a Protected Route
    if (!user && !isPublic) {
        // Redirect to login
        url.pathname = '/login';
        // Optional: Save the intended destination to redirect back after login
        url.searchParams.set('next', path);
        return NextResponse.redirect(url);
    }

    // SCENARIO B: Authenticated User trying to access Auth Routes (Login/Signup)
    if (user && (path === '/login' || path === '/signup')) {
        // Redirect to the dashboard/home
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    // 5. Return the response (with updated cookies from step 1)
    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public assets (images, sounds, etc - usually served from public/)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3)$).*)',
    ],
};