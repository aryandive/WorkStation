import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // DYNAMIC ORIGIN DETECTION
            // We need to determine where to redirect the user. 
            // We check 'x-forwarded-host' first to respect Ngrok/Vercel.
            const forwardedHost = request.headers.get('x-forwarded-host');
            const isLocalEnv = process.env.NODE_ENV === 'development';

            let origin = process.env.NEXT_PUBLIC_SITE_URL;

            if (forwardedHost) {
                // If we have a forwarded host (Ngrok/Vercel), use it.
                // Always assume HTTPS for these proxies.
                origin = `https://${forwardedHost}`;
            } else if (!origin) {
                // Fallback to localhost if no env var and no proxy header
                const host = request.headers.get('host');
                origin = isLocalEnv ? `http://${host}` : `https://${host}`;
            }

            // Ensure we don't have a double slash issue if origin ends with /
            const baseUrl = origin.replace(/\/$/, '');

            return NextResponse.redirect(`${baseUrl}${next}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?message=Could not log in with provider`)
}