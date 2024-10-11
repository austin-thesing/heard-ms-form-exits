addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Allow POST and OPTIONS methods only
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: getCorsHeaders(),
    });
  } else if (request.method === "POST") {
    const url = "https://hooks.zapier.com/hooks/catch/2007499/2doyia6/";
    try {
      // Parse request body as JSON
      const formData = await request.json();

      // Forward the form data to Zapier
      const forwardResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      // Check if Zapier responded successfully
      if (forwardResponse.ok) {
        return new Response("Form data successfully forwarded to Zapier!", {
          headers: getCorsHeaders(),
        });
      } else {
        return new Response("Failed to forward data to Zapier", {
          status: 500,
          headers: getCorsHeaders(),
        });
      }
    } catch (error) {
      return new Response("Error processing form data", {
        status: 500,
        headers: getCorsHeaders(),
      });
    }
  }

  // If not POST or OPTIONS, return 405 Method Not Allowed
  return new Response("Method Not Allowed", {
    status: 405,
    headers: getCorsHeaders(),
  });
}

// CORS headers
function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "https://www.joinheard.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}
