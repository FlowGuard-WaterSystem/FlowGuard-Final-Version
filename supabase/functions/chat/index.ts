import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const messages = body.messages || []
    const context = body.context || {}

    // 1. Extract context data with fallbacks
    const area = context.area || "an unknown area";
    const alerts = context.activeAlerts && context.activeAlerts.length > 0 
      ? context.activeAlerts.join(', ') 
      : "No active alerts";
    const reports = context.userReports && context.userReports.length > 0 
      ? context.userReports.join(', ') 
      : "No reports filed";

    // 2. Build the System Prompt
    const systemPrompt = `You are FlowGuard AI, an assistant for a South African water app. 
    Here is the user's current live data from the app:
    - Their Area: ${area}
    - Active Water Alerts in the system: ${alerts}
    - Their Submitted Reports: ${reports}
    
    Instructions:
    - Answer questions based on this live data.
    - If they ask how to report an issue, tell them to tap the 'Report' tab on the home screen, choose an issue type (like Leak or Burst Pipe), and add details.
    - Be friendly and keep answers short.`

    // 3. Call the Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("GROQ_API_KEY")}`, // Fetch securely from secrets
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b", // Groq's powerful Llama model
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      }),
    });

    // 4. Handle API errors gracefully
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Groq returned status ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Edge Function Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get a response.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})