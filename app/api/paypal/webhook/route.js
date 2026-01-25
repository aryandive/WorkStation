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
    // We strictly enforce this in production to prevent spoofing.
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
        // --- CASE A: Subscription Activated ---
        if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
            const userId = resource.custom_id;
            const planId = resource.plan_id;

            if (!userId) {
                console.warn(`[Webhook] ⚠️ Activation received without User ID (custom_id)`);
                return NextResponse.json({ status: 'ignored_no_user' });
            }

            // Determine Tier
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
            console.log(`[Webhook] ✅ Activated Pro for User: ${userId}`);
        }

        // --- CASE B: Status Changes (Cancel/Suspend/Expire) ---
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
        // Return 500 so PayPal knows to retry later (if it was a temp DB issue)
        return NextResponse.json({ error: 'Internal processing failed' }, { status: 500 });
    }
}