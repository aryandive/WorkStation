// app/api/paypal/verify-order/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getPayPalOrder } from '@/lib/paypal';
import { createClient } from '@/utils/supabase/server'; // User Client
import { createClient as createAdminClient } from '@supabase/supabase-js'; // Admin Client
import { handleAPIError, APIError, ERROR_CODES } from '@/lib/api-error';

export async function POST(request) {
    try {
        // 1. Authenticate User (Using standard client)
        // We use this just to get the user's ID securely
        const supabaseUserClient = await createClient();
        const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();

        if (userError || !user) {
            throw new APIError('Authentication required.', 401, ERROR_CODES.AUTH_REQUIRED);
        }

        // 2. Parse Request
        const body = await request.json();
        const { orderID } = body;

        if (!orderID) {
            throw new APIError('Order ID is missing.', 400, ERROR_CODES.VALIDATION_ERROR);
        }

        // 3. Verify with PayPal
        const orderData = await getPayPalOrder(orderID);

        // Security: Ensure order is COMPLETED/APPROVED
        if (orderData.status !== 'COMPLETED' && orderData.status !== 'APPROVED') {
            throw new APIError(`Order not complete. Status: ${orderData.status}`, 400, ERROR_CODES.PAYMENT_FAILED);
        }

        // Security: Verify amount (19.99)
        const amountPaid = orderData.purchase_units?.[0]?.amount?.value;
        if (amountPaid !== '19.99') {
            throw new APIError('Invalid payment amount.', 400, ERROR_CODES.PAYMENT_FAILED);
        }

        // 4. Fulfill Order (Using ADMIN Client)
        // We initialize a Service Role client to bypass RLS policies
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Check if this PayPal Order ID already exists in our DB
        const { data: existingOrder } = await supabaseAdmin
            .from('subscriptions')
            .select('id')
            .eq('paypal_subscription_id', orderID) // We store Order ID here for lifetime
            .single();

        if (existingOrder) {
            // If it exists, just return success (idempotency)
            // This prevents "double spending" processing logic if you add credits later
            return NextResponse.json({ success: true, tier: 'lifetime', message: 'Already verified' });
        }

        const { error: dbError } = await supabaseAdmin
            .from('subscriptions')
            .upsert({
                user_id: user.id,
                status: 'active',
                tier: 'lifetime',
                paypal_subscription_id: orderID,
                paypal_plan_id: 'lifetime_one_time',
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

        if (dbError) {
            console.error('Database Update Failed:', dbError);
            throw new APIError(`DB Error: ${dbError.message}`, 500, ERROR_CODES.DB_ERROR);
        }

        return NextResponse.json({ success: true, tier: 'lifetime' });

    } catch (error) {
        // Log the full error to console so you can see it in terminal
        console.error("Verify Order Route Failed:", error);
        return handleAPIError(error);
    }
}