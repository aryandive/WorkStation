// lib/paypal.js

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

/**
 * Fetches an OAuth 2.0 access token from PayPal.
 * @returns {Promise<string>} The access token.
 */
export async function getPayPalAccessToken() {
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`,
        },
        body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('PayPal Auth Error Response:', errorData);
        throw new Error('Failed to get PayPal access token.');
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Creates a new PayPal subscription.
 * @param {string} planId - The ID of the PayPal plan (e.g., P-123...).
 * @param {string} customId - Your internal user ID to link the subscription.
 * @returns {Promise<object>} The created subscription object from PayPal.
 */
export async function createPayPalSubscription(planId, customId) {
    const accessToken = await getPayPalAccessToken();
    const url = `${PAYPAL_API_BASE}/v1/billing/subscriptions`;

    const payload = {
        plan_id: planId,
        custom_id: customId, // This is how we link the sub to our user_id
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
            'PayPal-Request-Id': `sub-${Math.random().toString(36).substring(7)}`, // Idempotency
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('PayPal Create Subscription Error Response:', errorData, errorData.details);
        throw new Error('Failed to create PayPal subscription.');
    }

    return await response.json(); // Contains subscription ID and approval link
}

/**
 * Verifies a webhook signature from PayPal.
 * @param {object} headers - The request headers from Next.js.
 * @param {string} rawBody - The raw, unparsed request body.
 * @returns {Promise<boolean>} True if the webhook is valid, false otherwise.
 */
export async function verifyPayPalWebhook(headers, rawBody) {
    const accessToken = await getPayPalAccessToken();
    const url = `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`;

    const payload = {
        auth_algo: headers.get('paypal-auth-algo'),
        cert_url: headers.get('paypal-cert-url'),
        transmission_id: headers.get('paypal-transmission-id'),
        transmission_sig: headers.get('paypal-transmission-sig'),
        transmission_time: headers.get('paypal-transmission-time'),
        webhook_id: PAYPAL_WEBHOOK_ID,
        webhook_event: JSON.parse(rawBody), // PayPal requires the event as a JSON object
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error('Webhook verification failed with status:', response.status);
            return false;
        }

        const data = await response.json();
        return data.verification_status === 'SUCCESS';
    } catch (error) {
        console.error('Error verifying PayPal webhook:', error);
        return false;
    }
}