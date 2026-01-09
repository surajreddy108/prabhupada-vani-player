const excelFile = "songs.xlsx";

const homeView = document.getElementById("homeView");
const sheetView = document.getElementById("sheetView");
const tilesEl = document.getElementById("tiles");

const sheetNameTitle = document.getElementById("sheetNameTitle");
const songsContainer = document.getElementById("songsContainer");
const searchInput = document.getElementById("searchInput");
const countBadge = document.getElementById("countBadge");
const backBtn = document.getElementById("backBtn");

const audioPlayer = document.getElementById("audioPlayer");
const miniTitle = document.getElementById("miniTitle");

document.getElementById("year").textContent = new Date().getFullYear();

let workbook = null;
let currentSongs = [];   // songs for current sheet
let currentSheet = "";

async function loadExcel() {
  const res = await fetch(excelFile);
  const data = await res.arrayBuffer();
  workbook = XLSX.read(data, { type: "array" });

  // Build home tiles
  buildTiles();
}

function buildTiles() {
  tilesEl.innerHTML = "";

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    // count valid songs with Title+Link
    const songs = rows.filter(r => r.Title && r.Link);

    const tile = document.createElement("div");
    tile.className = "tile";

    tile.innerHTML = `
      <h3>${escapeHtml(sheetName)}</h3>
      <p>${songs.length} song(s) available</p>
      <div class="chip">Open collection →</div>
    `;

    tile.onclick = () => openSheet(sheetName);
    tilesEl.appendChild(tile);
  });
}

function openSheet(sheetName) {
  currentSheet = sheetName;

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet);

  // normalize songs list
  currentSongs = rows
    .filter(r => r.Title && r.Link)
    .map(r => ({
      title: String(r.Title).trim(),
      link: String(r.Link).trim()
    }));

  sheetNameTitle.textContent = sheetName;

  // reset search
  searchInput.value = "";
  renderSongs(currentSongs);

  // Switch view
  homeView.classList.remove("active");
  sheetView.classList.add("active");
}

function goHome() {
  sheetView.classList.remove("active");
  homeView.classList.add("active");
}

function renderSongs(songList) {
  songsContainer.innerHTML = "";
  countBadge.textContent = `${songList.length} song(s)`;

  if (songList.length === 0) {
    songsContainer.innerHTML = `<div class="song"><div class="song-title">No songs found</div></div>`;
    return;
  }

  // Efficient render: build HTML string once
  let html = "";
  songList.forEach((song, idx) => {
    html += `
      <div class="song" data-index="${idx}">
        <div>
          <div class="song-title">${escapeHtml(song.title)}</div>
          <div class="song-link">${escapeHtml(song.link)}</div>
        </div>
        <button class="btn">Play</button>
      </div>
    `;
  });

  songsContainer.innerHTML = html;

  // One event listener for all songs (event delegation)
  songsContainer.onclick = (e) => {
    const row = e.target.closest(".song");
    if (!row) return;
    const idx = Number(row.dataset.index);
    const song = songList[idx];
    playSong(song);
  };
}

function playSong(song) {
  audioPlayer.src = song.link;
  audioPlayer.play();
  miniTitle.textContent = `${currentSheet} • ${song.title}`;
}

// Search
searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();
  const filtered = currentSongs.filter(s => s.title.toLowerCase().includes(q));
  renderSongs(filtered);
});

backBtn.addEventListener("click", goHome);

// Helpers
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#039;"
  }[m]));
}

loadExcel();
