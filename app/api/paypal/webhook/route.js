// app/api/paypal/webhook/route.js
import { NextResponse } from 'next/server';
import { verifyPayPalWebhook } from '@/lib/paypal';
import { createClient } from '@supabase/supabase-js'; // Use the standard client for background tasks

// Initialize Supabase client (using service role key for admin tasks is safer for webhooks)
// For now, we'll use anon key, but for production, use the SERVICE_ROLE_KEY
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    // In production, use: process.env.SUPABASE_SERVICE_ROLE_KEY
);

// We need the raw body for webhook verification
export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(request) {
    const rawBody = await request.text();
    const headers = request.headers;

    try {
        // 1. Verify the webhook signature
        const isVerified = await verifyPayPalWebhook(headers, rawBody);
        if (!isVerified) {
            console.warn('Invalid PayPal webhook signature received.');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // 2. Parse the event
        const event = JSON.parse(rawBody);
        const eventType = event.event_type;
        const resource = event.resource;

        console.log(`Received PayPal Webhook: ${eventType}`);

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
        console.error('Error processing PayPal webhook:', error.message);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}