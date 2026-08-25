import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const recipient = formData.get('recipient') as string;
    const subject = formData.get('subject') as string;
    const body = formData.get('body') as string;
    const file = formData.get('file') as File | null;

    if (!recipient || !subject || !body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const smtpEmail = formData.get('smtpEmail') as string | null;
    const smtpPassword = formData.get('smtpPassword') as string | null;

    const userEmail = smtpEmail || process.env.GMAIL_USER;
    const userPass = smtpPassword || process.env.GMAIL_PASS;

    if (!userEmail || !userPass) {
      return NextResponse.json(
        { error: 'SMTP Credentials are not configured. Please add them in Settings.' },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: userEmail,
        pass: userPass,
      },
    });

    let attachments = [];
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      attachments.push({
        filename: file.name,
        content: buffer,
      });
    } else {
      const resumePath = formData.get('resumePath') as string | null;
      if (resumePath) {
        // Fetch the file from Supabase Storage
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const fileUrl = `${supabaseUrl}/storage/v1/object/public/resumes/${resumePath}`;
        
        const response = await fetch(fileUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const filename = resumePath.split('/').pop() || 'resume.pdf';
          attachments.push({
            filename: filename,
            content: buffer,
          });
        } else {
          console.error('Failed to fetch resume from Supabase:', response.statusText);
        }
      }
    }

    const isHtml = formData.get('isHtml') === 'true';
    const trackingId = formData.get('trackingId') as string | null;

    // Get the base URL from the request headers to construct the tracking URL
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    let finalHtml = isHtml ? body : body.replace(/\n/g, '<br>');
    if (trackingId) {
      const trackingUrl = `${baseUrl}/api/track?id=${trackingId}`;
      finalHtml += `<img src="${trackingUrl}" width="1" height="1" alt="" style="display:none;" />`;
    }

    const mailOptions = {
      from: userEmail,
      to: recipient,
      subject: subject,
      text: body,
      html: finalHtml,
      attachments: attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);

    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
