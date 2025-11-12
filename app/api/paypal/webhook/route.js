// app/api/paypal/webhook/route.js - FINAL DEBUG VERSION
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(request) {
    console.log("🎯 === PAYPAL WEBHOOK DEBUG - START ===");

    const rawBody = await request.text();
    const headers = Object.fromEntries(request.headers.entries());

    // Log EVERYTHING
    console.log("📨 Headers received:", JSON.stringify(headers, null, 2));
    console.log("📝 Raw body received:", rawBody);

    // FORCE SUCCESS RESPONSE - No verification at all
    console.log("✅ SKIPPING ALL VERIFICATION - RETURNING 200");

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const event = JSON.parse(rawBody);
        const eventType = event.event_type;
        const resource = event.resource;

        console.log(`🔔 Event Type: ${eventType}`);
        console.log("📊 Full Event Structure:", JSON.stringify(event, null, 2));

        // Search for custom_id in EVERY possible location
        console.log("🔍 Searching for custom_id...");
        const customId =
            resource?.custom_id ||
            event?.resource?.custom_id ||
            resource?.subscriber?.custom_id ||
            event?.resource?.subscriber?.custom_id;

        console.log(`👤 Custom ID found: ${customId || 'NOT FOUND'}`);
        console.log("🔎 Resource details:", JSON.stringify(resource, null, 2));

        if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
            console.log("💰 Processing subscription activation...");

            const subscriptionId = resource.id;
            const planId = resource.plan_id;
            const status = resource.status;

            console.log(`📋 Subscription Details:
            - ID: ${subscriptionId}
            - Plan: ${planId}
            - Status: ${status}
            - Custom ID: ${customId}`);

            if (customId) {
                console.log("✅ Found user ID, processing...");

                // Determine tier
                let tier = 'unknown';
                if (planId === process.env.PAYPAL_MONTHLY_PLAN_ID) {
                    tier = 'pro_monthly';
                } else if (planId === process.env.PAYPAL_YEARLY_PLAN_ID) {
                    tier = 'pro_yearly';
                }

                console.log(`🏷️ Determined tier: ${tier}`);

                // Update database
                const { error: dbError } = await supabase
                    .from('subscriptions')
                    .upsert({
                        user_id: customId,
                        status: status.toLowerCase(),
                        tier: tier,
                        paypal_subscription_id: subscriptionId,
                        paypal_plan_id: planId,
                    }, { onConflict: 'user_id' });

                if (dbError) {
                    console.error('❌ Database error:', dbError);
                } else {
                    console.log(`🎉 Success! User ${customId} upgraded to ${tier}`);
                }
            } else {
                console.error('❌ No custom_id found in webhook!');
                console.log('📋 Full resource for debugging:', JSON.stringify(resource, null, 2));
            }
        }

        console.log("🏁 === WEBHOOK PROCESSING COMPLETE ===");

        // ALWAYS return 200 - no matter what
        return NextResponse.json({
            success: true,
            debug: true,
            message: "Webhook received and processed",
            custom_id_found: !!customId,
            event_type: eventType
        });

    } catch (error) {
        console.error('💥 UNHANDLED ERROR:', error);
        // STILL return 200 even on error
        return NextResponse.json({
            success: true,
            debug: true,
            error: error.message
        });
    }
}