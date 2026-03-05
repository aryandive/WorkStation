// app/api/paypal/create-subscription/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createPayPalSubscription } from '@/lib/paypal';
import { createClient } from '@/utils/supabase/server';
import { handleAPIError, APIError, ERROR_CODES } from '@/lib/api-error';

export async function POST(request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        // 1. Strict Auth Check
        if (userError || !user) {
            throw new APIError('Authentication required to subscribe.', 401, ERROR_CODES.AUTH_REQUIRED);
        }

        // 2. Safe Body Parsing
        let body;
        try {
            body = await request.json();
        } catch (e) {
            throw new APIError('Invalid JSON body.', 400, ERROR_CODES.VALIDATION_ERROR);
        }

        const { planId } = body;

        // 3. Input Validation
        if (!planId) {
            throw new APIError('PayPal plan ID is missing.', 400, ERROR_CODES.VALIDATION_ERROR);
        }

        // 4. External Service Call (PayPal)
        const subscription = await createPayPalSubscription(planId, user.id);

        if (!subscription || !subscription.id) {
            throw new APIError('Received invalid subscription data from PayPal.', 502, ERROR_CODES.PAYMENT_FAILED);
        }

        return NextResponse.json({ id: subscription.id });

    } catch (error) {
        // Delegate to our centralized handler
        return handleAPIError(error);
    }
}