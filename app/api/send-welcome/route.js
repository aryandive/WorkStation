import { Resend } from 'resend';
import { WelcomeEmail } from '@/emails/WelcomeEmail';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const payload = await req.json();
    
    // Grab the 'type' of event alongside the records
    const { type, record, old_record } = payload;

    // Scenario 1: Standard Email/Password user finally clicked the Gatekeeper link
    const isEmailConfirmation = 
      type === 'UPDATE' && 
      old_record?.email_confirmed_at == null && 
      record?.email_confirmed_at != null;

    // Scenario 2: Google user signed up (they are pre-verified instantly on creation)
    const isGoogleSignup = 
      type === 'INSERT' && 
      record?.email_confirmed_at != null;

    // If NEITHER of these scenarios are true, we stop the function so we don't spam them
    if (!isEmailConfirmation && !isGoogleSignup) {
       return NextResponse.json({ message: 'Not a new confirmation or Google signup. Skipping.' }, { status: 200 });
    }

    // If they passed the test, send the beautiful Welcome Email!
    const resend = new Resend(process.env.RESEND_API_KEY);
    const userEmail = record.email;

    const data = await resend.emails.send({
      from: 'Aryan from SyncFlowState <admin@syncflowstate.com>',
      to: [userEmail],
      subject: 'Welcome to the zone, Friend. 🌊',
      react: WelcomeEmail(),
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}