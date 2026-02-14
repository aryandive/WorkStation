// app/api/paypal/webhook/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPayPalWebhook } from '@/lib/paypal';

export async function POST(request) {
    const headersList = request.headers;
    const transmissionId = headersList.get('paypal-transmission-id') || 'unknown';
    const timestamp = new Date().toISOString();

    console.log(`[Webhook] 🔵 Received ${transmissionId} at ${timestamp}`);

    let rawBody;
    try {
        rawBody = await request.text();
        if (!rawBody) throw new Error('Empty request body');
    } catch (err) {
        console.error(`[Webhook] 🔴 Read Error: ${err.message}`);
        return NextResponse.json({ error: 'Body read failed' }, { status: 400 });
    }

    // 1. SECURITY: Verify Signature
    if (process.env.NODE_ENV !== 'development') {
        try {
            await verifyPayPalWebhook(headersList, rawBody);
            console.log(`[Webhook] 🟢 Signature Verified: ${transmissionId}`);
        } catch (err) {
            console.error(`[Webhook] ⛔ Verification Failed: ${err.message}`);
            return NextResponse.json({ error: err.message }, { status: 400 });
        }
    } else {
        console.log(`[Webhook] ⚠️ Skipping verification in Development`);
    }

    // 2. PARSE EVENT
    let body;
    try {
        body = JSON.parse(rawBody);
    } catch (err) {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const eventType = body.event_type;
    const resource = body.resource;
    
    console.log(`[Webhook] 📨 Processing Event: ${eventType}`);

    // 3. DATABASE ACTION
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        // --- CASE A: Subscription Activated (Recurring) ---
        if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
            const userId = resource.custom_id;
            const planId = resource.plan_id;

            if (!userId) {
                console.warn(`[Webhook] ⚠️ Activation received without User ID (custom_id)`);
                return NextResponse.json({ status: 'ignored_no_user' });
            }

            const isMonthly = planId === process.env.NEXT_PUBLIC_PAYPAL_MONTHLY_PLAN_ID;
            const tier = isMonthly ? 'pro_monthly' : 'pro_yearly';

            const { error } = await supabase
                .from('subscriptions')
                .upsert({
                    user_id: userId,
                    status: 'active',
                    tier: tier,
                    paypal_subscription_id: resource.id,
                    paypal_plan_id: planId,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

            if (error) throw error;
            console.log(`[Webhook] ✅ Activated Subscription for User: ${userId}`);
        }

        // --- CASE B: One-Time Payment Success (Lifetime Deal) ---
        // This is the NEW block for the $19.99 lifetime purchase
        else if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
            // In one-time payments, the custom_id (User ID) is usually passed 
            // in the purchase_units level or the root resource depending on integration
            const userId = resource.custom_id || resource.purchase_units?.[0]?.custom_id;
            const orderId = resource.supplementary_data?.related_ids?.order_id || resource.id;

            if (!userId) {
                console.warn(`[Webhook] ⚠️ Payment captured without User ID. Manual check required for Order: ${orderId}`);
                // We return 200 to stop PayPal retrying, but log it as a warning
                return NextResponse.json({ status: 'ignored_no_user_id' });
            }

            const { error } = await supabase
                .from('subscriptions')
                .upsert({
                    user_id: userId,
                    status: 'active',
                    tier: 'lifetime', // Explicitly setting lifetime tier
                    paypal_subscription_id: orderId, // Storing Order ID as the sub ID reference
                    paypal_plan_id: 'lifetime_one_time',
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

            if (error) throw error;
            console.log(`[Webhook] 💎 Lifetime Access Granted for User: ${userId}`);
        }

        // --- CASE C: Status Changes (Cancel/Suspend/Expire) ---
        else if (
            ['BILLING.SUBSCRIPTION.CANCELLED', 
             'BILLING.SUBSCRIPTION.SUSPENDED', 
             'BILLING.SUBSCRIPTION.EXPIRED'].includes(eventType)
        ) {
            const subscriptionId = resource.id;
            const newStatus = resource.status.toLowerCase();

            const { error } = await supabase
                .from('subscriptions')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('paypal_subscription_id', subscriptionId);

            if (error) throw error;
            console.log(`[Webhook] ⚠️ Subscription ${subscriptionId} changed to ${newStatus}`);
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error(`[Webhook] 💥 Processing Error:`, error);
        return NextResponse.json({ error: 'Internal processing failed' }, { status: 500 });
    }
}