import { Resend } from 'resend';
import { WelcomeEmail } from '@/emails/WelcomeEmail';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // We moved the initialization inside the function!
    // Now it only runs when the webhook is triggered.
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { email } = await req.json();

    const data = await resend.emails.send({
      from: 'Aryan from SyncFlowState <admin@syncflowstate.com>',
      to: [email],
      subject: 'Welcome to the zone, Friend. 🌊',
      react: WelcomeEmail(),
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}