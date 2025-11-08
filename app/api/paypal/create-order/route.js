// app/api/paypal/create-order/route.js
import { NextResponse } from 'next/server';
import { createPayPalOrder } from '@/lib/paypal'; // Import the function

// --- Configuration ---
// Define product prices/details.
const PRODUCT_DETAILS = {
    'pro_yearly': { amount: 29.99, description: 'Work Station Pro - Yearly Subscription (Early Bird)' },
    'pro_monthly': { amount: 7.99, description: 'Work Station Pro - Monthly Subscription' }
};
const DEFAULT_PLAN = 'pro_yearly'; // Fallback plan
const CURRENCY = 'USD'; // Ensure this matches your PayPal account setup

// --- API Route Handler ---
export async function POST(request) {
    console.log("Received request to create PayPal order...");

    let planId = DEFAULT_PLAN;
    let product;

    try {
        // --- MODIFIED: Get Plan ID from frontend request body ---
        const body = await request.json();
        planId = body.planId && PRODUCT_DETAILS[body.planId] ? body.planId : DEFAULT_PLAN;

        product = PRODUCT_DETAILS[planId];
        if (!product) {
            console.error(`Invalid or missing planId requested: ${planId}`);
            return NextResponse.json({ error: 'Invalid subscription plan selected.' }, { status: 400 });
        }

        console.log(`Attempting to create order for plan: ${planId}, Amount: ${product.amount} ${CURRENCY}`);

        // --- Call PayPal Library Function ---
        // MODIFIED: Pass the dynamically determined amount, currency, and description
        const order = await createPayPalOrder(product.amount, CURRENCY, product.description);

        // --- Success Response ---
        // Ensure the order object and ID exist before responding
        if (!order || !order.id) {
            console.error("PayPal API returned invalid order data:", order);
            throw new Error("Received incomplete order data from PayPal.");
        }

        console.log("PayPal order created successfully:", order.id);
        // Return *only* the order ID as expected by PayPal SDK
        return NextResponse.json({ id: order.id });

    } catch (error) {
        // --- Error Handling ---
        console.error("Failed to create PayPal order:", error.message, error); // Log the specific error message

        // Determine appropriate status code (default to 500)
        let statusCode = 500;
        if (error.message.includes("Invalid subscription plan")) {
            statusCode = 400; // Bad Request if plan was invalid
        }
        // Could add more checks for specific PayPal errors if needed

        // Return a generic, user-friendly error message
        return NextResponse.json(
            { error: 'Failed to initiate PayPal checkout. Please try again later or contact support.' },
            { status: statusCode }
        );
    }
}