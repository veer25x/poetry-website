/* =========================
   Poetry Collection – script.js
   ========================= */

/* ---------- LocalStorage Keys ---------- */
const LS_DATA = "poetry.data.v3";
const LS_THEME = "poetry.theme.v1";

/* ---------- DOM ---------- */
const poemsContainer = document.getElementById("poemsContainer");

const searchInput  = document.getElementById("searchInput");
const poetFilter   = document.getElementById("poetFilter");
const themeFilter  = document.getElementById("themeFilter");

const homeLink      = document.getElementById("homeLink");
const favoritesLink = document.getElementById("favoritesLink");
const addPoemLink   = document.getElementById("addPoemLink");

const addPoemSection = document.getElementById("addPoemSection");
const addPoemForm    = document.getElementById("addPoemForm");
const poetNameInput  = document.getElementById("poetName");
const poemTitleInput = document.getElementById("poemTitle");
const poemThemeInput = document.getElementById("poemTheme");
const poemContentInput = document.getElementById("poemContent");

const themeToggle = document.getElementById("themeToggle");

/* ---------- App State ---------- */
let poems = loadData() || buildDefaultPoems();
let showFavoritesOnly = false;

/* ---------- Init ---------- */
applyStoredTheme();
populatePoetFilter(poems);
render();

/* ---------- Events ---------- */
// Search / Filters
searchInput.addEventListener("input", render);
poetFilter.addEventListener("change", render);
themeFilter.addEventListener("change", render);

// Navbar actions
homeLink.addEventListener("click", (e) => {
  e.preventDefault();
  showFavoritesOnly = false;
  addPoemSection.classList.add("hidden");
  render();
});

favoritesLink.addEventListener("click", (e) => {
  e.preventDefault();
  showFavoritesOnly = true;
  addPoemSection.classList.add("hidden");
  render();
});

addPoemLink.addEventListener("click", (e) => {
  e.preventDefault();
  addPoemSection.classList.toggle("hidden");
  showFavoritesOnly = false;
  render();
});

// Add poem
addPoemForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const poet = poetNameInput.value.trim();
  const title = poemTitleInput.value.trim();
  const theme = poemThemeInput.value;
  const body  = poemContentInput.value.trim();

  if (!poet || !title || !theme || !body) return;

  const newPoem = {
    id: uid(),
    poet,
    title,
    theme,
    body,
    fav: false
  };

  poems.unshift(newPoem);
  saveData(poems);

  // If poet not in dropdown, add it
  ensurePoetInFilter(poet);

  // Reset form
  addPoemForm.reset();
  addPoemSection.classList.add("hidden");

  // Auto-select the poet to show the new poem
  poetFilter.value = poet;
  render();
});

// Theme toggle
themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark-mode");
  themeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
  localStorage.setItem(LS_THEME, isDark ? "dark" : "light");
});

/* ---------- Rendering ---------- */
function render() {
  const q = searchInput.value.trim().toLowerCase();
  const byPoet  = poetFilter.value;
  const byTheme = themeFilter.value;

  let list = poems.slice();

  if (showFavoritesOnly) {
    list = list.filter(p => p.fav);
  }

  if (byPoet) {
    list = list.filter(p => p.poet === byPoet);
  }

  if (byTheme) {
    list = list.filter(p => p.theme === byTheme);
  }

  if (q) {
    list = list.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.body.toLowerCase().includes(q)
    );
  }

  poemsContainer.innerHTML = "";
  if (!list.length) {
    poemsContainer.innerHTML = `<div class="poem-card"><em>No poems found. Try clearing filters or search.</em></div>`;
    return;
  }

  list.forEach((p, i) => {
    const card = document.createElement("article");
    card.className = "poem-card";
    card.style.animationDelay = `${i * 0.03}s`;
    card.innerHTML = `
      <div class="theme-tag theme-${escapeHtml(p.theme)}">${escapeHtml(p.theme)}</div>
      <h3>${escapeHtml(p.title)}</h3>
      <p style="margin:.25rem 0 .5rem;opacity:.8;"><strong>${escapeHtml(p.poet)}</strong></p>
      <pre style="white-space:pre-wrap;margin:0 0 .6rem;line-height:1.6">${escapeHtml(p.body)}</pre>
      <div>
        <button class="fav-btn" aria-pressed="${p.fav ? "true" : "false"}" data-id="${p.id}">
          ${p.fav ? "❤️ Remove Favorite" : "🤍 Add Favorite"}
        </button>
      </div>
    `;
    poemsContainer.appendChild(card);
  });

  // Hook up favorite buttons
  poemsContainer.querySelectorAll(".fav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      toggleFavorite(id);
      render(); // re-render to reflect changes
    });
  });
}

/* ---------- Helpers ---------- */
function populatePoetFilter(list) {
  // Build set of poets from data
  const poets = Array.from(new Set(list.map(p => p.poet))).sort((a,b) => a.localeCompare(b));
  // Keep the "All Poets" option at top (value="")
  const current = poetFilter.value;
  // Clear all except first
  for (let i = poetFilter.options.length - 1; i >= 1; i--) {
    poetFilter.remove(i);
  }
  poets.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    poetFilter.appendChild(opt);
  });
  // restore selection if still valid
  if (current && poets.includes(current)) poetFilter.value = current;
}

function ensurePoetInFilter(name) {
  const exists = Array.from(poetFilter.options).some(opt => opt.value === name);
  if (!exists) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    poetFilter.appendChild(opt);
  }
}

function toggleFavorite(id) {
  const idx = poems.findIndex(p => p.id === id);
  if (idx !== -1) {
    poems[idx].fav = !poems[idx].fav;
    saveData(poems);
  }
}

function applyStoredTheme() {
  const stored = localStorage.getItem(LS_THEME) || "light";
  const isDark = stored === "dark";
  document.body.classList.toggle("dark-mode", isDark);
  themeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
}

function saveData(data) {
  localStorage.setItem(LS_DATA, JSON.stringify(data));
}

function loadData() {
  const raw = localStorage.getItem(LS_DATA);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function escapeHtml(s) {
  return String(s)
   .replace(/&/g, "&amp;")
   .replace(/</g, "&lt;")
   .replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;")
   .replace(/'/g, "&#039;");
}

/* ---------- Seed Data (10 poets × 5 themes) ----------
   Themes per poet: Motivation, Love, Friendship, Nature, Life
   Short original demo snippets (replace with your own any time)
------------------------------------------------------- */
function buildDefaultPoems() {
  const P = [];

  // Helper to push 5 themed poems for each poet
  const add = (poet, entries) => {
    entries.forEach(e => P.push({ id: uid(), poet, ...e, fav:false }));
  };

  add("Rumi", [
    { title:"Rise as Light", theme:"Motivation", body:"Wake with the dawn inside your chest;\nevery step becomes a sunrise." },
    { title:"Beloved Door", theme:"Love", body:"Your name opens the door—\nI fall into a room of stars." },
    { title:"Two Cups", theme:"Friendship", body:"We share tea and silence—\nboth grow warmer together." },
    { title:"Green Whisper", theme:"Nature", body:"The garden forgives with shade,\npetals translating the wind." },
    { title:"A Life of Circles", theme:"Life", body:"I travel in widening circles—\nreturning always more open." }
  ]);

  add("Pablo Neruda", [
    { title:"Begin Again", theme:"Motivation", body:"Shake the dust from yesterday—\nlet the new sea carry you." },
    { title:"Ode to Your Name", theme:"Love", body:"I say your name and the night\nlearns a warmer darkness." },
    { title:"Salt & Bread", theme:"Friendship", body:"At the table of talk,\nwe season the day with laughter." },
    { title:"Island of Leaves", theme:"Nature", body:"The forest writes green odes—\nI sign them with footsteps." },
    { title:"I Confess the Day", theme:"Life", body:"I am made of mornings and mistakes—\nboth teach me to live." }
  ]);

  add("Emily Dickinson", [
    { title:"Small Courage", theme:"Motivation", body:"A thimbleful of hope—\nyet it hems the whole day." },
    { title:"Certain Blue", theme:"Love", body:"A sky the size of your silence—\nI live there rent-free." },
    { title:"Neighbor Stars", theme:"Friendship", body:"We window our evenings together—\nlight travels kindly." },
    { title:"Bee Psalm", theme:"Nature", body:"The clover rings a tiny bell—\nI answer with belief." },
    { title:"Inventory of Breath", theme:"Life", body:"Count not years but heartbeats—\nI keep mine in envelopes." }
  ]);

  add("William Wordsworth", [
    { title:"Go Lightly", theme:"Motivation", body:"Climb with morning in your shoes—\ntroubles turn to birds." },
    { title:"A Lake for Two", theme:"Love", body:"Your hand, a shoreline—\nI am the wave that stays." },
    { title:"Valley Companions", theme:"Friendship", body:"Throw stones together—\nripples memorize our names." },
    { title:"Woodpath Diary", theme:"Nature", body:"Rings in the oak remember\nwho prayed for rain." },
    { title:"Still Country", theme:"Life", body:"The road becomes a teacher\nwhen we walk slowly." }
  ]);

  add("Rabindranath Tagore", [
    { title:"Unfurl", theme:"Motivation", body:"Let courage be your sail—\nthe day a generous river." },
    { title:"Lamp at the Window", theme:"Love 💕", body:"I keep a lamp in your name—\neven the moon grows modest." },
    { title:"Hand in Hand", theme:"Friendship", body:"We cross invisible bridges—\nwords are wooden planks." },
    { title:"Rain School", theme:"Nature 🍃", body:"The rain tutors every leaf\nin fluent green." },
    { title:"Quiet Shore", theme:"Life", body:"Where the mind rests,\nI hear the tide become thought." }
  ]);

  add("Maya Angelou", [
    { title:"Still I Rise (Again)", theme:"Motivation", body:"I gather my yeses from dust—\nand rise, rhythmic as drums." },
    { title:"Tender Thunder", theme:"Love 💕", body:"Your laugh is weather—\nmy world forecasts joy." },
    { title:"Circle of Chairs", theme:"Friendship", body:"We sit until the room is brave—\nthen stand together." },
    { title:"City Green", theme:"Nature", body:"A tree on the corner teaches\nresistance in blossom." },
    { title:"Wider Room", theme:"Life", body:"Where I am not expected—\nI grow a larger door." }
  ]);

  add("Langston Hughes", [
    { title:"Dream Fuel", theme:"Motivation", body:"Hold the dream like a match—\nsmall fire, big journey." },
    { title:"Harlem Kiss", theme:"Love 💕", body:"On Lenox Avenue, your smile\nturns traffic into music." },
    { title:"Good Company", theme:"Friendship", body:"We make a table out of rhythm—\npass the blues, pass the bread." },
    { title:"River Song", theme:"Nature", body:"The river keeps America’s tune—\nI hum along the banks." },
    { title:"Bus Window", theme:"Life", body:"I see my tomorrow in glass—\nstop by stop, it arrives." }
  ]);

  add("John Keats", [
    { title:"Warm Summit", theme:"Motivation", body:"Climb, heart—\nthere is a gentler wind above." },
    { title:"Starlit Oath", theme:"Love 💕", body:"I write my vow on a star—\nit falls into your eyes." },
    { title:"Teacup Steam", theme:"Friendship", body:"Fogged rims, clear talk—\nwe warm the world a sip at a time." },
    { title:"Nightingale Leaf", theme:"Nature", body:"A leaf becomes listening—\nall music roots in green." },
    { title:"Autumn Room", theme:"Life", body:"I stitch amber afternoons\ninto my quiet." }
  ]);

  add("Robert Frost", [
    { title:"Another Road", theme:"Motivation ", body:"Choose the bend you fear—\nfind a kinder horizon." },
    { title:"Snowlight", theme:"Love 💕", body:"Your face in winter—\na promise the frost can’t keep." },
    { title:"Fence Menders", theme:"Friendship", body:"We build a gate in every wall—\nand visit more often." },
    { title:"Woods Aside", theme:"Nature", body:"The forest pauses—\nI borrow its calm." },
    { title:"Promises to Keep", theme:"Life", body:"I count my miles by candor—\narriving where I mean." }
  ]);

  add("Sylvia Plath", [
    { title:"Bright Spine", theme:"Motivation", body:"Lifting the day by its sentence—\nI underline my will." },
    { title:"Red Tulip", theme:"Love 💕", body:"Your name opens like a bloom—\nscarlet, certain, sudden." },
    { title:"Glass Friends", theme:"Friendship", body:"We trade true mirrors—\nno one leaves distorted." },
    { title:"Apiary", theme:"Nature", body:"A hive stitches sunlight—\nhoney is time made sweet." },
    { title:"Calendar Bones", theme:"Life", body:"I tally hours by honesty—\nand find a living sum." }
  ]);

  return P;
}

/* ---------- END SEED ---------- */
