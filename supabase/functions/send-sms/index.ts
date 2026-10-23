import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { phone, message } = await req.json()

    if (!phone || !message) {
      throw new Error("Missing phone number or message");
    }

    // =====================================================================
    // OPTION A: The "Placeholder" Method (For Testing/Demo)
    // If you don't have Africa's Talking set up, this just prints to terminal.
    // =====================================================================
    if (!Deno.env.get("AT_API_KEY")) {
       console.log(`[MOCK SMS] To: ${phone} | Message: ${message}`);
       return new Response(JSON.stringify({ success: true, note: "Mock SMS sent" }), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       })
    }

    // =====================================================================
    // OPTION B: The Real Africa's Talking API Method
    // =====================================================================
    const AT_USERNAME = Deno.env.get("AT_USERNAME"); 
    const AT_API_KEY = Deno.env.get("AT_API_KEY"); 

    const response = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        "apiKey": AT_API_KEY!,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: new URLSearchParams({
        username: AT_USERNAME!,
        to: phone,
        message: message,
        from: "FLOWGUARD" // Optional shortcode
      })
    });

    const data = await response.json();
    
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})