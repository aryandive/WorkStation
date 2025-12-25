// app/api/paypal/create-subscription/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createPayPalSubscription } from '@/lib/paypal';
import { createClient } from '@/utils/supabase/server';

export async function POST(request) {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { planId } = await request.json();

    // Guard against missing configuration
    if (!planId) {
        return NextResponse.json({ error: 'PayPal plan ID missing. Please contact support.' }, { status: 400 });
    }

    try {
        const subscription = await createPayPalSubscription(planId, user.id);
        if (!subscription || !subscription.id) {
            throw new Error('Invalid subscription data received from PayPal.');
        }
        return NextResponse.json({ id: subscription.id });
    } catch (error) {
        console.error('Failed to create PayPal subscription:', error.message);
        return NextResponse.json({ error: 'Failed to initiate subscription. Please try again.' }, { status: 500 });
    }
}