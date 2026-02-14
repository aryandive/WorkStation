// lib/paypal.js

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

/**
 * Fetches an OAuth 2.0 access token from PayPal.
 * Cached handling should be done by the caller if making multiple requests.
 * @returns {Promise<string>} The access token.
 */
export async function getPayPalAccessToken() {
    if (!CLIENT_ID || !CLIENT_SECRET) {
        throw new Error('Missing PayPal Credentials (CLIENT_ID or CLIENT_SECRET)');
    }

    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    try {
        const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${auth}`,
            },
            body: 'grant_type=client_credentials',
            cache: 'no-store' // Ensure we never get a stale cached token
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[PayPal] Auth Failed:', errorText);
            throw new Error(`PayPal Auth Failed: ${response.status}`);
        }

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('[PayPal] Token Fetch Error:', error);
        throw error;
    }
}

/**
 * NEW: Fetches the current status of a subscription directly from PayPal.
 * Optimized for Batch Processing: Accepts an existing token to avoid rate limits.
 * * @param {string} subscriptionId - The PayPal Subscription ID (e.g., I-123456789).
 * @param {string|null} [cachedToken] - Optional: Pass an existing token to avoid re-fetching.
 * @returns {Promise<object>} The subscription details (status, plan_id, etc).
 */
export async function getPayPalSubscriptionDetails(subscriptionId, cachedToken = null) {
    // Optimization: Reuse token if provided (Critical for Cron Jobs)
    const accessToken = cachedToken || await getPayPalAccessToken();
    const url = `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            cache: 'no-store'
        });

        // HANDLE 404: Subscription ID doesn't exist at PayPal
        if (response.status === 404) {
            return { status: 'NOT_FOUND', id: subscriptionId };
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            // Throw specific error so the "Grace Period" logic knows it's an API failure
            throw new Error(`PayPal API Error ${response.status}: ${errorData.message || 'Unknown'}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        // Re-throw so the caller knows this wasn't a "Cancelled" result, but a "Check Failed" result
        console.error(`[PayPal] Get Details Error for ${subscriptionId}:`, error);
        throw error;
    }
}

/**
 * Creates a new PayPal subscription.
 */
export async function createPayPalSubscription(planId, customId) {
    const accessToken = await getPayPalAccessToken();
    const url = `${PAYPAL_API_BASE}/v1/billing/subscriptions`;

    const payload = {
        plan_id: planId,
        custom_id: customId,
        application_context: {
            brand_name: 'Work Station',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'SUBSCRIBE_NOW',
            return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/journal?upgraded=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
        },
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'PayPal-Request-Id': `sub-${Math.random().toString(36).substring(7)}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('PayPal Create Subscription Failed:', JSON.stringify(errorData, null, 2));
        throw new Error(errorData.name || 'PAYPAL_CREATION_FAILED');
    }

    return await response.json();
}

/**
 * NEW: Fetches an Order details to verify a one-time purchase.
 * @param {string} orderId - The PayPal Order ID (e.g., 5X123456789).
 */
export async function getPayPalOrder(orderId) {
    const accessToken = await getPayPalAccessToken();
    const url = `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        cache: 'no-store'
    });

    if (!response.ok) {
        throw new Error(`PayPal API Error ${response.status}: Failed to fetch order`);
    }

    return await response.json();
}

/**
 * Verifies a webhook signature from PayPal.
 */
export async function verifyPayPalWebhook(headers, rawBody) {
    if (!PAYPAL_WEBHOOK_ID) {
        throw new Error('Missing PAYPAL_WEBHOOK_ID in environment variables');
    }

    const accessToken = await getPayPalAccessToken();
    const url = `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`;

    const payload = {
        auth_algo: headers.get('paypal-auth-algo'),
        cert_url: headers.get('paypal-cert-url'),
        transmission_id: headers.get('paypal-transmission-id'),
        transmission_sig: headers.get('paypal-transmission-sig'),
        transmission_time: headers.get('paypal-transmission-time'),
        webhook_id: PAYPAL_WEBHOOK_ID,
        webhook_event: JSON.parse(rawBody),
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`PayPal Verification API Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.verification_status !== 'SUCCESS') {
        throw new Error(`Signature Verification Failed: ${data.verification_status}`);
    }

    return true;
}