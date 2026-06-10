// ─────────────────────────────────────────────────────────────
//  HomeBase — Resident & Property Operations Platform
//  Vanilla JS SPA · No framework · No build step
// ─────────────────────────────────────────────────────────────

/* ─── Building Event Data ─── */
const BUILDING_EVENTS = {
  '2026-03-20': [{ type:'maintenance', title:'HVAC Maintenance',    desc:'Lobby & corridors',        time:'9am–1pm',  timeH:9,  dur:4, color:'orange' }],
  '2026-03-25': [{ type:'movein',      title:'Move-in: Unit 7A',   desc:'Maria Santos',              time:'8am–11am', timeH:8,  dur:3, color:'blue'   }],
  '2026-03-26': [{ type:'movein',      title:'Move-in: Unit 11F',  desc:'James Lee · Floor 11',      time:'11am–2pm', timeH:11, dur:3, color:'blue'   }],
  '2026-03-28': [
    { type:'movein',      title:'Move-in: Unit 14B ★', desc:'Alex Johnson · Floor 14',    time:'8am–11am', timeH:8,  dur:3, color:'indigo' },
    { type:'movein',      title:'Move-in: Unit 3B',    desc:'Chris Park',                  time:'11am–2pm', timeH:11, dur:3, color:'yellow' },
  ],
  '2026-03-30': [{ type:'movein',      title:'Move-in: Unit 22C',  desc:'David Kim · Floor 22',      time:'2pm–5pm',  timeH:14, dur:3, color:'purple' }],
  '2026-04-01': [
    { type:'movein',      title:'Move-in: Unit 5D',    desc:'Emma Wilson',                  time:'8am–11am', timeH:8,  dur:3, color:'green' },
    { type:'maintenance', title:'Lobby Renovation',    desc:'Phase 2 starts',               time:'8am–6pm',  timeH:8,  dur:10,color:'red'   },
  ],
};

/* ─── Booking Checklist ─── */
const BOOKING_CHECKLIST = [
  { id:'coi',      required:true,  label:'Certificate of Insurance approved',      check: s => s.coiApprovals[s.movingin.unit] === 'approved' },
  { id:'deposit',  required:true,  label:'Security deposit cleared',               check: ()=> true },
  { id:'movers',   required:false, label:'Moving company or self-move arranged',   check: ()=> false },
  { id:'utilities',required:false, label:'Utilities setup initiated',              check: s => s.movingin.utilities.electric.status !== 'not_started' },
  { id:'keys',     required:false, label:'Key pickup appointment scheduled',       check: s => !!s.elevatorBooking.keyPickupSlot },
  { id:'parking',  required:false, label:'Moving truck parking arranged',          check: s => !!s.elevatorBooking.parkingSlot },
];

/* ─── Providers (no gas — all-electric high-rise) ─── */
const PROVIDERS = {
  electric: ['ConEd', 'National Grid', 'Direct Energy'],
  internet: ['Xfinity', 'Verizon Fios', 'RCN'],
};

/* ─── Building Floor Data (deterministic, no Math.random) ─── */
function seededFloat(n) {
  const x = Math.sin(n * 9.301 + 0.1) * 43758.5453;
  return x - Math.floor(x);
}

const FIRST_NAMES = ['Rachel','James','Diana','Sam','Olivia','Noah','Ava','Liam','Isabella','Ethan',
  'Mia','Alexander','Charlotte','Benjamin','Amelia','Lucas','Harper','Mason','Evelyn','Logan',
  'Aria','Jackson','Luna','Aiden','Layla','Carter','Riley','Sebastian','Zoey','Jack',
  'Penelope','Owen','Lily','Sophie','Emma','Sofia','Michael','Jennifer','Daniel','Natalie'];
const LAST_NAMES  = ['Kim','Park','Torres','Patel','Chen','Williams','Martinez','Johnson','Lee','Brown',
  'Davis','Wilson','Taylor','Anderson','Thomas','Jackson','White','Harris','Martin','Garcia',
  'Thompson','Robinson','Lewis','Walker','Hall','Allen','Young','King','Wright','Scott',
  'Green','Baker','Rodriguez','Turner','Phillips','Evans'];

function seededName(seed) {
  const fi = Math.floor(seededFloat(seed * 2.7)  * FIRST_NAMES.length);
  const li = Math.floor(seededFloat(seed * 3.13) * LAST_NAMES.length);
  return `${FIRST_NAMES[fi]} ${LAST_NAMES[li]}`;
}

const KNOWN_UNITS = {
  '24A': { name:'Victoria Harmon',  status:'occupied',  since:'Mar 2022', ph:true },
  '23A': { name:'James Whitfield',  status:'occupied',  since:'Sep 2021', ph:true },
  '23B': { name:null,               status:'vacant',    ph:true },
  '14A': { name:'Sarah Chen',       status:'occupied',  since:'Jan 2024' },
  '14B': { name:'Alex Johnson',     status:'moving-in', moveIn:'Mar 28' },
  '14C': { name:null,               status:'vacant' },
  '14D': { name:'Marcus Webb',      status:'occupied',  since:'Mar 2023' },
  '14E': { name:'Jennifer Walsh',   status:'occupied',  since:'Aug 2023' },
  '14F': { name:'Robert Tanaka',    status:'occupied',  since:'Dec 2023' },
  '7A':  { name:'Maria Santos',     status:'moving-in', moveIn:'Mar 25' },
  '7B':  { name:'Linda Park',       status:'occupied',  since:'Jun 2023' },
  '7C':  { name:'David Chen',       status:'occupied',  since:'Sep 2023' },
  '7D':  { name:null,               status:'vacant' },
  '7E':  { name:'Sofia Reyes',      status:'occupied',  since:'Feb 2024' },
  '7F':  { name:null,               status:'vacant' },
  '11D': { name:'James Lee',        status:'moving-in', moveIn:'Mar 26' },
  '22C': { name:'David Kim',        status:'moving-in', moveIn:'Mar 30' },
  '3B':  { name:'Chris Park',       status:'moving-in', moveIn:'Mar 28' },
  '5D':  { name:'Emma Wilson',      status:'moving-in', moveIn:'Apr 1' },
};

/* Floor layout: PH=1 unit, floor 23=2 units, 20-22=4 units, 1-2=4 units, rest=6 */
function getFloorLetters(f) {
  if (f === 24) return ['A'];
  if (f === 23) return ['A','B'];
  if (f >= 20 || f <= 2) return ['A','B','C','D'];
  return ['A','B','C','D','E','F'];
}

const BUILDING_FLOORS = (function() {
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Sep','Oct','Nov'];
  const floors = {};
  for (let f = 1; f <= 24; f++) {
    const letters = getFloorLetters(f);
    const fu = {};
    letters.forEach((letter, li) => {
      const uid = `${f}${letter}`;
      if (KNOWN_UNITS[uid]) { fu[uid] = Object.assign({}, KNOWN_UNITS[uid]); return; }
      const seed = f * 7 + li;
      const r    = seededFloat(seed);
      const occ  = f >= 23 ? r < 0.9 : r < 0.76;
      if (occ) {
        const mo = MONTHS[Math.floor(seededFloat(seed + 100) * MONTHS.length)];
        const yr = seededFloat(seed + 200) > 0.5 ? '2024' : '2023';
        fu[uid] = { name: seededName(seed), status:'occupied', since:`${mo} ${yr}` };
      } else {
        fu[uid] = { name:null, status:'vacant' };
      }
    });
    floors[f] = fu;
  }
  return floors;
})();

/* ─── Application State ─── */
const state = {
  role: 'movingin',
  movingInScreen:        'dashboard',
  currentResidentScreen: 'feed',
  staffScreen:           'dashboard',

  movingin: {
    name:'Alex Johnson', unit:'14B', building:'The Meridian', floor:14,
    moveInDate:'March 28, 2026',
    coi:      { status:'under_review', fileName:'Certificate_of_Insurance_2026.pdf', uploadedAt:'Mar 22, 2026' },
    elevator: { status:'not_booked' },
    utilities: {
      electric: { status:'complete',  provider:'ConEd',   accountNum:'CON-847291' },
      internet: { status:'scheduled', provider:'Xfinity', scheduledDate:'Mar 27, 2026' },
    },
  },

  current: {
    name:'Sarah Chen', unit:'14A', floor:14,
    unreadCount: 3,
    notifications: [
      { id:1, read:false, iconName:'package',       color:'blue',   title:'Upcoming move-in on your floor',
        body:'Alex Johnson is moving into Unit 14B on March 28, 8am–11am. Expect service elevator activity on Floor 14.',     time:'2 hours ago' },
      { id:2, read:false, iconName:'wrench',         color:'orange', title:'HVAC Maintenance — March 20',
        body:'Scheduled maintenance for lobby & corridor HVAC, 9am–1pm. Expect some noise in common areas.',                 time:'Yesterday' },
      { id:3, read:false, iconName:'calendar',       color:'accent', title:'Rooftop social this Friday',
        body:'Building social on the rooftop at 6pm. RSVP at the concierge desk. Drinks and light bites included.',          time:'2 days ago' },
      { id:4, read:true,  iconName:'truck',          color:'yellow', title:'Package received for you',
        body:'A delivery was received on your behalf. Pick up at the front desk, Package Locker C-12.',                      time:'3 days ago' },
      { id:5, read:true,  iconName:'shield',         color:'green',  title:'COI renewal reminder',
        body:"Your renter's insurance renews in 45 days. Upload the new COI to maintain your move-in eligibility.",          time:'5 days ago' },
    ],
    payments: {
      bills: [
        { id:'electric', iconName:'zap',       cls:'electric', label:'Electric',          provider:'ConEd',        amount:94.50,  due:'Mar 25', status:'due',      autoPay:false },
        { id:'internet', iconName:'wifi',       cls:'internet', label:'Internet & Cable',  provider:'Xfinity',      amount:69.99,  due:'Mar 28', status:'due',      autoPay:true  },
        { id:'amenity',  iconName:'sparkles',   cls:'amenity',  label:'Building Amenity',  provider:'The Meridian', amount:350.00, due:'Mar 1',  status:'paid',     autoPay:true  },
        { id:'parking',  iconName:'car',        cls:'parking',  label:'Parking — Spot 42', provider:'The Meridian', amount:275.00, due:'Apr 1',  status:'upcoming', autoPay:false },
        { id:'storage',  iconName:'archive',    cls:'storage',  label:'Storage Unit S14',  provider:'The Meridian', amount:55.00,  due:'Apr 1',  status:'upcoming', autoPay:true  },
      ],
    },
    prefs: { myFloor:true, adjFloor:true, allBuilding:false, maintenance:true, events:true },
  },

  calendarState:   { view:'month', year:2026, month:3, weekStart:23, selectedDay:28 },
  elevatorBooking: { step:0, selectedDate:null, selectedDuration:null, selectedSlot:null, keyPickupSlot:null, parkingSlot:null },
  coiApprovals:    {},
  buildingState:   { selectedFloor:null, showComplaint:false, complaintSent:false },
};

/* ─── Icon Helper ─── */
function ic(name, size) {
  size = size || 16;
  return `<i data-lucide="${name}" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0"></i>`;
}

function badge(text, cls) {
  return `<span class="badge badge--${cls}">${text}</span>`;
}

function fmt$(n) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/* ─── Navigation ─── */
function navigate(screen) {
  if (state.role === 'movingin')  state.movingInScreen        = screen;
  if (state.role === 'current')   state.currentResidentScreen = screen;
  if (state.role === 'staff')     state.staffScreen           = screen;
  render();
}

function switchRole(role) {
  state.role = role;
  render();
}

function goHome() {
  if (state.role === 'movingin')  state.movingInScreen        = 'dashboard';
  if (state.role === 'current')   state.currentResidentScreen = 'feed';
  if (state.role === 'staff')     state.staffScreen           = 'dashboard';
  render();
}

function selectBuildingFloor(f) {
  state.buildingState.selectedFloor  = state.buildingState.selectedFloor === f ? null : f;
  state.buildingState.showComplaint  = false;
  state.buildingState.complaintSent  = false;
  render();
}

function showComplaintForm()  { state.buildingState.showComplaint = true;  render(); }
function submitComplaint()    { state.buildingState.complaintSent = true;  render(); }
function cancelComplaint()    { state.buildingState.showComplaint = false; render(); }

function bookingNext() { state.elevatorBooking.step++; render(); }
function bookingBack() { state.elevatorBooking.step--; render(); }

function selectBookingDate(d)  { state.elevatorBooking.selectedDate = d; render(); }
function selectBookingSlot(s)  { state.elevatorBooking.selectedSlot = s; render(); }
function selectDuration(d)     { state.elevatorBooking.selectedDuration = d; state.elevatorBooking.selectedSlot = null; render(); }
function selectKeySlot(s)      { state.elevatorBooking.keyPickupSlot = s; render(); }
function selectParking(p)      { state.elevatorBooking.parkingSlot = p; render(); }
function approveCoI(unit)      { state.coiApprovals[unit] = 'approved'; render(); }
function rejectCoI(unit)       { state.coiApprovals[unit] = 'rejected'; render(); }
function confirmElevatorBooking() {
  const eb = state.elevatorBooking;
  const SLOT_LABELS = { s1:'8am–11am', s2:'11am–2pm', s3:'2pm–5pm', l1:'8am–2pm', l2:'11am–5pm' };
  state.movingin.elevator = {
    status: 'booked',
    date: 'March ' + eb.selectedDate + ', 2026',
    slot: SLOT_LABELS[eb.selectedSlot] || '8am–11am',
    duration: eb.selectedDuration || '3h',
    confirmNum: 'ELV-2847',
  };
  state.elevatorBooking.step = 4;
  render();
}

function togglePref(key) { state.current.prefs[key] = !state.current.prefs[key]; render(); }
function markAllRead()   { state.current.notifications.forEach(n => n.read = true); state.current.unreadCount = 0; render(); }

function setCalView(v)  { state.calendarState.view = v; render(); }
function selectDay(d)   { state.calendarState.selectedDay = d; state.calendarState.view = 'day'; render(); }

function calPrev() {
  const cs = state.calendarState;
  if (cs.view === 'month') { if (cs.month > 1) cs.month--; else { cs.year--; cs.month = 12; } }
  else if (cs.view === 'week') { cs.weekStart -= 7; if (cs.weekStart < 1) { cs.month--; cs.weekStart = 21; } }
  else { if (cs.selectedDay > 1) cs.selectedDay--; else { cs.selectedDay = 28; cs.month--; } }
  render();
}

function calNext() {
  const cs = state.calendarState;
  if (cs.view === 'month') { if (cs.month < 12) cs.month++; else { cs.year++; cs.month = 1; } }
  else if (cs.view === 'week') { cs.weekStart += 7; if (cs.weekStart > 28) { cs.month++; cs.weekStart = 1; } }
  else { if (cs.selectedDay < 31) cs.selectedDay++; else { cs.selectedDay = 1; cs.month++; } }
  render();
}

/* ─── Nav Item Helper ─── */
function navItem(screen, label, iconName, currentScreen, bdg) {
  const active   = currentScreen === screen;
  const bdgHtml  = bdg ? `<span class="nav-badge">${bdg}</span>` : '';
  return `<button class="nav-item ${active ? 'nav-item--active' : ''}" onclick="navigate('${screen}')">
    ${ic(iconName, 18)}<span style="flex:1">${label}</span>${bdgHtml}
  </button>`;
}

/* ─── Layout ─── */
function renderLayout(contentFn) {
  const role = state.role;
  const mi   = state.movingin;
  const cr   = state.current;

  const roleButtons = [
    { key:'movingin', label:'Moving In', icon:'package'    },
    { key:'current',  label:'Resident',  icon:'home'       },
    { key:'staff',    label:'Staff',     icon:'building-2' },
  ].map(r => `
    <button class="role-btn ${role === r.key ? 'role-btn--active' : ''}" onclick="switchRole('${r.key}')">
      ${ic(r.icon, 14)} ${r.label}
    </button>
  `).join('');

  let userName, userUnit, avatarCls, initials;
  if (role === 'movingin') { userName = mi.name;        userUnit = `Unit ${mi.unit}`;     avatarCls = 'indigo'; initials = 'AJ'; }
  else if (role === 'current') { userName = cr.name;   userUnit = `Unit ${cr.unit}`;     avatarCls = 'green';  initials = 'SC'; }
  else                     { userName = 'Maya Bennett'; userUnit = 'Building Staff';       avatarCls = 'blue';   initials = 'MB'; }

  let sidebar = '';
  if (role === 'movingin') {
    const s = state.movingInScreen;
    sidebar = `
      <div class="sidebar-section">My Move-In</div>
      ${navItem('dashboard', 'Overview',        'layout-dashboard', s)}
      ${navItem('coi',       'Insurance (COI)', 'shield',           s)}
      ${navItem('elevator',  'Elevator Booking','arrow-up-down',    s)}
      ${navItem('utilities', 'Utilities',       'zap',              s)}
      <div class="sidebar-section">Building</div>
      ${navItem('building',  'Building Map',    'building-2',       s)}
    `;
  } else if (role === 'current') {
    const s = state.currentResidentScreen;
    const u = cr.unreadCount;
    sidebar = `
      <div class="sidebar-section">My Home</div>
      ${navItem('feed',     'Notifications', 'bell',        s, u > 0 ? u : '')}
      ${navItem('calendar', 'Calendar',      'calendar',    s)}
      ${navItem('payments', 'Payments',      'credit-card', s)}
      <div class="sidebar-section">Building</div>
      ${navItem('building', 'Building Map',  'building-2',  s)}
      ${navItem('settings', 'Settings',      'settings',    s)}
    `;
  } else {
    const s = state.staffScreen;
    sidebar = `
      <div class="sidebar-section">Operations</div>
      ${navItem('dashboard',  'Dashboard',       'layout-dashboard', s)}
      ${navItem('coi-review', 'COI Review',      'file-check',       s, '3')}
      ${navItem('schedule',   'Move-In Schedule','calendar',         s)}
      <div class="sidebar-section">Building</div>
      ${navItem('building',   'Building Map',    'building-2',       s)}
      ${navItem('residents',  'Residents',       'users',            s)}
    `;
  }

  return `
    <div class="layout">
      <header class="topbar">
        <div class="topbar-brand" onclick="goHome()">
          <img src="img/logo.png" style="width:28px;height:28px;object-fit:contain;flex-shrink:0;border-radius:6px" alt="HomeBase">
          HomeBase
        </div>
        <div class="topbar-roles">${roleButtons}</div>
        <div class="topbar-user">
          <div class="topbar-user-text">
            <span style="font-weight:600;color:var(--text);font-size:12.5px">${userName}</span>
            <span style="font-size:11px">${userUnit}</span>
          </div>
          <div class="avatar avatar--${avatarCls}">${initials}</div>
        </div>
      </header>
      <div class="body-wrap">
        <aside class="sidebar">${sidebar}</aside>
        <main class="main">
          <div class="main-inner">${contentFn()}</div>
        </main>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════════
   MOVING IN SCREENS
══════════════════════════════════════════════════ */

function renderMovingInDashboard() {
  const mi  = state.movingin;
  const done    = BOOKING_CHECKLIST.filter(i => i.check(state)).length;
  const total   = BOOKING_CHECKLIST.length;
  const reqDone = BOOKING_CHECKLIST.filter(i => i.required && i.check(state)).length;
  const reqTotal= BOOKING_CHECKLIST.filter(i => i.required).length;
  const pct     = Math.round(done / total * 100);

  const coiIsApproved = state.coiApprovals[mi.unit] === 'approved';
  const coiBadge = coiIsApproved ? 'green' : { under_review:'yellow', rejected:'red', not_started:'gray' }[mi.coi.status] || 'gray';
  const coiLabel = coiIsApproved ? 'Approved' : { under_review:'Under Review', rejected:'Rejected', not_started:'Not Uploaded' }[mi.coi.status] || 'Pending';

  const utStatusCls   = s => ({ complete:'green', scheduled:'blue', in_progress:'yellow', not_started:'gray' })[s] || 'gray';
  const utStatusLabel = s => ({ complete:'Complete', scheduled:'Scheduled', in_progress:'In Progress', not_started:'Not Started' })[s] || s;

  return `
    <div class="hero-card">
      <div class="hero-greeting">Welcome, ${mi.name.split(' ')[0]}!</div>
      <div class="hero-sub">Your move-in to <strong style="color:var(--text)">${mi.building}</strong> is almost ready.</div>
      <div class="hero-meta">
        <div class="hero-meta-item">${ic('map-pin',14)} Unit <strong>${mi.unit}</strong>, Floor ${mi.floor}</div>
        <div class="hero-meta-item">${ic('calendar',14)} <strong>${mi.moveInDate}</strong></div>
        <div class="hero-meta-item">${ic('clock',14)} Elevator: <strong>${mi.elevator.status === 'booked' ? mi.elevator.slot : 'Not booked yet'}</strong></div>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar" style="width:${pct}%"></div>
      </div>
      <div class="progress-label">${done} of ${total} tasks complete — ${reqDone}/${reqTotal} required items done</div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">${ic('list-checks',18)} Move-In Checklist</div>
        <span class="badge badge--${reqDone === reqTotal ? 'green' : 'yellow'}">${reqDone}/${reqTotal} required</span>
      </div>
      <div class="checklist">
        ${BOOKING_CHECKLIST.map(item => {
          const ok = item.check(state);
          return `
            <div class="checklist-item ${ok ? 'checklist-item--done' : ''}">
              <div class="check-icon ${ok ? 'check-icon--done' : ''}">${ok ? ic('check',12) : ''}</div>
              <div style="flex:1"><div class="check-label">${item.label}</div></div>
              <span class="req-tag req-tag--${item.required ? 'required' : 'optional'}">${item.required ? 'Required' : 'Optional'}</span>
            </div>`;
        }).join('')}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
      <div class="card">
        <div class="card-header" style="margin-bottom:12px">
          <div class="card-title">${ic('shield',18)} Insurance</div>
          ${badge(coiLabel, coiBadge)}
        </div>
        <div class="info-banner info-banner--yellow mb-3">${ic('clock',14)} <span>Uploaded <strong>${mi.coi.uploadedAt}</strong> — review takes 1–2 business days</span></div>
        <button class="btn btn--ghost btn--sm w-full" onclick="navigate('coi')">${ic('arrow-right',14)} View Details</button>
      </div>
      <div class="card">
        <div class="card-header" style="margin-bottom:12px">
          <div class="card-title">${ic('arrow-up-down',18)} Elevator</div>
          ${badge(mi.elevator.status === 'booked' ? 'Booked' : 'Not Booked', mi.elevator.status === 'booked' ? 'green' : 'gray')}
        </div>
        ${mi.elevator.status === 'booked'
          ? `<div class="info-banner info-banner--green mb-3">${ic('check-circle',14)} <span><strong>${mi.elevator.date}</strong> · ${mi.elevator.slot}</span></div>`
          : `<div class="info-banner info-banner--yellow mb-3">${ic('alert-triangle',14)} <span>${coiIsApproved ? 'COI approved — you can now book the elevator.' : 'Waiting for COI approval before booking.'}</span></div>`
        }
        <button class="btn btn--ghost btn--sm w-full" onclick="navigate('elevator')">${ic('arrow-right',14)} ${mi.elevator.status === 'booked' ? 'View Booking' : 'Book Now'}</button>
      </div>
    </div>

    <div class="card mt-3">
      <div class="card-header" style="margin-bottom:12px">
        <div class="card-title">${ic('zap',18)} Utilities</div>
      </div>
      <div class="utility-list">
        ${Object.entries(mi.utilities).map(([key, u]) => {
          const iconName = key === 'electric' ? 'zap' : 'wifi';
          const label    = key === 'electric' ? 'Electric' : 'Internet';
          const cls      = key === 'electric' ? 'electric' : 'internet';
          return `
            <div class="utility-row ${u.status !== 'not_started' ? 'utility-row--active' : ''}">
              <div class="utility-icon utility-icon--${cls}">${ic(iconName,22)}</div>
              <div class="utility-info">
                <div class="utility-name">${label}</div>
                <div class="utility-detail">${u.provider || 'Not configured'}${u.accountNum?' · '+u.accountNum:u.scheduledDate?' · Install: '+u.scheduledDate:''}</div>
              </div>
              ${badge(utStatusLabel(u.status), utStatusCls(u.status))}
            </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

function renderMovingInCOI() {
  const coi = state.movingin.coi;
  return `
    <div class="page-header">
      <div class="page-title">Certificate of Insurance</div>
      <div class="page-subtitle">Required before elevator booking becomes available</div>
    </div>
    <div class="info-banner info-banner--blue mb-4">
      ${ic('info',16)} <span><strong>Why is this required?</strong> COI protects the building from liability during your move. Our team verifies coverage amounts and that the building is listed as additional insured.</span>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="card-title">${ic('file-text',18)} Uploaded Document</div>
        ${badge('Under Review','yellow')}
      </div>
      <div class="file-card mb-4">
        <div class="file-card-icon">${ic('file-text',22)}</div>
        <div style="flex:1">
          <div class="file-card-name">${coi.fileName}</div>
          <div class="file-card-meta">Uploaded ${coi.uploadedAt}</div>
        </div>
        <button class="btn btn--ghost btn--sm">${ic('download',14)} Download</button>
      </div>
      <div class="card-title mb-3">${ic('clock',18)} Review Status</div>
      <div class="review-timeline">
        ${[
          { done:true,  active:false, title:'Document received',           sub:'Mar 22, 2026 · 10:14am' },
          { done:false, active:true,  title:'Under review by management',  sub:'Assigned to Maya Bennett · Est. Mar 24' },
          { done:false, active:false, title:'Approval & notification',     sub:'You\'ll receive an email once approved' },
        ].map(t => `
          <div class="timeline-item">
            <div class="timeline-dot ${t.done ? 'timeline-dot--done' : t.active ? 'timeline-dot--active' : 'timeline-dot--future'}"></div>
            <div>
              <div class="font-600" style="${!t.done && !t.active ? 'color:var(--text-3)' : ''}">${t.title}</div>
              <div class="text-sm text-muted mt-1">${t.sub}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>
    <div class="card mt-3">
      <div class="card-title mb-3">${ic('shield-check',18)} COI Requirements Checklist</div>
      ${[
        ['General Liability',   '$1,000,000 per occurrence'],
        ['Property Damage',     '$500,000 minimum'],
        ['Additional Insured',  'The Meridian Building LLC must be listed'],
        ['Coverage Dates',      'Policy must be active on Mar 28, 2026'],
      ].map(([req, val]) => `
        <div class="checklist-item checklist-item--done" style="padding:10px 14px;margin-bottom:6px">
          <div class="check-icon check-icon--done">${ic('check',12)}</div>
          <div><div class="check-label">${req}</div><div class="check-sublabel">${val}</div></div>
        </div>`).join('')}
    </div>
  `;
}

function renderMovingInElevator() {
  const eb  = state.elevatorBooking;
  const mi  = state.movingin;
  const coiApproved = state.coiApprovals[mi.unit] === 'approved';

  const DATE_AV = {
    24:[true,true,true], 25:[false,true,true], 27:[true,true,true],
    28:[true,false,true], 29:[true,true,true], 30:[true,true,false],
  };
  const av = DATE_AV[eb.selectedDate] || [true,true,true];
  const SLOTS_3H = [
    { id:'s1', time:'8am – 11am', taken:!av[0] },
    { id:'s2', time:'11am – 2pm', taken:!av[1] },
    { id:'s3', time:'2pm – 5pm',  taken:!av[2] },
  ];
  const SLOTS_6H = [
    { id:'l1', time:'8am – 2pm',  taken:!av[0]||!av[1] },
    { id:'l2', time:'11am – 5pm', taken:!av[1]||!av[2] },
  ];
  const KEY_SLOTS = [
    { id:'k1', day:'Day Before · Mar 27', time:'2:00pm' },
    { id:'k2', day:'Day Before · Mar 27', time:'4:00pm' },
    { id:'k3', day:'Move-In Day · Mar 28', time:'7:30am' },
    { id:'k4', day:'Move-In Day · Mar 28', time:'8:00am' },
  ];
  const PARKING = [
    { id:'za', label:'Loading Zone A', sub:'4 spots · South entrance',    available:true  },
    { id:'zb', label:'Loading Zone B', sub:'2 spots · Main entrance',     available:true  },
    { id:'zc', label:'Loading Zone C', sub:'Currently reserved',          available:false },
    { id:'st', label:'Street Permit',  sub:'Free 4-hour permit from office', available:true },
  ];
  const SLOT_LABELS = { s1:'8am–11am', s2:'11am–2pm', s3:'2pm–5pm', l1:'8am–2pm', l2:'11am–5pm' };
  const KEY_LABELS  = { k1:'Mar 27 · 2:00pm', k2:'Mar 27 · 4:00pm', k3:'Mar 28 · 7:30am', k4:'Mar 28 · 8:00am' };
  const PARK_LABELS = { za:'Loading Zone A', zb:'Loading Zone B', st:'Street Permit' };

  const stepLabels = ['Checklist','Date','Time','Add-ons','Confirm'];
  const stepper = `
    <div class="stepper">
      ${stepLabels.map((l, i) => `
        <div class="step ${i < eb.step ? 'step--done' : i === eb.step ? 'step--active' : ''}">
          <div class="step-num">${i < eb.step ? ic('check',11) : i+1}</div>
          <div class="step-label">${l}</div>
        </div>`).join('')}
    </div>`;

  let body = '';

  if (eb.step === 0) {
    const allReqDone = BOOKING_CHECKLIST.filter(i=>i.required).every(i=>i.check(state));
    body = `
      <div class="card-title mb-4">${ic('list-checks',18)} Eligibility Checklist</div>
      ${!coiApproved ? `
        <div class="info-banner info-banner--yellow mb-4">
          ${ic('clock',16)} <span><strong>COI pending staff review.</strong> Your building manager must approve it before you can book. Switch to the Staff tab → COI Review to simulate approval.</span>
        </div>` : `
        <div class="info-banner info-banner--green mb-4">
          ${ic('check-circle',16)} <span><strong>COI approved.</strong> All required items are cleared — you can proceed to book.</span>
        </div>`}
      <div class="checklist mb-4">
        ${BOOKING_CHECKLIST.map(item => {
          const ok = item.check(state);
          return `
            <div class="checklist-item ${ok ? 'checklist-item--done' : ''}">
              <div class="check-icon ${ok ? 'check-icon--done' : ''}">${ok ? ic('check',12) : ''}</div>
              <div style="flex:1"><div class="check-label">${item.label}</div></div>
              <span class="req-tag req-tag--${item.required ? 'required' : 'optional'}">${item.required ? 'Required' : 'Optional'}</span>
            </div>`;
        }).join('')}
      </div>
      <div class="info-banner info-banner--blue mb-4">
        ${ic('info',16)} <span><strong>Choosing your window:</strong> 3 hours is enough for a 1–2BR move. For 3BR+ or large furniture, pick a 6-hour block.</span>
      </div>
      <button class="btn btn--primary" ${allReqDone ? '' : 'disabled'} onclick="bookingNext()">
        ${ic('arrow-right',15)} Proceed to Date Selection
      </button>`;

  } else if (eb.step === 1) {
    const dates = [24,25,26,27,28,29,30].map((d, i) => ({
      d, dow:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
      myDate: d === 28, disabled: d === 26
    }));
    body = `
      <div class="card-title mb-4">${ic('calendar',18)} Select Move-In Date</div>
      <div class="date-grid mb-4">
        ${dates.map(dt => `
          <button class="date-btn ${dt.disabled?'date-btn--disabled':''} ${dt.myDate&&eb.selectedDate!==dt.d?'date-btn--booked':''} ${eb.selectedDate===dt.d?'date-btn--selected':''}"
            onclick="${dt.disabled?'':'selectBookingDate('+dt.d+')'}" ${dt.disabled?'disabled':''}>
            <span class="date-btn-dow">${dt.dow}</span>
            <span class="date-btn-day">${dt.d}</span>
            <span style="font-size:9px;margin-top:2px;font-weight:700;color:var(--text-3)">Mar</span>
            ${dt.myDate?'<span style="font-size:9px;color:var(--green);font-weight:800">My Date</span>':''}
          </button>`).join('')}
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn--ghost" onclick="bookingBack()">${ic('arrow-left',15)} Back</button>
        <button class="btn btn--primary" ${eb.selectedDate?'':'disabled'} onclick="bookingNext()">${ic('arrow-right',15)} Choose Time</button>
      </div>`;

  } else if (eb.step === 2) {
    const slots = eb.selectedDuration === '6h' ? SLOTS_6H : SLOTS_3H;
    body = `
      <div class="card-title mb-4">${ic('clock',18)} Duration & Time — Mar ${eb.selectedDate||28}</div>
      <div class="mb-4">
        <div style="font-size:12.5px;font-weight:600;color:var(--text-2);margin-bottom:8px">Elevator window</div>
        <div style="display:flex;gap:8px;margin-bottom:${eb.selectedDuration==='6h'?'10':'0'}px">
          <button class="btn ${eb.selectedDuration==='3h'?'btn--primary':'btn--secondary'}" onclick="selectDuration('3h')">${ic('clock',15)} 3 Hours</button>
          <button class="btn ${eb.selectedDuration==='6h'?'btn--primary':'btn--secondary'}" onclick="selectDuration('6h')">${ic('timer',15)} 6 Hours</button>
        </div>
        ${eb.selectedDuration==='6h'?`<div class="info-banner info-banner--blue mt-3">${ic('info',14)} <span>Recommended for 3BR+ units or large furniture. Includes the full morning or afternoon block.</span></div>`:''}
      </div>
      ${eb.selectedDuration?(()=>{
        const allTaken = slots.every(s=>s.taken);
        return `
        <div class="mb-4">
          <div style="font-size:12.5px;font-weight:600;color:var(--text-2);margin-bottom:8px">Available slots</div>
          ${allTaken
            ? `<div class="info-banner info-banner--red" style="background:var(--red-bg);border:1px solid rgba(239,68,68,0.25);color:var(--text-2)">
                ${ic('calendar-x',16)} <span><strong style="color:var(--red)">No ${eb.selectedDuration} slots available on this date.</strong> Select a different date or switch to ${eb.selectedDuration==='6h'?'3-hour':'6-hour'} windows.</span>
               </div>`
            : `<div class="slot-grid">
                ${slots.map(slot=>`
                  <button class="slot-btn ${slot.taken?'slot-btn--taken':''} ${eb.selectedSlot===slot.id?'slot-btn--selected':''}"
                    onclick="${slot.taken?'':'selectBookingSlot(\''+slot.id+'\')'}" ${slot.taken?'disabled':''}>
                    <span class="slot-time">${slot.time}</span>
                    <span class="slot-duration">${eb.selectedDuration}</span>
                    <span style="font-size:10px;font-weight:600;${slot.taken?'color:var(--red)':'color:var(--green)'}">${slot.taken?'Taken':'Available'}</span>
                  </button>`).join('')}
               </div>`}
        </div>`;
      })():''}
      <div style="display:flex;gap:10px">
        <button class="btn btn--ghost" onclick="bookingBack()">${ic('arrow-left',15)} Back</button>
        <button class="btn btn--primary" ${eb.selectedSlot?'':'disabled'} onclick="bookingNext()">${ic('arrow-right',15)} Add-ons</button>
      </div>`;

  } else if (eb.step === 3) {
    body = `
      <div class="card-title mb-4">${ic('plus-circle',18)} Optional Add-ons</div>

      <div class="mb-5">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div>
            <div style="font-size:14px;font-weight:700;display:flex;align-items:center;gap:6px">${ic('key',15)} Key Pickup</div>
            <div style="font-size:12px;color:var(--text-2);margin-top:3px">Schedule when to collect your keys from the concierge</div>
          </div>
          <span class="badge badge--gray">Optional</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${KEY_SLOTS.map(k=>`
            <button class="slot-btn ${eb.keyPickupSlot===k.id?'slot-btn--selected':''}" style="align-items:flex-start;padding:12px;gap:3px"
              onclick="selectKeySlot('${k.id}')">
              <span style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.4px">${k.day}</span>
              <span class="slot-time" style="font-size:15px">${k.time}</span>
              <span style="font-size:11px;color:var(--text-2)">Concierge Desk</span>
            </button>`).join('')}
        </div>
      </div>

      <div class="mb-5">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div>
            <div style="font-size:14px;font-weight:700;display:flex;align-items:center;gap:6px">${ic('truck',15)} Moving Truck Parking</div>
            <div style="font-size:12px;color:var(--text-2);margin-top:3px">Reserve a loading zone for your moving truck</div>
          </div>
          <span class="badge badge--gray">Optional</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${PARKING.map(p=>`
            <button class="slot-btn ${!p.available?'slot-btn--taken':''} ${eb.parkingSlot===p.id?'slot-btn--selected':''}" style="align-items:flex-start;padding:12px;gap:3px"
              onclick="${p.available?'selectParking(\''+p.id+'\')':''}" ${!p.available?'disabled':''}>
              <span class="slot-time" style="font-size:13px">${p.label}</span>
              <span style="font-size:11px;color:${p.available?'var(--text-2)':'var(--red)'}">${p.sub}</span>
            </button>`).join('')}
        </div>
      </div>

      <div style="display:flex;gap:10px">
        <button class="btn btn--ghost" onclick="bookingBack()">${ic('arrow-left',15)} Back</button>
        <button class="btn btn--primary" onclick="confirmElevatorBooking()">${ic('check',15)} Confirm Booking</button>
      </div>`;

  } else {
    body = `
      <div class="confirm-box mb-4">
        <div class="confirm-icon">${ic('check-circle',28)}</div>
        <div style="font-size:20px;font-weight:800;margin-bottom:6px">All Set!</div>
        <div style="color:var(--text-2);font-size:13.5px">Your move-in day is fully planned.</div>
      </div>
      <div class="booking-detail-list mb-4">
        <div class="booking-detail-row">${ic('hash',16)} <span>Confirmation #</span><strong>${mi.elevator.confirmNum||'ELV-2847'}</strong></div>
        <div class="booking-detail-row">${ic('building-2',16)} <span>Building</span><strong>${mi.building}</strong></div>
        <div class="booking-detail-row">${ic('map-pin',16)} <span>Unit</span><strong>${mi.unit} · Floor ${mi.floor}</strong></div>
        <div class="booking-detail-row">${ic('calendar',16)} <span>Date</span><strong>March ${eb.selectedDate||28}, 2026</strong></div>
        <div class="booking-detail-row">${ic('clock',16)} <span>Elevator</span><strong>${SLOT_LABELS[eb.selectedSlot]||'8am–11am'} · ${eb.selectedDuration||'3h'}</strong></div>
        <div class="booking-detail-row">${ic('arrow-up-down',16)} <span>Service Elevator</span><strong>Elevator B — Floor ${mi.floor} reserved</strong></div>
        ${eb.keyPickupSlot?`<div class="booking-detail-row">${ic('key',16)} <span>Key Pickup</span><strong>${KEY_LABELS[eb.keyPickupSlot]}</strong></div>`:''}
        ${eb.parkingSlot?`<div class="booking-detail-row">${ic('truck',16)} <span>Truck Parking</span><strong>${PARK_LABELS[eb.parkingSlot]||eb.parkingSlot}</strong></div>`:''}
      </div>
      <div class="info-banner info-banner--blue">
        ${ic('info',16)} <span>Confirmation sent to your email. Arrive 10 min early to check in with the concierge.</span>
      </div>`;
  }

  return `
    <div class="page-header">
      <div class="page-title">Service Elevator Booking</div>
      <div class="page-subtitle">Reserve the service elevator for your move-in day</div>
    </div>
    <div class="card">${stepper}${body}</div>`;
}

function renderMovingInUtilities() {
  const ut = state.movingin.utilities;
  return `
    <div class="page-header">
      <div class="page-title">Utilities Setup</div>
      <div class="page-subtitle">Configure services for Unit ${state.movingin.unit}</div>
    </div>
    <div class="info-banner info-banner--blue mb-4">
      ${ic('info',16)} <span><strong>All-electric building.</strong> No gas service in this building — your stove, oven, and heating all run on electricity (NYC Local Law 154). Setup utilities at least 3 business days before move-in.</span>
    </div>
    <div class="utility-list mb-4">
      ${Object.entries(ut).map(([key, u]) => {
        const iconName = key === 'electric' ? 'zap' : 'wifi';
        const label    = key === 'electric' ? 'Electric' : 'Internet';
        const cls      = key === 'electric' ? 'electric' : 'internet';
        const statusCls   = { complete:'green', scheduled:'blue', in_progress:'yellow', not_started:'gray' }[u.status] || 'gray';
        const statusLabel = { complete:'Complete', scheduled:'Scheduled', in_progress:'In Progress', not_started:'Not Started' }[u.status] || u.status;
        return `
          <div class="utility-row ${u.status !== 'not_started' ? 'utility-row--active' : ''}">
            <div class="utility-icon utility-icon--${cls}">${ic(iconName,22)}</div>
            <div class="utility-info">
              <div class="utility-name">${label}</div>
              <div class="utility-detail">${u.provider||'Not configured'}${u.accountNum?' · '+u.accountNum:u.scheduledDate?' · Install: '+u.scheduledDate:''}</div>
            </div>
            ${badge(statusLabel, statusCls)}
          </div>`;
      }).join('')}
    </div>
    <div class="card">
      <div class="card-title mb-3">${ic('info',18)} Utilities at ${state.movingin.building}</div>
      <div class="flex-col gap-3">
        <div class="info-banner info-banner--yellow">
          ${ic('zap',16)} <span><strong>Electricity:</strong> ConEd manages local delivery infrastructure. You can stay with ConEd as your energy supplier or switch to an ESCO for a different rate. Delivery is the same either way.</span>
        </div>
        <div class="info-banner info-banner--blue">
          ${ic('wifi',16)} <span><strong>Internet:</strong> The building has pre-run fiber in every unit. Two providers are available: <strong>Xfinity</strong> and <strong>Verizon Fios</strong>. Book your installation 3–5 days before move-in.</span>
        </div>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════════════
   CURRENT RESIDENT SCREENS
══════════════════════════════════════════════════ */

function renderCurrentFeed() {
  const cr = state.current;
  const iconColor = { package:'blue', wrench:'orange', calendar:'accent', truck:'yellow', shield:'green' };

  return `
    <div class="page-header">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <div class="page-title">${ic('bell',22)} Notifications</div>
          <div class="page-subtitle">${cr.unreadCount > 0 ? `${cr.unreadCount} unread` : 'All caught up'}</div>
        </div>
        ${cr.unreadCount > 0 ? `<button class="btn btn--ghost btn--sm" onclick="markAllRead()">${ic('check-check',14)} Mark all read</button>` : ''}
      </div>
    </div>
    <div class="notif-list">
      ${cr.notifications.map(n => `
        <div class="notif-item ${n.read ? '' : 'notif-item--unread'}">
          <div class="notif-icon notif-icon--${iconColor[n.iconName] || 'accent'}">${ic(n.iconName,18)}</div>
          <div class="notif-content">
            <div class="notif-title">${n.title}</div>
            <div class="notif-body">${n.body}</div>
            <div class="notif-time">${ic('clock',11)} ${n.time}</div>
          </div>
          ${!n.read ? badge('New','accent') : ''}
        </div>`).join('')}
    </div>`;
}

function renderCurrentCalendar() {
  return `
    <div class="page-header">
      <div class="page-title">${ic('calendar',22)} Building Calendar</div>
      <div class="page-subtitle">Events, move-ins, and maintenance for The Meridian</div>
    </div>
    ${renderCalendar('view')}`;
}

function renderCurrentPayments() {
  const bills = state.current.payments.bills;
  const due   = bills.filter(b => b.status === 'due').reduce((s, b) => s + b.amount, 0);
  const upcoming = bills.filter(b => b.status === 'upcoming').reduce((s, b) => s + b.amount, 0);
  const statusLabel = { due:'Due Soon', paid:'Paid', upcoming:'Upcoming', overdue:'Overdue' };
  const statusCls   = { due:'yellow',  paid:'green',  upcoming:'gray',    overdue:'red' };

  return `
    <div class="page-header">
      <div class="page-title">${ic('credit-card',22)} Payments</div>
      <div class="page-subtitle">All charges for Unit ${state.current.unit}</div>
    </div>

    <div class="pay-summary">
      <div>
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;color:var(--text-2);margin-bottom:6px">Due This Month</div>
        <div class="pay-amount">${fmt$(due)}</div>
        <div class="pay-due-info">${ic('alert-triangle',12)} 2 bills pending · Due by Mar 28</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
        <button class="btn btn--primary btn--lg" onclick="alert('Payment processing would go here')">
          ${ic('credit-card',18)} Pay All Due — ${fmt$(due)}
        </button>
        <div style="font-size:12px;color:var(--text-2)">${fmt$(upcoming)} upcoming next month</div>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-header">
        <div class="card-title">${ic('receipt',18)} Monthly Charges</div>
      </div>
      <div class="pay-list">
        ${bills.map(bill => `
          <div class="pay-row pay-row--${bill.status}">
            <div class="pay-icon pay-icon--${bill.cls}">${ic(bill.iconName,22)}</div>
            <div class="pay-info">
              <div class="pay-name">${bill.label}</div>
              <div class="pay-provider">${ic('building-2',11)} ${bill.provider}</div>
            </div>
            <div class="pay-right">
              <div class="pay-amount-sm">${fmt$(bill.amount)}</div>
              <div class="pay-due-date">Due ${bill.due}</div>
              <div class="pay-auto">${bill.autoPay ? ic('repeat',10)+' Auto-pay on' : ic('alert-circle',10)+' Manual'}</div>
            </div>
            ${badge(statusLabel[bill.status], statusCls[bill.status])}
            ${bill.status === 'due' ? `<button class="btn btn--primary btn--sm" onclick="alert('Redirecting to payment…')">${ic('credit-card',13)} Pay</button>` : ''}
          </div>`).join('')}
      </div>
    </div>

    <div class="card">
      <div class="pay-history-title">${ic('clock',18)} Payment History — February 2026</div>
      <div class="pay-history-list">
        ${[
          { name:'Electric',          provider:'ConEd',        amount:87.30,  date:'Feb 25', auto:false },
          { name:'Internet & Cable',  provider:'Xfinity',      amount:69.99,  date:'Feb 28', auto:true  },
          { name:'Building Amenity',  provider:'The Meridian', amount:350.00, date:'Feb 1',  auto:true  },
          { name:'Parking — Spot 42', provider:'The Meridian', amount:275.00, date:'Feb 1',  auto:true  },
          { name:'Storage Unit S14',  provider:'The Meridian', amount:55.00,  date:'Feb 1',  auto:true  },
        ].map(h => `
          <div class="pay-history-row">
            ${ic('check-circle',14)}
            <span class="pay-history-name">${h.name} <span class="text-muted text-xs">· ${h.provider}</span></span>
            <span class="pay-history-amount">${fmt$(h.amount)}</span>
            <span class="pay-history-date">${h.date}${h.auto?' · Auto':''}</span>
          </div>`).join('')}
      </div>
    </div>`;
}

function renderCurrentSettings() {
  const prefs = state.current.prefs;
  return `
    <div class="page-header">
      <div class="page-title">${ic('settings',22)} Notification Preferences</div>
      <div class="page-subtitle">Control what you hear about for Unit ${state.current.unit}</div>
    </div>
    <div class="card">
      <div class="setting-group">
        <div class="setting-group-title">Move-In Activity</div>
        ${[
          { key:'myFloor',    label:'My Floor Activity',    sub:'Move-ins and move-outs on Floor '+state.current.floor },
          { key:'adjFloor',   label:'Adjacent Floors',      sub:'Activity on floors 13 and 15' },
          { key:'allBuilding',label:'All Building Activity', sub:'All move-ins and major events building-wide' },
        ].map(s => `
          <div class="setting-row">
            <div class="setting-info"><div class="setting-label">${s.label}</div><div class="setting-sub">${s.sub}</div></div>
            <button class="toggle ${prefs[s.key]?'toggle--on':''}" onclick="togglePref('${s.key}')"></button>
          </div>`).join('')}
      </div>
      <div class="setting-group">
        <div class="setting-group-title">Building Alerts</div>
        ${[
          { key:'maintenance', label:'Maintenance Notices', sub:'HVAC, elevators, utilities outages' },
          { key:'events',      label:'Building Events',     sub:'Social events, amenity bookings, community news' },
        ].map(s => `
          <div class="setting-row">
            <div class="setting-info"><div class="setting-label">${s.label}</div><div class="setting-sub">${s.sub}</div></div>
            <button class="toggle ${prefs[s.key]?'toggle--on':''}" onclick="togglePref('${s.key}')"></button>
          </div>`).join('')}
      </div>
    </div>`;
}

/* ══════════════════════════════════════════════════
   BUILDING VISUALIZATION
══════════════════════════════════════════════════ */

function renderBuildingView(roleCtx) {
  roleCtx = roleCtx || state.role;
  const myUnit  = roleCtx === 'movingin' ? state.movingin.unit  : roleCtx === 'current' ? state.current.unit  : null;
  const myFloor = roleCtx === 'movingin' ? state.movingin.floor : roleCtx === 'current' ? state.current.floor : null;
  const selected = state.buildingState.selectedFloor;

  // Total unit count
  let totalUnits = 0;
  for (let f = 1; f <= 24; f++) totalUnits += getFloorLetters(f).length;

  // Build floor rows top-to-bottom (24 down to 1)
  const facadeRows = [];
  for (let f = 24; f >= 1; f--) {
    const letters = getFloorLetters(f);
    const isPH    = f >= 23;
    const units   = BUILDING_FLOORS[f] || {};
    const windows = letters.map(l => {
      const uid = `${f}${l}`;
      const u   = units[uid];
      if (!u) return isPH ? 'ph-vacant' : 'vacant';
      if (myUnit === uid) return 'you';
      if (isPH) return u.status === 'occupied' ? 'ph' : 'ph-vacant';
      return u.status === 'moving-in' ? 'moving-in' : u.status === 'occupied' ? 'occupied' : 'vacant';
    });
    facadeRows.push({ f, windows, isMine: f === myFloor, isPH });
  }

  const legend = `
    <div class="bv-legend">
      <div class="bv-legend-item"><div class="bv-legend-dot bv-legend-dot--occupied"></div>Occupied</div>
      <div class="bv-legend-item"><div class="bv-legend-dot bv-legend-dot--vacant"></div>Vacant</div>
      <div class="bv-legend-item"><div class="bv-legend-dot bv-legend-dot--moving-in"></div>Moving In</div>
      <div class="bv-legend-item"><div class="bv-legend-dot bv-legend-dot--ph"></div>Penthouse</div>
      ${myUnit ? '<div class="bv-legend-item"><div class="bv-legend-dot bv-legend-dot--you"></div>Your Unit</div>' : ''}
    </div>`;

  const facade = `
    <div class="bv-facade-panel">
      <div class="bv-penthouse">
        <div class="bv-penthouse-label">The Meridian</div>
        <div class="bv-building-name">24 Floors · ${totalUnits} Units</div>
      </div>
      <div class="bv-floors-list">
        ${facadeRows.map(row => `
          <div class="bv-floor ${row.isPH?'bv-floor--ph':''} ${selected===row.f?'bv-floor--selected':''} ${row.isMine&&selected!==row.f?'bv-floor--mine':''}"
               onclick="selectBuildingFloor(${row.f})">
            <span class="bv-floor-num ${row.isPH?'bv-floor-num--ph':''}">${row.f===24?'PH':row.f===23?'23':row.f}</span>
            <div class="bv-windows">${row.windows.map(w=>`<div class="bv-win bv-win--${w}"></div>`).join('')}</div>
            ${row.isMine ? '<span class="bv-floor-tag">You</span>' : row.isPH ? '<span class="bv-floor-tag bv-floor-tag--ph">PH</span>' : ''}
          </div>`).join('')}
      </div>
      <div class="bv-entrance"><div class="bv-entrance-label">Entrance</div></div>
    </div>`;

  // Detail panel
  let detail = '';
  if (!selected) {
    let occ = 0, vac = 0, mov = 0;
    for (let f = 1; f <= 24; f++) {
      getFloorLetters(f).forEach(l => {
        const u = (BUILDING_FLOORS[f]||{})[`${f}${l}`];
        if (!u) return;
        if (u.status === 'occupied') occ++;
        else if (u.status === 'moving-in') mov++;
        else vac++;
      });
    }
    const pct = Math.round(occ / (occ+vac+mov) * 100);
    detail = `
      <div class="bv-overview">
        <div style="color:var(--text-3);margin-bottom:14px">${ic('mouse-pointer-2',22)}</div>
        <div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:6px">Select a Floor</div>
        <div style="font-size:13px;color:var(--text-2);margin-bottom:24px">Click any floor on the facade to explore its units</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:340px;margin:0 auto;text-align:center">
          <div style="background:var(--surface);border:1px solid rgba(99,102,241,0.3);border-radius:var(--radius);padding:14px">
            <div style="font-size:28px;font-weight:800;color:var(--accent-h)">${occ}</div>
            <div style="font-size:11px;color:var(--text-2);margin-top:2px">Occupied</div>
          </div>
          <div style="background:var(--surface);border:1px solid rgba(245,158,11,0.25);border-radius:var(--radius);padding:14px">
            <div style="font-size:28px;font-weight:800;color:var(--yellow)">${mov}</div>
            <div style="font-size:11px;color:var(--text-2);margin-top:2px">Moving In</div>
          </div>
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px">
            <div style="font-size:28px;font-weight:800;color:var(--text)">${pct}%</div>
            <div style="font-size:11px;color:var(--text-2);margin-top:2px">Occupancy</div>
          </div>
        </div>
      </div>`;
  } else {
    const floorLetters = getFloorLetters(selected);
    const floorUnits   = BUILDING_FLOORS[selected] || {};
    const isMyFloor    = selected === myFloor;
    const canSeeName   = roleCtx === 'staff' || isMyFloor;
    const isPH         = selected >= 23;
    const floorTitle   = selected === 24 ? 'Penthouse' : selected === 23 ? 'Floor 23 — Penthouse Level' : `Floor ${selected}`;

    const unitCards = floorLetters.map(l => {
      const uid     = `${selected}${l}`;
      const u       = floorUnits[uid] || { status:'vacant', name:null };
      const isMe    = myUnit === uid;
      const dispId  = selected === 24 ? 'Penthouse' : selected === 23 ? `PH-${l}` : uid;

      let displayName = '';
      if (isMe) displayName = roleCtx === 'movingin' ? state.movingin.name : state.current.name;
      else if (canSeeName && u.name) displayName = u.name;
      else if (u.status === 'occupied') displayName = isPH ? 'Resident' : 'Resident';

      const subText = isMe ? (roleCtx === 'movingin' ? 'Moving in Mar 28' : `Floor ${myFloor}`) :
        u.status === 'moving-in' ? `Moving in ${u.moveIn||'soon'}` :
        (roleCtx === 'staff' && u.since) ? `Since ${u.since}` :
        u.status === 'vacant' ? 'Available' : '';

      const cardCls = isMe ? 'you' : u.status;

      return `
        <div class="bv-unit-card bv-unit-card--${cardCls} ${isPH?'bv-unit-card--ph':''}">
          <div class="bv-unit-num" style="${isPH?'font-size:16px':''}"> ${dispId}</div>
          <div class="bv-unit-name">${displayName || (u.status==='vacant'?'Vacant':'—')}</div>
          <div class="bv-unit-sub">
            ${badge(u.status==='occupied'?'Occupied':u.status==='moving-in'?'Moving In':'Vacant', u.status==='occupied'?'accent':u.status==='moving-in'?'yellow':'gray')}
            ${subText ? `<div style="margin-top:5px;font-size:11px;color:var(--text-2)">${subText}</div>` : ''}
          </div>
        </div>`;
    }).join('');

    const complaintHtml = (roleCtx === 'current' || roleCtx === 'movingin') ? renderComplaintSection(selected) : '';
    const cols = floorLetters.length <= 2 ? floorLetters.length : floorLetters.length <= 4 ? 2 : 3;

    detail = `
      <div class="bv-detail-header">
        <div>
          <div class="bv-detail-title">${floorTitle}</div>
          <div style="color:var(--text-2);font-size:13px;margin-top:2px">${isMyFloor?'Your floor · ':''}${floorLetters.length} unit${floorLetters.length!==1?'s':''}${roleCtx!=='staff'&&!isMyFloor&&!isPH?' · Names hidden for privacy':''}</div>
        </div>
        <button class="btn btn--ghost btn--sm" onclick="selectBuildingFloor(${selected})">${ic('x',13)} Close</button>
      </div>
      <div class="bv-unit-grid" style="grid-template-columns:repeat(${cols},1fr)">${unitCards}</div>
      ${complaintHtml}`;
  }

  return `
    <div class="page-header">
      <div class="page-title">${ic('building-2',22)} Building Map</div>
      <div class="page-subtitle">The Meridian — Interactive floor & unit visualization</div>
    </div>
    ${legend}
    <div class="bv-wrap">
      ${facade}
      <div class="bv-detail-panel">${detail}</div>
    </div>`;
}

function renderComplaintSection(floor) {
  const bs = state.buildingState;
  if (bs.complaintSent) {
    return `
      <div class="info-banner info-banner--green mt-4">
        ${ic('check-circle',16)} <span><strong>Issue reported!</strong> Building management will respond within 1–2 business days. Reference #REP-${floor}-${Math.floor(seededFloat(floor)*9000+1000)}</span>
      </div>`;
  }
  if (bs.showComplaint) {
    return `
      <div class="card mt-4">
        <div class="card-title mb-3">${ic('flag',18)} Report an Issue</div>
        <div class="complaint-form">
          <div><div class="form-label">Issue Type</div>
            <select class="form-select">
              <option>Noise Complaint</option><option>Maintenance Request</option>
              <option>Elevator Issue</option><option>Common Area Problem</option>
              <option>Package / Delivery Issue</option><option>Other</option>
            </select></div>
          <div><div class="form-label">Location</div>
            <select class="form-select">
              <option>Floor ${floor} — Common Area</option>
              <option>My Unit (${state.current.unit || state.movingin.unit})</option>
              <option>Hallway / Corridor</option><option>Elevator</option><option>Lobby</option>
            </select></div>
          <div><div class="form-label">Description</div>
            <textarea class="form-textarea" placeholder="Describe the issue in detail…"></textarea></div>
          <div style="display:flex;gap:8px">
            <button class="btn btn--primary" onclick="submitComplaint()">${ic('send',14)} Submit</button>
            <button class="btn btn--ghost" onclick="cancelComplaint()">${ic('x',14)} Cancel</button>
          </div>
        </div>
      </div>`;
  }
  return `
    <div class="mt-4">
      <button class="btn btn--ghost" onclick="showComplaintForm()">${ic('flag',15)} Report an Issue</button>
    </div>`;
}

/* ══════════════════════════════════════════════════
   STAFF SCREENS
══════════════════════════════════════════════════ */

function renderStaffDashboard() {
  return `
    <div class="page-header">
      <div class="page-title">${ic('layout-dashboard',22)} Operations Dashboard</div>
      <div class="page-subtitle">The Meridian · ${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>
    </div>
    <div class="stats-grid">
      <div class="stat-card stat-card--accent">
        <div class="stat-icon stat-icon--accent">${ic('package',18)}</div>
        <div class="stat-value" style="color:var(--accent-h)">6</div>
        <div class="stat-label">Move-ins this month</div>
      </div>
      <div class="stat-card stat-card--yellow">
        <div class="stat-icon stat-icon--yellow">${ic('file-text',18)}</div>
        <div class="stat-value" style="color:var(--yellow)">3</div>
        <div class="stat-label">COI reviews pending</div>
      </div>
      <div class="stat-card stat-card--green">
        <div class="stat-icon stat-icon--green">${ic('users',18)}</div>
        <div class="stat-value" style="color:var(--green)">112</div>
        <div class="stat-label">Occupied units</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--blue">${ic('door-open',18)}</div>
        <div class="stat-value">14</div>
        <div class="stat-label">Vacant units</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="card">
        <div class="card-title mb-3">${ic('calendar',18)} Upcoming Move-Ins</div>
        ${[
          { date:'Mar 25', unit:'7A',  name:'Maria Santos',  ok:true  },
          { date:'Mar 26', unit:'11F', name:'James Lee',     ok:false },
          { date:'Mar 28', unit:'14B', name:'Alex Johnson',  ok:true  },
          { date:'Mar 28', unit:'3B',  name:'Chris Park',    ok:true  },
          { date:'Mar 30', unit:'22C', name:'David Kim',     ok:true  },
        ].map(m => `
          <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-2)">
            <div style="width:42px;text-align:center">
              <div style="font-size:10px;color:var(--text-3);font-weight:700;text-transform:uppercase">${m.date.split(' ')[0]}</div>
              <div style="font-size:18px;font-weight:800;color:var(--text);line-height:1">${m.date.split(' ')[1]}</div>
            </div>
            <div style="flex:1"><div style="font-weight:600;font-size:13.5px">${m.name}</div><div style="font-size:12px;color:var(--text-2)">Unit ${m.unit}</div></div>
            ${badge(m.ok ? 'Confirmed' : 'Awaiting COI', m.ok ? 'green' : 'yellow')}
          </div>`).join('')}
      </div>
      <div class="card">
        <div class="card-title mb-3">${ic('shield',18)} Recent COI Activity</div>
        ${[
          { name:'Alex Johnson',  unit:'14B', label:'Under Review', cls:'yellow' },
          { name:'Maria Santos',  unit:'7A',  label:'Approved',     cls:'green'  },
          { name:'Chris Park',    unit:'3B',  label:'Approved',     cls:'green'  },
          { name:'James Lee',     unit:'11F', label:'Not Uploaded', cls:'gray'   },
          { name:'David Kim',     unit:'22C', label:'Under Review', cls:'yellow' },
        ].map(c => `
          <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-2)">
            <div class="avatar avatar--indigo" style="width:28px;height:28px;font-size:10px">${c.name.split(' ').map(n=>n[0]).join('')}</div>
            <div style="flex:1"><div style="font-weight:600;font-size:13px">${c.name}</div><div style="font-size:11.5px;color:var(--text-2)">Unit ${c.unit}</div></div>
            ${badge(c.label, c.cls)}
          </div>`).join('')}
      </div>
    </div>`;
}

function renderStaffCOI() {
  return `
    <div class="page-header">
      <div class="page-title">${ic('file-check',22)} COI Review</div>
      <div class="page-subtitle">3 documents awaiting review</div>
    </div>
    <div class="coi-table">
      ${[
        { name:'Alex Johnson', unit:'14B', floor:14, uploaded:'Mar 22', file:'COI_Alex_Johnson_2026.pdf'  },
        { name:'David Kim',    unit:'22C', floor:22, uploaded:'Mar 22', file:'Insurance_DK_March2026.pdf' },
        { name:'James Lee',    unit:'11F', floor:11, uploaded:null,     file:null                         },
      ].map(c => {
        const approval = state.coiApprovals[c.unit];
        return `
        <div class="coi-row ${!approval && c.file ? 'coi-row--pending' : ''}">
          <div class="avatar avatar--indigo">${c.name.split(' ').map(n=>n[0]).join('')}</div>
          <div class="coi-resident" style="flex:1">
            <div class="coi-resident-name">${c.name}</div>
            <div class="coi-resident-unit">Unit ${c.unit} · Floor ${c.floor}</div>
          </div>
          ${c.file ? `
            <div style="flex:1;min-width:0">
              <div style="font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.file}</div>
              <div style="font-size:11.5px;color:var(--text-2)">Uploaded ${c.uploaded}</div>
            </div>
            ${approval === 'approved' ? badge('Approved','green') :
              approval === 'rejected' ? badge('Rejected','red') :
              `<div class="action-row">
                <button class="btn btn--green btn--sm" onclick="approveCoI('${c.unit}')">${ic('check',13)} Approve</button>
                <button class="btn btn--danger btn--sm" onclick="rejectCoI('${c.unit}')">${ic('x',13)} Reject</button>
                <button class="btn btn--ghost btn--sm">${ic('download',13)}</button>
              </div>`}` :
            `<div style="font-size:12.5px;color:var(--text-3);flex:1">No document uploaded yet</div>
             ${badge('Awaiting Upload','gray')}`}
        </div>`;
      }).join('')}
    </div>
    <div class="card mt-4">
      <div class="card-title mb-3">${ic('check-circle',18)} Recently Approved</div>
      ${[
        { name:'Maria Santos', unit:'7A', date:'Mar 21' },
        { name:'Chris Park',   unit:'3B', date:'Mar 20' },
        { name:'Emma Wilson',  unit:'5D', date:'Mar 19' },
      ].map(c => `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-2)">
          <div class="avatar avatar--green" style="width:28px;height:28px;font-size:10px">${c.name.split(' ').map(n=>n[0]).join('')}</div>
          <div style="flex:1"><div style="font-weight:600;font-size:13px">${c.name} · Unit ${c.unit}</div><div style="font-size:11.5px;color:var(--text-2)">Approved ${c.date}</div></div>
          ${badge('Approved','green')}
        </div>`).join('')}
    </div>`;
}

function renderStaffSchedule() {
  return `
    <div class="page-header">
      <div class="page-title">${ic('calendar',22)} Move-In Schedule</div>
      <div class="page-subtitle">Service elevator reservations for March 2026</div>
    </div>
    ${renderCalendar('staff')}`;
}

function renderStaffResidents() {
  const occupied = [];
  for (let f = 24; f >= 1; f--) {
    getFloorLetters(f).forEach(l => {
      const uid = `${f}${l}`;
      const u   = (BUILDING_FLOORS[f]||{})[uid];
      if (u && u.name) occupied.push({ uid, floor:f, ...u });
    });
  }
  const shown = occupied.slice(0, 24);

  return `
    <div class="page-header">
      <div class="page-title">${ic('users',22)} Residents</div>
      <div class="page-subtitle">${occupied.length} total · Showing ${shown.length}</div>
    </div>
    <div class="resident-table">
      ${shown.map(r => `
        <div class="resident-row">
          <div class="avatar avatar--indigo" style="width:34px;height:34px;font-size:11px">${r.name.split(' ').map(n=>n[0]).join('')}</div>
          <div class="resident-info">
            <div class="resident-name">${r.name}</div>
            <div class="resident-unit">Unit ${r.uid} · Floor ${r.floor}${r.since?' · Since '+r.since:''}</div>
          </div>
          <div class="resident-badges">
            ${badge(r.status==='moving-in'?'Moving In '+r.moveIn:'Occupied', r.status==='moving-in'?'yellow':'accent')}
            ${r.status==='moving-in'?badge('COI Pending','gray'):badge('COI OK','green')}
          </div>
        </div>`).join('')}
    </div>`;
}

/* ══════════════════════════════════════════════════
   CALENDAR COMPONENT
══════════════════════════════════════════════════ */

function renderCalendar(mode) {
  const cs = state.calendarState;
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const titleStr = cs.view === 'month' ? `${MONTHS[cs.month-1]} ${cs.year}` :
                   cs.view === 'week'  ? `Mar ${cs.weekStart}–${cs.weekStart+6}, ${cs.year}` :
                   `Mar ${cs.selectedDay||28}, ${cs.year}`;

  const header = `
    <div class="cal-header">
      <div class="cal-nav-group">
        <button class="cal-nav-btn" onclick="calPrev()">${ic('chevron-left',14)}</button>
        <button class="cal-nav-btn" onclick="calNext()">${ic('chevron-right',14)}</button>
      </div>
      <div style="font-size:16px;font-weight:800;color:var(--text)">${titleStr}</div>
      <div class="view-tabs">
        ${['month','week','day'].map(v=>`<button class="view-tab ${cs.view===v?'view-tab--active':''}" onclick="setCalView('${v}')">${v[0].toUpperCase()+v.slice(1)}</button>`).join('')}
      </div>
    </div>`;

  const body = cs.view === 'month' ? renderMonthView() : cs.view === 'week' ? renderWeekView() : renderDayView();
  return header + body;
}

function renderMonthView() {
  const cs = state.calendarState;
  const DOWS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const firstDow = new Date(cs.year, cs.month-1, 1).getDay();
  const pad = (firstDow + 6) % 7;
  const days = new Date(cs.year, cs.month, 0).getDate();
  const cells = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return `
    <div class="cal-dow-header">${DOWS.map(d=>`<div class="cal-dow">${d}</div>`).join('')}</div>
    <div class="cal-month-grid">
      ${cells.map(d => {
        if (!d) return `<div class="cal-day cal-day--other"></div>`;
        const key    = `${cs.year}-${String(cs.month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const events = BUILDING_EVENTS[key] || [];
        const today  = d === 28 && cs.month === 3;
        return `
          <div class="cal-day ${today?'cal-day--today':''}" onclick="selectDay(${d})">
            <div class="cal-day-num">${d}</div>
            ${events.map(e=>`<div class="cal-event cal-event--${e.color}">${e.title}</div>`).join('')}
          </div>`;
      }).join('')}
    </div>`;
}

function renderWeekView() {
  const cs   = state.calendarState;
  const ws   = cs.weekStart;
  const DOWS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const days = Array.from({length:7},(_,i) => ws + i);
  const HOURS= [8,9,10,11,12,13,14,15,16,17,18];

  const headerCells = days.map((d,i) => {
    const key  = `2026-03-${String(d).padStart(2,'0')}`;
    const has  = !!(BUILDING_EVENTS[key] && BUILDING_EVENTS[key].length);
    const today= d === 28;
    return `<div class="cal-week-day-header ${today?'cal-week-day-header--today':''} ${has&&!today?'cal-week-day-header--hasevents':''}">
      <div class="cal-week-day-name">${DOWS[i]}</div>
      <div class="cal-week-day-num">${d}</div>
    </div>`;
  }).join('');

  const rows = HOURS.map(h => `
    <tr>
      <td class="cal-week-time-cell">${h}:00</td>
      ${days.map(d => {
        const key    = `2026-03-${String(d).padStart(2,'0')}`;
        const events = (BUILDING_EVENTS[key]||[]).filter(e => e.timeH === h);
        return `<td class="cal-week-cell ${d===28?'cal-week-cell--today':''}">
          ${events.map(e=>`<div class="cal-week-event cal-event--${e.color}">${e.title}</div>`).join('')}
        </td>`;
      }).join('')}
    </tr>`).join('');

  return `
    <table class="cal-week-grid" cellspacing="0">
      <tr><td class="cal-week-time-header"></td>${headerCells}</tr>
      ${rows}
    </table>`;
}

function renderDayView() {
  const cs  = state.calendarState;
  const day = cs.selectedDay || 28;
  const key = `2026-03-${String(day).padStart(2,'0')}`;
  const evs = BUILDING_EVENTS[key] || [];
  const HOURS = [7,8,9,10,11,12,13,14,15,16,17,18,19];

  return `
    <div class="cal-day-view">
      ${HOURS.map(h => {
        const ev = evs.filter(e => e.timeH === h);
        return `
          <div class="cal-day-row">
            <div class="cal-day-time">${h}:00</div>
            <div class="cal-day-slot ${ev.length?'cal-day-slot--occupied':''}">
              ${ev.map(e=>`<div class="cal-day-event cal-event--${e.color}"><strong>${e.title}</strong> · ${e.desc} · ${e.time}</div>`).join('')}
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

/* ─── Render Entry Point ─── */
function render() {
  const fns = {
    movingin: {
      dashboard: renderMovingInDashboard,
      coi:       renderMovingInCOI,
      elevator:  renderMovingInElevator,
      utilities: renderMovingInUtilities,
      building:  () => renderBuildingView('movingin'),
    },
    current: {
      feed:     renderCurrentFeed,
      calendar: renderCurrentCalendar,
      payments: renderCurrentPayments,
      building: () => renderBuildingView('current'),
      settings: renderCurrentSettings,
    },
    staff: {
      dashboard:  renderStaffDashboard,
      'coi-review': renderStaffCOI,
      schedule:   renderStaffSchedule,
      building:   () => renderBuildingView('staff'),
      residents:  renderStaffResidents,
    },
  };

  const screenKey = state.role === 'movingin' ? state.movingInScreen :
                    state.role === 'current'  ? state.currentResidentScreen :
                    state.staffScreen;

  const contentFn = (fns[state.role] || {})[screenKey] || renderStaffDashboard;

  document.getElementById('app').innerHTML = renderLayout(contentFn);
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

render();
