// API Configuration
const API_BASE_URL = "http://localhost:8080"; // Change this to your Spring Boot backend URL

// DOM Elements
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const fetchBtn = document.getElementById("fetch-btn");
const entryForm = document.getElementById("entry-form");
const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const journalList = document.getElementById("journal-list");

// --- NEW STATE VARIABLES ---
// We will store the credentials here after a successful "login"
let currentUsername = null;
let currentPassword = null;

// Event Listeners
fetchBtn.addEventListener("click", handleLoginAndFetch); // MODIFIED: Renamed for clarity
entryForm.addEventListener("submit", handleSaveEntry);

// --- MODIFIED ---
// Now reads from our stored variables, not the input fields
function getAuthHeader() {
  if (!currentUsername || !currentPassword) {
    return null;
  }
  const credentials = btoa(`${currentUsername}:${currentPassword}`);
  return `Basic ${credentials}`;
}

// --- MODIFIED ---
// This is now the "Login" function.
// It reads from INPUTS, validates them, and if successful,
// stores them in our global variables.
async function handleLoginAndFetch() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username) {
    showError("Please enter a username");
    return;
  }
  if (!password) {
    showError("Please enter a password");
    return;
  }

  fetchBtn.disabled = true;
  fetchBtn.textContent = "Loading...";

  // --- We must test the credentials first ---
  // We create a *temporary* auth header just for this login attempt
  const tempAuthHeader = `Basic ${btoa(`${username}:${password}`)}`;
  const url = `${API_BASE_URL}/journal/${username}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: tempAuthHeader, // Use the temporary header
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    console.log("[v1] Login attempt status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Login failed: ${response.status} ${response.statusText}. ${errorText}`);
    }

    // --- SUCCESS! ---
    // Now we save the credentials globally
    currentUsername = username;
    currentPassword = password;
    showSuccess("Logged in successfully! Loading entries...");

    // Now that we are "logged in", fetch and display the entries
    const entries = await response.json();
    displayEntries(entries); // No need to pass username, it's global

  } catch (error) {
    console.error("[v1] Error during login:", error);
    showError(`Error: ${error.message}`);
    journalList.innerHTML = '<p class="empty-state">Failed to log in. Check credentials and console.</p>';
    // Clear any old/bad credentials
    currentUsername = null;
    currentPassword = null;
  } finally {
    fetchBtn.disabled = false;
    fetchBtn.textContent = "Fetch Journals";
  }
}

// --- NEW FUNCTION ---
// This function fetches journals using the *stored* credentials.
// It's used to refresh the list after saving, updating, or deleting.
async function refreshJournals() {
  if (!currentUsername) {
    showError("You are not logged in.");
    return;
  }

  try {
    const url = `${API_BASE_URL}/journal/${currentUsername}`;
    console.log("[v1] Refreshing from URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: getAuthHeader(), // Uses global credentials
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to refresh journals: ${response.status} ${errorText}`);
    }

    const entries = await response.json();
    displayEntries(entries);
  } catch (error) {
    console.error("[v1] Error refreshing journals:", error);
    showError(`Error refreshing list: ${error.message}`);
  }
}

// --- MODIFIED ---
// Now uses global credentials and calls refreshJournals()
async function handleSaveEntry(e) {
  e.preventDefault();

  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  // Check for global username, NOT the input field
  if (!currentUsername) {
    showError("Please log in first by fetching your journals.");
    return;
  }

  if (!title || !content) {
    showError("Please fill in both title and content");
    return;
  }

  try {
    const submitBtn = entryForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";

    const url = `${API_BASE_URL}/journal/${currentUsername}`; // Use global username
    console.log("[v1] Saving to URL:", url);

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: getAuthHeader(), // Uses global credentials
      },
      credentials: "include",
      body: JSON.stringify({ title, content }),
    });

    console.log("[v1] Save response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save entry: ${response.status} ${errorText}`);
    }

    showSuccess("Entry saved successfully!");
    entryForm.reset();

    // Refresh the journal list using stored credentials
    await refreshJournals();
  } catch (error) {
    console.error("[v1] Error saving entry:", error);
    showError(`Error: ${error.message}`);
  } finally {
    const submitBtn = entryForm.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.textContent = "Save Entry";
  }
}

// --- MODIFIED ---
// Now uses global credentials and calls refreshJournals()
async function handleDeleteEntry(entryId) {
  if (!currentUsername) {
    showError("Please log in first.");
    return;
  }

  if (!confirm("Are you sure you want to delete this entry?")) {
    return;
  }

  try {
    const url = `${API_BASE_URL}/journal/${entryId}/${currentUsername}`; // Use global username
    console.log("[v1] Deleting from URL:", url);

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: getAuthHeader(), // Uses global credentials
      },
      credentials: "include",
    });

    console.log("[v1] Delete response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete entry: ${response.status} ${errorText}`);
    }

    showSuccess("Entry deleted successfully");

    // Refresh the journal list
    await refreshJournals();
  } catch (error) {
    console.error("[v1] Error deleting entry:", error);
    showError(`Error: ${error.message}`);
  }
}

// --- MODIFIED ---
// Now uses global credentials and calls refreshJournals()
async function handleUpdateEntry(entryId) {
  if (!currentUsername) {
    showError("Please log in first.");
    return;
  }

  const newTitle = prompt("Enter new title:");
  if (newTitle === null) return;

  const newContent = prompt("Enter new content:");
  if (newContent === null) return;

  try {
    const url = `${API_BASE_URL}/journal/${currentUsername}/${entryId}`; // Use global username
    console.log("[v1] Updating at URL:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getAuthHeader(), // Uses global credentials
      },
      credentials: "include",
      body: JSON.stringify({ title: newTitle, content: newContent }),
    });

    console.log("[v1] Update response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update entry: ${response.status} ${errorText}`);
    }

    showSuccess("Entry updated successfully");

    // Refresh the journal list
    await refreshJournals();
  } catch (error) {
    console.error("[v1] Error updating entry:", error);
    showError(`Error: ${error.message}`);
  }
}

// --- MODIFIED ---
// No longer needs 'username' passed in, as it's global
function displayEntries(entries) {
  if (!entries || entries.length === 0) {
    journalList.innerHTML = '<p class="empty-state">No entries yet. Create one to get started!</p>';
    return;
  }

  journalList.innerHTML = entries
    .map((entry) => {
      const date = new Date(entry.createdAt || entry.timestamp).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // MODIFIED: onclick functions no longer need to pass the username
      return `
        <div class="entry-card">
          <div class="entry-header">
            <h3 class="entry-title">${escapeHtml(entry.title)}</h3>
            <span class="entry-date">${date}</span>
          </div>
          <p class="entry-content">${escapeHtml(entry.content)}</p>
          <div class="entry-actions">
            <button class="btn btn-edit" onclick="handleUpdateEntry('${entry.id}')">
              Edit
            </button>
            <button class="btn btn-danger" onclick="handleDeleteEntry('${entry.id}')">
              Delete
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

// Utility function to escape HTML and prevent XSS
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Show error message
function showError(message) {
  // Remove any existing messages first
  document.querySelectorAll(".error-message, .success-message").forEach(el => el.remove());
  
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  document.querySelector(".main-content").insertBefore(errorDiv, document.querySelector(".main-content").firstChild);

  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

// Show success message
function showSuccess(message) {
  // Remove any existing messages first
  document.querySelectorAll(".error-message, .success-message").forEach(el => el.remove());

  const successDiv = document.createElement("div");
  successDiv.className = "success-message";
  successDiv.textContent = message;
  document.querySelector(".main-content").insertBefore(successDiv, document.querySelector(".main-content").firstChild);

  setTimeout(() => {
    successDiv.remove();
  }, 3000); // Success messages can be shorter
}