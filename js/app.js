// ── Building-Wide Event Data ───────────────────────────────────────────────

const BUILDING_EVENTS = {
  '2026-03-20': [{ type: 'maintenance', title: 'HVAC Maintenance', desc: 'Lobby & corridors', time: '9am–1pm', timeH: 9, dur: 4, icon: '🔧', color: 'orange' }],
  '2026-03-25': [{ type: 'movein', title: 'Move-in: Unit 7A', desc: 'Maria Santos', time: '8am–11am', timeH: 8, dur: 3, icon: '📦', color: 'blue' }],
  '2026-03-26': [{ type: 'movein', title: 'Move-in: Unit 11F', desc: 'James Lee', time: '11am–2pm', timeH: 11, dur: 3, icon: '📦', color: 'blue' }],
  '2026-03-28': [
    { type: 'movein', title: 'Move-in: Unit 14B ★', desc: 'Alex Johnson · Floor 14', time: '8am–11am', timeH: 8, dur: 3, icon: '📦', color: 'indigo' },
    { type: 'movein', title: 'Move-in: Unit 3B', desc: 'Chris Park', time: '11am–2pm', timeH: 11, dur: 3, icon: '📦', color: 'yellow' }
  ],
  '2026-03-30': [{ type: 'movein', title: 'Move-in: Unit 22C', desc: 'David Kim', time: '8am–11am', timeH: 8, dur: 3, icon: '📦', color: 'blue' }],
  '2026-04-01': [{ type: 'movein', title: 'Move-in: Unit 5D', desc: 'Emma Wilson', time: 'TBD', timeH: -1, dur: 3, icon: '📦', color: 'gray' }],
  '2026-04-05': [{ type: 'event', title: 'Community Meeting', desc: 'Building Meeting Room B', time: '7:00 PM', timeH: 19, dur: 1, icon: '🏘️', color: 'green' }],
};

const BOOKING_CHECKLIST = [
  { id: 'coi',      required: true,  label: 'Certificate of Insurance (COI) approved',   hint: 'Required by building management before access',      check: s => s.movingin.coi.status === 'approved' },
  { id: 'deposit',  required: true,  label: 'Security deposit cleared',                   hint: 'Confirmed with the building office',                  check: () => true },
  { id: 'movers',   required: false, label: 'Moving company or self-move arranged',       hint: 'Professional movers required for items over 100 lbs', check: () => false },
  { id: 'utilities',required: false, label: 'Utilities transfer initiated',                hint: 'At least one service set up or in progress',          check: s => s.movingin.utilities.electric.status !== 'not_started' },
  { id: 'keys',     required: false, label: 'Key pickup appointment scheduled',            hint: 'Arrange with building office (Mon–Fri, 9am–5pm)',     check: () => false },
  { id: 'parking',  required: false, label: 'Moving truck parking/loading dock arranged',  hint: 'West-side loading dock or street permit',             check: () => false },
];

// ── State ──────────────────────────────────────────────────────────────────

const state = {
  role: 'movingin', // 'movingin' | 'current' | 'staff'

  movingInScreen:       'dashboard', // dashboard | coi | elevator | utilities
  currentResidentScreen:'feed',      // feed | calendar | settings
  staffScreen:          'dashboard', // dashboard | coi-review | schedule | residents

  movingin: {
    name: 'Alex Johnson',
    unit: '14B',
    building: 'The Meridian',
    moveInDate: 'March 28, 2026',
    daysUntil: 19,
    coi: { status: 'under_review', fileName: 'AlexJohnson_StateFarm_COI.pdf', uploadedAt: 'March 9, 2026' },
    elevator: { status: 'booked', date: 'March 28, 2026', slot: '8am–11am', elevator: 'Service Elevator A', confirmationCode: 'ELV-20260328-14B' },
    utilities: {
      electric: { status: 'complete',    provider: 'ConEd',   accountNum: 'CON-***8821' },
      gas:      { status: 'not_started', provider: null },
      internet: { status: 'scheduled',   provider: 'Xfinity', scheduledDate: 'March 27' }
    }
  },

  current: {
    name: 'Sarah Chen',
    unit: '14A',
    floor: 14,
    notifications: [
      { id: 1, read: false, urgent: true,  type: 'movein',      icon: '📦', title: 'New neighbor moving in — your floor!', body: 'Unit 14B (floor 14, right next door) is scheduled for March 28, 8am–11am. Service elevator will be reserved and loading dock may be congested.', date: 'Today, 9:14 AM', calDay: 28 },
      { id: 2, read: false, urgent: false, type: 'movein',      icon: '📦', title: 'Move-in scheduled: Unit 3B', body: 'Chris Park (floor 3) is moving in on March 28, 11am–2pm. Two move-ins are scheduled on the same day.', date: 'Today, 8:50 AM', calDay: 28 },
      { id: 3, read: true,  urgent: false, type: 'movein',      icon: '📦', title: 'Move-in scheduled: Unit 11F', body: 'James Lee (floor 11) is moving in on March 26, 11am–2pm. Service elevator reserved.', date: 'Yesterday', calDay: 26 },
      { id: 4, read: true,  urgent: false, type: 'maintenance', icon: '🔧', title: 'Upcoming: HVAC maintenance', body: 'Lobby and corridor HVAC maintenance on March 20, 9am–1pm. Some noise expected in common areas.', date: 'Mar 7', calDay: 20 },
      { id: 5, read: true,  urgent: false, type: 'info',        icon: '✅', title: 'Move-in complete: Unit 7A', body: 'Maria Santos has successfully moved into unit 7A. Service elevator is fully available again.', date: 'Mar 5', calDay: null },
    ],
    prefs: { myFloor: true, adjFloor: true, allBuilding: false, maintenance: true, events: true }
  },

  pendingCOIs: [
    { id: 1, name: 'Alex Johnson', unit: '14B', moveIn: 'Mar 28', status: 'under_review', file: 'AlexJohnson_StateFarm.pdf', submitted: 'Mar 9',  coverage: '$300,000', provider: 'State Farm',  expiry: 'Dec 2026', additionalInsured: true  },
    { id: 2, name: 'Maria Santos', unit: '7A',  moveIn: 'Mar 25', status: 'under_review', file: 'Santos_Lemonade.pdf',      submitted: 'Mar 8',  coverage: '$100,000', provider: 'Lemonade',   expiry: 'Jan 2027', additionalInsured: false },
    { id: 3, name: 'David Kim',    unit: '22C', moveIn: 'Mar 30', status: 'under_review', file: 'DavidKim_Allstate.pdf',    submitted: 'Mar 10', coverage: '$500,000', provider: 'Allstate',   expiry: 'Oct 2026', additionalInsured: true  },
    { id: 4, name: 'Emma Wilson',  unit: '5D',  moveIn: 'Apr 1',  status: 'under_review', file: 'Wilson_Progressive.pdf',   submitted: 'Mar 11', coverage: '$200,000', provider: 'Progressive',expiry: 'Mar 2027', additionalInsured: true  }
  ],

  residents: [
    { name: 'Maria Santos', unit: '7A',  date: 'Mar 25', coi: 'approved', elevator: 'booked',  utilities: 'partial',     compliance: 'partial' },
    { name: 'James Lee',    unit: '11F', date: 'Mar 26', coi: 'approved', elevator: 'booked',  utilities: 'complete',    compliance: 'full'    },
    { name: 'Alex Johnson', unit: '14B', date: 'Mar 28', coi: 'pending',  elevator: 'booked',  utilities: 'partial',     compliance: 'partial' },
    { name: 'Chris Park',   unit: '3B',  date: 'Mar 28', coi: 'missing',  elevator: 'missing', utilities: 'not_started', compliance: 'none'    },
    { name: 'David Kim',    unit: '22C', date: 'Mar 30', coi: 'pending',  elevator: 'booked',  utilities: 'not_started', compliance: 'partial' },
    { name: 'Emma Wilson',  unit: '5D',  date: 'Apr 1',  coi: 'pending',  elevator: 'missing', utilities: 'not_started', compliance: 'none'    }
  ],

  schedule: {
    'Mar 25': [{ resident: 'Maria Santos', unit: '7A',  slot: '8am–11am',  status: 'confirmed'   }],
    'Mar 26': [{ resident: 'James Lee',    unit: '11F', slot: '11am–2pm',  status: 'confirmed'   }],
    'Mar 28': [
      { resident: 'Alex Johnson', unit: '14B', slot: '8am–11am',  status: 'confirmed'   },
      { resident: 'Chris Park',   unit: '3B',  slot: '11am–2pm',  status: 'unconfirmed' }
    ],
    'Mar 30': [{ resident: 'David Kim',  unit: '22C', slot: '8am–11am',  status: 'confirmed'   }]
  },

  selectedCOI: null,

  // Elevator booking flow
  elevatorBooking: { step: 0, selectedDate: null, selectedSlot: null }, // step 0=checklist 1=calendar 2=slot 3=confirm

  // Calendar
  calendarState: {
    view: 'month', // month | week | day
    year: 2026,
    month: 3,       // March
    weekStart: 23,  // week of Mar 23 for week view
    selectedDay: null
  },

  utilitiesStep: 0
};

// ── Helpers ────────────────────────────────────────────────────────────────

function badge(status) {
  const map = {
    approved:     ['badge-green',  '✓ Approved'],
    under_review: ['badge-yellow', '⏳ Under Review'],
    pending:      ['badge-yellow', '⏳ Pending'],
    not_started:  ['badge-gray',   'Not Started'],
    missing:      ['badge-red',    '⚠ Missing'],
    booked:       ['badge-green',  '✓ Booked'],
    complete:     ['badge-green',  '✓ Complete'],
    scheduled:    ['badge-blue',   '📅 Scheduled'],
    partial:      ['badge-yellow', '◑ Partial'],
    full:         ['badge-green',  '✓ Compliant'],
    none:         ['badge-red',    '⚠ Non-compliant'],
    confirmed:    ['badge-green',  'Confirmed'],
    unconfirmed:  ['badge-yellow', '⚠ Unconfirmed']
  };
  const [cls, label] = map[status] || ['badge-gray', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function eventsForDate(year, month, day) {
  const key = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  return BUILDING_EVENTS[key] || [];
}

// ── Navigation ─────────────────────────────────────────────────────────────

function navigate(screen) {
  if (state.role === 'movingin') state.movingInScreen = screen;
  else if (state.role === 'current') state.currentResidentScreen = screen;
  else state.staffScreen = screen;
  state.selectedCOI = null;
  render();
}

function switchRole(role) {
  state.role = role;
  render();
}

// ── Calendar Component ─────────────────────────────────────────────────────

function renderCalendar(mode = 'view') {
  const cs = state.calendarState;
  const MONTH_NAMES = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
  const weekDates = getWeekDates(cs.year, cs.month, cs.weekStart);

  return `
    <div class="cal-container">
      <div class="cal-header">
        <div class="cal-header-left">
          ${cs.view === 'month' ? `
            <button class="cal-nav-btn" onclick="calNav(-1)">‹</button>
            <span class="cal-month-label">${MONTH_NAMES[cs.month]} ${cs.year}</span>
            <button class="cal-nav-btn" onclick="calNav(1)">›</button>
          ` : cs.view === 'week' ? `
            <button class="cal-nav-btn" onclick="calWeekNav(-7)">‹</button>
            <span class="cal-month-label">${formatWeekLabel(weekDates)}</span>
            <button class="cal-nav-btn" onclick="calWeekNav(7)">›</button>
          ` : `
            <button class="cal-nav-btn" onclick="calDayNav(-1)">‹</button>
            <span class="cal-month-label">${formatDayLabel(cs.year, cs.month, cs.selectedDay || 9)}</span>
            <button class="cal-nav-btn" onclick="calDayNav(1)">›</button>
          `}
        </div>
        <div class="cal-view-toggle">
          <button class="cal-view-btn ${cs.view==='month'?'cal-view-btn--active':''}" onclick="setCalView('month')">Month</button>
          <button class="cal-view-btn ${cs.view==='week' ?'cal-view-btn--active':''}" onclick="setCalView('week')">Week</button>
          <button class="cal-view-btn ${cs.view==='day'  ?'cal-view-btn--active':''}" onclick="setCalView('day')">Day</button>
        </div>
      </div>

      ${cs.view === 'month' ? renderMonthView(mode) : ''}
      ${cs.view === 'week'  ? renderWeekView(mode)  : ''}
      ${cs.view === 'day'   ? renderDayView(mode)   : ''}

      ${cs.selectedDay && cs.view !== 'day' ? renderDayDetail(mode) : ''}
    </div>
  `;
}

function renderMonthView(mode) {
  const { year, month, selectedDay } = state.calendarState;
  // March 1, 2026 = Sunday → Mon-first startDow = 6
  const firstDow = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevMonthDays = new Date(year, month - 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDow; i++)
    cells.push({ day: prevMonthDays - firstDow + 1 + i, cur: false });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, cur: true });
  while (cells.length % 7 !== 0)
    cells.push({ day: cells.length - daysInMonth - firstDow + 1, cur: false });

  return `
    <div class="cal-month-grid">
      ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d =>
        `<div class="cal-weekday-hdr">${d}</div>`
      ).join('')}
      ${cells.map(cell => {
        const evts = cell.cur ? eventsForDate(year, month, cell.day) : [];
        const isToday = cell.cur && year===2026 && month===3 && cell.day===9;
        const isSel   = cell.cur && selectedDay === cell.day;
        const bookable = mode === 'booking' && cell.cur && isBookableDate(year, month, cell.day);
        return `
          <div class="cal-day-cell ${!cell.cur?'cal-day-other':''} ${isToday?'cal-day-today':''} ${isSel?'cal-day-selected':''} ${bookable?'cal-day-bookable':''}"
               onclick="${cell.cur ? `selectCalDay(${cell.day})` : ''}">
            <div class="cal-day-num">${cell.day}</div>
            ${evts.slice(0,3).map(e => `
              <div class="cal-pill cal-pill--${e.color}" title="${e.title}">${e.title}</div>
            `).join('')}
            ${evts.length > 3 ? `<div class="cal-more">+${evts.length-3}</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderWeekView(mode) {
  const { year, month, weekStart } = state.calendarState;
  const weekDates = getWeekDates(year, month, weekStart);
  const hours = [7,8,9,10,11,12,13,14,15,16,17,18];
  const hLabel = h => h < 12 ? `${h}am` : h===12 ? '12pm' : `${h-12}pm`;

  return `
    <div class="cal-week-view">
      <div class="cal-week-hdr">
        <div class="cal-time-spacer"></div>
        ${weekDates.map(d => {
          const isToday = d.y===2026&&d.m===3&&d.day===9;
          const evts = eventsForDate(d.y, d.m, d.day);
          return `
            <div class="cal-week-day-col ${isToday?'cal-wdc--today':''}">
              <div class="cal-wdc-label">${d.dow}</div>
              <div class="cal-wdc-num ${isToday?'cal-wdc-num--today':''}">${d.day}</div>
              ${evts.length ? `<div class="cal-wdc-dot"></div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
      <div class="cal-week-body">
        ${hours.map(h => `
          <div class="cal-week-row">
            <div class="cal-time-lbl">${hLabel(h)}</div>
            ${weekDates.map(d => {
              const evts = eventsForDate(d.y, d.m, d.day).filter(e => e.timeH === h);
              return `
                <div class="cal-week-cell ${mode==='booking'&&isBookableDate(d.y,d.m,d.day)?'cal-week-cell--bookable':''}"
                     onclick="${mode==='booking'&&isBookableDate(d.y,d.m,d.day)?`selectCalDay(${d.day})`:''}">
                  ${evts.map(e => `
                    <div class="cal-event-block cal-event-block--${e.color}">
                      <div class="cal-eb-title">${e.icon} ${e.title}</div>
                      <div class="cal-eb-time">${e.time}</div>
                    </div>
                  `).join('')}
                </div>
              `;
            }).join('')}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderDayView(mode) {
  const { year, month, selectedDay } = state.calendarState;
  const day = selectedDay || 9;
  const evts = eventsForDate(year, month, day);
  const hours = [7,8,9,10,11,12,13,14,15,16,17,18,19];
  const hLabel = h => h < 12 ? `${h}:00 AM` : h===12 ? '12:00 PM' : `${h-12}:00 PM`;

  return `
    <div class="cal-day-view">
      ${hours.map(h => {
        const evt = evts.find(e => e.timeH === h);
        return `
          <div class="cal-day-row">
            <div class="cal-time-lbl cal-time-lbl--day">${hLabel(h)}</div>
            <div class="cal-day-slot">
              ${evt ? `
                <div class="cal-day-evt cal-day-evt--${evt.color}">
                  <div class="cal-de-icon">${evt.icon}</div>
                  <div>
                    <div class="cal-de-title">${evt.title}</div>
                    <div class="cal-de-desc">${evt.desc} · ${evt.time}</div>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderDayDetail(mode) {
  const { year, month, selectedDay } = state.calendarState;
  const evts = eventsForDate(year, month, selectedDay);
  const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  if (!evts.length && mode !== 'booking') return '';

  return `
    <div class="cal-day-detail">
      <div class="cal-dd-header">${MONTHS[month]} ${selectedDay}</div>
      ${evts.length ? evts.map(e => `
        <div class="cal-dd-event cal-event-block--${e.color}">
          <span class="cal-dd-icon">${e.icon}</span>
          <div>
            <div class="cal-dd-title">${e.title}</div>
            <div class="cal-dd-meta">${e.desc} · ${e.time}</div>
          </div>
        </div>
      `).join('') : `<div style="color:#94a3b8;font-size:13px">No events on this day.</div>`}
      ${mode === 'booking' && isBookableDate(year, month, selectedDay) ? `
        <button class="btn-primary" style="margin-top:12px" onclick="state.elevatorBooking.step=2; render()">Select this date →</button>
      ` : ''}
    </div>
  `;
}

// Calendar helpers

function getWeekDates(year, month, startDay) {
  const DOWS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const result = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(year, month - 1, startDay + i);
    result.push({ y: d.getFullYear(), m: d.getMonth()+1, day: d.getDate(), dow: DOWS[d.getDay()] });
  }
  return result;
}

function formatWeekLabel(weekDates) {
  const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const first = weekDates[0], last = weekDates[6];
  if (first.m === last.m) return `${MONTHS[first.m]} ${first.day}–${last.day}, ${first.y}`;
  return `${MONTHS[first.m]} ${first.day} – ${MONTHS[last.m]} ${last.day}, ${first.y}`;
}

function formatDayLabel(year, month, day) {
  const DOWS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
  const d = new Date(year, month - 1, day);
  return `${DOWS[d.getDay()]}, ${MONTHS[month]} ${day}`;
}

function isBookableDate(year, month, day) {
  // Available for booking: not a Sunday, not already fully booked, >= today
  const d = new Date(year, month - 1, day);
  const today = new Date(2026, 2, 9);
  if (d < today) return false;
  if (d.getDay() === 0) return false; // no Sundays
  // Mar 30 is fully booked
  if (year===2026 && month===3 && day===30) return false;
  return true;
}

function selectCalDay(day) {
  state.calendarState.selectedDay = day;
  render();
}

function setCalView(view) {
  state.calendarState.view = view;
  render();
}

function calNav(dir) {
  let { year, month } = state.calendarState;
  month += dir;
  if (month > 12) { month = 1; year++; }
  if (month < 1)  { month = 12; year--; }
  state.calendarState.year = year;
  state.calendarState.month = month;
  state.calendarState.selectedDay = null;
  render();
}

function calWeekNav(days) {
  const cs = state.calendarState;
  const d = new Date(cs.year, cs.month - 1, cs.weekStart + days);
  cs.year = d.getFullYear();
  cs.month = d.getMonth() + 1;
  cs.weekStart = d.getDate();
  render();
}

function calDayNav(dir) {
  const cs = state.calendarState;
  const d = new Date(cs.year, cs.month - 1, (cs.selectedDay || 9) + dir);
  cs.year = d.getFullYear();
  cs.month = d.getMonth() + 1;
  cs.selectedDay = d.getDate();
  render();
}

// ── Moving-In Resident: Dashboard ──────────────────────────────────────────

function renderMovingInDashboard() {
  const { movingin: r } = state;
  const steps = [r.coi.status === 'approved', r.elevator.status === 'booked', false];
  const done = steps.filter(Boolean).length;
  const pct  = Math.round(done / 3 * 100);

  return `
    <div class="screen-content">
      <div class="welcome-banner">
        <div>
          <div class="welcome-greeting">Hi, ${r.name} 👋</div>
          <div class="welcome-subtitle">
            Move-in: <strong>${r.moveInDate}</strong> · Unit ${r.unit}<br>${r.building}
          </div>
        </div>
        <div class="welcome-meta">
          <div class="welcome-days">${r.daysUntil}</div>
          <div class="welcome-days-label">days away</div>
        </div>
      </div>

      <div class="progress-section">
        <div class="progress-header">
          <span>${done} of 3 steps complete</span><span>${pct}%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>

      <div class="steps-grid">
        <div class="step-card ${r.coi.status==='approved'?'step-card--done':''}" onclick="navigate('coi')">
          <div class="step-icon">${r.coi.status==='approved'?'✅':'📄'}</div>
          <div class="step-info">
            <div class="step-title">Certificate of Insurance (COI)</div>
            <div class="step-desc">Required by your building before move-in</div>
            <div class="step-status">${badge(r.coi.status)}</div>
          </div>
          <div class="step-arrow">›</div>
        </div>

        <div class="step-card ${r.elevator.status==='booked'?'step-card--done':''}" onclick="navigate('elevator')">
          <div class="step-icon">${r.elevator.status==='booked'?'✅':'🛗'}</div>
          <div class="step-info">
            <div class="step-title">Elevator Reservation</div>
            <div class="step-desc">${r.elevator.status==='booked' ? `${r.elevator.slot} · ${r.elevator.elevator}` : 'Reserve your move-in window'}</div>
            <div class="step-status">${badge(r.elevator.status)}</div>
          </div>
          <div class="step-arrow">›</div>
        </div>

        <div class="step-card" onclick="navigate('utilities')">
          <div class="step-icon">⚡</div>
          <div class="step-info">
            <div class="step-title">Utilities & Internet</div>
            <div class="step-desc">Electric · Gas · ISP — 2 of 3 set up</div>
            <div class="step-status">${badge('partial')}</div>
          </div>
          <div class="step-arrow">›</div>
        </div>
      </div>

      <div class="info-card">
        <div class="info-card-title">📋 Building Policy Reminders</div>
        <ul class="info-list">
          <li>Move-ins: Mon–Sat, 8am–5pm (no Sundays)</li>
          <li>Service elevator must be reserved in advance — no passenger elevator use</li>
          <li>COI must be approved before your move-in date</li>
          <li>Professional movers required for items over 100 lbs</li>
          <li>Loading dock entrance is on the west side of the building</li>
        </ul>
      </div>
    </div>
  `;
}

// ── Moving-In Resident: COI ────────────────────────────────────────────────

function renderMovingInCOI() {
  const { coi } = state.movingin;
  return `
    <div class="screen-content">
      <div class="screen-header">
        <button class="back-btn" onclick="navigate('dashboard')">← Dashboard</button>
        <h2 class="screen-title">Certificate of Insurance</h2>
      </div>
      <div class="explainer-card">
        <div class="explainer-title">What is a COI?</div>
        <div class="explainer-text">A Certificate of Insurance proves you have renter's insurance. The Meridian requires <strong>$100,000+ in liability coverage</strong> with the building listed as an additional insured party.</div>
      </div>
      ${coi.status==='not_started' ? renderCOIUpload() : ''}
      ${coi.status==='under_review'? renderCOIUnderReview() : ''}
      ${coi.status==='approved'    ? renderCOIApproved() : ''}
      ${coi.status==='rejected'    ? renderCOIRejected() : ''}
      <div class="requirements-card">
        <div class="req-title">COI Requirements</div>
        <div class="req-list">
          ${['$100,000+ liability coverage','The Meridian LLC listed as additional insured','Policy valid through move-in date','Issued by a licensed US insurer','Your full legal name on the policy'].map(r =>
            `<div class="req-item"><span class="req-check">✓</span><span>${r}</span></div>`
          ).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderCOIUpload() {
  return `
    <div class="upload-zone" ondragover="event.preventDefault();this.classList.add('upload-zone--active')"
         ondragleave="this.classList.remove('upload-zone--active')"
         ondrop="event.preventDefault();this.classList.remove('upload-zone--active');simulateCOIUpload()"
         onclick="simulateCOIUpload()">
      <div class="upload-icon">📤</div>
      <div class="upload-text">Drop your COI here or click to upload</div>
      <div class="upload-subtext">PDF, JPG, PNG · max 10 MB</div>
    </div>
    <div style="text-align:center;font-size:13px;color:#64748b;margin-bottom:16px">
      No policy yet? <a href="#" onclick="event.preventDefault()" style="color:#2563eb;font-weight:600">Find a provider →</a>
    </div>
  `;
}

function renderCOIUnderReview() {
  return `
    <div class="status-card status-card--yellow">
      <div class="status-card-icon">⏳</div>
      <div class="status-card-content">
        <div class="status-card-title">Your COI is under review</div>
        <div class="status-card-desc">Building staff will review within 1–2 business days. You'll be notified when approved.</div>
      </div>
    </div>
    <div class="uploaded-file-card">
      <div class="file-icon">📄</div>
      <div class="file-info">
        <div class="file-name">${state.movingin.coi.fileName}</div>
        <div class="file-meta">Uploaded ${state.movingin.coi.uploadedAt}</div>
      </div>
      <button class="btn-link" onclick="state.movingin.coi.status='not_started';render()">Replace</button>
    </div>
  `;
}

function renderCOIApproved() {
  return `
    <div class="status-card status-card--green">
      <div class="status-card-icon">✅</div>
      <div class="status-card-content">
        <div class="status-card-title">COI Approved — you're all set!</div>
        <div class="status-card-desc">Your insurance meets all building requirements.</div>
      </div>
    </div>
    <div class="uploaded-file-card">
      <div class="file-icon">📄</div>
      <div class="file-info"><div class="file-name">${state.movingin.coi.fileName}</div><div class="file-meta">Approved · ${state.movingin.coi.uploadedAt}</div></div>
    </div>
  `;
}

function renderCOIRejected() {
  return `
    <div class="status-card status-card--red">
      <div class="status-card-icon">❌</div>
      <div class="status-card-content">
        <div class="status-card-title">COI Rejected — action required</div>
        <div class="status-card-desc"><strong>Reason:</strong> Coverage below $100,000 minimum. Please update your policy and re-upload.</div>
      </div>
    </div>
    ${renderCOIUpload()}
  `;
}

function simulateCOIUpload() {
  state.movingin.coi.status = 'under_review';
  state.movingin.coi.fileName = 'AlexJohnson_Updated_COI.pdf';
  state.movingin.coi.uploadedAt = 'March 9, 2026';
  render();
}

// ── Moving-In Resident: Elevator (with Checklist + Calendar) ───────────────

const ELEVATOR_SLOTS = [
  { id: '8am',  label: '8am–11am',  available: true  },
  { id: '11am', label: '11am–2pm',  available: false },
  { id: '2pm',  label: '2pm–5pm',   available: true  }
];

function renderMovingInElevator() {
  const { elevator } = state.movingin;

  if (elevator.status === 'booked') {
    return `
      <div class="screen-content">
        <div class="screen-header">
          <button class="back-btn" onclick="navigate('dashboard')">← Dashboard</button>
          <h2 class="screen-title">Elevator Reservation</h2>
        </div>
        <div class="status-card status-card--green">
          <div class="status-card-icon">✅</div>
          <div class="status-card-content">
            <div class="status-card-title">Elevator reserved — confirmed!</div>
            <div class="status-card-desc">Your service elevator window is locked in. Check in at the building office before using it.</div>
          </div>
        </div>
        <div class="booking-details-card">
          <div class="booking-detail"><span class="bd-label">Date</span><span class="bd-value">${elevator.date}</span></div>
          <div class="booking-detail"><span class="bd-label">Time Window</span><span class="bd-value">${elevator.slot}</span></div>
          <div class="booking-detail"><span class="bd-label">Elevator</span><span class="bd-value">${elevator.elevator}</span></div>
          <div class="booking-detail"><span class="bd-label">Confirmation #</span><span class="bd-value"><span class="code">${elevator.confirmationCode}</span></span></div>
        </div>
        <div class="info-card">
          <div class="info-card-title">📋 Day-of Instructions</div>
          <ul class="info-list">
            <li>Check in at the building management office (lobby level)</li>
            <li>Use the loading dock entrance on the west side of the building</li>
            <li>Elevator key fob is provided at check-in and returned afterward</li>
            <li>Overtime fee: $75/hour past your reserved window</li>
          </ul>
        </div>
        <button class="btn-secondary" style="width:auto;display:inline-block;padding:10px 20px"
          onclick="state.movingin.elevator.status='not_booked';state.elevatorBooking={step:0,selectedDate:null,selectedSlot:null};render()">
          Modify Reservation
        </button>
      </div>
    `;
  }

  const bk = state.elevatorBooking;
  return `
    <div class="screen-content">
      <div class="screen-header">
        <button class="back-btn" onclick="navigate('dashboard')">← Dashboard</button>
        <h2 class="screen-title">Book Elevator</h2>
      </div>

      <div class="booking-steps-row">
        <div class="booking-step-item ${bk.step>=0?'bsi--active':''}">
          <div class="bsi-dot">${bk.step>0?'✓':'1'}</div>
          <div class="bsi-label">Checklist</div>
        </div>
        <div class="bsi-line"></div>
        <div class="booking-step-item ${bk.step>=1?'bsi--active':''}">
          <div class="bsi-dot">${bk.step>1?'✓':'2'}</div>
          <div class="bsi-label">Pick Date</div>
        </div>
        <div class="bsi-line"></div>
        <div class="booking-step-item ${bk.step>=2?'bsi--active':''}">
          <div class="bsi-dot">${bk.step>2?'✓':'3'}</div>
          <div class="bsi-label">Pick Time</div>
        </div>
        <div class="bsi-line"></div>
        <div class="booking-step-item ${bk.step>=3?'bsi--active':''}">
          <div class="bsi-dot">4</div>
          <div class="bsi-label">Confirm</div>
        </div>
      </div>

      ${bk.step === 0 ? renderBookingChecklist()    : ''}
      ${bk.step === 1 ? renderBookingCalendar()     : ''}
      ${bk.step === 2 ? renderBookingSlots()        : ''}
      ${bk.step === 3 ? renderBookingConfirmation() : ''}
    </div>
  `;
}

function renderBookingChecklist() {
  const items = BOOKING_CHECKLIST.map(item => {
    const done = item.check(state);
    return { ...item, done };
  });
  const reqDone   = items.filter(i => i.required && i.done).length;
  const reqTotal  = items.filter(i => i.required).length;
  const allReqDone = reqDone === reqTotal;

  return `
    <div class="checklist-card">
      <div class="checklist-hdr">
        <div class="checklist-title">Pre-Booking Checklist</div>
        <div class="checklist-sub">Complete required items before reserving your elevator window</div>
        <div class="checklist-progress-row">
          <div class="checklist-progress-bar">
            <div class="checklist-progress-fill" style="width:${Math.round(reqDone/reqTotal*100)}%"></div>
          </div>
          <span class="checklist-progress-label">${reqDone}/${reqTotal} required</span>
        </div>
      </div>
      ${items.map(item => `
        <div class="checklist-item ${item.done?'ci--done':''}">
          <div class="checklist-icon ${item.done?'ci-icon--done':item.required?'ci-icon--req':'ci-icon--opt'}">
            ${item.done ? '✓' : item.required ? '!' : '○'}
          </div>
          <div class="checklist-body">
            <div class="checklist-label">
              ${item.label}
              ${item.required
                ? `<span class="cl-tag cl-tag--req">Required</span>`
                : `<span class="cl-tag cl-tag--opt">Optional</span>`}
            </div>
            <div class="checklist-hint">${item.hint}</div>
            ${!item.done && item.id === 'coi' ? `
              <button class="btn-link" style="margin-top:4px" onclick="navigate('coi')">Upload COI →</button>
            ` : ''}
            ${!item.done && item.id === 'utilities' ? `
              <button class="btn-link" style="margin-top:4px" onclick="navigate('utilities')">Set up utilities →</button>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </div>

    ${!allReqDone ? `
      <div class="status-card status-card--yellow" style="margin-bottom:14px">
        <div class="status-card-icon">⚠️</div>
        <div class="status-card-content">
          <div class="status-card-title">Complete required items first</div>
          <div class="status-card-desc">${reqTotal - reqDone} required item(s) still pending. You can still proceed to check availability.</div>
        </div>
      </div>
    ` : `
      <div class="status-card status-card--green" style="margin-bottom:14px">
        <div class="status-card-icon">🎉</div>
        <div class="status-card-content">
          <div class="status-card-title">All required items complete!</div>
          <div class="status-card-desc">You're ready to reserve your elevator window.</div>
        </div>
      </div>
    `}

    <button class="btn-primary" onclick="state.elevatorBooking.step=1; state.calendarState.view='month'; state.calendarState.selectedDay=null; render()">
      ${allReqDone ? 'Choose Your Date →' : 'View Availability Anyway →'}
    </button>
  `;
}

function renderBookingCalendar() {
  const bk = state.elevatorBooking;
  return `
    <div class="booking-calendar-section">
      <div class="booking-section-title">📅 Select your move-in date</div>
      <div class="booking-section-sub">Green days are available for booking. Click a date to select it, then click "Select this date".</div>
      ${renderCalendar('booking')}
      <button class="btn-secondary" onclick="state.elevatorBooking.step=0;render()">← Back to Checklist</button>
    </div>
  `;
}

function renderBookingSlots() {
  const bk = state.elevatorBooking;
  const cs = state.calendarState;
  const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dateLabel = cs.selectedDay ? `${MONTHS[cs.month]} ${cs.selectedDay}, ${cs.year}` : 'Selected Date';

  return `
    <div>
      <div class="slot-header">Available windows for <strong>${dateLabel}</strong> · Service Elevator A</div>
      <div class="slot-list">
        ${ELEVATOR_SLOTS.map(s => `
          <div class="slot-card ${!s.available?'slot-card--taken':''} ${bk.selectedSlot===s.id?'slot-card--selected':''}"
               onclick="${s.available?`selectSlot('${s.id}')`:''}">
            <div>
              <div class="slot-time">${s.label}</div>
              <div class="slot-status">${s.available?'Available (Service Elevator A)':'Taken'}</div>
            </div>
            ${bk.selectedSlot===s.id ? `<span class="badge badge-blue">Selected ✓</span>` : ''}
          </div>
        `).join('')}
      </div>
      <div class="slot-note">⏱ Each window is 3 hours · Overtime: $75/hour</div>
      ${bk.selectedSlot ? `<button class="btn-primary" onclick="state.elevatorBooking.step=3;render()">Review Booking →</button>` : ''}
      <button class="btn-secondary" onclick="state.elevatorBooking.step=1;render()">← Change Date</button>
    </div>
  `;
}

function selectSlot(id) {
  state.elevatorBooking.selectedSlot = id;
  render();
}

function renderBookingConfirmation() {
  const bk = state.elevatorBooking;
  const cs = state.calendarState;
  const MONTHS = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
  const slotLabel = ELEVATOR_SLOTS.find(s => s.id === bk.selectedSlot)?.label || '';
  const dateLabel = `${MONTHS[cs.month]} ${cs.selectedDay}, ${cs.year}`;

  return `
    <div style="background:white;border:1px solid #e2e8f0;border-radius:14px;padding:22px">
      <div style="font-size:17px;font-weight:800;margin-bottom:16px">Confirm Your Booking</div>
      <div class="booking-details-card" style="margin-bottom:0">
        <div class="booking-detail"><span class="bd-label">Date</span><span class="bd-value">${dateLabel}</span></div>
        <div class="booking-detail"><span class="bd-label">Time Window</span><span class="bd-value">${slotLabel}</span></div>
        <div class="booking-detail"><span class="bd-label">Elevator</span><span class="bd-value">Service Elevator A</span></div>
        <div class="booking-detail"><span class="bd-label">Unit</span><span class="bd-value">${state.movingin.unit}</span></div>
      </div>
      <p class="confirm-policy">By confirming, you agree to the elevator usage policy. Cancellations must be made 48+ hours in advance or a $50 fee applies.</p>
      <div class="btn-row">
        <button class="btn-secondary" onclick="state.elevatorBooking.step=2;render()">← Change Time</button>
        <button class="btn-primary" onclick="confirmElevatorBooking()">Confirm Reservation ✓</button>
      </div>
    </div>
  `;
}

function confirmElevatorBooking() {
  const bk = state.elevatorBooking;
  const cs = state.calendarState;
  const MONTHS = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
  const slotLabel = ELEVATOR_SLOTS.find(s => s.id === bk.selectedSlot)?.label || '';
  state.movingin.elevator = {
    status: 'booked',
    date: `${MONTHS[cs.month]} ${cs.selectedDay}, ${cs.year}`,
    slot: slotLabel,
    elevator: 'Service Elevator A',
    confirmationCode: `ELV-${cs.year}${String(cs.month).padStart(2,'0')}${String(cs.selectedDay).padStart(2,'0')}-${state.movingin.unit}`
  };
  render();
}

// ── Moving-In Resident: Utilities ──────────────────────────────────────────

const PROVIDERS = {
  electric: ['ConEd', 'National Grid', 'Direct Energy', 'Green Mountain Energy'],
  gas:      ['ConEd', 'National Fuel', 'Sprague Energy', 'Direct Energy'],
  internet: ['Xfinity', 'Spectrum', 'Verizon Fios', 'RCN']
};

function renderMovingInUtilities() {
  const { utilities } = state.movingin;
  const step = state.utilitiesStep;
  return `
    <div class="screen-content">
      <div class="screen-header">
        <button class="back-btn" onclick="navigate('dashboard')">← Dashboard</button>
        <h2 class="screen-title">Utilities & Internet Setup</h2>
      </div>
      <div class="utilities-overview">
        ${utilityRow('electric','⚡','Electric', utilities.electric)}
        ${utilityRow('gas','🔥','Gas',           utilities.gas)}
        ${utilityRow('internet','🌐','Internet', utilities.internet)}
      </div>
      ${step===0 ? renderUtilitiesHome()                                  : ''}
      ${step===1 ? renderUtilitySetup('electric','Electric Provider','⚡'): ''}
      ${step===2 ? renderUtilitySetup('gas','Gas Provider','🔥')         : ''}
      ${step===3 ? renderUtilitySetup('internet','Internet Provider','🌐'): ''}
      ${step===4 ? renderUtilitiesDone()                                  : ''}
    </div>
  `;
}

function utilityRow(type, icon, label, data) {
  const cls = { complete:'badge-green', scheduled:'badge-blue', not_started:'badge-gray' };
  const lbl = { complete:'✓ Complete',  scheduled:'📅 Scheduled', not_started:'Not started' };
  const stepMap = { electric:1, gas:2, internet:3 };
  return `
    <div class="utility-row" onclick="state.utilitiesStep=${stepMap[type]};render()">
      <span class="utility-icon">${icon}</span>
      <span class="utility-label">${label}</span>
      ${data.provider ? `<span class="utility-provider">${data.provider}</span>` : '<span class="utility-provider"></span>'}
      <span class="badge ${cls[data.status]}">${lbl[data.status]}</span>
      <span style="margin-left:8px;color:#94a3b8">›</span>
    </div>
  `;
}

function renderUtilitiesHome() {
  return `
    <div class="utilities-cta">
      <div class="utilities-cta-text">Set up your utilities before move-in day to avoid gaps in service.</div>
      <button class="btn-primary" style="width:auto;display:inline-block;padding:12px 28px" onclick="state.utilitiesStep=1;render()">Start Setup →</button>
    </div>
  `;
}

function renderUtilitySetup(type, title, icon) {
  const data = state.movingin.utilities[type];
  const nextStep = type==='electric'?2:type==='gas'?3:4;
  const prevStep = type==='electric'?0:type==='gas'?1:2;
  return `
    <div class="utility-setup-card">
      <div class="utility-setup-title">${icon} ${title}</div>
      ${(data.status==='complete'||data.status==='scheduled') ? `
        <div class="status-card status-card--${data.status==='complete'?'green':'blue'}" style="margin-bottom:14px">
          <div class="status-card-icon">${data.status==='complete'?'✅':'📅'}</div>
          <div class="status-card-content">
            <div class="status-card-title">${data.provider} — ${data.status==='complete'?'Active':'Scheduled'}</div>
            <div class="status-card-desc">${data.status==='complete'?`Account: ${data.accountNum||'Active'}`:`Installation on ${data.scheduledDate}`}</div>
          </div>
        </div>
        <div style="font-size:12.5px;color:#64748b;margin-bottom:12px">Want to change? Select another provider:</div>
      ` : ''}
      <div class="provider-list" style="margin-bottom:14px">
        ${PROVIDERS[type].map(p => `
          <div class="provider-card" onclick="selectProvider('${type}','${p}')">
            <div class="provider-logo">${p[0]}</div>
            <div class="provider-name">${p}</div>
            <div class="provider-arrow">›</div>
          </div>
        `).join('')}
      </div>
      <div class="btn-row">
        <button class="btn-secondary" onclick="state.utilitiesStep=${prevStep};render()">← Back</button>
        <button class="btn-primary" onclick="state.utilitiesStep=${nextStep};render()">${nextStep===4?'Finish ✓':'Next →'}</button>
      </div>
    </div>
  `;
}

function selectProvider(type, provider) {
  state.movingin.utilities[type] = {
    status: type==='electric'?'complete':'scheduled',
    provider,
    accountNum: type==='electric' ? `CON-***${Math.floor(Math.random()*9000+1000)}` : undefined,
    scheduledDate: type!=='electric' ? 'March 27' : undefined
  };
  render();
}

function renderUtilitiesDone() {
  return `
    <div class="status-card status-card--green">
      <div class="status-card-icon">🎉</div>
      <div class="status-card-content">
        <div class="status-card-title">Utilities setup complete!</div>
        <div class="status-card-desc">We'll send reminders as your service dates approach.</div>
      </div>
    </div>
    <button class="btn-primary" onclick="navigate('dashboard')">← Back to Dashboard</button>
  `;
}

// ── Current Resident: Feed ─────────────────────────────────────────────────

function renderCurrentFeed() {
  const { current } = state;
  const unread = current.notifications.filter(n => !n.read).length;

  return `
    <div class="screen-content">
      <div class="staff-header">
        <div>
          <div class="staff-greeting">Hi, ${current.name} 👋</div>
          <div class="staff-date">Unit ${current.unit} · Floor ${current.floor} · The Meridian</div>
        </div>
        ${unread ? `<span class="badge badge-red">${unread} new</span>` : ''}
      </div>

      <div class="status-card status-card--blue" style="margin-bottom:20px">
        <div class="status-card-icon">📅</div>
        <div class="status-card-content">
          <div class="status-card-title">Coming up: Move-in on your floor</div>
          <div class="status-card-desc">Unit 14B (next door) is moving in on <strong>March 28, 8–11am</strong>. Expect some activity in the hallway and elevator.</div>
          <button class="btn-small" style="margin-top:10px" onclick="state.calendarState.selectedDay=28;state.calendarState.view='day';navigate('calendar')">View in Calendar →</button>
        </div>
      </div>

      <div class="section-header">🔔 Notifications</div>
      <div class="notif-feed">
        ${current.notifications.map(n => `
          <div class="notif-card ${!n.read?'notif-card--unread':''} ${n.urgent?'notif-card--urgent':''}"
               onclick="markRead(${n.id})">
            ${!n.read ? '<div class="notif-dot"></div>' : ''}
            <div class="notif-icon-wrap notif-icon-wrap--${n.type}">${n.icon}</div>
            <div class="notif-content">
              <div class="notif-title">${n.title}</div>
              <div class="notif-body">${n.body}</div>
              <div class="notif-time">${n.date}</div>
              ${n.calDay ? `
                <button class="btn-small" style="margin-top:8px" onclick="event.stopPropagation();state.calendarState.selectedDay=${n.calDay};state.calendarState.view='day';navigate('calendar')">See in Calendar</button>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function markRead(id) {
  const n = state.current.notifications.find(n => n.id === id);
  if (n) n.read = true;
  render();
}

// ── Current Resident: Calendar ─────────────────────────────────────────────

function renderCurrentCalendar() {
  return `
    <div class="screen-content" style="max-width:860px">
      <div class="screen-header">
        <h2 class="screen-title">Building Calendar</h2>
      </div>

      <div class="cal-legend">
        <span class="cal-legend-item"><span class="cal-leg-dot cal-leg-dot--blue"></span>Move-in</span>
        <span class="cal-legend-item"><span class="cal-leg-dot cal-leg-dot--indigo"></span>Move-in · Your floor</span>
        <span class="cal-legend-item"><span class="cal-leg-dot cal-leg-dot--orange"></span>Maintenance</span>
        <span class="cal-legend-item"><span class="cal-leg-dot cal-leg-dot--green"></span>Building event</span>
      </div>

      ${renderCalendar('view')}

      ${state.calendarState.selectedDay && state.calendarState.view === 'month' ? '' : ''}
    </div>
  `;
}

// ── Current Resident: Settings ─────────────────────────────────────────────

function renderCurrentSettings() {
  const { prefs } = state.current;
  return `
    <div class="screen-content">
      <div class="screen-header">
        <h2 class="screen-title">Notification Settings</h2>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Move-in Alerts</div>
        <div class="settings-section-sub">Get notified when new residents move into the building</div>
        ${settingToggle('myFloor',   'My floor only',       'Only notified for move-ins on floor ' + state.current.floor, prefs)}
        ${settingToggle('adjFloor',  'Adjacent floors',     'Also notified for floors ' + (state.current.floor-1) + ' and ' + (state.current.floor+1), prefs)}
        ${settingToggle('allBuilding','Whole building',     'Get notified about every move-in in the building', prefs)}
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Other Notifications</div>
        ${settingToggle('maintenance', 'Maintenance & repairs', 'HVAC, plumbing, elevator servicing', prefs)}
        ${settingToggle('events',      'Building events',       'Community meetings, social events', prefs)}
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Delivery Method</div>
        <div class="delivery-options">
          ${['In-app', 'Email', 'Push notification'].map((m,i) => `
            <div class="delivery-option ${i<2?'delivery-option--active':''}">
              <span>${m}</span>
              <span class="badge ${i<2?'badge-blue':'badge-gray'}">${i<2?'On':'Off'}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <button class="btn-primary" onclick="alert('Settings saved!')">Save Preferences</button>
    </div>
  `;
}

function settingToggle(key, label, desc, prefs) {
  const on = prefs[key];
  return `
    <div class="setting-row" onclick="state.current.prefs['${key}']=!state.current.prefs['${key}'];render()">
      <div class="setting-info">
        <div class="setting-label">${label}</div>
        <div class="setting-desc">${desc}</div>
      </div>
      <div class="toggle ${on?'toggle--on':''}">
        <div class="toggle-knob"></div>
      </div>
    </div>
  `;
}

// ── Staff: Dashboard ───────────────────────────────────────────────────────

function renderStaffDashboard() {
  const urgent = state.residents.filter(r => r.compliance === 'none');
  return `
    <div class="screen-content">
      <div class="staff-header">
        <div>
          <div class="staff-greeting">Operations Dashboard</div>
          <div class="staff-date">The Meridian · March 9, 2026</div>
        </div>
      </div>
      <div class="kpi-grid">
        <div class="kpi-card kpi-card--blue"   onclick="navigate('schedule')">
          <div class="kpi-number">5</div><div class="kpi-label">Moves This Week</div>
        </div>
        <div class="kpi-card kpi-card--yellow" onclick="navigate('coi-review')">
          <div class="kpi-number">${state.pendingCOIs.filter(c=>c.status==='under_review').length}</div><div class="kpi-label">COIs Pending</div>
        </div>
        <div class="kpi-card kpi-card--red"    onclick="navigate('schedule')">
          <div class="kpi-number">1</div><div class="kpi-label">Conflicts</div>
        </div>
        <div class="kpi-card kpi-card--green"  onclick="navigate('residents')">
          <div class="kpi-number">72%</div><div class="kpi-label">Compliant</div>
        </div>
      </div>

      ${urgent.length ? `
        <div class="section-header">⚠️ Needs Attention</div>
        ${urgent.map(r => `
          <div class="alert-card">
            <div class="alert-icon">⚠️</div>
            <div class="alert-content">
              <div class="alert-title">${r.name} · Unit ${r.unit}</div>
              <div class="alert-desc">Move-in ${r.date} · COI missing · Elevator not booked</div>
            </div>
            <button class="btn-small" onclick="navigate('residents')">View →</button>
          </div>
        `).join('')}
      ` : ''}

      <div class="section-header">📅 This Week — Elevator Schedule</div>
      ${Object.entries(state.schedule).map(([date, bookings]) => `
        <div class="schedule-day">
          <div class="schedule-date">${date}</div>
          ${bookings.map(b => `
            <div class="schedule-item ${b.status==='unconfirmed'?'schedule-item--warn':''}">
              <span class="schedule-time">${b.slot}</span>
              <span class="schedule-resident">${b.resident} · Unit ${b.unit}</span>
              ${badge(b.status)}
            </div>
          `).join('')}
        </div>
      `).join('')}
      <div class="view-all-btn" onclick="navigate('schedule')">View full schedule →</div>
    </div>
  `;
}

// ── Staff: COI Review ──────────────────────────────────────────────────────

function renderStaffCOIReview() {
  if (state.selectedCOI !== null) return renderCOIDetail();
  const pending = state.pendingCOIs.filter(c => c.status === 'under_review').length;
  return `
    <div class="screen-content">
      <div class="screen-header">
        <button class="back-btn" onclick="navigate('dashboard')">← Dashboard</button>
        <h2 class="screen-title">COI Review Queue</h2>
      </div>
      <div class="queue-summary">${pending} pending · ${state.pendingCOIs.length - pending} processed</div>
      ${state.pendingCOIs.map(coi => `
        <div class="coi-row" onclick="state.selectedCOI=${coi.id};render()">
          <div>
            <div class="coi-resident">${coi.name}</div>
            <div class="coi-meta">Unit ${coi.unit} · Move-in ${coi.moveIn} · Submitted ${coi.submitted} · ${coi.file}</div>
          </div>
          <div class="coi-row-right">${badge(coi.status)}<span style="color:#94a3b8;margin-left:6px">›</span></div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderCOIDetail() {
  const coi = state.pendingCOIs.find(c => c.id === state.selectedCOI);
  if (!coi) return '';
  const hasIssue = !coi.additionalInsured;
  return `
    <div class="screen-content">
      <div class="screen-header">
        <button class="back-btn" onclick="state.selectedCOI=null;render()">← COI Queue</button>
        <h2 class="screen-title">Review COI</h2>
      </div>
      <div class="coi-detail-header">
        <div><div class="coi-name">${coi.name}</div><div class="coi-unit">Unit ${coi.unit} · Move-in ${coi.moveIn}</div></div>
        ${badge(coi.status)}
      </div>
      <div class="coi-preview">
        <div class="coi-preview-header">📄 ${coi.file}</div>
        <div class="coi-field"><span class="cf-label">Policyholder</span><span class="cf-value">${coi.name}</span></div>
        <div class="coi-field"><span class="cf-label">Provider</span><span class="cf-value">${coi.provider}</span></div>
        <div class="coi-field"><span class="cf-label">Liability Coverage</span><span class="cf-value">${coi.coverage}</span></div>
        <div class="coi-field"><span class="cf-label">Policy Expiry</span><span class="cf-value">${coi.expiry}</span></div>
        <div class="coi-field">
          <span class="cf-label">Additional Insured</span>
          <span class="cf-value ${hasIssue?'cf-warn':''}">${hasIssue?'⚠ The Meridian LLC — NOT listed':'✓ The Meridian LLC'}</span>
        </div>
      </div>
      ${hasIssue ? `
        <div class="coi-issue-card">
          <div class="ci-title">⚠️ Issue Found</div>
          <div class="ci-desc">The Meridian LLC is not listed as additional insured. Resident must update their policy and resubmit.</div>
        </div>
      ` : ''}
      ${coi.status === 'under_review' ? `
        <div class="review-actions">
          <button class="btn-reject"  onclick="rejectCOI(${coi.id})">✗ Reject</button>
          <button class="btn-approve" onclick="approveCOI(${coi.id})">✓ Approve COI</button>
        </div>
      ` : `
        <div style="padding:16px;text-align:center;font-size:16px;font-weight:800;color:${coi.status==='approved'?'#16a34a':'#dc2626'}">
          ${coi.status==='approved'?'✅ Approved':'❌ Rejected'}
        </div>
      `}
    </div>
  `;
}

function approveCOI(id) {
  const coi = state.pendingCOIs.find(c => c.id === id);
  if (coi) coi.status = 'approved';
  const r = state.residents.find(r => r.name === coi.name);
  if (r) r.coi = 'approved';
  state.selectedCOI = null;
  render();
}

function rejectCOI(id) {
  const reason = prompt('Enter rejection reason (sent to resident):');
  if (reason === null) return;
  const coi = state.pendingCOIs.find(c => c.id === id);
  if (coi) { coi.status = 'rejected'; coi.rejectedReason = reason; }
  state.selectedCOI = null;
  render();
}

// ── Staff: Schedule ────────────────────────────────────────────────────────

function renderStaffSchedule() {
  const allDates = ['Mar 25','Mar 26','Mar 27','Mar 28','Mar 30','Mar 31'];
  const allSlots = ['8am–11am','11am–2pm','2pm–5pm'];
  return `
    <div class="screen-content">
      <div class="screen-header">
        <button class="back-btn" onclick="navigate('dashboard')">← Dashboard</button>
        <h2 class="screen-title">Elevator Schedule — Service Elevator A</h2>
      </div>
      <div class="schedule-legend">
        <span class="legend-item"><span class="legend-dot legend-dot--green"></span>Confirmed</span>
        <span class="legend-item"><span class="legend-dot legend-dot--yellow"></span>Unconfirmed</span>
        <span class="legend-item"><span class="legend-dot legend-dot--gray"></span>Available</span>
      </div>
      ${allDates.map(date => {
        const dayBookings = state.schedule[date] || [];
        return `
          <div class="schedule-block">
            <div class="schedule-block-header">${date}</div>
            ${allSlots.map(slot => {
              const b = dayBookings.find(b => b.slot === slot);
              return `
                <div class="schedule-slot-row">
                  <div class="slot-time-label">${slot}</div>
                  ${b
                    ? `<div class="slot-booking slot-booking--${b.status==='confirmed'?'ok':'warn'}">${b.resident} · Unit ${b.unit} ${b.status==='confirmed'?'✓':'⚠ COI pending'}</div>`
                    : '<div class="slot-empty">Available</div>'}
                </div>
              `;
            }).join('')}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ── Staff: Residents ───────────────────────────────────────────────────────

function renderStaffResidents() {
  const { residents } = state;
  const full = residents.filter(r=>r.compliance==='full').length;
  const partial = residents.filter(r=>r.compliance==='partial').length;
  const none = residents.filter(r=>r.compliance==='none').length;
  return `
    <div class="screen-content">
      <div class="screen-header">
        <button class="back-btn" onclick="navigate('dashboard')">← Dashboard</button>
        <h2 class="screen-title">Upcoming Move-Ins</h2>
      </div>
      <div class="residents-summary">
        <div class="rs-stat"><span class="rs-num">${residents.length}</span><span class="rs-label">Total</span></div>
        <div class="rs-stat"><span class="rs-num" style="color:#16a34a">${full}</span><span class="rs-label">Compliant</span></div>
        <div class="rs-stat"><span class="rs-num" style="color:#d97706">${partial}</span><span class="rs-label">Partial</span></div>
        <div class="rs-stat"><span class="rs-num" style="color:#dc2626">${none}</span><span class="rs-label">Non-compliant</span></div>
      </div>
      <table class="residents-table">
        <thead>
          <tr><th>Resident</th><th>Move-in</th><th>COI</th><th>Elevator</th><th>Utilities</th></tr>
        </thead>
        <tbody>
          ${residents.map(r => `
            <tr class="${r.compliance==='none'?'row-danger':r.compliance==='partial'?'row-warn':''}">
              <td><strong>${r.name}</strong><br><span style="color:#64748b;font-size:12px">Unit ${r.unit}</span></td>
              <td style="font-weight:600">${r.date}</td>
              <td>${badge(r.coi==='approved'?'approved':r.coi==='pending'?'pending':'missing')}</td>
              <td>${badge(r.elevator==='booked'?'booked':'missing')}</td>
              <td>${badge(r.utilities==='complete'?'complete':r.utilities==='partial'?'partial':'not_started')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ── Layout ─────────────────────────────────────────────────────────────────

function renderLayout(contentFn) {
  const role = state.role;
  const currentScreen = role==='movingin' ? state.movingInScreen
                      : role==='current'  ? state.currentResidentScreen
                      :                    state.staffScreen;

  const navConfigs = {
    movingin: [
      { id:'dashboard', icon:'🏠', label:'My Move-In'         },
      { id:'coi',       icon:'📄', label:'Insurance (COI)'    },
      { id:'elevator',  icon:'🛗', label:'Elevator Booking'   },
      { id:'utilities', icon:'⚡', label:'Utilities & Internet'}
    ],
    current: [
      { id:'feed',     icon:'🔔', label:'Notifications', badge: state.current.notifications.filter(n=>!n.read).length || null },
      { id:'calendar', icon:'📅', label:'Building Calendar' },
      { id:'settings', icon:'⚙️', label:'Settings'          }
    ],
    staff: [
      { id:'dashboard',  icon:'📊', label:'Operations'         },
      { id:'coi-review', icon:'📄', label:'COI Review',  badge: state.pendingCOIs.filter(c=>c.status==='under_review').length },
      { id:'schedule',   icon:'📅', label:'Schedule'          },
      { id:'residents',  icon:'👥', label:'All Residents'      }
    ]
  };

  const navItems = navConfigs[role];

  const sectionLabel = role==='movingin' ? 'Move-In Setup'
                     : role==='current'  ? 'My Building'
                     :                    'Staff Portal';

  return `
    <div class="app-layout">
      <header class="topbar">
        <div class="topbar-brand">
          <div class="logo">Home<span>Base</span></div>
          <div class="logo-badge">Move-In MVP</div>
        </div>
        <div class="role-switcher">
          <button class="role-btn ${role==='movingin'?'role-btn--active':''}" onclick="switchRole('movingin')">📦 Moving In</button>
          <button class="role-btn ${role==='current' ?'role-btn--active':''}" onclick="switchRole('current')">🏘️ Current Resident</button>
          <button class="role-btn ${role==='staff'   ?'role-btn--active':''}" onclick="switchRole('staff')">🏢 Building Staff</button>
        </div>
      </header>

      <div class="app-body">
        <nav class="sidebar">
          <div class="sidebar-section-label">${sectionLabel}</div>
          ${navItems.map(item => `
            <div class="nav-item ${currentScreen===item.id?'nav-item--active':''}" onclick="navigate('${item.id}')">
              <span class="nav-icon">${item.icon}</span>
              <span class="nav-label">${item.label}</span>
              ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
            </div>
          `).join('')}
        </nav>

        <main class="main-content">
          ${contentFn()}
        </main>
      </div>
    </div>
  `;
}

// ── Render ─────────────────────────────────────────────────────────────────

function render() {
  let contentFn;
  if (state.role === 'movingin') {
    const map = { dashboard:renderMovingInDashboard, coi:renderMovingInCOI, elevator:renderMovingInElevator, utilities:renderMovingInUtilities };
    contentFn = map[state.movingInScreen] || renderMovingInDashboard;
  } else if (state.role === 'current') {
    const map = { feed:renderCurrentFeed, calendar:renderCurrentCalendar, settings:renderCurrentSettings };
    contentFn = map[state.currentResidentScreen] || renderCurrentFeed;
  } else {
    const map = { dashboard:renderStaffDashboard, 'coi-review':renderStaffCOIReview, schedule:renderStaffSchedule, residents:renderStaffResidents };
    contentFn = map[state.staffScreen] || renderStaffDashboard;
  }
  document.getElementById('app').innerHTML = renderLayout(contentFn);
}

render();
