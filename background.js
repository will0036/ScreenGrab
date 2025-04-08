chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    try {
      const token = await getAuthToken(); // Ensure token is retrieved before proceeding
      let result = {};
  
      if (request.type === "SEND_EMAIL") {
        const rawMessage = createRawEmail(request.to, request.subject, request.body);
        const res = await sendEmail(token, rawMessage);
        result = res.success ? { success: true } : { success: false, error: res.error };
      } else if (request.type === "SEND_EMAIL_PDF") {
        const { to, subject, pdfData } = request;
        const rawMessage = createRawEmailWithAttachment(to, subject, pdfData);
        const res = await sendEmail(token, rawMessage);
        result = res.success ? { success: true } : { success: false, error: res.error };
      }
  
      // Store result in chrome storage
      chrome.storage.local.set({ emailSendResult: result });
  
      // Send back the result
      sendResponse(result);
    } catch (err) {
      const errorResult = { success: false, error: err.message };
      chrome.storage.local.set({ emailSendResult: errorResult });
      sendResponse(errorResult);
    }
  
    return true; // Keep the message channel open for async response
  });
  
  // Function to get OAuth token for Gmail API
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
  
  // Function to send the email via Gmail API
  async function sendEmail(token, rawMessage) {
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ raw: rawMessage })
    });
  
    if (res.ok) {
      return { success: true };
    } else {
      const errorText = await res.text();
      console.error("Gmail send failed:", errorText);
      return { success: false, error: errorText };
    }
  }
  
  // Function to create raw email message in base64 encoding (for plain text)
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
  
  // Function to create raw email with PDF attachment in base64 encoding
  function createRawEmailWithAttachment(to, subject, pdfData) {
    const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"; // Boundary for MIME
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: multipart/mixed; boundary=" + boundary,
      "",
      `--${boundary}`,
      "Content-Type: application/pdf; name=\"content.pdf\"",
      "Content-Transfer-Encoding: base64",
      "Content-Disposition: attachment; filename=\"content.pdf\"",
      "",
      pdfData,
      `--${boundary}--`
    ].join("\n");
  
    const encoded = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  
    return encoded;
  }
  