import { createClient } from 'npm:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface EmailRequest {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: smtpSettings, error: smtpError } = await supabase
      .from('smtp_settings')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (smtpError || !smtpSettings) {
      throw new Error('SMTP settings not configured or inactive');
    }

    const emailRequest: EmailRequest = await req.json();

    if (!emailRequest.to || !emailRequest.subject) {
      throw new Error('Missing required fields: to, subject');
    }

    const transportConfig: any = {
      host: smtpSettings.host,
      port: smtpSettings.port,
      auth: {
        user: smtpSettings.username,
        pass: smtpSettings.password,
      },
    };

    if (smtpSettings.use_ssl) {
      transportConfig.secure = true;
    } else if (smtpSettings.use_tls) {
      transportConfig.secure = false;
      transportConfig.tls = { rejectUnauthorized: false };
    } else {
      transportConfig.secure = false;
    }

    const transporter = nodemailer.createTransport(transportConfig);

    const mailOptions = {
      from: emailRequest.from || `${smtpSettings.from_name} <${smtpSettings.from_email}>`,
      to: emailRequest.to,
      subject: emailRequest.subject,
      text: emailRequest.text || '',
      html: emailRequest.html || emailRequest.text || '',
      replyTo: emailRequest.replyTo || smtpSettings.from_email,
    };

    const info = await transporter.sendMail(mailOptions);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        messageId: info.messageId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send email',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
