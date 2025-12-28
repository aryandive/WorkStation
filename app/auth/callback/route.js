// This server route is no longer used because providers may return tokens in the URL hash
// which the server cannot read. The client page at app/auth/callback/page.js now handles it.
export async function GET() {
    return new Response('Not Found', { status: 404 })
}
