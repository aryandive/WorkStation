// app/debug-env/page.js
'use client';

export default function DebugEnv() {
    return (
        <div style={{ padding: '2rem' }}>
            <h1>Environment Variables Debug</h1>
            <div style={{ background: '#f5f5f5', padding: '1rem', marginTop: '1rem' }}>
                <h3>PayPal Plan IDs:</h3>
                <p>Monthly: {process.env.NEXT_PUBLIC_PAYPAL_MONTHLY_PLAN_ID || 'MISSING'}</p>
                <p>Yearly: {process.env.NEXT_PUBLIC_PAYPAL_YEARLY_PLAN_ID || 'MISSING'}</p>
                <p>Client ID: {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? 'SET' : 'MISSING'}</p>
            </div>
        </div>
    );
}