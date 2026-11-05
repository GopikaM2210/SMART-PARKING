/**
 * Smart Parking System - Core Application Logic
 * Converted and enhanced from C Program implementation:
 * - MAX = 5
 * - RATE = 20 (Rs. 20/hr)
 * - struct Parking { char vehicle[20]; int entry, exit; int occupied; }
 */

// Global Constants matching C Code
const MAX_SLOTS = 5;
const RATE_PER_HOUR = 20;

// Application State
let parkingSlots = [];
let billingHistory = [];
let soundEnabled = true;
let audioCtx = null;

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initAudio();
  loadState();
  initLiveClock();
  renderAll();
  setupEventListeners();
  addConsoleLog("System initialized. MAX = 5 slots, RATE = Rs. 20/hr.");
});

/**
 * Initialize Web Audio API for interactive chimes without external assets
 */
function initAudio() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  } catch (e) {
    console.warn("AudioContext not supported", e);
  }
}

function playSound(type) {
  if (!soundEnabled || !audioCtx) return;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'entry') {
      // Pleasant rising chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.18);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'exit') {
      // Cash/ding chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'error') {
      // Low buzz
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (err) {
    console.error("Audio error", err);
  }
}

/**
 * State Management & Persistence
 */
function loadState() {
  const savedSlots = localStorage.getItem('smart_parking_slots');
  const savedHistory = localStorage.getItem('smart_parking_history');
  const savedSound = localStorage.getItem('smart_parking_sound');

  if (savedSound !== null) {
    soundEnabled = savedSound === 'true';
    updateSoundButtonIcon();
  }

  if (savedSlots) {
    try {
      parkingSlots = JSON.parse(savedSlots);
      if (parkingSlots.length !== MAX_SLOTS) {
        initDefaultSlots();
      }
    } catch (e) {
      initDefaultSlots();
    }
  } else {
    initDefaultSlots();
  }

  if (savedHistory) {
    try {
      billingHistory = JSON.parse(savedHistory);
    } catch (e) {
      billingHistory = [];
    }
  }
}

function initDefaultSlots() {
  parkingSlots = [];
  for (let i = 0; i < MAX_SLOTS; i++) {
    parkingSlots.push({
      slotNumber: i + 1,
      vehicle: '',
      entry: 0,
      exit: 0,
      occupied: false,
      timestamp: null
    });
  }
  saveState();
}

function saveState() {
  localStorage.setItem('smart_parking_slots', JSON.stringify(parkingSlots));
  localStorage.setItem('smart_parking_history', JSON.stringify(billingHistory));
}

/**
 * Live 24-Hour Clock Update
 */
function initLiveClock() {
  const updateClock = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const clockElem = document.getElementById('liveClockDisplay');
    if (clockElem) {
      clockElem.textContent = `${hours}:${minutes}:${seconds} (24h)`;
    }
  };
  updateClock();
  setInterval(updateClock, 1000);
}

/**
 * Render Parking Slots (C: Choice 1 - View Parking Slots)
 */
function renderSlots(filterText = '') {
  const container = document.getElementById('parkingSlotsGrid');
  if (!container) return;
  container.innerHTML = '';

  const cleanFilter = filterText.trim().toUpperCase();

  parkingSlots.forEach((slot, index) => {
    const isFiltered = cleanFilter && 
      !slot.slotNumber.toString().includes(cleanFilter) && 
      !(slot.occupied && slot.vehicle.toUpperCase().includes(cleanFilter));

    const card = document.createElement('div');
    card.className = `parking-slot-card rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 ${
      slot.occupied ? 'occupied-slot' : 'available-slot'
    } ${isFiltered ? 'opacity-25 grayscale' : ''}`;

    // Slot Header: Slot Number & Status Pill
    const headerHtml = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-7 h-7 rounded-lg ${slot.occupied ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'} flex items-center justify-center font-bold text-xs">
            #${slot.slotNumber}
          </span>
          <span class="text-xs font-bold uppercase tracking-wider text-slate-300">Slot ${slot.slotNumber}</span>
        </div>
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
          slot.occupied 
            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
        }">
          <span class="w-1.5 h-1.5 rounded-full ${slot.occupied ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}"></span>
          ${slot.occupied ? 'Occupied' : 'Available'}
        </span>
      </div>
    `;

    // Slot Body: Car graphic or Empty Parking bay
    let bodyHtml = '';
    if (slot.occupied) {
      bodyHtml = `
        <div class="my-4 text-center space-y-2.5 animate-car-enter">
          <!-- Stylized Vehicle Plate -->
          <div class="license-plate mx-auto">
            <span class="country-strip">IND</span>
            <span>${escapeHtml(slot.vehicle)}</span>
          </div>

          <!-- Car Icon Illustration -->
          <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-2xl shadow-inner">
            <i class="ph-bold ph-car"></i>
          </div>

          <!-- Time Info -->
          <div class="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 text-xs text-slate-300 space-y-1 font-mono">
            <div class="flex justify-between items-center text-[11px]">
              <span class="text-slate-400">Entry Time:</span>
              <span class="text-emerald-400 font-bold">${String(slot.entry).padStart(2, '0')}:00</span>
            </div>
            <div class="flex justify-between items-center text-[11px]">
              <span class="text-slate-400">Rate:</span>
              <span>₹${RATE_PER_HOUR}/hr</span>
            </div>
          </div>
        </div>
      `;
    } else {
      bodyHtml = `
        <div class="my-6 text-center space-y-2">
          <div class="w-14 h-14 mx-auto rounded-2xl bg-slate-800/60 border border-dashed border-emerald-500/40 flex items-center justify-center text-emerald-400/80 text-2xl">
            <i class="ph-bold ph-arrow-down-right"></i>
          </div>
          <p class="text-xs text-slate-400 font-medium">Bay Vacant</p>
          <p class="text-[11px] text-slate-500">Ready for vehicle allocation</p>
        </div>
      `;
    }

    // Slot Footer: Action Button
    let actionHtml = '';
    if (slot.occupied) {
      actionHtml = `
        <button onclick="openExitModalForSlot(${slot.slotNumber})" class="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs shadow-md shadow-amber-950/20 transition flex items-center justify-center gap-1.5">
          <i class="ph-bold ph-sign-out text-sm"></i>
          <span>Process Exit</span>
        </button>
      `;
    } else {
      actionHtml = `
        <button onclick="openEntryModalForSlot(${slot.slotNumber})" class="w-full py-2 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-xs shadow-md shadow-emerald-950/20 transition flex items-center justify-center gap-1.5">
          <i class="ph-bold ph-plus-circle text-sm"></i>
          <span>Park Here</span>
        </button>
      `;
    }

    card.innerHTML = headerHtml + bodyHtml + actionHtml;
    container.appendChild(card);
  });
}

/**
 * Render KPI Statistics
 */
function renderStats() {
  const total = MAX_SLOTS;
  const occupiedCount = parkingSlots.filter(s => s.occupied).length;
  const availableCount = total - occupiedCount;
  const occupancyPct = Math.round((occupiedCount / total) * 100);

  const totalRev = billingHistory.reduce((sum, item) => sum + item.total, 0);

  document.getElementById('statTotalSlots').textContent = total;
  document.getElementById('statAvailableSlots').textContent = availableCount;
  document.getElementById('statOccupiedSlots').textContent = occupiedCount;
  document.getElementById('statOccupancyPct').textContent = `${occupancyPct}% occupancy`;

  document.getElementById('statTotalRevenue').textContent = `₹${totalRev}`;
  document.getElementById('statTotalExits').textContent = `${billingHistory.length} checkout${billingHistory.length === 1 ? '' : 's'} today`;

  // Parking Full Banner (C Code printf("Parking Full!\n"))
  const banner = document.getElementById('parkingFullBanner');
  if (banner) {
    if (occupiedCount >= total) {
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  }

  // Update disable states on main entry button
  const entryBtn = document.getElementById('btnOpenEntry');
  if (entryBtn) {
    if (occupiedCount >= total) {
      entryBtn.classList.add('opacity-50', 'cursor-not-allowed');
      entryBtn.setAttribute('title', 'Parking is Full!');
    } else {
      entryBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      entryBtn.removeAttribute('title');
    }
  }
}

/**
 * Render Transaction History Table
 */
function renderHistory() {
  const tbody = document.getElementById('historyTableBody');
  const emptyNotice = document.getElementById('emptyHistoryNotice');
  if (!tbody || !emptyNotice) return;

  if (billingHistory.length === 0) {
    tbody.innerHTML = '';
    emptyNotice.classList.remove('hidden');
    return;
  }

  emptyNotice.classList.add('hidden');
  tbody.innerHTML = '';

  billingHistory.slice(-10).reverse().forEach(item => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-800/40 transition-colors';
    tr.innerHTML = `
      <td class="py-2.5 px-3 font-mono font-bold text-white uppercase">${escapeHtml(item.vehicle)}</td>
      <td class="py-2.5 px-3">
        <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700">Slot ${item.slot}</span>
      </td>
      <td class="py-2.5 px-3 font-mono text-slate-300">${String(item.entry).padStart(2, '0')}:00</td>
      <td class="py-2.5 px-3 font-mono text-slate-300">${String(item.exit).padStart(2, '0')}:00</td>
      <td class="py-2.5 px-3 font-mono text-slate-200">${item.duration} ${item.duration === 1 ? 'Hour' : 'Hours'}</td>
      <td class="py-2.5 px-3 font-mono text-emerald-400 font-bold text-right">₹${item.total}</td>
      <td class="py-2.5 px-3 text-center">
        <button onclick="reprintBill('${item.id}')" class="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white" title="View / Print Receipt">
          <i class="ph-bold ph-receipt text-sm"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderAll() {
  renderSlots();
  renderStats();
  renderHistory();
}

/**
 * =========================================================================
 * VEHICLE ENTRY (C Code: Case 2)
 * =========================================================================
 * C Logic:
 * slot = -1;
 * for (i = 0; i < MAX; i++) {
 *   if (!p[i].occupied) { slot = i; break; }
 * }
 * if (slot == -1) printf("Parking Full!\n");
 */
function openEntryModal(preferredSlot = null) {
  // First check if all slots are full
  const firstAvailableIdx = parkingSlots.findIndex(s => !s.occupied);
  if (firstAvailableIdx === -1) {
    playSound('error');
    showToast("Parking Full! No available slots.", "error");
    addConsoleLog("[ENTRY FAILED]: Parking Full! (All 5 slots occupied)");
    return;
  }

  // Populate Slot Selector
  const select = document.getElementById('entrySlotSelect');
  select.innerHTML = '';

  parkingSlots.forEach((s, idx) => {
    if (!s.occupied) {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `Slot ${s.slotNumber} (Available)`;
      if (preferredSlot !== null && s.slotNumber === preferredSlot) {
        opt.selected = true;
      } else if (preferredSlot === null && idx === firstAvailableIdx) {
        opt.selected = true;
      }
      select.appendChild(opt);
    }
  });

  // Pre-fill current hour
  const now = new Date();
  document.getElementById('entryTimeInput').value = now.getHours();
  document.getElementById('entryVehicleNumber').value = '';

  document.getElementById('entryModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('entryVehicleNumber').focus(), 100);
}

function openEntryModalForSlot(slotNum) {
  openEntryModal(slotNum);
}

function closeEntryModal() {
  document.getElementById('entryModal').classList.add('hidden');
}

function handleVehicleEntry(e) {
  e.preventDefault();
  const select = document.getElementById('entrySlotSelect');
  const slotIdx = parseInt(select.value, 10);
  const vehicleInput = document.getElementById('entryVehicleNumber').value.trim().toUpperCase();
  const entryTime = parseInt(document.getElementById('entryTimeInput').value, 10);

  // Validation
  if (isNaN(slotIdx) || slotIdx < 0 || slotIdx >= MAX_SLOTS) {
    showToast("Invalid slot selected!", "error");
    return;
  }

  if (parkingSlots[slotIdx].occupied) {
    showToast(`Slot ${slotIdx + 1} is already occupied!`, "error");
    return;
  }

  if (!vehicleInput) {
    showToast("Please enter a valid vehicle number!", "error");
    return;
  }

  if (isNaN(entryTime) || entryTime < 0 || entryTime > 23) {
    showToast("Entry time must be between 0 and 23 hours!", "error");
    return;
  }

  // Check if vehicle is already parked in another slot
  const existingSlot = parkingSlots.find(s => s.occupied && s.vehicle.toUpperCase() === vehicleInput);
  if (existingSlot) {
    showToast(`Vehicle ${vehicleInput} is already parked in Slot ${existingSlot.slotNumber}!`, "warning");
    return;
  }

  // Exact C Logic:
  // p[slot].occupied = 1;
  // scanf("%19s", p[slot].vehicle);
  // scanf("%d", &p[slot].entry);
  parkingSlots[slotIdx].vehicle = vehicleInput;
  parkingSlots[slotIdx].entry = entryTime;
  parkingSlots[slotIdx].occupied = true;
  parkingSlots[slotIdx].timestamp = new Date().toISOString();

  saveState();
  renderAll();
  closeEntryModal();
  playSound('entry');

  // C Program outputs:
  // printf("Vehicle Allocated Successfully!\n");
  // printf("Assigned Slot: %d\n", slot + 1);
  showToast(`Vehicle Allocated Successfully! Assigned Slot: ${slotIdx + 1}`, "success");
  addConsoleLog(`[ENTRY]: Vehicle '${vehicleInput}' parked in Slot ${slotIdx + 1} at ${entryTime}:00`);
}

/**
 * =========================================================================
 * VEHICLE EXIT (C Code: Case 3)
 * =========================================================================
 * C Logic:
 * if (slot < 1 || slot > MAX || !p[slot - 1].occupied) {
 *   printf("Invalid or Empty Slot!\n");
 * } else {
 *   duration = p[i].exit - p[i].entry;
 *   if (duration < 0) duration += 24;
 *   total = duration * RATE;
 *   p[i].occupied = 0;
 * }
 */
function openExitModal(preferredSlot = null) {
  const occupiedSlots = parkingSlots.filter(s => s.occupied);
  if (occupiedSlots.length === 0) {
    playSound('error');
    showToast("No vehicles currently parked to exit!", "info");
    addConsoleLog("[EXIT FAILED]: No occupied slots to release.");
    return;
  }

  const select = document.getElementById('exitSlotSelect');
  select.innerHTML = '';

  occupiedSlots.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.slotNumber;
    opt.textContent = `Slot ${s.slotNumber} - ${s.vehicle} (Entry: ${String(s.entry).padStart(2, '0')}:00)`;
    if (preferredSlot !== null && s.slotNumber === preferredSlot) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });

  updateExitSlotDetails();

  // Set default exit time: current hour, or entry + 2
  const currentHour = new Date().getHours();
  document.getElementById('exitTimeInput').value = currentHour;

  calculateLiveExitEstimate();

  document.getElementById('exitModal').classList.remove('hidden');
}

function openExitModalForSlot(slotNum) {
  openExitModal(slotNum);
}

function closeExitModal() {
  document.getElementById('exitModal').classList.add('hidden');
}

function updateExitSlotDetails() {
  const select = document.getElementById('exitSlotSelect');
  const slotNum = parseInt(select.value, 10);
  const slot = parkingSlots.find(s => s.slotNumber === slotNum);

  if (slot && slot.occupied) {
    document.getElementById('exitSummaryVehicle').textContent = slot.vehicle;
    document.getElementById('exitSummaryEntryTime').textContent = `${String(slot.entry).padStart(2, '0')}:00`;
  }
  calculateLiveExitEstimate();
}

/**
 * Calculate live duration & bill following C code formula:
 * duration = p[i].exit - p[i].entry;
 * if (duration < 0) duration += 24;
 * total = duration * RATE;
 */
function calculateLiveExitEstimate() {
  const select = document.getElementById('exitSlotSelect');
  const slotNum = parseInt(select.value, 10);
  const slot = parkingSlots.find(s => s.slotNumber === slotNum);
  const exitInput = document.getElementById('exitTimeInput');

  if (!slot || !slot.occupied || !exitInput.value) {
    document.getElementById('exitPreviewDuration').textContent = '0 Hours';
    document.getElementById('exitPreviewTotal').textContent = 'Rs. 0';
    return;
  }

  const exitTime = parseInt(exitInput.value, 10);
  if (isNaN(exitTime) || exitTime < 0 || exitTime > 23) {
    document.getElementById('exitPreviewDuration').textContent = 'Invalid Time';
    document.getElementById('exitPreviewTotal').textContent = 'Rs. --';
    return;
  }

  let duration = exitTime - slot.entry;
  if (duration < 0) {
    duration += 24; // Overnight parking rule from C code
  }

  const total = duration * RATE_PER_HOUR;
  document.getElementById('exitPreviewDuration').textContent = `${duration} ${duration === 1 ? 'Hour' : 'Hours'}`;
  document.getElementById('exitPreviewTotal').textContent = `Rs. ${total}`;
}

function handleVehicleExit(e) {
  e.preventDefault();
  const select = document.getElementById('exitSlotSelect');
  const slotNum = parseInt(select.value, 10);
  const exitTime = parseInt(document.getElementById('exitTimeInput').value, 10);

  // C code validation:
  // if (slot < 1 || slot > MAX || !p[slot - 1].occupied)
  if (isNaN(slotNum) || slotNum < 1 || slotNum > MAX_SLOTS) {
    showToast("Invalid or Empty Slot!", "error");
    addConsoleLog("[EXIT ERROR]: Invalid Slot Number!");
    return;
  }

  const slotIdx = slotNum - 1;
  const slot = parkingSlots[slotIdx];

  if (!slot || !slot.occupied) {
    showToast("Invalid or Empty Slot!", "error");
    addConsoleLog("[EXIT ERROR]: Invalid or Empty Slot!");
    return;
  }

  if (isNaN(exitTime) || exitTime < 0 || exitTime > 23) {
    showToast("Exit time must be between 0 and 23 hours!", "error");
    return;
  }

  // Exact C Calculation:
  // duration = p[i].exit - p[i].entry;
  // if (duration < 0) duration += 24;
  // total = duration * RATE;
  let duration = exitTime - slot.entry;
  if (duration < 0) {
    duration += 24;
  }
  const total = duration * RATE_PER_HOUR;

  // Snapshot bill data
  const billRecord = {
    id: 'BILL-' + Date.now().toString(36).toUpperCase(),
    slot: slotNum,
    vehicle: slot.vehicle,
    entry: slot.entry,
    exit: exitTime,
    duration: duration,
    rate: RATE_PER_HOUR,
    total: total,
    timestamp: new Date().toLocaleString()
  };

  // Add to History
  billingHistory.push(billRecord);

  // Exact C State Mutation:
  // p[i].occupied = 0;
  // printf("Slot Released Successfully!\n");
  slot.occupied = false;
  slot.vehicle = '';
  slot.entry = 0;
  slot.exit = 0;
  slot.timestamp = null;

  saveState();
  renderAll();
  closeExitModal();
  playSound('exit');

  // Display C Output Bill Modal
  displayBillModal(billRecord);

  showToast(`Slot ${slotNum} Released Successfully! Total: Rs.${total}`, "success");
  addConsoleLog(`[EXIT]: Slot ${slotNum} released. Vehicle: ${billRecord.vehicle}, Duration: ${duration}h, Total: Rs.${total}`);
}

/**
 * =========================================================================
 * PARKING BILL DISPLAY (C Code: printf("\n--- PARKING BILL ---\n"))
 * =========================================================================
 */
function displayBillModal(bill) {
  document.getElementById('receiptSlot').textContent = `Slot #${bill.slot}`;
  document.getElementById('receiptVehicle').textContent = bill.vehicle;
  document.getElementById('receiptEntry').textContent = `${String(bill.entry).padStart(2, '0')}:00`;
  document.getElementById('receiptExit').textContent = `${String(bill.exit).padStart(2, '0')}:00`;
  document.getElementById('receiptDuration').textContent = `${bill.duration} ${bill.duration === 1 ? 'Hour' : 'Hours'}`;
  document.getElementById('receiptTotal').textContent = `Rs. ${bill.total}`;
  document.getElementById('receiptTimestamp').textContent = bill.timestamp;

  document.getElementById('billModal').classList.remove('hidden');
}

function closeBillModal() {
  document.getElementById('billModal').classList.add('hidden');
}

function reprintBill(billId) {
  const bill = billingHistory.find(b => b.id === billId);
  if (bill) {
    displayBillModal(bill);
  }
}

/**
 * =========================================================================
 * HELPERS & UTILITIES
 * =========================================================================
 */
function setCurrentHour(inputId) {
  const currentHour = new Date().getHours();
  const input = document.getElementById(inputId);
  if (input) {
    input.value = currentHour;
  }
}

function setQuickPlate(plate) {
  const input = document.getElementById('entryVehicleNumber');
  if (input) {
    input.value = plate;
  }
}

function fillSampleVehicle() {
  // Find first free slot
  const freeSlot = parkingSlots.find(s => !s.occupied);
  if (!freeSlot) {
    showToast("All slots are currently occupied!", "warning");
    return;
  }

  const samplePlates = ['TN-01-AX-9921', 'KA-05-MK-3401', 'MH-02-ER-7711', 'DL-3C-AZ-4500', 'KL-07-BW-1200'];
  const samplePlate = samplePlates[(freeSlot.slotNumber - 1) % samplePlates.length];
  const nowHour = new Date().getHours();
  const entryHour = (nowHour - Math.floor(Math.random() * 4) + 24) % 24;

  freeSlot.occupied = true;
  freeSlot.vehicle = samplePlate;
  freeSlot.entry = entryHour;
  freeSlot.timestamp = new Date().toISOString();

  saveState();
  renderAll();
  playSound('entry');
  showToast(`Sample vehicle ${samplePlate} parked in Slot ${freeSlot.slotNumber}`, "info");
  addConsoleLog(`[DEMO]: Allocated ${samplePlate} to Slot ${freeSlot.slotNumber} (Entry: ${entryHour}:00)`);
}

function handleSearch(query) {
  const clearBtn = document.getElementById('clearSearchBtn');
  if (query.trim()) {
    clearBtn.classList.remove('hidden');
  } else {
    clearBtn.classList.add('hidden');
  }
  renderSlots(query);
}

function clearSearch() {
  const searchInput = document.getElementById('searchInput');
  searchInput.value = '';
  document.getElementById('clearSearchBtn').classList.add('hidden');
  renderSlots('');
}

function clearHistory() {
  if (confirm("Are you sure you want to clear billing history?")) {
    billingHistory = [];
    saveState();
    renderAll();
    showToast("Billing history cleared.", "info");
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function addConsoleLog(msg) {
  const container = document.getElementById('liveConsoleLogs');
  if (!container) return;
  const time = new Date().toLocaleTimeString();
  const line = document.createElement('div');
  line.textContent = `[${time}] ${msg}`;
  container.appendChild(line);
  container.scrollTop = container.scrollHeight;
}

/**
 * Toast Notification System
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs sm:text-sm font-medium shadow-xl backdrop-blur-md animate-fadeIn transition-all duration-300 ${
    type === 'success' 
      ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-950/40' 
      : type === 'error'
      ? 'bg-rose-950/90 text-rose-200 border-rose-500/40 shadow-rose-950/40'
      : type === 'warning'
      ? 'bg-amber-950/90 text-amber-200 border-amber-500/40 shadow-amber-950/40'
      : 'bg-slate-900/90 text-slate-200 border-slate-700 shadow-slate-950/40'
  }`;

  let iconClass = 'ph-info';
  if (type === 'success') iconClass = 'ph-check-circle text-emerald-400';
  else if (type === 'error') iconClass = 'ph-x-circle text-rose-400';
  else if (type === 'warning') iconClass = 'ph-warning-circle text-amber-400';

  toast.innerHTML = `
    <i class="ph-bold ${iconClass} text-lg flex-shrink-0"></i>
    <span class="flex-1">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function updateSoundButtonIcon() {
  const icon = document.getElementById('soundIcon');
  if (!icon) return;
  if (soundEnabled) {
    icon.className = 'ph-bold ph-speaker-high text-base text-emerald-400';
  } else {
    icon.className = 'ph-bold ph-speaker-slash text-base text-slate-500';
  }
}

function setupEventListeners() {
  // Sound toggle button
  const soundBtn = document.getElementById('soundToggleBtn');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      localStorage.setItem('smart_parking_sound', soundEnabled);
      updateSoundButtonIcon();
      showToast(soundEnabled ? "Sound feedback enabled" : "Sound feedback muted", "info");
      if (soundEnabled) playSound('entry');
    });
  }

  // Reset button
  const resetBtn = document.getElementById('resetDataBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm("Reset parking system? This will clear all slots and history.")) {
        initDefaultSlots();
        billingHistory = [];
        saveState();
        renderAll();
        showToast("System reset successfully.", "info");
        addConsoleLog("[SYSTEM RESET]: All slots and billing history cleared.");
      }
    });
  }

  // ESC key to close open modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeEntryModal();
      closeExitModal();
      closeBillModal();
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
