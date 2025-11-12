// app/api/debug-env/route.js
import { NextResponse } from 'next/server';

export async function GET() {
    const envVars = {
        PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID ? 'SET' : 'MISSING',
        PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET ? 'SET' : 'MISSING',
        PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID ? 'SET' : 'MISSING',
        PAYPAL_MONTHLY_PLAN_ID: process.env.PAYPAL_MONTHLY_PLAN_ID ? 'SET' : 'MISSING',
        PAYPAL_YEARLY_PLAN_ID: process.env.PAYPAL_YEARLY_PLAN_ID ? 'SET' : 'MISSING',
        NODE_ENV: process.env.NODE_ENV,
    };

    return NextResponse.json(envVars);
}