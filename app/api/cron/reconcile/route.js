// app/api/cron/reconcile/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPayPalAccessToken, getPayPalSubscriptionDetails } from '@/lib/paypal';

export async function GET(request) {
    // 1. SECURITY: The "Secret Handshake"
    const authHeader = request.headers.get('authorization');
    if (
        !process.env.CRON_SECRET || 
        authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // 2. SETUP: Admin Access to Database
        // We use the Service Role Key to bypass RLS policies
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { persistSession: false } }
        );

        // 3. SELECTION: Get "Stale" Records
        // Fetch 20 users who claim to be 'active' or 'past_due',
        // sorted by who hasn't been checked in the longest time.
        const { data: subscriptions, error: dbError } = await supabase
            .from('subscriptions')
            .select('*')
            .in('status', ['active', 'past_due'])
            .order('updated_at', { ascending: true }) // Oldest first
            .limit(20);

        if (dbError) throw new Error(`DB Select Error: ${dbError.message}`);

        if (!subscriptions || subscriptions.length === 0) {
            console.log('[Cron] 💤 No active subscriptions to reconcile.');
            return NextResponse.json({ message: 'No records found' });
        }

        console.log(`[Cron] 🔍 Inspecting ${subscriptions.length} records...`);

        // 4. PREPARATION: Get PayPal Token ONCE (Optimization)
        const accessToken = await getPayPalAccessToken();
        const results = { checked: 0, fixed: 0, errors: 0 };

        // 5. EXECUTION: The Loop
        for (const sub of subscriptions) {
            results.checked++;
            
            try {
                // Fetch TRUTH from PayPal
                const ppSub = await getPayPalSubscriptionDetails(sub.paypal_subscription_id, accessToken);
                const ppStatus = ppSub.status ? ppSub.status.toLowerCase() : 'unknown';

                let newStatus = sub.status; // Default: No change
                let needsUpdate = false;

                // --- LOGIC: The Comparison ---

                // CASE A: Zombie (DB says Active, PayPal says Cancelled/Suspended)
                if (sub.status === 'active' && ['cancelled', 'suspended', 'expired'].includes(ppStatus)) {
                    console.log(`[Cron] 🧟 Zombie Detected: User ${sub.user_id} is active but PayPal is ${ppStatus}. Downgrading.`);
                    newStatus = ppStatus;
                    needsUpdate = true;
                }
                
                // CASE B: False Negative (DB says Past_Due, PayPal says Active)
                else if (sub.status === 'past_due' && ppStatus === 'active') {
                    console.log(`[Cron] ✨ Resurrection: User ${sub.user_id} was past_due but PayPal is Active. Upgrading.`);
                    newStatus = 'active';
                    needsUpdate = true;
                }

                // CASE C: Synchronization (Status Match)
                // We ALWAYS update 'updated_at' so this user goes to the back of the line
                // and we don't check them again tomorrow.
                else {
                    needsUpdate = true; // Still "updating" the timestamp
                }

                // Perform the Update
                if (needsUpdate) {
                    const { error: updateError } = await supabase
                        .from('subscriptions')
                        .update({ 
                            status: newStatus,
                            updated_at: new Date().toISOString() // Vital: Moves them to end of queue
                        })
                        .eq('user_id', sub.user_id);

                    if (updateError) console.error(`[Cron] ❌ DB Update Failed for ${sub.user_id}:`, updateError);
                    if (newStatus !== sub.status) results.fixed++;
                }

            } catch (err) {
                // GRACE PERIOD: If PayPal errors out (500), we DO NOT cancel the user.
                // We just log it and move on. They will be checked again next time.
                console.error(`[Cron] ⚠️ Skipping User ${sub.user_id} due to API Error: ${err.message}`);
                results.errors++;
            }
        }

        console.log(`[Cron] ✅ Batch Complete. Checked: ${results.checked}, Fixed: ${results.fixed}, Errors: ${results.errors}`);
        return NextResponse.json({ success: true, ...results });

    } catch (error) {
        console.error('[Cron] 💥 Critical Failure:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}