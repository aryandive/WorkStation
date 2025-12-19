'use client';

import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { Loader2 } from 'lucide-react';

export default function PayPalSubscriptionButton({ planId, user }) {
    const [{ isPending }] = usePayPalScriptReducer();

    return (
        <div className="relative w-full min-h-[150px] z-0">
            {isPending && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800/50 rounded-lg z-10 backdrop-blur-sm">
                    <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
                    <span className="text-sm text-gray-300 mt-2">Loading Secure Payment...</span>
                </div>
            )}

            <PayPalButtons
                style={{
                    shape: 'rect',
                    color: 'gold',
                    layout: 'vertical',
                    label: 'subscribe'
                }}
                createSubscription={(data, actions) => {
                    // --- DEBUGGING START ---
                    console.log("🟢 Attempting to Create Subscription");
                    console.log("👉 Plan ID being sent:", planId);
                    console.log("👉 User ID being sent:", user?.id);

                    if (!planId) {
                        console.error("🔴 ERROR: Plan ID is missing! Aborting.");
                        alert("System Error: Plan ID is missing. Check console.");
                        return; // Stop execution
                    }
                    // --- DEBUGGING END ---

                    return actions.subscription.create({
                        plan_id: planId,
                        custom_id: user?.id,
                    });
                }}
                onApprove={(data, actions) => {
                    console.log('Subscription successful:', data);
                    // alert('Subscription Active! ID: ' + data.subscriptionID);
                    window.location.href = '/journal?upgraded=true';
                }}
            />
        </div>
    );
}
