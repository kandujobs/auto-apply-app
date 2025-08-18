import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface JobMatchPayload {
  user_id: string
  job_title: string
  company: string
  location: string
  job_url?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, job_title, company, location, job_url }: JobMatchPayload = await req.json()

    // Validate required fields
    if (!user_id || !job_title || !company) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, job_title, company' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user profile and notification settings
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, notification_settings')
      .eq('id', user_id)
      .single()

    if (profileError || !profile) {
      throw new Error('User profile not found')
    }

    // Check if job match notifications are enabled
    const notificationSettings = profile.notification_settings || {}
    if (!notificationSettings.jobMatchNotifications) {
      return new Response(
        JSON.stringify({ message: 'Job match notifications disabled for user' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }

    // Create email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Job Match Found!</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .job-card { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .job-title { font-size: 20px; font-weight: bold; color: #2d3748; margin-bottom: 5px; }
          .company { font-size: 16px; color: #4a5568; margin-bottom: 5px; }
          .location { font-size: 14px; color: #718096; }
          .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          .footer { text-align: center; margin-top: 30px; color: #718096; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 New Job Match Found!</h1>
            <p>We found a great opportunity that matches your profile</p>
          </div>
          <div class="content">
            <p>Hi there!</p>
            <p>We've found a new job opportunity that matches your skills and preferences:</p>
            
            <div class="job-card">
              <div class="job-title">${job_title}</div>
              <div class="company">${company}</div>
              <div class="location">${location || 'Location not specified'}</div>
            </div>
            
            ${job_url ? `<a href="${job_url}" class="cta-button">View Job Details</a>` : ''}
            
            <p>Log in to your KanduJobs dashboard to apply or save this position for later.</p>
            
            <div class="footer">
              <p>You're receiving this because you have job match notifications enabled.</p>
              <p>To manage your notification preferences, visit your account settings.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'KanduJobs <onboarding@resend.dev>',
        to: profile.email,
        subject: `🎯 New Job Match: ${job_title} at ${company}`,
        html: emailHtml,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Resend API error: ${error}`)
    }

    const result = await response.json()

    // Log the notification
    await supabase
      .from('email_notifications')
      .insert({
        user_id,
        type: 'job_match',
        subject: `New Job Match: ${job_title} at ${company}`,
        sent_at: new Date().toISOString(),
        resend_id: result.id
      })

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending job match notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
