// ── State ──────────────────────────────────────────────────────────────────

const state = {
  role: 'resident',
  residentScreen: 'dashboard',
  staffScreen: 'dashboard',

  resident: {
    name: 'Alex Johnson',
    unit: '14B',
    building: 'The Meridian',
    moveInDate: 'March 28, 2026',
    daysUntil: 19,

    coi: {
      status: 'under_review', // not_started | under_review | approved | rejected
      fileName: 'AlexJohnson_StateFarm_COI.pdf',
      uploadedAt: 'March 9, 2026'
    },

    elevator: {
      status: 'booked', // not_booked | booked
      date: 'March 28, 2026',
      slot: '8am–11am',
      elevator: 'Service Elevator A',
      confirmationCode: 'ELV-20260328-14B'
    },

    utilities: {
      electric: { status: 'complete',     provider: 'ConEd',   accountNum: 'CON-***8821' },
      gas:      { status: 'not_started',  provider: null },
      internet: { status: 'scheduled',    provider: 'Xfinity', scheduledDate: 'March 27' }
    }
  },

  pendingCOIs: [
    { id: 1, name: 'Alex Johnson', unit: '14B',  moveIn: 'Mar 28', status: 'under_review',
      file: 'AlexJohnson_StateFarm_COI.pdf', submitted: 'Mar 9',
      coverage: '$300,000 liability', provider: 'State Farm', expiry: 'Dec 2026',
      additionalInsured: true },
    { id: 2, name: 'Maria Santos', unit: '7A',   moveIn: 'Mar 25', status: 'under_review',
      file: 'Santos_Lemonade_COI.pdf', submitted: 'Mar 8',
      coverage: '$100,000 liability', provider: 'Lemonade',   expiry: 'Jan 2027',
      additionalInsured: false },
    { id: 3, name: 'David Kim',    unit: '22C',  moveIn: 'Mar 30', status: 'under_review',
      file: 'DavidKim_Allstate.pdf', submitted: 'Mar 10',
      coverage: '$500,000 liability', provider: 'Allstate',   expiry: 'Oct 2026',
      additionalInsured: true },
    { id: 4, name: 'Emma Wilson',  unit: '5D',   moveIn: 'Apr 1',  status: 'under_review',
      file: 'Wilson_Progressive.pdf', submitted: 'Mar 11',
      coverage: '$200,000 liability', provider: 'Progressive', expiry: 'Mar 2027',
      additionalInsured: true }
  ],

  residents: [
    { name: 'Maria Santos', unit: '7A',  date: 'Mar 25', coi: 'approved',  elevator: 'booked',   utilities: 'partial',     compliance: 'partial' },
    { name: 'James Lee',    unit: '11F', date: 'Mar 26', coi: 'approved',  elevator: 'booked',   utilities: 'complete',    compliance: 'full'    },
    { name: 'Alex Johnson', unit: '14B', date: 'Mar 28', coi: 'pending',   elevator: 'booked',   utilities: 'partial',     compliance: 'partial' },
    { name: 'Chris Park',   unit: '3B',  date: 'Mar 28', coi: 'missing',   elevator: 'missing',  utilities: 'not_started', compliance: 'none'    },
    { name: 'David Kim',    unit: '22C', date: 'Mar 30', coi: 'pending',   elevator: 'booked',   utilities: 'not_started', compliance: 'partial' },
    { name: 'Emma Wilson',  unit: '5D',  date: 'Apr 1',  coi: 'pending',   elevator: 'missing',  utilities: 'not_started', compliance: 'none'    }
  ],

  schedule: {
    'Mar 25': [{ resident: 'Maria Santos', unit: '7A',  slot: '8am–11am',  status: 'confirmed' }],
    'Mar 26': [{ resident: 'James Lee',    unit: '11F', slot: '11am–2pm',  status: 'confirmed' }],
    'Mar 28': [
      { resident: 'Alex Johnson', unit: '14B', slot: '8am–11am', status: 'confirmed' },
      { resident: 'Chris Park',   unit: '3B',  slot: '11am–2pm', status: 'unconfirmed' }
    ],
    'Mar 30': [{ resident: 'David Kim', unit: '22C', slot: '8am–11am', status: 'confirmed' }]
  },

  selectedCOI: null,

  elevatorBooking: { step: 0, selectedDate: null, selectedSlot: null },
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

// ── Navigation ─────────────────────────────────────────────────────────────

function navigate(screen) {
  if (state.role === 'resident') state.residentScreen = screen;
  else state.staffScreen = screen;
  state.selectedCOI = null;
  render();
}

function switchRole(role) {
  state.role = role;
  render();
}

// ── Resident: Dashboard ────────────────────────────────────────────────────

function renderResidentDashboard() {
  const { resident } = state;
  const steps = [
    resident.coi.status === 'approved',
    resident.elevator.status === 'booked',
    false // utilities partial
  ];
  const done = steps.filter(Boolean).length;
  const pct = Math.round(done / 3 * 100);

  return `
    <div class="screen-content">
      <div class="welcome-banner">
        <div>
          <div class="welcome-greeting">Hi, ${resident.name} 👋</div>
          <div class="welcome-subtitle">
            Move-in: <strong>${resident.moveInDate}</strong> · Unit ${resident.unit}<br>
            ${resident.building}
          </div>
        </div>
        <div class="welcome-meta">
          <div class="welcome-days">${resident.daysUntil}</div>
          <div class="welcome-days-label">days away</div>
        </div>
      </div>

      <div class="progress-section">
        <div class="progress-header">
          <span>${done} of 3 steps complete</span>
          <span>${pct}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
      </div>

      <div class="steps-grid">
        <div class="step-card ${resident.coi.status === 'approved' ? 'step-card--done' : ''}" onclick="navigate('coi')">
          <div class="step-icon">${resident.coi.status === 'approved' ? '✅' : '📄'}</div>
          <div class="step-info">
            <div class="step-title">Certificate of Insurance (COI)</div>
            <div class="step-desc">Required by your building before move-in day</div>
            <div class="step-status">${badge(resident.coi.status)}</div>
          </div>
          <div class="step-arrow">›</div>
        </div>

        <div class="step-card ${resident.elevator.status === 'booked' ? 'step-card--done' : ''}" onclick="navigate('elevator')">
          <div class="step-icon">${resident.elevator.status === 'booked' ? '✅' : '🛗'}</div>
          <div class="step-info">
            <div class="step-title">Elevator Reservation</div>
            <div class="step-desc">${resident.elevator.status === 'booked'
              ? `${resident.elevator.slot} · ${resident.elevator.elevator}`
              : 'Reserve your move-in elevator window'}</div>
            <div class="step-status">${badge(resident.elevator.status)}</div>
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
          <li>Move-ins are Mon–Sat, 8am–5pm (no Sundays)</li>
          <li>Service elevator must be reserved in advance — no passenger elevator use</li>
          <li>COI must be approved before your move-in date</li>
          <li>Professional movers required for items over 100 lbs</li>
          <li>Loading dock entrance is on the west side of the building</li>
        </ul>
      </div>
    </div>
  `;
}

// ── Resident: COI ─────────────────────────────────────────────────────────

function renderResidentCOI() {
  const { coi } = state.resident;
  return `
    <div class="screen-content">
      <div class="screen-header">
        <button class="back-btn" onclick="navigate('dashboard')">← Dashboard</button>
        <h2 class="screen-title">Certificate of Insurance</h2>
      </div>

      <div class="explainer-card">
        <div class="explainer-title">What is a COI?</div>
        <div class="explainer-text">
          A Certificate of Insurance proves you have renter's insurance. The Meridian requires
          <strong>$100,000+ in liability coverage</strong> with the building listed as an additional insured party.
          Your insurance provider can issue this document for free.
        </div>
      </div>

      ${coi.status === 'not_started' ? renderCOIUpload() : ''}
      ${coi.status === 'under_review' ? renderCOIUnderReview() : ''}
      ${coi.status === 'approved'     ? renderCOIApproved()   : ''}
      ${coi.status === 'rejected'     ? renderCOIRejected()   : ''}

      <div class="requirements-card">
        <div class="req-title">COI Checklist</div>
        <div class="req-list">
          ${[
            '$100,000+ liability coverage',
            'The Meridian LLC listed as additional insured',
            'Policy valid through your move-in date',
            'Issued by a licensed US insurance provider',
            'Your full legal name on the policy'
          ].map(r => `
            <div class="req-item">
              <span class="req-check">✓</span>
              <span>${r}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderCOIUpload() {
  return `
    <div class="upload-zone" id="uploadZone"
         ondragover="event.preventDefault(); this.classList.add('upload-zone--active')"
         ondragleave="this.classList.remove('upload-zone--active')"
         ondrop="event.preventDefault(); this.classList.remove('upload-zone--active'); simulateCOIUpload()"
         onclick="simulateCOIUpload()">
      <div class="upload-icon">📤</div>
      <div class="upload-text">Drop your COI here or click to upload</div>
      <div class="upload-subtext">PDF, JPG, PNG · max 10 MB</div>
    </div>
    <div style="text-align:center; font-size:13px; color:#64748b; margin-bottom:16px">
      No policy yet? <a href="#" onclick="event.preventDefault(); alert('Partner ISPs and insurance providers page')" style="color:#2563eb; font-weight:600">Find a provider →</a>
    </div>
  `;
}

function renderCOIUnderReview() {
  return `
    <div class="status-card status-card--yellow">
      <div class="status-card-icon">⏳</div>
      <div class="status-card-content">
        <div class="status-card-title">Your COI is under review</div>
        <div class="status-card-desc">Building staff will review within 1–2 business days. You'll be notified by email when it's approved or if any changes are needed.</div>
      </div>
    </div>
    <div class="uploaded-file-card">
      <div class="file-icon">📄</div>
      <div class="file-info">
        <div class="file-name">${state.resident.coi.fileName}</div>
        <div class="file-meta">Uploaded ${state.resident.coi.uploadedAt}</div>
      </div>
      <button class="btn-link" onclick="state.resident.coi.status='not_started'; render()">Replace file</button>
    </div>
  `;
}

function renderCOIApproved() {
  return `
    <div class="status-card status-card--green">
      <div class="status-card-icon">✅</div>
      <div class="status-card-content">
        <div class="status-card-title">COI Approved — you're all set!</div>
        <div class="status-card-desc">Your insurance meets all building requirements. No further action needed on this step.</div>
      </div>
    </div>
    <div class="uploaded-file-card">
      <div class="file-icon">📄</div>
      <div class="file-info">
        <div class="file-name">${state.resident.coi.fileName}</div>
        <div class="file-meta">Approved · Uploaded ${state.resident.coi.uploadedAt}</div>
      </div>
    </div>
  `;
}

function renderCOIRejected() {
  return `
    <div class="status-card status-card--red">
      <div class="status-card-icon">❌</div>
      <div class="status-card-content">
        <div class="status-card-title">COI Rejected — action required</div>
        <div class="status-card-desc"><strong>Reason:</strong> Coverage amount is below the required $100,000 minimum. Please update your policy and re-upload the new COI document.</div>
      </div>
    </div>
    ${renderCOIUpload()}
  `;
}

function simulateCOIUpload() {
  state.resident.coi.status = 'under_review';
  state.resident.coi.fileName = 'AlexJohnson_Updated_COI.pdf';
  state.resident.coi.uploadedAt = 'March 9, 2026';
  render();
}

// ── Resident: Elevator ─────────────────────────────────────────────────────

const ELEVATOR_DATES = [
  { date: 'Mar 26', day: 'Thu', available: true },
  { date: 'Mar 27', day: 'Fri', available: true },
  { date: 'Mar 28', day: 'Sat', available: true },
  { date: 'Mar 29', day: 'Sun', available: false, reason: 'Sundays unavailable' },
  { date: 'Mar 30', day: 'Mon', available: false, reason: 'Fully booked' },
  { date: 'Mar 31', day: 'Tue', available: true },
  { date: 'Apr 1',  day: 'Wed', available: true }
];

const ELEVATOR_SLOTS = [
  { id: '8am',  label: '8am–11am',  available: true  },
  { id: '11am', label: '11am–2pm',  available: false },
  { id: '2pm',  label: '2pm–5pm',   available: true  }
];

function renderResidentElevator() {
  const { elevator } = state.resident;

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
            <div class="status-card-title">Elevator reserved — you're confirmed!</div>
            <div class="status-card-desc">Your service elevator window is locked in. Check in at the building office before using it on move-in day.</div>
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
            <li>Overtime fee: $75/hour for each hour past your reserved window</li>
            <li>Cancellations must be made at least 48 hours in advance</li>
          </ul>
        </div>
        <button class="btn-secondary" style="width:auto; display:inline-block; padding: 10px 20px"
          onclick="state.resident.elevator.status='not_booked'; state.elevatorBooking={step:0,selectedDate:null,selectedSlot:null}; render()">
          Modify Reservation
        </button>
      </div>
    `;
  }

  // Booking flow
  const bk = state.elevatorBooking;
  return `
    <div class="screen-content">
      <div class="screen-header">
        <button class="back-btn" onclick="navigate('dashboard')">← Dashboard</button>
        <h2 class="screen-title">Book Elevator</h2>
      </div>

      <div class="booking-steps">
        <div class="booking-step ${bk.step >= 0 ? 'active' : ''}">1. Choose date</div>
        <div class="booking-step-sep">›</div>
        <div class="booking-step ${bk.step >= 1 ? 'active' : ''}">2. Choose time</div>
        <div class="booking-step-sep">›</div>
        <div class="booking-step ${bk.step >= 2 ? 'active' : ''}">3. Confirm</div>
      </div>

      ${bk.step === 0 ? renderDateSelection() : ''}
      ${bk.step === 1 ? renderSlotSelection() : ''}
      ${bk.step === 2 ? renderBookingConfirmation() : ''}
    </div>
  `;
}

function renderDateSelection() {
  const bk = state.elevatorBooking;
  return `
    <div class="date-grid">
      ${ELEVATOR_DATES.map(d => `
        <div class="date-card ${!d.available ? 'date-card--disabled' : ''} ${bk.selectedDate === d.date ? 'date-card--selected' : ''}"
             onclick="${d.available ? `selectDate('${d.date}')` : ''}">
          <div class="date-day">${d.day}</div>
          <div class="date-date">${d.date}</div>
          ${d.available
            ? '<div class="date-avail">Available</div>'
            : `<div class="date-reason">${d.reason}</div>`}
        </div>
      `).join('')}
    </div>
    ${bk.selectedDate ? `<button class="btn-primary" onclick="state.elevatorBooking.step=1; render()">Continue →</button>` : ''}
  `;
}

function selectDate(date) {
  state.elevatorBooking.selectedDate = date;
  state.elevatorBooking.selectedSlot = null;
  render();
}

function renderSlotSelection() {
  const bk = state.elevatorBooking;
  return `
    <div class="slot-header">Available windows for <strong>${bk.selectedDate}, 2026</strong> · Service Elevator A</div>
    <div class="slot-list">
      ${ELEVATOR_SLOTS.map(s => `
        <div class="slot-card ${!s.available ? 'slot-card--taken' : ''} ${bk.selectedSlot === s.id ? 'slot-card--selected' : ''}"
             onclick="${s.available ? `selectSlot('${s.id}')` : ''}">
          <div class="slot-time">${s.label}</div>
          <div class="slot-status">${s.available ? '✓ Available' : 'Taken'}</div>
        </div>
      `).join('')}
    </div>
    <div class="slot-note">⏱ Each window is 3 hours · Overtime: $75/hour</div>
    ${bk.selectedSlot ? `<button class="btn-primary" onclick="state.elevatorBooking.step=2; render()">Review Booking →</button>` : ''}
    <button class="btn-secondary" onclick="state.elevatorBooking.step=0; render()">← Change Date</button>
  `;
}

function selectSlot(id) {
  state.elevatorBooking.selectedSlot = id;
  render();
}

function renderBookingConfirmation() {
  const bk = state.elevatorBooking;
  const slotLabel = ELEVATOR_SLOTS.find(s => s.id === bk.selectedSlot)?.label || '';
  return `
    <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:20px 22px">
      <div style="font-size:16px; font-weight:800; margin-bottom:16px">Confirm Your Booking</div>
      <div class="booking-details-card" style="margin-bottom:0">
        <div class="booking-detail"><span class="bd-label">Date</span><span class="bd-value">${bk.selectedDate}, 2026</span></div>
        <div class="booking-detail"><span class="bd-label">Time Window</span><span class="bd-value">${slotLabel}</span></div>
        <div class="booking-detail"><span class="bd-label">Elevator</span><span class="bd-value">Service Elevator A</span></div>
        <div class="booking-detail"><span class="bd-label">Unit</span><span class="bd-value">${state.resident.unit}</span></div>
      </div>
      <p class="confirm-policy">By confirming, you agree to the elevator usage policy. Cancellations must be made 48+ hours in advance or a $50 fee applies.</p>
      <div class="btn-row">
        <button class="btn-secondary" onclick="state.elevatorBooking.step=1; render()">← Change Time</button>
        <button class="btn-primary" onclick="confirmElevatorBooking()">Confirm Reservation ✓</button>
      </div>
    </div>
  `;
}

function confirmElevatorBooking() {
  const bk = state.elevatorBooking;
  const slotLabel = ELEVATOR_SLOTS.find(s => s.id === bk.selectedSlot)?.label || '';
  state.resident.elevator = {
    status: 'booked',
    date: `${bk.selectedDate}, 2026`,
    slot: slotLabel,
    elevator: 'Service Elevator A',
    confirmationCode: `ELV-2026${bk.selectedDate.replace(' ','').replace(' ','')}-${state.resident.unit}`
  };
  render();
}

// ── Resident: Utilities ────────────────────────────────────────────────────

const PROVIDERS = {
  electric: ['ConEd', 'National Grid', 'Direct Energy', 'Green Mountain Energy'],
  gas:      ['ConEd', 'National Fuel',  'Sprague Energy', 'Direct Energy'],
  internet: ['Xfinity', 'Spectrum', 'Verizon Fios', 'RCN']
};

function renderResidentUtilities() {
  const { utilities } = state.resident;
  const step = state.utilitiesStep;

  return `
    <div class="screen-content">
      <div class="screen-header">
        <button class="back-btn" onclick="navigate('dashboard')">← Dashboard</button>
        <h2 class="screen-title">Utilities & Internet Setup</h2>
      </div>

      <div class="utilities-overview">
        ${utilityRow('electric', '⚡', 'Electric',  utilities.electric)}
        ${utilityRow('gas',      '🔥', 'Gas',       utilities.gas)}
        ${utilityRow('internet', '🌐', 'Internet',  utilities.internet)}
      </div>

      ${step === 0 ? renderUtilitiesHome() : ''}
      ${step === 1 ? renderUtilitySetup('electric', 'Electric Provider', '⚡') : ''}
      ${step === 2 ? renderUtilitySetup('gas',      'Gas Provider',      '🔥') : ''}
      ${step === 3 ? renderUtilitySetup('internet', 'Internet Provider', '🌐') : ''}
      ${step === 4 ? renderUtilitiesDone() : ''}
    </div>
  `;
}

function utilityRow(type, icon, label, data) {
  const statusMap = { complete: 'badge-green', scheduled: 'badge-blue', not_started: 'badge-gray' };
  const labelMap  = { complete: '✓ Complete',  scheduled: '📅 Scheduled', not_started: 'Not started' };
  const stepMap   = { electric: 1, gas: 2, internet: 3 };
  return `
    <div class="utility-row" onclick="state.utilitiesStep=${stepMap[type]}; render()">
      <span class="utility-icon">${icon}</span>
      <span class="utility-label">${label}</span>
      ${data.provider ? `<span class="utility-provider">${data.provider}</span>` : '<span class="utility-provider"></span>'}
      <span class="badge ${statusMap[data.status]}">${labelMap[data.status]}</span>
      <span style="margin-left:8px; color:#94a3b8">›</span>
    </div>
  `;
}

function renderUtilitiesHome() {
  return `
    <div class="utilities-cta">
      <div class="utilities-cta-text">
        Set up your utilities before move-in day to avoid any gaps in service.<br>
        We partner with local providers for quick, hassle-free setup.
      </div>
      <button class="btn-primary" style="width:auto; display:inline-block; padding:12px 28px" onclick="state.utilitiesStep=1; render()">Start Setup →</button>
    </div>
  `;
}

function renderUtilitySetup(type, title, icon) {
  const data = state.resident.utilities[type];
  const nextStep = type === 'electric' ? 2 : type === 'gas' ? 3 : 4;
  const prevStep = type === 'electric' ? 0 : type === 'gas' ? 1 : 2;

  return `
    <div class="utility-setup-card">
      <div class="utility-setup-title">${icon} ${title}</div>

      ${(data.status === 'complete' || data.status === 'scheduled') ? `
        <div class="status-card status-card--${data.status === 'complete' ? 'green' : 'blue'}" style="margin-bottom:14px">
          <div class="status-card-icon">${data.status === 'complete' ? '✅' : '📅'}</div>
          <div class="status-card-content">
            <div class="status-card-title">${data.provider} — ${data.status === 'complete' ? 'Active' : 'Scheduled'}</div>
            <div class="status-card-desc">${data.status === 'complete' ? `Account: ${data.accountNum || 'Active'}` : `Installation on ${data.scheduledDate}`}</div>
          </div>
        </div>
        <div style="font-size:12.5px; color:#64748b; margin-bottom:12px">Want to change provider? Select another below.</div>
      ` : ''}

      ${data.status === 'not_started' ? `
        <div class="provider-list" style="margin-bottom:14px">
          ${PROVIDERS[type].map(p => `
            <div class="provider-card" onclick="selectProvider('${type}', '${p}')">
              <div class="provider-logo">${p[0]}</div>
              <div class="provider-name">${p}</div>
              <div class="provider-arrow">›</div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="provider-list" style="margin-bottom:14px">
          ${PROVIDERS[type].map(p => `
            <div class="provider-card" onclick="selectProvider('${type}', '${p}')">
              <div class="provider-logo">${p[0]}</div>
              <div class="provider-name">${p}</div>
              <div class="provider-arrow">›</div>
            </div>
          `).join('')}
        </div>
      `}

      <div class="btn-row">
        <button class="btn-secondary" onclick="state.utilitiesStep=${prevStep}; render()">← Back</button>
        <button class="btn-primary" onclick="state.utilitiesStep=${nextStep}; render()">
          ${nextStep === 4 ? 'Finish ✓' : 'Next →'}
        </button>
      </div>
    </div>
  `;
}

function selectProvider(type, provider) {
  state.resident.utilities[type] = {
    status: type === 'electric' ? 'complete' : 'scheduled',
    provider,
    accountNum: type === 'electric' ? 'CON-***' + Math.floor(Math.random()*9000+1000) : undefined,
    scheduledDate: type !== 'electric' ? 'March 27' : undefined
  };
  render();
}

function renderUtilitiesDone() {
  return `
    <div class="status-card status-card--green">
      <div class="status-card-icon">🎉</div>
      <div class="status-card-content">
        <div class="status-card-title">Utilities setup complete!</div>
        <div class="status-card-desc">Great work — we'll send reminder emails as your installation dates approach. All set for move-in day!</div>
      </div>
    </div>
    <button class="btn-primary" onclick="navigate('dashboard')">← Back to Dashboard</button>
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
        <div class="kpi-card kpi-card--blue" onclick="navigate('schedule')">
          <div class="kpi-number">5</div>
          <div class="kpi-label">Moves This Week</div>
        </div>
        <div class="kpi-card kpi-card--yellow" onclick="navigate('coi-review')">
          <div class="kpi-number">${state.pendingCOIs.filter(c => c.status === 'under_review').length}</div>
          <div class="kpi-label">COIs Pending Review</div>
        </div>
        <div class="kpi-card kpi-card--red" onclick="navigate('schedule')">
          <div class="kpi-number">1</div>
          <div class="kpi-label">Scheduling Conflicts</div>
        </div>
        <div class="kpi-card kpi-card--green" onclick="navigate('residents')">
          <div class="kpi-number">72%</div>
          <div class="kpi-label">Compliance Rate</div>
        </div>
      </div>

      ${urgent.length ? `
        <div class="section-header">⚠️ Needs Immediate Attention</div>
        ${urgent.map(r => `
          <div class="alert-card">
            <div class="alert-icon">⚠️</div>
            <div class="alert-content">
              <div class="alert-title">${r.name} · Unit ${r.unit}</div>
              <div class="alert-desc">Move-in ${r.date} · COI not submitted · Elevator not booked · ${Math.abs(getDaysUntil(r.date))} days remaining</div>
            </div>
            <button class="btn-small" onclick="navigate('residents')">View →</button>
          </div>
        `).join('')}
      ` : ''}

      <div class="section-header">📅 This Week's Elevator Schedule</div>
      ${Object.entries(state.schedule).map(([date, bookings]) => `
        <div class="schedule-day">
          <div class="schedule-date">${date}</div>
          ${bookings.map(b => `
            <div class="schedule-item ${b.status === 'unconfirmed' ? 'schedule-item--warn' : ''}">
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

function getDaysUntil(dateStr) {
  const months = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
  const [mon, day] = dateStr.split(' ');
  const target = new Date(2026, months[mon], parseInt(day));
  const today  = new Date(2026, 2, 9);
  return Math.ceil((target - today) / 86400000);
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

      <div class="queue-summary">${pending} pending review · ${state.pendingCOIs.length - pending} processed</div>

      ${state.pendingCOIs.map(coi => `
        <div class="coi-row" onclick="state.selectedCOI=${coi.id}; render()">
          <div>
            <div class="coi-resident">${coi.name}</div>
            <div class="coi-meta">Unit ${coi.unit} · Move-in ${coi.moveIn} · Submitted ${coi.submitted} · ${coi.file}</div>
          </div>
          <div class="coi-row-right">
            ${badge(coi.status)}
            <span style="color:#94a3b8; margin-left:6px">›</span>
          </div>
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
        <button class="back-btn" onclick="state.selectedCOI=null; render()">← COI Queue</button>
        <h2 class="screen-title">Review COI</h2>
      </div>

      <div class="coi-detail-header">
        <div class="coi-resident-info">
          <div class="coi-name">${coi.name}</div>
          <div class="coi-unit">Unit ${coi.unit} · Move-in ${coi.moveIn}</div>
        </div>
        ${badge(coi.status)}
      </div>

      <div class="coi-preview">
        <div class="coi-preview-header">📄 ${coi.file}</div>
        <div class="coi-field"><span class="cf-label">Policyholder</span><span class="cf-value">${coi.name}</span></div>
        <div class="coi-field"><span class="cf-label">Insurance Provider</span><span class="cf-value">${coi.provider}</span></div>
        <div class="coi-field"><span class="cf-label">Liability Coverage</span>
          <span class="cf-value ${parseInt(coi.coverage.replace(/\D/g,'')) < 100000 ? 'cf-warn' : ''}">
            ${coi.coverage}${parseInt(coi.coverage.replace(/\D/g,'')) < 100000 ? ' ⚠ Below minimum' : ''}
          </span>
        </div>
        <div class="coi-field"><span class="cf-label">Policy Expiry</span><span class="cf-value">${coi.expiry}</span></div>
        <div class="coi-field">
          <span class="cf-label">Additional Insured</span>
          <span class="cf-value ${hasIssue ? 'cf-warn' : ''}">
            ${hasIssue ? '⚠ The Meridian LLC — NOT listed' : '✓ The Meridian LLC'}
          </span>
        </div>
        <div class="coi-field"><span class="cf-label">Submitted</span><span class="cf-value">${coi.submitted}</span></div>
      </div>

      ${hasIssue ? `
        <div class="coi-issue-card">
          <div class="ci-title">⚠️ Issue Found</div>
          <div class="ci-desc">The building (The Meridian LLC) is not listed as an additional insured party on this policy. The resident must contact their insurance provider to add the building and re-submit the updated COI.</div>
        </div>
      ` : ''}

      ${coi.status === 'under_review' ? `
        <div class="review-actions">
          <button class="btn-reject" onclick="rejectCOI(${coi.id})">✗ Reject</button>
          <button class="btn-approve" onclick="approveCOI(${coi.id})">✓ Approve COI</button>
        </div>
      ` : `
        <div style="padding:16px; text-align:center; font-size:16px; font-weight:800; color:${coi.status==='approved'?'#16a34a':'#dc2626'}">
          ${coi.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
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
  const reason = prompt('Enter rejection reason (will be sent to resident):');
  if (reason === null) return;
  const coi = state.pendingCOIs.find(c => c.id === id);
  if (coi) { coi.status = 'rejected'; coi.rejectedReason = reason || 'Does not meet requirements'; }
  state.selectedCOI = null;
  render();
}

// ── Staff: Schedule ────────────────────────────────────────────────────────

function renderStaffSchedule() {
  const allDates = ['Mar 25', 'Mar 26', 'Mar 27', 'Mar 28', 'Mar 30', 'Mar 31'];
  const allSlots = ['8am–11am', '11am–2pm', '2pm–5pm'];

  return `
    <div class="screen-content">
      <div class="screen-header">
        <button class="back-btn" onclick="navigate('dashboard')">← Dashboard</button>
        <h2 class="screen-title">Elevator Schedule — Service Elevator A</h2>
      </div>

      <div class="schedule-legend">
        <span class="legend-item"><span class="legend-dot legend-dot--green"></span> Confirmed</span>
        <span class="legend-item"><span class="legend-dot legend-dot--yellow"></span> Unconfirmed (COI pending)</span>
        <span class="legend-item"><span class="legend-dot legend-dot--gray"></span> Available</span>
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
                    ? `<div class="slot-booking slot-booking--${b.status === 'confirmed' ? 'ok' : 'warn'}">
                         ${b.resident} · Unit ${b.unit} ${b.status === 'confirmed' ? '✓' : '⚠ COI pending'}
                       </div>`
                    : '<div class="slot-empty">Available</div>'
                  }
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
  const full    = residents.filter(r => r.compliance === 'full').length;
  const partial = residents.filter(r => r.compliance === 'partial').length;
  const none    = residents.filter(r => r.compliance === 'none').length;

  return `
    <div class="screen-content">
      <div class="screen-header">
        <button class="back-btn" onclick="navigate('dashboard')">← Dashboard</button>
        <h2 class="screen-title">Upcoming Move-Ins</h2>
      </div>

      <div class="residents-summary">
        <div class="rs-stat">
          <span class="rs-num">${residents.length}</span>
          <span class="rs-label">Total</span>
        </div>
        <div class="rs-stat">
          <span class="rs-num" style="color:#16a34a">${full}</span>
          <span class="rs-label">Compliant</span>
        </div>
        <div class="rs-stat">
          <span class="rs-num" style="color:#d97706">${partial}</span>
          <span class="rs-label">Partial</span>
        </div>
        <div class="rs-stat">
          <span class="rs-num" style="color:#dc2626">${none}</span>
          <span class="rs-label">Non-compliant</span>
        </div>
      </div>

      <table class="residents-table">
        <thead>
          <tr>
            <th>Resident</th>
            <th>Move-in</th>
            <th>COI</th>
            <th>Elevator</th>
            <th>Utilities</th>
          </tr>
        </thead>
        <tbody>
          ${residents.map(r => `
            <tr class="${r.compliance === 'none' ? 'row-danger' : r.compliance === 'partial' ? 'row-warn' : ''}">
              <td><strong>${r.name}</strong><br><span style="color:#64748b;font-size:12px">Unit ${r.unit}</span></td>
              <td style="font-weight:600">${r.date}</td>
              <td>${badge(r.coi === 'approved' ? 'approved' : r.coi === 'pending' ? 'pending' : 'missing')}</td>
              <td>${badge(r.elevator === 'booked' ? 'booked' : 'missing')}</td>
              <td>${badge(r.utilities === 'complete' ? 'complete' : r.utilities === 'partial' ? 'partial' : 'not_started')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ── Layout ─────────────────────────────────────────────────────────────────

function renderLayout(contentFn) {
  const isResident = state.role === 'resident';
  const currentScreen = isResident ? state.residentScreen : state.staffScreen;

  const residentNav = [
    { id: 'dashboard', icon: '🏠', label: 'My Move-In' },
    { id: 'coi',       icon: '📄', label: 'Insurance (COI)' },
    { id: 'elevator',  icon: '🛗', label: 'Elevator Booking' },
    { id: 'utilities', icon: '⚡', label: 'Utilities & Internet' }
  ];

  const staffNav = [
    { id: 'dashboard',  icon: '📊', label: 'Operations',   badge: null },
    { id: 'coi-review', icon: '📄', label: 'COI Review',   badge: state.pendingCOIs.filter(c=>c.status==='under_review').length },
    { id: 'schedule',   icon: '📅', label: 'Elevator Schedule', badge: null },
    { id: 'residents',  icon: '👥', label: 'All Residents', badge: null }
  ];

  const navItems = isResident ? residentNav : staffNav;

  return `
    <div class="app-layout">
      <header class="topbar">
        <div class="topbar-brand">
          <div class="logo">Home<span>Base</span></div>
          <div class="logo-badge">Move-In MVP</div>
        </div>
        <div class="role-switcher">
          <button class="role-btn ${isResident ? 'role-btn--active' : ''}" onclick="switchRole('resident')">
            👤 Resident
          </button>
          <button class="role-btn ${!isResident ? 'role-btn--active' : ''}" onclick="switchRole('staff')">
            🏢 Building Staff
          </button>
        </div>
      </header>

      <div class="app-body">
        <nav class="sidebar">
          <div class="sidebar-section-label">${isResident ? 'Move-In Setup' : 'Staff Portal'}</div>
          ${navItems.map(item => `
            <div class="nav-item ${currentScreen === item.id ? 'nav-item--active' : ''}" onclick="navigate('${item.id}')">
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
  const isResident = state.role === 'resident';
  let contentFn;

  if (isResident) {
    const screenMap = {
      dashboard: renderResidentDashboard,
      coi:       renderResidentCOI,
      elevator:  renderResidentElevator,
      utilities: renderResidentUtilities
    };
    contentFn = screenMap[state.residentScreen] || renderResidentDashboard;
  } else {
    const screenMap = {
      dashboard:  renderStaffDashboard,
      'coi-review': renderStaffCOIReview,
      schedule:   renderStaffSchedule,
      residents:  renderStaffResidents
    };
    contentFn = screenMap[state.staffScreen] || renderStaffDashboard;
  }

  document.getElementById('app').innerHTML = renderLayout(contentFn);
}

render();
