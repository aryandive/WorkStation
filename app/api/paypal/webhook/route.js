// app/api/paypal/webhook/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPayPalWebhook } from '@/lib/paypal';

export async function POST(request) {
    console.log('🔄 --- WEBHOOK RECEIVED --- 🔄');

    const rawBody = await request.text();
    const headersList = request.headers;

    // 1. VERIFY WEBHOOK SIGNATURE
    // This prevents hackers from faking payments.
    try {
        const isValid = await verifyPayPalWebhook(headersList, rawBody);
        if (!isValid) {
            console.error('❌ SIGNATURE VERIFICATION FAILED');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }
    } catch (err) {
        console.error('❌ ERROR DURING VERIFICATION:', err);
        return NextResponse.json({ error: 'Verification error' }, { status: 500 });
    }

    const body = JSON.parse(rawBody);
    console.log(`📨 Event Type: ${body.event_type}`);

    // Init Supabase Admin
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const resource = body.resource;

        // 2. HANDLE SUBSCRIPTION ACTIVATION
        if (body.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
            const userId = resource.custom_id;
            const planId = resource.plan_id;

            if (!userId) {
                console.error('❌ ERROR: No custom_id (user_id) found.');
                return NextResponse.json({ error: 'No custom_id found' }, { status: 400 });
            }

            // Map Plan ID to Tier Name
            let tier = null;
            if (planId === process.env.NEXT_PUBLIC_PAYPAL_MONTHLY_PLAN_ID) {
                tier = 'pro_monthly';
            } else if (planId === process.env.NEXT_PUBLIC_PAYPAL_YEARLY_PLAN_ID) {
                tier = 'pro_yearly';
            } else {
                console.warn(`⚠️ Warning: Unknown planId ${planId}, defaulting to 'pro'`);
                tier = 'pro';
            }

            console.log(`✅ ACTIVATING: User ${userId}, Tier ${tier}`);

            const { error } = await supabase
                .from('subscriptions')
                .upsert({
                    user_id: userId,
                    status: 'active', // Standardize status to 'active'
                    tier: tier,
                    paypal_subscription_id: resource.id,
                    paypal_plan_id: planId,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

            if (error) console.error('❌ DB ERROR (Activation):', error);
            else console.log('✅ DATABASE UPDATED: Subscription Active');
        }

        // 3. HANDLE CANCELLATION, SUSPENSION, & EXPIRATION
        else if (
            body.event_type === 'BILLING.SUBSCRIPTION.CANCELLED' ||
            body.event_type === 'BILLING.SUBSCRIPTION.SUSPENDED' ||
            body.event_type === 'BILLING.SUBSCRIPTION.EXPIRED'
        ) {
            const subscriptionId = resource.id;
            const newStatus = resource.status.toLowerCase(); // 'cancelled', 'suspended', etc.

            console.log(`⚠️ PROCESSING CHANGE: Sub ${subscriptionId} -> ${newStatus}`);

            // Update by paypal_subscription_id because custom_id is sometimes missing in these events
            const { error } = await supabase
                .from('subscriptions')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('paypal_subscription_id', subscriptionId);

            if (error) console.error('❌ DB ERROR (Status Change):', error);
            else console.log(`✅ DATABASE UPDATED: Subscription is now ${newStatus}`);
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('💥 UNHANDLED WEBHOOK ERROR:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ status: 'Webhook Active' });
}