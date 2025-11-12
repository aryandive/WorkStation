// for gemini copy/app/api/paypal/webhook/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { verifyPayPalWebhook } from '@/lib/paypal';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// We need the raw body for webhook verification
export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(request) {
    console.log("--- PayPal Webhook Received ---");

    // --- START DEBUG LOGS ---
    console.log("Checking Env Vars...");
    console.log(`NEXT_PUBLIC_PAYPAL_CLIENT_ID: ${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? 'FOUND' : '!!! MISSING !!!'}`);
    console.log(`PAYPAL_CLIENT_SECRET: ${process.env.PAYPAL_CLIENT_SECRET ? 'FOUND' : '!!! MISSING !!!'}`);
    console.log(`PAYPAL_WEBHOOK_ID: ${process.env.PAYPAL_WEBHOOK_ID ? 'FOUND' : '!!! MISSING !!!'}`);
    // --- END DEBUG LOGS ---

    const rawBody = await request.text();
    const headers = request.headers;

    try {
        console.log("Attempting to verify webhook signature...");
        const isVerified = await verifyPayPalWebhook(headers, rawBody);

        if (!isVerified) {
            console.warn('!!! Webhook verification FAILED. Check CLIENT_ID, CLIENT_SECRET, and WEBHOOK_ID. !!!');
            // The 401 is coming from getPayPalAccessToken() inside verifyPayPalWebhook
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        console.log("Webhook signature VERIFIED.");
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
                    console.error('Webhook Error: No custom_id (user_id) found in subscription.');
                    break;
                }

                // Determine tier from planId
                let tier = null;
                if (planId === process.env.NEXT_PUBLIC_PAYPAL_MONTHLY_PLAN_ID) {
                    tier = 'pro_monthly';
                } else if (planId === process.env.NEXT_PUBLIC_PAYPAL_YEARLY_PLAN_ID) {
                    tier = 'pro_yearly';
                }

                if (!tier) {
                    console.error(`Webhook Error: Unknown planId ${planId}`);
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
                    }, { onConflict: 'user_id' }); // Update if user_id already exists

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

                // Find the user by their PayPal subscription ID
                const { error: dbError } = await supabase
                    .from('subscriptions')
                    .update({
                        status: status.toLowerCase(), // 'cancelled', 'expired', etc.
                    })
                    .eq('paypal_subscription_id', subscriptionId);

                if (dbError) {
                    console.error(`Failed to update subscription status to ${status} for sub_id ${subscriptionId}:`, dbError);
                } else {
                    console.log(`Subscription status updated to ${status} for sub_id ${subscriptionId}`);
                }
                break;
            }

            default:
                console.log(`Unhandled PayPal event_type: ${eventType}`);
        }

        // 5. Acknowledge the webhook
        return NextResponse.json({ received: true }, { status: 200 });

    } catch (error) {
        console.error('!!! Top-level error in PayPal webhook handler: !!!', error.message);
        // This catches errors from verifyPayPalWebhook, which is where the 401 is
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
} 