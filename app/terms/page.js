"use client";

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ScrollText, ShieldAlert, Scale, FileWarning, Ban } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="bg-[#1A202C] text-[#F7FAFC] font-sans min-h-screen flex flex-col">
            <Header />

            <main className="flex-grow py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Page Header */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center justify-center p-3 bg-gray-800 rounded-full mb-6 border border-gray-700">
                            <Scale className="w-8 h-8 text-gray-400" />
                        </div>
                        <h1 className="text-4xl font-extrabold text-white mb-4">Terms & Conditions</h1>
                        <p className="text-gray-400 text-lg">
                            Last Updated: February 2026
                        </p>
                    </div>

                    <div className="space-y-12 text-gray-300 leading-relaxed">

                        {/* SECTION 1: REFUND POLICY (The Important Part) */}
                        <section className="bg-yellow-900/10 border border-yellow-500/20 rounded-2xl p-8">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <ShieldAlert className="text-yellow-400" />
                                1. Refund Policy
                            </h2>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white">1.1 Lifetime Deal (The &quot;Believer&quot; Plan)</h3>
                                <p>
                                    We offer a <strong>14-Day Money-Back Guarantee</strong> for the Lifetime Deal. However, this is a performance-based guarantee, not a &quot;no questions asked&quot; policy.
                                </p>
                                <ul className="list-disc pl-5 space-y-2 marker:text-yellow-500">
                                    <li>
                                        <strong>Eligibility:</strong> You must email <strong className="text-white">support@workstation.com</strong> within 14 calendar days of purchase.
                                    </li>
                                    <li>
                                        <strong>Condition:</strong> You must provide a valid reason why the software did not meet your expectations. We value your feedback to improve the product.
                                    </li>
                                    <li>
                                        <strong>Anti-Exploitation Clause:</strong> We reserve the right to deny refund requests if we detect patterns of abuse, such as purchasing solely for a short-term project (e.g., &quot;Finals Week&quot;) with the intent to refund immediately after use.
                                    </li>
                                </ul>

                                <h3 className="text-lg font-semibold text-white mt-6">1.2 Monthly Subscriptions</h3>
                                <p>
                                    Monthly subscriptions are <strong>non-refundable</strong>. You may cancel your subscription at any time to prevent future billing, but we do not provide refunds for partial months or unused time.
                                </p>
                            </div>
                        </section>

                        {/* SECTION 2: GENERAL TERMS */}
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                <ScrollText className="text-blue-400" />
                                2. Introduction
                            </h2>
                            <p className="mb-4">
                                Welcome to WorkStation. By accessing or using our website and application, you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms, you may not access the service.
                            </p>
                            <p>
                                WorkStation is a project built and maintained by an independent student developer. While we strive for professional reliability, you acknowledge that this is not an enterprise-grade service with 24/7 support teams.
                            </p>
                        </section>

                        {/* SECTION 3: ACCOUNTS */}
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>You are responsible for safeguarding the password that you use to access the service.</li>
                                <li>You agree not to disclose your password to any third party.</li>
                                <li>We reserve the right to terminate accounts that are inactive for over 12 months (Free Tier only) or violate our usage policies.</li>
                            </ul>
                        </section>

                        {/* SECTION 4: INTELLECTUAL PROPERTY */}
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">4. Intellectual Property</h2>
                            <p className="mb-4">
                                The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of WorkStation and its developer.
                            </p>
                            <p>
                                <strong>Your Data:</strong> You retain all rights to the journal entries, tasks, and personal data you create within the app. We claim no ownership over your personal content.
                            </p>
                        </section>

                        {/* SECTION 5: LIMITATION OF LIABILITY */}
                        <section className="bg-gray-800/40 border border-gray-700 rounded-xl p-6">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                <FileWarning className="text-red-400" />
                                5. &quot;As Is&quot; and Limitation of Liability
                            </h2>
                            <p className="mb-4 uppercase tracking-wider text-sm font-bold text-gray-500">
                                Please read this section carefully.
                            </p>
                            <p className="mb-4">
                                The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. The developer makes no representations or warranties of any kind, express or implied, regarding the operation of the service.
                            </p>
                            <p>
                                In no event shall WorkStation or its developer be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                <li>Your access to or use of or inability to access or use the Service;</li>
                                <li>Any unauthorized access to or use of our secure servers and/or any personal information stored therein;</li>
                                <li>Any bugs, viruses, or the like that may be transmitted to or through our Service.</li>
                            </ul>
                        </section>

                        {/* SECTION 6: TERMINATION */}
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                <Ban className="text-gray-400" />
                                6. Termination
                            </h2>
                            <p>
                                We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                                Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service or request account deletion via the Contact page.
                            </p>
                        </section>

                        {/* SECTION 7: CONTACT */}
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">7. Contact Us</h2>
                            <p>
                                If you have any questions about these Terms, please contact us at:
                                <br />
                                <a href="mailto:support@workstation.com" className="text-yellow-400 hover:underline mt-2 inline-block">
                                    support@workstation.com
                                </a>
                            </p>
                        </section>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}