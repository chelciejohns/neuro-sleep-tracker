async function loadEntries() {
  const response = await fetch(`${window.APP_CONFIG.apiBaseUrl}/entries`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to load entries");
  }

  return result.items || [];
}

function average(items, key) {
  if (!items.length) return 0;
  const total = items.reduce((sum, item) => sum + Number(item[key] || 0), 0);
  return (total / items.length).toFixed(1);
}

function renderStats(items) {
  document.getElementById("avg-sleep-quality").textContent = average(items, "SleepQuality");
  document.getElementById("avg-sensory-load").textContent = average(items, "SensoryLoad");
  document.getElementById("avg-masking-level").textContent = average(items, "MaskingLevel");
  document.getElementById("avg-nightmare-intensity").textContent = average(items, "NightmareIntensity");
}

function renderEntries(items) {
  const list = document.getElementById("entries-list");

  if (!items.length) {
    list.innerHTML = "<p>No entries yet.</p>";
    return;
  }

  list.innerHTML = items
    .slice(0, 10)
    .map(
      (item) => `
        <div class="entry-row">
          <strong>${item.EntryDate}</strong>
          <p>Sleep Hours: ${item.SleepHours}</p>
          <p>Sleep Quality: ${item.SleepQuality}</p>
          <p>Sensory Load: ${item.SensoryLoad}</p>
          <p>Masking Level: ${item.MaskingLevel}</p>
          <p>Nightmare Intensity: ${item.NightmareIntensity}</p>
          <p>Notes: ${item.Notes || "-"}</p>
        </div>
      `
    )
    .join("");
}

function renderChart(items) {
  const ordered = [...items].sort((a, b) => a.EntryDate.localeCompare(b.EntryDate));

  const labels = ordered.map(item => item.EntryDate);
  const sleepQuality = ordered.map(item => item.SleepQuality);
  const sensoryLoad = ordered.map(item => item.SensoryLoad);
  const maskingLevel = ordered.map(item => item.MaskingLevel);
  const nightmareIntensity = ordered.map(item => item.NightmareIntensity);

  const ctx = document.getElementById("trendChart").getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Sleep Quality",
          data: sleepQuality,
          borderWidth: 2
        },
        {
          label: "Sensory Load",
          data: sensoryLoad,
          borderWidth: 2
        },
        {
          label: "Masking Level",
          data: maskingLevel,
          borderWidth: 2
        },
        {
          label: "Nightmare Intensity",
          data: nightmareIntensity,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true
    }
  });
}

async function initDashboard() {
  try {
    const items = await loadEntries();
    renderStats(items);
    renderEntries(items);
    renderChart(items);
  } catch (error) {
    document.getElementById("entries-list").innerHTML = `<p>${error.message}</p>`;
  }
}

initDashboard();