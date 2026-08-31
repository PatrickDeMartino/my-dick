const video = document.querySelector("#puff-video");
const puffWindow = document.querySelector("#puff-window");
const soundButton = document.querySelector("#tv-sound");
const roomSource = document.querySelector("#room-source");
const roomPlate = document.querySelector("#room-plate");
const soundKnob = document.querySelector("#tv-knob-sound");
const nextKnob = document.querySelector("#tv-knob-next");
const sectorOverlay = document.querySelector("#sector-overlay");
const sectorZoom = document.querySelector("#sector-zoom");
const sectorTitle = document.querySelector("#sector-title");
const sectorClose = document.querySelector("#sector-close");

const SHORT_IDS = [
  "510vSdkygXo", "fjh_N1SGXOs", "yA22xbGxbJg", "mFhxmYI1WE4",
  "zcmS8rkfH6w", "-eFD3Ude5E0", "nyHvxnyDQ9w", "gvevFUu5REE",
  "Hw0tjupZGaM", "tVRRDKf_Ol8", "MZNi6LEcFXw", "Sp0AVpJh8Fg",
  "eDs5G1U5DTA", "_II9hvsRbYE", "RO9FPRn9dQ0", "LqWaHBqof8Q",
  "J9pR3Y3HvR8", "LrYJDwVY7bM", "3SXpj7lVDRI", "ROrb6KKNrEQ",
  "BLvPhflNkwk", "47S5-awePA0", "mqphRV_U7sQ", "JI-rLii_BXI",
  "MhS-z6H8W8Y", "3FOyQ01eIu8", "v78tY7luETI", "WvYwup_JGnM",
  "nTBzA398zbE", "AGBZIeMwjfc", "czGPwl3M750", "2xtdfYg1D5M",
  "scA5Gqp0ppU", "SH-dIijCBM0", "aVbso3NVu3s", "OFRBvvXwcwc",
  "EmSMBaYUQ00", "RX7TtEoJ6os", "EjTCq3OMNG8", "h7pwMnSpZ64",
  "gyBPKzEalns", "bfyTZsgvV74", "0iWDBtbhvNs", "plSBa23eIH8",
  "P5rjxE-h68g", "7N2Wh35Y4R0", "EXKEe4RHoDY", "Y7zWbv0reFM",
  "HjFKkEGeSLY", "fsmhk7c3_cg", "_8sVg8uu_UI", "5qAGeFoNdKg",
  "Ekuiuifa2Io", "xkUPVqwddLY", "jZvaKBd1ZXY", "m5cRc_AYZDw",
  "bFPbmeiQ6EQ", "AfcoqxFTQ9Y", "ElVi56fzL3E", "EXGi_0MyVbE",
  "bejYI65ZsoI", "Nmi5DHfGnyw", "zJsg0Ll2L-I", "Sz9ZBND8Rmk",
  "Aek5pv4rf_4", "VBlfArIWqjs", "zyfPR9IEdR8", "rzM9Lj6PdnU",
  "6_6sP-PW6hg", "_-sEkgomKYc", "oIBwwnxIUfk", "RlBxMP_lFJs",
  "RObHqHYTSfc", "Hw1bbEENPwU", "-fPm-mwWZLM", "NdNzRvM8Pmo",
  "dtg57DyqJpc", "kJI30bZTN94", "MKm68wt1afw", "zyYfJIBvY4o",
  "P47gi5SNvIQ", "cDr7Ku4IYps", "otkAQfsJWlU", "YCw8YlZK6G8",
  "bm72EqprVqE", "5dPNP0KYEVw", "qoYo9E7jA1c", "WwqNVxYWv7M",
  "-SGihRwfVFY", "PhWfkzSxIgc", "fSci9cSdmUQ", "UAQwOvtAtMg",
  "oHmil0ufc5s", "u9bW1bZZfxc", "o1IZFSuUZJM", "ThJMdm0xfCI",
  "bu3rGqxz-CE", "CCEzqSLuz7s", "5pLlDXrFmKE", "M_ru3j7PE_s",
  "fip0bmBF9hI", "8ezxC6nTze0", "o1-enLv1Rxs", "nCLWVUJh4DA",
  "tX5pA-p3EJA", "8aLEcr1kOI4", "_Mti_bk5BNk", "S6jO8V-xYRw",
  "aeFPUcs2-sg", "QPL1r1_oTHc", "qBBPDxviVdk", "5yB5jmHZEhA",
  "HazSGcIYlsk", "U-YfqeKZQXQ", "wz17eZpJTDg", "WU10ZIlPaYw",
  "_7xmfOR7AXU", "Ogv4fQgwBqk", "sInFNYY3EHU", "xyjXsQhlyKs",
  "mJftECsBhm4", "RhC6BQH8hdg", "-nmSXArSi9U", "xaSKU7qKpL4",
  "ns3BiyAoOXQ", "qQhnhFc31rc", "gvkEOhm0ezA", "40C_DwY-ycs",
  "e7CDJOBCRws", "7CCZukViElw", "EqlQg3uOpes", "Aal7zy1C3sI",
  "8IuzGUhSBSc", "-XXn09rsIPI", "zW9xcj_ZrNQ", "x3fSTdpsxaQ",
  "2tktQwDe7vY", "TdLCxLNEc-o", "ASSH2ZyhuJ0", "Qug-fPWrt-I",
  "tn-F77uS68Y", "yP_g662niOw", "fCi-rDxqFeQ", "LtkV9yo9cF4",
  "HeGSpHadiCY", "w5adXv8TxH0", "NxBaJQ4tsog", "lhubM4hT91w",
  "ovIn_lW44hc", "CyJg8nEf87I", "HDFRE2nlgI8", "ka73-jdlrmA",
  "FXZzlsExd3s", "5GBZbxcs1Cg", "pD0cd9iHu2I", "kRth_4oPFys",
  "yYU6-rBqnAs", "-dHjao7EX5s", "hBvO2qBEHNc", "g_GsXw96syw",
  "k-FDyiXZypA", "6wcmUlxlyKg", "DHW2jOcUrpU", "BFQO4N_25EY",
  "6xhcUyPV58Y", "1pvQduiqnNs", "G2i1B7T2bQA", "elepCeHQEq0",
  "qh4dIbIWxrk", "N7jFDJ8KEMU", "sfpV4EyzfXg", "ucK0gBk11Lw",
  "c2CbUNW5B9Q", "fWVCIfyqTX0", "6mCCZCL0kAU", "Q4P76vcs1c4",
  "u0VJvmmhPVk", "CLhmLcEfeDU", "e_tfeP_5geQ", "d-r9YhG8x-k",
  "2nas3dTem10", "WYA2DN3bdTQ", "APZIn8Fn1KY", "w6FgOxhP-ok",
  "LaMiZbBCE24", "t5mI8Tz3Bj4", "D9N1fzQ1Uug", "xVBZHL-5zI4",
  "X1TFw4mqQw8", "xABDAkxbT0k", "ojSAn9FDYNo", "hZKDcMjYko0",
  "GCU9qIKup0U", "2szs5xCezJ8", "vtd1kP5JzAQ", "4606L1LRgEg",
  "AEG1RfyQ8M8", "tvOBymmfTEw", "6HZjFh4FpOk", "7PwOw4YaV80",
  "MfDzi6TyOwY", "6ym1Ula9P0M", "9iDFTnDxDtY", "6kFLSW1JzTI",
  "vwpLODJ8CVc", "tNDv9r8P_3Q", "mAtfVBqg83Y", "8iolLaKlkOY",
  "Czxw_hHHY0E", "QO_a1tAE0g4", "-TLKJQ0eC4Q", "Mj35UUK94uA",
  "tH-H5mibQM4", "KVGyMLPiB00", "CLteOXpALRo", "Dh6ObedJeto",
  "6C2JDoBPM-4", "Re3oV8aCvnQ", "6fidoWPNgsE",
];

const MINUTE_MS = 60_000;
const MIN_DELAY_MS = 5_000;
const PUFF_LENGTH_BUFFER_MS = 16_000;
const previewMode = new URLSearchParams(window.location.search).has("preview");

let cycleTimer;
let puffTimer;
let isPlaying = false;
let shortsPlayer;
let tvMuted = true;
let shortQueue = [];
let lastShortId;

async function prepareRoomPlate() {
  try {
    await roomSource.decode();

    roomPlate.width = roomSource.naturalWidth;
    roomPlate.height = roomSource.naturalHeight;

    const context = roomPlate.getContext("2d", { willReadFrequently: true });
    context.drawImage(roomSource, 0, 0);

    // Only inspect the television screen region; every other source pixel stays exact.
    const screenRegion = { x: 320, y: 290, width: 310, height: 430 };
    const pixels = context.getImageData(
      screenRegion.x,
      screenRegion.y,
      screenRegion.width,
      screenRegion.height,
    );

    for (let index = 0; index < pixels.data.length; index += 4) {
      const red = pixels.data[index];
      const green = pixels.data[index + 1];
      const blue = pixels.data[index + 2];
      const greenLead = green - Math.max(red, blue);
      const greenRatio = green / (red + blue + 1);

      if (green > 65 && greenLead > 30 && greenRatio > 1.2) {
        pixels.data[index + 3] = 0;
      }
    }

    context.putImageData(pixels, screenRegion.x, screenRegion.y);
    roomPlate.classList.add("is-ready");
    roomSource.classList.add("is-keyed");
  } catch {
    // Keep the untouched source image visible if the foreground plate cannot load.
  }
}

function refillShortQueue() {
  shortQueue = [...SHORT_IDS];

  for (let index = shortQueue.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shortQueue[index], shortQueue[randomIndex]] = [
      shortQueue[randomIndex],
      shortQueue[index],
    ];
  }

  if (shortQueue.at(-1) === lastShortId && shortQueue.length > 1) {
    [shortQueue[0], shortQueue[shortQueue.length - 1]] = [
      shortQueue[shortQueue.length - 1],
      shortQueue[0],
    ];
  }
}

function playNextRandomShort() {
  if (!shortsPlayer || typeof shortsPlayer.loadVideoById !== "function") return;
  if (shortQueue.length === 0) refillShortQueue();

  lastShortId = shortQueue.pop();
  shortsPlayer.loadVideoById(lastShortId);
}

window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
  shortsPlayer = new YT.Player("shorts-player", {
    width: "100%",
    height: "100%",
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      playsinline: 1,
      rel: 0,
    },
    events: {
      onReady(event) {
        event.target.mute();
        playNextRandomShort();
      },
      onStateChange(event) {
        if (event.data === YT.PlayerState.ENDED) playNextRandomShort();
      },
      onError() {
        window.setTimeout(playNextRandomShort, 250);
      },
    },
  });
};

soundButton.addEventListener("click", () => {
  if (!shortsPlayer || typeof shortsPlayer.unMute !== "function") return;

  tvMuted = !tvMuted;
  if (tvMuted) {
    shortsPlayer.mute();
    soundButton.setAttribute("aria-label", "Turn television sound on");
  } else {
    shortsPlayer.unMute();
    shortsPlayer.setVolume(70);
    soundButton.setAttribute("aria-label", "Turn television sound off");
  }
});
soundKnob.addEventListener("click", () => soundButton.click());
nextKnob.addEventListener("click", () => playNextRandomShort());

const sectorViews = {
  tv: { position: "8% 49%", size: "285%", title: "TELEVISION ARRAY" },
  anubis: { position: "69% 18%", size: "245%", title: "ANUBIS ON THE THRONE" },
  pigeon: { position: "67% 90%", size: "230%", title: "CYBERNETIC PIGEON" },
};
document.querySelectorAll(".room-sector").forEach((button) => button.addEventListener("click", () => {
  const view = sectorViews[button.dataset.sector];
  sectorZoom.style.backgroundPosition = view.position;
  sectorZoom.style.backgroundSize = view.size;
  sectorTitle.textContent = view.title;
  sectorOverlay.hidden = false;
}));
sectorClose.addEventListener("click", () => { sectorOverlay.hidden = true; });
sectorOverlay.addEventListener("click", (event) => { if (event.target === sectorOverlay) sectorOverlay.hidden = true; });
window.addEventListener("keydown", (event) => { if (event.key === "Escape") sectorOverlay.hidden = true; });

function randomDelayForCycle() {
  if (previewMode) return 2_000;

  const latestStart = MINUTE_MS - PUFF_LENGTH_BUFFER_MS;
  return Math.floor(
    MIN_DELAY_MS + Math.random() * (latestStart - MIN_DELAY_MS),
  );
}

async function playPuff() {
  if (isPlaying) return;

  isPlaying = true;
  video.currentTime = 0;

  try {
    await video.play();
    puffWindow.classList.add("is-playing");
  } catch {
    isPlaying = false;
  }
}

function returnToStill() {
  puffWindow.classList.remove("is-playing");
  isPlaying = false;
}

function schedulePuffForThisMinute() {
  window.clearTimeout(puffTimer);
  puffTimer = window.setTimeout(playPuff, randomDelayForCycle());
}

function beginSchedule() {
  schedulePuffForThisMinute();

  const cycleLength = previewMode ? 20_000 : MINUTE_MS;
  cycleTimer = window.setInterval(schedulePuffForThisMinute, cycleLength);
}

video.addEventListener("ended", returnToStill);
video.addEventListener("error", returnToStill);

// Press P at any time to check the transition without changing the schedule.
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "p") playPuff();
});

window.addEventListener("pagehide", () => {
  window.clearInterval(cycleTimer);
  window.clearTimeout(puffTimer);
});

beginSchedule();
prepareRoomPlate();
