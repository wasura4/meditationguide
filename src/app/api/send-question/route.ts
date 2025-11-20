import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, meditationType, question, contact } = body;

    // Validate required fields
    if (!name || !meditationType || !question || !contact) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Nirvanaya App <onboarding@resend.dev>', // You'll need to verify your domain to use a custom email
      to: ['wasura.ediri@gmail.com'],
      subject: `New Meditation Question from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
            New Meditation Question
          </h2>

          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;">
              <strong style="color: #555;">Name:</strong><br/>
              <span style="color: #333; font-size: 16px;">${name}</span>
            </p>

            <p style="margin: 10px 0;">
              <strong style="color: #555;">Meditation Type:</strong><br/>
              <span style="color: #333; font-size: 16px;">${meditationType}</span>
            </p>

            <p style="margin: 10px 0;">
              <strong style="color: #555;">Question:</strong><br/>
              <span style="color: #333; font-size: 16px; white-space: pre-wrap;">${question}</span>
            </p>

            <p style="margin: 10px 0;">
              <strong style="color: #555;">Contact:</strong><br/>
              <span style="color: #333; font-size: 16px;">${contact}</span>
            </p>
          </div>

          <p style="color: #888; font-size: 12px; margin-top: 30px; text-align: center; border-top: 1px solid #ddd; padding-top: 15px;">
            Sent from Nirvanaya Meditation App
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, messageId: data?.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
