chrome.runtime.onMessage.addListener(async (request, sender) => {
    if (request.type === "SEND_EMAIL") {
      try {
        // Get the correct token from chrome identity
        const token = await getAuthToken();
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
  
        // Result handling
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
        // If there is an error, store the error result in chrome storage
        chrome.storage.local.set({
          emailSendResult: { success: false, error: err.message }
        });
      }
    } else if (request.type === "SEND_EMAIL_PDF") {
      try {
        // Get the correct token from chrome identity
        const token = await getAuthToken();
        const { to, subject, pdfData } = request;
        const rawMessage = createRawEmailWithAttachment(to, subject, pdfData);
  
        // Send the email with PDF attachment through Gmail API
        const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ raw: rawMessage })
        });
  
        // Result handling for PDF
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
        // If there is an error, store the error result in chrome storage
        chrome.storage.local.set({
          emailSendResult: { success: false, error: err.message }
        });
      }
    }
  
    return true;  // Keep the message channel open for async response
  });
  
  // Function to get OAuth token for Gmail API
  function getAuthToken() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError || !token) {
          console.error("Error retrieving token:", chrome.runtime.lastError);
          reject(new Error("No token received"));
        } else {
          resolve(token);
        }
      });
    });
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
  
  function createRawEmailWithAttachment(to, subject, pdfData) {
    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(7); // Ensure unique boundary
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: multipart/mixed; boundary=" + boundary,
      "",
      `--${boundary}`,
      "Content-Type: text/plain; charset=utf-8",
      "Content-Transfer-Encoding: 7bit",
      "",
      "Please find the attached PDF document.",
      `--${boundary}`,
      "Content-Type: application/pdf; name=\"content.pdf\"",
      "Content-Transfer-Encoding: base64",
      "Content-Disposition: attachment; filename=\"content.pdf\"",
      "",
      pdfData,
      `--${boundary}--`
    ].join("\n");
  
    // Encode the message into base64 and fix the encoding
    const encoded = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  
    return encoded;
  }