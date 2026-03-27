const form = document.getElementById("entry-form");
const messageBox = document.getElementById("form-message");

document.getElementById("entryDate").value = new Date().toISOString().split("T")[0];

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    entryDate: document.getElementById("entryDate").value,
    sleepHours: Number(document.getElementById("sleepHours").value),
    sleepQuality: Number(document.getElementById("sleepQuality").value),
    sensoryLoad: Number(document.getElementById("sensoryLoad").value),
    maskingLevel: Number(document.getElementById("maskingLevel").value),
    nightmareIntensity: Number(document.getElementById("nightmareIntensity").value),
    notes: document.getElementById("notes").value.trim()
  };

  try {
    const response = await fetch(`${window.APP_CONFIG.apiBaseUrl}/entries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to save entry");
    }

    messageBox.textContent = "Entry saved successfully.";
    messageBox.className = "success";
    form.reset();
    document.getElementById("entryDate").value = new Date().toISOString().split("T")[0];
  } catch (error) {
    messageBox.textContent = error.message;
    messageBox.className = "error";
  }
});