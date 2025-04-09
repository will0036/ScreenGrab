Chrome Screen Grab
Table of Contents
Overview


Code Structure


Functions Description


Features


1. Overview
This Chrome extension allows users to:
Grab content from a webpage.


Send that content via Gmail to any email address.


Optionally send the content as a PDF attachment.


Maintain a history of recent email addresses.


Manage emails directly from the extension popup with features like:


Selecting recent email addresses from a dropdown.


Adding a new email address manually.


Sending content as either plain text or PDF.



2. Code Structure
The extension consists of several files that work together:
popup.html
Description: This is the HTML page for the extension’s popup. It contains the user interface (UI) for interacting with the extension. It includes input fields for email addresses, message body, and options to send content as a PDF.

 Elements:


Email input field with a datalist for recent emails.


Subject field.


Textarea for the message body.


Checkbox to send the content as a PDF.


"Grab Content" button to extract content from the active webpage.


"Send Email" button to send the content.


"Clear Data" button to reset stored data (recent email history, etc.).


popup.js
Description: This JavaScript file manages the functionality of the popup UI. It listens for user interactions like clicking the "Grab Content" button and the "Send Email" button. It also handles retrieving the user's email and sending the extracted content either as plain text or PDF.

 Key Functions:


loadRecentEmails(): Populates the dropdown (datalist) with recent email addresses stored in local storage.


getCurrentUserEmail(): Retrieves the current user's email using the Gmail API.


checkEmailStatus(): Checks the status of the email send operation and provides feedback (success or failure).


generatePdf(): Generates a PDF from the content using the jsPDF library when the "Send as PDF" checkbox is checked.


saveEmailToHistory(): Saves the recently used email addresses to local storage.


clearAllData(): Clears all stored data (OAuth token, recent email history, local storage).


sendEmail(): Sends the content either as plain text or PDF.


background.js
Description: This JavaScript file manages background operations such as sending the email using the Gmail API. It listens for messages from the popup and performs email operations (sending plain text or PDF).

 Key Functions:


getAuthToken(): Retrieves the OAuth token required to authenticate the Gmail API requests.


sendEmail(): Sends the email through the Gmail API using the raw email message.


createRawEmail(): Converts the plain text email content into a raw base64-encoded message.


createRawEmailWithAttachment(): Converts the email with an attachment (PDF) into a raw base64-encoded message for the Gmail API.


content.js
Description: This script is injected into the active webpage when the user clicks the "Grab Content" button. It extracts the main content of the page by removing non-essential elements like navigation, headers, and ads.

 Key Functions:


contentExtraction(): Grabs the text content of the webpage, removes unnecessary HTML elements, and sends the content back to the popup via chrome.runtime.sendMessage.

3. Functions Description
Here’s a breakdown of the important functions within each script:
popup.js
loadRecentEmails():


Purpose: Loads and displays recent email addresses in the datalist dropdown.


How: Retrieves email addresses from chrome.storage.local and populates the dropdown with them.


getCurrentUserEmail():


Purpose: Retrieves the currently authenticated user’s Gmail email address.


How: Uses chrome.identity.getAuthToken() to get the OAuth token and then makes an API call to Gmail to fetch the user’s profile.


checkEmailStatus():


Purpose: Waits for the result of the email sending operation and provides feedback to the user.


How: Polls chrome.storage.local for the result of the email sending process and alerts the user once it's available.


generatePdf():


Purpose: Generates a PDF document from the provided content.


How: Uses the jsPDF library to create a PDF document and then returns the base64-encoded PDF.


saveEmailToHistory():


Purpose: Saves the provided email to local storage for future use.


How: Updates chrome.storage.local to save the email address.


clearAllData():


Purpose: Clears all stored data (recent email history, OAuth token).


How: Removes all data from local storage and resets the extension state.


background.js
getAuthToken():


Purpose: Retrieves an OAuth token for accessing Gmail API.


How: Uses chrome.identity.getAuthToken() to obtain the token.


sendEmail():


Purpose: Sends an email using the Gmail API.


How: Sends the base64-encoded email message to Gmail via the https://gmail.googleapis.com/gmail/v1/users/me/messages/send endpoint.


createRawEmail():


Purpose: Converts a plain-text email into a base64-encoded raw email message.


How: Encodes the email content using base64 encoding for Gmail API.


createRawEmailWithAttachment():


Purpose: Converts an email with a PDF attachment into a base64-encoded raw email message.


How: Similar to createRawEmail(), but adds a PDF attachment to the message.


content.js
contentExtraction():


Purpose: Extracts the main content of the webpage and removes irrelevant elements like headers, footers, and ads.


How: Uses document.body.innerText to grab the visible content and sends it back to the popup.



4. Features
Grabbing Content: Extracts the main content of a webpage while removing unwanted elements like navigation bars and advertisements.


Sending Email: Sends the extracted content to a specified email address using Gmail API, either as plain text or as a PDF attachment.


Recent Emails: Stores the last 5 email addresses used for sending and populates the input field with them for easy selection.


Data Management: Provides the ability to clear saved data, such as the OAuth token and recent email history.


PDF Support: Allows sending the extracted content as a PDF attachment using the jsPDF library.
