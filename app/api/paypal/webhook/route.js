// app/api/paypal/webhook/route.js
import { NextResponse } from 'next/server';
import { verifyPayPalWebhook } from '@/lib/paypal';
import { createClient } from '@supabase/supabase-js';

// This API route MUST run on the Node.js runtime for webhook verification
export const runtime = 'nodejs';

// Initialize a *server-side* Supabase client using the Service Role Key
// This is secure because this code only runs on your server, not in the browser
// This client has admin rights and can bypass RLS to update your subscriptions.
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    console.log("--- PayPal Webhook Received ---");
    const rawBody = await request.text();
    const headers = request.headers;

    // --- DEBUG LOGS: Check for Environment Variables ---
    console.log("Checking Env Vars...");
    console.log(`NEXT_PUBLIC_PAYPAL_CLIENT_ID: ${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? 'FOUND' : '!!! MISSING !!!'}`);
    console.log(`PAYPAL_CLIENT_SECRET: ${process.env.PAYPAL_CLIENT_SECRET ? 'FOUND' : '!!! MISSING !!!'}`);
    console.log(`PAYPAL_WEBHOOK_ID: ${process.env.PAYPAL_WEBHOOK_ID ? 'FOUND' : '!!! MISSING !!!'}`);
    console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'FOUND' : '!!! MISSING !!!'}`);
    // --- END DEBUG LOGS ---

    try {
        // 1. Verify the webhook signature
        console.log("Attempting to verify webhook signature...");
        const isVerified = await verifyPayPalWebhook(headers, rawBody);

        if (!isVerified) {
            console.warn('!!! Webhook verification FAILED. !!!');
            // This is the source of the 401 error.
            // It means getPayPalAccessToken (inside verify) is failing,
            // almost certainly because CLIENT_ID or CLIENT_SECRET is missing/wrong.
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
        console.log("Webhook signature VERIFIED.");

        // 2. Parse the event
        const event = JSON.parse(rawBody);
        const eventType = event.event_type;
        const resource = event.resource;

        console.log(`Received PayPal Event: ${eventType}`);

        // 3. Handle the event
        switch (eventType) {
            case 'BILLING.SUBSCRIPTION.ACTIVATED': {
                const subscriptionId = resource.id;
                const planId = resource.plan_id;
                const userId = resource.custom_id; // This is our Supabase user_id!
                const status = resource.status; // e.g., 'ACTIVE'

                if (!userId) {
                    console.error('Webhook Error: No custom_id (user_id) found in subscription resource.');
                    break;
                }

                console.log(`Processing ACTIVATED event for user: ${userId}`);

                // Determine tier from planId
                let tier = null;
                if (planId === process.env.NEXT_PUBLIC_PAYPAL_MONTHLY_PLAN_ID) {
                    tier = 'pro_monthly';
                } else if (planId === process.env.NEXT_PUBLIC_PAYPAL_YEARLY_PLAN_ID) {
                    tier = 'pro_yearly';
                }

                if (!tier) {
                    console.error(`Webhook Error: Unknown planId ${planId}. Check Vercel Env Vars.`);
                    break;
                }

                // 4. Update our Supabase database
                const { error: dbError } = await supabase
                    .from('subscriptions')
                    .upsert({
                        user_id: userId,
                        status: status.toLowerCase(), // 'active'
                        tier: tier,
                        paypal_subscription_id: subscriptionId,
                        paypal_plan_id: planId,
                    }, { onConflict: 'user_id' }); // This will update or insert

                if (dbError) {
                    console.error('Supabase DB error updating subscription:', dbError);
                } else {
                    console.log(`Subscription activated successfully for user: ${userId}, tier: ${tier}`);
                }
                break;
            }

            case 'BILLING.SUBSCRIPTION.CANCELLED':
            case 'BILLING.SUBSCRIPTION.EXPIRED':
            case 'BILLING.SUBSCRIPTION.SUSPENDED': {
                const subscriptionId = resource.id;
                const status = resource.status; // e.g., 'CANCELLED'

                // Find the user associated with this subscription
                const { data: subData, error: findError } = await supabase
                    .from('subscriptions')
                    .select('user_id')
                    .eq('paypal_subscription_id', subscriptionId)
                    .single();

                if (findError || !subData) {
                    console.error(`Webhook Error: Received ${eventType} for unknown subscription ${subscriptionId}`);
                    break;
                }

                const userId = subData.user_id;
                console.log(`Processing ${eventType} event for user: ${userId}`);

                // Update their status
                const { error: dbError } = await supabase
                    .from('subscriptions')
                    .update({ status: status.toLowerCase() })
                    .eq('user_id', userId);

                if (dbError) {
                    console.error(`Supabase DB error updating status to ${status}:`, dbError);
                } else {
                    console.log(`Subscription for user ${userId} updated to ${status}`);
                }
                break;
            }

            default:
                console.log(`Unhandled PayPal event_type: ${eventType}`);
        }

        // 5. Acknowledge the webhook
        console.log("--- Webhook Processed Successfully ---");
        return NextResponse.json({ received: true }, { status: 200 });

    } catch (error) {
        console.error('!!! Unhandled Error in Webhook processing !!!:', error.message, error.stack);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}