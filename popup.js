let messageListenerRegistered = false;

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

    if (!to || !to.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    const confirmSend = confirm(`Send this content to ${to}?`);
    if (!confirmSend) return;

    const sendBtn = document.getElementById("sendEmail");
    sendBtn.disabled = true;

    // Send message to background.js to send email
    chrome.runtime.sendMessage({ type: "SEND_EMAIL", to, subject, body });

    // Wait for the result in chrome storage
    await checkEmailStatus(sendBtn);
    saveEmailToHistory(to);
  });
});

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
    alert("Email sent!");
    window.close();  // Close popup after successful send
  } else {
    console.error("Failed to send email:", result.error);
    alert(`Failed to send email: ${result.error || "Unknown error"}`);
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

// Load recent email addresses for dropdown
function loadRecentEmails() {
  chrome.storage.local.get("recentEmails", (data) => {
    const emails = data.recentEmails || [];
    const list = document.getElementById("emailList");
    const input = document.getElementById("emailInput");

    list.innerHTML = "";  // Clear the list before repopulating

    emails.forEach((email, i) => {
      const option = document.createElement("option");
      option.value = email;
      list.appendChild(option);
      if (i === 0) input.value = email;
    });
  });
}

// Save email to recent email history
function saveEmailToHistory(email) {
  chrome.storage.local.get("recentEmails", (data) => {
    let emails = data.recentEmails || [];
    if (!emails.includes(email)) {
      emails.unshift(email);
      if (emails.length > 5) emails = emails.slice(0, 5);
      chrome.storage.local.set({ recentEmails: emails });
    }
  });
}

// Clear all data when "Clear Data" is clicked
function clearAllData() {
  // Clear OAuth token
  clearOAuthToken();

  // Clear storage
  clearStorage();

  // Clear LocalStorage
  clearLocalStorage();

  alert("All data has been cleared and reset.");
}

// Clear OAuth token manually
function clearOAuthToken() {
  chrome.identity.getAuthToken({ interactive: false }, (token) => {
    if (chrome.runtime.lastError || !token) {
      console.log("No cached token found.");
    } else {
      chrome.identity.removeCachedAuthToken({ token: token }, () => {
        console.log("OAuth token cleared.");
      });
    }
  });
}

// Clear all storage data (localStorage, chrome.storage)
function clearStorage() {
  chrome.storage.local.clear(() => {
    console.log("All storage data cleared.");
  });
}

function clearLocalStorage() {
  localStorage.clear();
  console.log("LocalStorage cleared.");
}
