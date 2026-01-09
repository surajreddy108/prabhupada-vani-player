const excelFile = "songs.xlsx"; // must be in same folder
const sheetSelect = document.getElementById("sheetSelect");
const playlistEl = document.getElementById("playlist");
const audioPlayer = document.getElementById("audioPlayer");
const nowPlaying = document.getElementById("nowPlaying");

let workbook = null;

// Load Excel file
async function loadExcel() {
  const res = await fetch(excelFile);
  const data = await res.arrayBuffer();

  workbook = XLSX.read(data, { type: "array" });

  // Populate sheet dropdown
  workbook.SheetNames.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    sheetSelect.appendChild(option);
  });

  // Load first sheet by default
  loadSheet(workbook.SheetNames[0]);
}

// Render sheet playlist
function loadSheet(sheetName) {
  playlistEl.innerHTML = "";

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet);

  // Expect columns: Title, Link
  rows.forEach((row) => {
    if (!row.Title || !row.Link) return;

    const li = document.createElement("li");
    li.textContent = row.Title;

    li.onclick = () => {
      audioPlayer.src = row.Link;
      audioPlayer.play();
      nowPlaying.textContent = `Now Playing: ${row.Title}`;
    };

    playlistEl.appendChild(li);
  });
}

// Sheet selection event
sheetSelect.addEventListener("change", (e) => {
  loadSheet(e.target.value);
});

// Start
loadExcel();
