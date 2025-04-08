document.addEventListener("DOMContentLoaded", () => {
    loadRecentEmails();
    getCurrentUserEmail();  // Fetch and display the current user email when the popup is opened
  
    // Clear all data when "Clear Data" button is clicked
    document.getElementById("clearData").addEventListener("click", () => {
      clearAllData();  // Clears all stored email history and tokens
    });
  
    // Grab content from the current tab
    document.getElementById("grabContent").addEventListener("click", async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });
    });
  
    // Only register message listener once
    if (!messageListenerRegistered) {
      chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg.content) {
          document.getElementById("message").value = msg.content;
        }
      });
      messageListenerRegistered = true;
    }
  
    // Send email when "Send Email" button is clicked
    document.getElementById("sendEmail").addEventListener("click", async () => {
      const to = document.getElementById("emailInput").value;
      const subject = document.getElementById("subject").value || "Page content";
      const body = document.getElementById("message").value;
      const sendAsPdf = document.getElementById("sendAsPdf").checked;
  
      if (!to || !to.includes("@")) {
        alert("Please enter a valid email address.");
        return;
      }
  
      const confirmSend = confirm(`Send this content to ${to}?`);
      if (!confirmSend) return;
  
      const sendBtn = document.getElementById("sendEmail");
      sendBtn.disabled = true;
  
      // Retrieve the OAuth token first before proceeding
      try {
        const token = await getAuthToken();  // Ensure the token is retrieved first
        if (sendAsPdf) {
          const pdfData = await generatePdf(body);
          // Send PDF data to background.js
          chrome.runtime.sendMessage({ type: "SEND_EMAIL_PDF", to, subject, pdfData });
        } else {
          // Send plain text email
          chrome.runtime.sendMessage({ type: "SEND_EMAIL", to, subject, body });
        }
  
        // Wait for the result in chrome storage
        await checkEmailStatus(sendBtn);
        saveEmailToHistory(to);
      } catch (error) {
        alert(`Failed to get token: ${error.message}`);
        sendBtn.disabled = false;
      }
    });
  });
  
  // Function to generate PDF content using jsPDF
  function generatePdf(bodyContent) {
    return new Promise((resolve, reject) => {
      try {
        const jsPDF = window.jspdf.jsPDF;
        const doc = new jsPDF();
  
        // Add the page content
        doc.text(bodyContent, 10, 10);
  
        // Save PDF as base64
        const pdfData = doc.output("datauristring");
        resolve(pdfData);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  // Function to get the OAuth token for Gmail API
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
  
  // Check for the email send result in storage
  async function checkEmailStatus(sendBtn) {
    let result = null;
    while (result === null) {
      result = await new Promise((resolve) => {
        chrome.storage.local.get("emailSendResult", (data) => {
          resolve(data.emailSendResult); // Directly access the result object
        });
      });
  
      // If the result is still not available, retry every 100ms
      if (result === null) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  
    // Handle the result once it's available
    sendBtn.disabled = false;
    if (result.success) {
      alert("✅ Email sent!");
      window.close();  // Close popup after successful send
    } else {
      console.error("Failed to send email:", result.error);
      alert(`❌ Failed to send email: ${result.error || "Unknown error"}`);
    }
  }
  
  // Fetch current user email using stored token or from chrome identity
  function getCurrentUserEmail() {
    const storedToken = localStorage.getItem("gmailToken");
  
    if (storedToken) {
      fetchGmailProfile(storedToken);  // Fetch Gmail profile if token exists
    } else {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError || !token) {
          console.warn("Token error:", chrome.runtime.lastError?.message || "No token");
          document.getElementById("currentUser").textContent = "Not signed in";
          return;
        }
        fetchGmailProfile(token);
      });
    }
  }
  
  // Fetch Gmail profile data using token
  function fetchGmailProfile(token) {
    fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        document.getElementById("currentUser").textContent = data.emailAddress
          ? `Sending as: ${data.emailAddress}`
          : "Unknown user";
      })
      .catch((err) => {
        console.error("Fetch error:", err.message);
        document.getElementById("currentUser").textContent = "Error loading user";
      });
  }
  