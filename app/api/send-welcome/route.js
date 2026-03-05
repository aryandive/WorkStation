import { Resend } from 'resend';
import { WelcomeEmail } from '@/emails/WelcomeEmail';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // 1. Get the massive payload from Supabase
    const payload = await req.json();
    
    // 2. Extract the old row data and the new row data
    const { record, old_record } = payload;

    // 3. STOP: If they were already confirmed before this update, do not send the email again!
    if (old_record?.email_confirmed_at != null) {
      return NextResponse.json({ message: 'Email already confirmed previously. Skipping.' }, { status: 200 });
    }

    // 4. STOP: If they still aren't confirmed, do not send the welcome email yet!
    if (record?.email_confirmed_at == null) {
       return NextResponse.json({ message: 'Email not confirmed yet. Skipping.' }, { status: 200 });
    }

    // 5. If they pass the checks, initialize Resend and grab their email
    const resend = new Resend(process.env.RESEND_API_KEY);
    const userEmail = record.email;

    // 6. Send the beautiful Welcome Email
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