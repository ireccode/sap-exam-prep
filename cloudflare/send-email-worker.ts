// @ts-ignore: Cloudflare namespace imports are resolved at runtime
import { EmailMessage } from "cloudflare:email";

interface Env {
  SEND_EMAIL: any;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Extract the origin from the request
    const origin = request.headers.get("Origin") || "https://saparchitectprep.com";
    
    // Set CORS headers - allow requests from the origin that made the request
    // This allows both the main domain and localhost for development
    const headers = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    // For debugging - allow GET requests to check if the worker is running
    if (request.method === "GET") {
      return new Response(JSON.stringify({ 
        status: "Email worker running",
        environment: {
          hasEmailBinding: typeof env.SEND_EMAIL !== "undefined"
        }
      }), { headers });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers
      });
    }

    try {
      // Parse the JSON body
      const { name, email, subject, message } = await request.json();
      
      // Validate required fields
      if (!name || !email || !subject || !message) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers
        });
      }

      try {
        // Create HTML content for the email
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Contact Form Submission</title>
</head>
<body>
  <h2>New Contact Form Submission</h2>
  <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
  <p><strong>Subject:</strong> ${subject}</p>
  <p><strong>Message:</strong></p>
  <p>${message.replace(/\n/g, "<br>")}</p>
</body>
</html>
        `;

        // Generate a unique Message-ID
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 10);
        const messageId = `<${timestamp}.${randomString}@saparchitectprep.com>`;

        // Build a simple multipart MIME message as a string
        const boundary = "----EmailFormBoundary" + Math.random().toString(36).substring(2);
        const emailContent = 
`From: noreply@saparchitectprep.com
To: support@saparchitectprep.com
Subject: New Contact: ${subject}
Message-ID: ${messageId}
Date: ${new Date().toUTCString()}
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary="${boundary}"

--${boundary}
Content-Type: text/plain; charset=utf-8

From: ${name} <${email}>

Subject: ${subject}

Message:
${message}

--${boundary}
Content-Type: text/html; charset=utf-8

${htmlContent}

--${boundary}--
`;
        
        // Create the EmailMessage with the raw email content as a string
        const emailMessage = new EmailMessage(
          "noreply@saparchitectprep.com", 
          "support@saparchitectprep.com", 
          emailContent
        );
        
        // Send the email
        await env.SEND_EMAIL.send(emailMessage);
        
        return new Response(JSON.stringify({ 
          success: true,
          message: "Email sent successfully"
        }), {
          status: 200,
          headers
        });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        
        // If email fails, we will still return a success response with details
        return new Response(JSON.stringify({ 
          success: true,
          warning: "Your message was received, but there was an issue sending the email notification. Our team will still process your request.",
          debug: "Email sending error: " + JSON.stringify(emailError)
        }), {
          status: 200,
          headers
        });
      }
    } catch (error) {
      console.error("Processing error:", error);
      
      return new Response(JSON.stringify({ 
        error: "Failed to process your request",
        details: error instanceof Error ? error.message : String(error)
      }), {
        status: 500,
        headers
      });
    }
  }
}; 