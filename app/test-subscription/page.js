// app/test-subscription/page.js
'use client';
import { useState } from 'react';

export default function TestSubscription() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const createSubscription = async (planType) => {
        setLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/paypal/create-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    planType: planType,
                    userId: 'test-user-' + Date.now() // Unique test user
                }),
            });

            const data = await response.json();

            if (data.success && data.approvalUrl) {
                setResult({
                    type: 'success',
                    message: 'Subscription created! Click the link below to approve:',
                    approvalUrl: data.approvalUrl,
                    subscriptionId: data.subscriptionId
                });

                // Open PayPal approval in new tab
                window.open(data.approvalUrl, '_blank');
            } else {
                setResult({
                    type: 'error',
                    message: data.error || 'Failed to create subscription'
                });
            }
        } catch (error) {
            setResult({
                type: 'error',
                message: 'Network error: ' + error.message
            });
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <h1>Test PayPal Subscription</h1>
            <p>Create a test subscription to trigger webhooks:</p>

            <div style={{ marginBottom: '2rem' }}>
                <button
                    onClick={() => createSubscription('monthly')}
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        margin: '5px',
                        backgroundColor: '#0070ba',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Creating...' : 'Create Monthly Subscription'}
                </button>

                <button
                    onClick={() => createSubscription('yearly')}
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        margin: '5px',
                        backgroundColor: '#0070ba',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Creating...' : 'Create Yearly Subscription'}
                </button>
            </div>

            {result && (
                <div style={{
                    padding: '1rem',
                    backgroundColor: result.type === 'success' ? '#d4edda' : '#f8d7da',
                    border: `1px solid ${result.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                    borderRadius: '5px',
                    marginTop: '1rem'
                }}>
                    <h3>{result.type === 'success' ? '✅ Success!' : '❌ Error'}</h3>
                    <p>{result.message}</p>
                    {result.approvalUrl && (
                        <div>
                            <p><strong>Subscription ID:</strong> {result.subscriptionId}</p>
                            <a
                                href={result.approvalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#0070ba', textDecoration: 'underline' }}
                            >
                                Click here to approve the subscription in PayPal
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}