// app/api/paypal/webhook/route.js
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPayPalWebhook } from '@/lib/paypal';

export async function POST(request) {
    console.log('🔄 --- WEBHOOK RECEIVED --- 🔄');

    const rawBody = await request.text();
    const headersList = request.headers;

    // 🛑 SAFETY CHECK: Ensure body is not empty
    if (!rawBody) {
        console.warn('⚠️ Received empty webhook body. Ignoring.');
        return NextResponse.json({ error: 'Empty body' }, { status: 400 });
    }

    // 1. SECURITY VERIFICATION (Skip in dev/ngrok if needed, but keep for production)
    if (process.env.NODE_ENV !== 'development') {
        try {
            const isValid = await verifyPayPalWebhook(headersList, rawBody);
            if (!isValid) {
                console.error('❌ SIGNATURE VERIFICATION FAILED');
                return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
            }
        } catch (err) {
            console.error('⚠️ Verification Error:', err.message);
        }
    }

    let body;
    try {
        body = JSON.parse(rawBody);
    } catch (err) {
        console.error('❌ JSON PARSE ERROR:', err.message);
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Init Supabase Admin
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const resource = body.resource;
        const eventType = body.event_type;

        console.log(`📨 Event Type: ${eventType}`);

        // ====================================================
        // 2. HANDLE SUBSCRIPTION ACTIVATION
        // ====================================================
        if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
            const userId = resource.custom_id;
            const planId = resource.plan_id;

            // 🛡️ ZOMBIE KILLER: Ignore events with no User ID
            if (!userId) {
                console.log(`👻 Ignoring Ghost Event (No custom_id). Date: ${resource.create_time}`);
                return NextResponse.json({ received: true });
            }

            console.log(`✅ PROCESSING PAYMENT for User: ${userId}`);

            // Determine Tier
            let tier = 'pro';
            if (planId === process.env.NEXT_PUBLIC_PAYPAL_MONTHLY_PLAN_ID) {
                tier = 'pro_monthly';
            } else if (planId === process.env.NEXT_PUBLIC_PAYPAL_YEARLY_PLAN_ID) {
                tier = 'pro_yearly';
            }

            // Upsert into Database
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

            if (error) {
                console.error('❌ DATABASE ERROR:', error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            console.log('🎉 SUCCESS: Subscription saved to Supabase!');
        }

        // ====================================================
        // 3. HANDLE CANCELLATION / STATUS CHANGE
        // ====================================================
        else if (
            eventType === 'BILLING.SUBSCRIPTION.CANCELLED' ||
            eventType === 'BILLING.SUBSCRIPTION.SUSPENDED' ||
            eventType === 'BILLING.SUBSCRIPTION.EXPIRED'
        ) {
            const subscriptionId = resource.id;
            const newStatus = resource.status.toLowerCase();

            console.log(`⚠️ STATUS UPDATE: ${subscriptionId} is now ${newStatus}`);

            const { error } = await supabase
                .from('subscriptions')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('paypal_subscription_id', subscriptionId);

            if (error) console.error('❌ DB ERROR:', error);
            else console.log('✅ Status updated in DB');
        }
        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('💥 SERVER ERROR:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}