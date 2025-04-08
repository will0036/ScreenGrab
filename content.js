(() => {
    try {
      const url = window.location.href;  // Get the current page URL
  
      // Select the content to be sent
      const removeSelectors = ['nav', 'header', 'footer', 'aside', '.ads', '.nav', '.footer'];
      
      // Remove unwanted elements (ads, navigation, etc.)
      removeSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => el.remove());
      });
  
      const mainText = document.body.innerText.trim().replace(/\s{2,}/g, ' ');
  
      const fullContent = `URL: ${url}\n\n${mainText}`;
  
      // Send the content to the popup
      chrome.runtime.sendMessage({ content: fullContent });
    } catch (err) {
      // In case of an error, send an error message to popup
      chrome.runtime.sendMessage({ content: "Error extracting content: " + err.message });
    }
  })();
  