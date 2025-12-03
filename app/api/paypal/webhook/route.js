// app/api/paypal/webhook/route.js - LOCAL DEVELOPMENT VERSION
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(request) {
    console.log('🔄 --- LOCALHOST WEBHOOK RECEIVED --- 🔄');

    // WARNING: We are skipping signature verification for local testing.
    console.warn('!!! WARNING: Webhook signature verification is SKIPPED. DO NOT use this code in production. !!!');

    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    console.log('📨 Event Type:', body.event_type);

    // Log the important bits
    if (body.resource) {
        console.log('---');
        console.log('  Resource ID:', body.resource.id);
        console.log('  CUSTOM_ID (USER_ID):', body.resource.custom_id);
        console.log('  PLAN_ID:', body.resource.plan_id);
        console.log('  Status:', body.resource.status);
        console.log('---');
    }

    // Use the Service Role Key to bypass RLS
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY // Use the secure service key
    );

    try {
        if (body.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
            const resource = body.resource;
            const userId = resource.custom_id;
            const planId = resource.plan_id;

            if (!userId) {
                console.error('❌ ERROR: No custom_id (user_id) found in webhook body.');
                return NextResponse.json({ error: 'No custom_id found' }, { status: 400 });
            }

            let tier = null;
            if (planId === process.env.NEXT_PUBLIC_PAYPAL_MONTHLY_PLAN_ID) {
                tier = 'pro_monthly';
            } else if (planId === process.env.NEXT_PUBLIC_PAYPAL_YEARLY_PLAN_ID) {
                tier = 'pro_yearly';
            }

            if (!tier) {
                console.error(`❌ ERROR: Unknown planId ${planId}`);
                return NextResponse.json({ error: 'Unknown planId' }, { status: 400 });
            }

            console.log(`✅ PROCESSING: User ${userId}, Tier ${tier}`);

            const { error } = await supabase
                .from('subscriptions')
                .upsert({
                    user_id: userId,
                    status: resource.status.toLowerCase(),
                    tier: tier,
                    paypal_subscription_id: resource.id,
                    paypal_plan_id: planId,
                }, { onConflict: 'user_id' });

            if (error) {
                console.error('❌ SUPABASE ERROR:', error);
            } else {
                console.log('✅ DATABASE SUCCESS: User subscription updated!');
            }
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('💥 UNHANDLED ERROR:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


// ADD THIS NEW FUNCTION:

export async function GET() {

    return NextResponse.json({ status: 'Webhook endpoint is active' }, { status: 200 });
}