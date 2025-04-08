(() => {
    try {
      const title = document.title;
      const url = window.location.href;
  
      const removeSelectors = ['nav', 'header', 'footer', 'aside', '.ads', '.nav', '.footer'];
      removeSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => el.remove());
      });
  
      const mainText = document.body.innerText.trim().replace(/\s{2,}/g, ' ');
  
      const fullContent = `URL: ${url}\n\n${mainText}`;
      chrome.runtime.sendMessage({ content: fullContent });
    } catch (err) {
      chrome.runtime.sendMessage({ content: "Error extracting content: " + err.message });
    }
  })();