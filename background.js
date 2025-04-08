chrome.runtime.onMessage.addListener(async (request, sender) => {
    if (request.type === "SEND_EMAIL") {
      try {
        const token = await getAuthToken(); // Get the correct token from chrome identity
        const rawMessage = createRawEmail(request.to, request.subject, request.body);
  
        // Send the email through Gmail API
        const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ raw: rawMessage })
        });
  
        let result = {};
        if (res.ok) {
          result.success = true;
        } else {
          const errorText = await res.text();
          result.success = false;
          result.error = errorText;
        }
  
        // Store the result in chrome storage
        chrome.storage.local.set({ emailSendResult: result });
  
      } catch (err) {
        chrome.storage.local.set({
          emailSendResult: { success: false, error: err.message }
        });
      }
    }
  });
  
  // Function to fetch the OAuth token for Gmail API
  function getAuthToken() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError || !token) {
          reject(new Error("No token received"));
        } else {
          resolve(token);
        }
      });
    });
  }
  
  // Function to create the raw email message in base64 encoding
  function createRawEmail(to, subject, body) {
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      body
    ].join("\n");
  
    const encoded = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  
    return encoded;
  }
  