// app/api/paypal/create-subscription/route.js
import { NextResponse } from 'next/server';
import { createPayPalSubscription } from '@/lib/paypal';
import { createClient } from '@/utils/supabase/server'; // Use server client

export async function POST(request) {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // 1. Check if user is authenticated
    if (userError || !user) {
        console.error("User not authenticated to create subscription.");
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // 2. Get planId from the request
    const { planId } = await request.json();
    if (!planId) {
        return NextResponse.json({ error: 'planId is required' }, { status: 400 });
    }

    try {
        // 3. Create the subscription using the user's ID as the custom_id
        const subscription = await createPayPalSubscription(planId, user.id);

        if (!subscription || !subscription.id) {
            throw new Error('Invalid subscription data received from PayPal.');
        }

        // 4. Return *only* the subscription ID to the client
        return NextResponse.json({ id: subscription.id });

    } catch (error) {
        console.error('Failed to create PayPal subscription:', error.message);
        return NextResponse.json(
            { error: 'Failed to initiate subscription. Please try again.' },
            { status: 500 }
        );
    }
}