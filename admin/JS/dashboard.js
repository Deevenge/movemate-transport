const chartTheme = {
  text: "#64748b",
  line: "#e2e8f0",
  cyan: "#18c6d8",
  cyanDark: "#0e9dad",
  green: "#22c55e",
  amber: "#f59e0b",
  ink: "#0f172a"
};

const firebaseConfigPaths = [
  "../../JS/firebase-config.js",
  "./firebase-config.js",
  "../firebase-config.js",
  "../../firebase-config.js"
];

const timestampFields = ["createdAt", "created_at", "submitted_at", "updatedAt", "timestamp", "date"];
const riderRoles = ["rider", "passenger"];

const defaultAvatar =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="36" fill="#E7FBFD"/>
      <circle cx="80" cy="62" r="30" fill="#18C6D8"/>
      <path d="M31 139c8-31 27-47 49-47s41 16 49 47" fill="#0F172A"/>
    </svg>
  `);

const state = {
  users: [],
  trips: [],
  bookings: [],
  rideRequests: [],
  chats: [],
  drivers: [],
  riders: [],
  admin: null,
  adminId: "movemate-admin",
  selectedAdminPhoto: null,
  selectedAdminPhotoPreview: null,
  firebaseReady: false,
  openDriverId: null,
  pendingRejectDriverId: null,
  pendingConfirmAction: null
};

const elements = {
  statCards: document.querySelectorAll("[data-stat]"),
  activityFeed: document.querySelector(".activity-feed ol"),
  liveCopy: document.querySelectorAll("[data-live-copy]"),
  driverTableBody: document.getElementById("driversTableBody"),
  driverMessage: document.getElementById("driversTableMessage"),
  riderTableBody: document.getElementById("ridersTableBody"),
  riderMessage: document.getElementById("ridersTableMessage"),
  drawer: document.getElementById("driverDrawer"),
  drawerBackdrop: document.getElementById("driverDrawerBackdrop"),
  drawerType: document.getElementById("drawerProfileType"),
  drawerTitle: document.getElementById("drawerDriverName"),
  drawerContent: document.getElementById("driverDrawerContent"),
  closeDrawer: document.getElementById("closeDriverDrawer"),
  adminAccount: document.getElementById("adminAccount"),
  adminProfileToggle: document.getElementById("adminProfileToggle"),
  adminAccountMenu: document.getElementById("adminAccountMenu"),
  adminProfileImage: document.getElementById("adminProfileImage"),
  adminProfileName: document.getElementById("adminProfileName"),
  adminProfileRole: document.getElementById("adminProfileRole"),
  adminProfileBackdrop: document.getElementById("adminProfileBackdrop"),
  adminProfileModal: document.getElementById("adminProfileModal"),
  closeAdminProfile: document.getElementById("closeAdminProfile"),
  adminProfilePreview: document.getElementById("adminProfilePreview"),
  adminPhotoInput: document.getElementById("adminPhotoInput"),
  saveAdminPhoto: document.getElementById("saveAdminPhoto"),
  adminModalName: document.getElementById("adminModalName"),
  adminModalEmail: document.getElementById("adminModalEmail"),
  adminModalRole: document.getElementById("adminModalRole"),
  adminModalPhone: document.getElementById("adminModalPhone"),
  toast: document.getElementById("adminToast"),
  documentPreviewBackdrop: document.getElementById("documentPreviewBackdrop"),
  documentPreviewModal: document.getElementById("documentPreviewModal"),
  documentPreviewTitle: document.getElementById("documentPreviewTitle"),
  documentPreviewBody: document.getElementById("documentPreviewBody"),
  closeDocumentPreview: document.getElementById("closeDocumentPreview"),
  rejectReasonBackdrop: document.getElementById("rejectReasonBackdrop"),
  rejectReasonModal: document.getElementById("rejectReasonModal"),
  rejectReasonInput: document.getElementById("rejectReasonInput"),
  closeRejectReason: document.getElementById("closeRejectReason"),
  cancelRejectReason: document.getElementById("cancelRejectReason"),
  confirmRejectReason: document.getElementById("confirmRejectReason"),
  confirmActionBackdrop: document.getElementById("confirmActionBackdrop"),
  confirmActionModal: document.getElementById("confirmActionModal"),
  confirmActionEyebrow: document.getElementById("confirmActionEyebrow"),
  confirmActionTitle: document.getElementById("confirmActionTitle"),
  confirmActionMessage: document.getElementById("confirmActionMessage"),
  closeConfirmAction: document.getElementById("closeConfirmAction"),
  cancelConfirmAction: document.getElementById("cancelConfirmAction"),
  confirmActionButton: document.getElementById("confirmActionButton")
};

const chartData = {
  dailyTripsChart: {
    type: "bar",
    labels: ["No data"],
    values: [0],
    color: chartTheme.cyan
  },
  weeklyBookingsChart: {
    type: "line",
    labels: ["No data"],
    values: [0],
    color: chartTheme.green
  },
  revenueChart: {
    type: "area",
    labels: ["No data"],
    values: [0],
    color: chartTheme.cyan
  },
  driverGrowthChart: {
    type: "line",
    labels: ["No data"],
    values: [0],
    color: chartTheme.amber
  }
};

function setupCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  return { ctx, width: rect.width, height: rect.height };
}

function drawGrid(ctx, width, height, padding) {
  ctx.strokeStyle = chartTheme.line;
  ctx.lineWidth = 1;
  ctx.font = "12px Inter, sans-serif";
  ctx.fillStyle = chartTheme.text;

  for (let i = 0; i <= 4; i += 1) {
    const y = padding.top + ((height - padding.top - padding.bottom) / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }
}

function getPoints(values, width, height, padding) {
  const safeValues = values.length ? values : [0];
  const maxValue = Math.max(...safeValues, 1);
  const minValue = Math.min(...safeValues, 0);
  const max = maxValue * 1.08 || 1;
  const min = minValue > 0 ? minValue * 0.92 : 0;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  return safeValues.map((value, index) => {
    const x = padding.left + (chartWidth / (safeValues.length - 1 || 1)) * index;
    const y = padding.top + chartHeight - ((value - min) / (max - min || 1)) * chartHeight;
    return { x, y, value };
  });
}

function drawLabels(ctx, labels, width, height, padding) {
  ctx.fillStyle = chartTheme.text;
  ctx.font = "700 11px Inter, sans-serif";
  ctx.textAlign = "center";

  labels.forEach((label, index) => {
    const x = padding.left + ((width - padding.left - padding.right) / (labels.length - 1 || 1)) * index;
    ctx.fillText(label, x, height - 8);
  });
}

function drawLineChart(ctx, config, width, height, padding, fillArea = false) {
  const points = getPoints(config.values, width, height, padding);

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });

  if (fillArea) {
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, "rgba(24, 198, 216, 0.28)");
    gradient.addColorStop(1, "rgba(24, 198, 216, 0)");

    ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
    ctx.lineTo(points[0].x, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
  }

  ctx.strokeStyle = config.color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = config.color;
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function drawBarChart(ctx, config, width, height, padding) {
  const values = config.values.length ? config.values : [0];
  const max = Math.max(...values, 1) * 1.12;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const gap = 12;
  const barWidth = Math.max(18, chartWidth / values.length - gap);
  const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);

  gradient.addColorStop(0, config.color);
  gradient.addColorStop(1, "rgba(24, 198, 216, 0.2)");

  values.forEach((value, index) => {
    const x = padding.left + index * (chartWidth / values.length) + gap / 2;
    const barHeight = (value / max) * chartHeight;
    const y = height - padding.bottom - barHeight;

    ctx.fillStyle = gradient;
    roundRect(ctx, x, y, barWidth, barHeight, 8);
    ctx.fill();
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function renderChart(id, config) {
  const canvas = document.getElementById(id);

  if (!canvas) return;

  const { ctx, width, height } = setupCanvas(canvas);
  const padding = { top: 16, right: 12, bottom: 28, left: 12 };

  ctx.clearRect(0, 0, width, height);
  drawGrid(ctx, width, height, padding);

  if (config.type === "bar") {
    drawBarChart(ctx, config, width, height, padding);
  }

  if (config.type === "line") {
    drawLineChart(ctx, config, width, height, padding);
  }

  if (config.type === "area") {
    drawLineChart(ctx, config, width, height, padding, true);
  }

  drawLabels(ctx, config.labels, width, height, padding);
}

function renderDashboardCharts() {
  Object.entries(chartData).forEach(([id, config]) => renderChart(id, config));
}

function text(value, fallback = "Not provided") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function escapeHtml(value) {
  return text(value, "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return entities[char];
  });
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-ZA").format(value);
}

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value.seconds) return new Date(value.seconds * 1000);

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getRecordDate(data) {
  for (const field of timestampFields) {
    const date = toDate(data[field]);
    if (date) return date;
  }

  return null;
}

function formatDate(value) {
  const date = toDate(value);
  if (!date) return "Not provided";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatRelativeTime(date) {
  if (!date) return "Date not provided";

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const ranges = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60]
  ];

  for (const [unit, value] of ranges) {
    const amount = Math.trunc(seconds / value);
    if (Math.abs(amount) >= 1) {
      return new Intl.RelativeTimeFormat("en-ZA", { numeric: "auto" }).format(amount, unit);
    }
  }

  return "Just now";
}

function badgeClass(status) {
  return statusBadgeClass(status);
}

function statusBadgeClass(status) {
  const normalized = text(status, "").toLowerCase();

  if (["verified", "approved", "active", "complete", "completed", "true"].includes(normalized)) return "success";
  if (["pending", "submitted", "review", "in review", "not verified", "false"].includes(normalized)) return "warning";
  if (["rejected", "blocked"].includes(normalized)) return "danger";
  if (["suspended"].includes(normalized)) return "muted";

  return "muted";
}

function verifiedDriverBadgeLabel(value) {
  return value === true ? "Verified" : "Not Verified";
}

function isPdfUrl(url) {
  if (!url) return false;

  const normalized = String(url).split("?")[0].toLowerCase();
  return normalized.endsWith(".pdf");
}

function formatBooleanStatus(value) {
  return value === true ? "Verified" : "Not verified";
}

function setTableMessage(element, message, isError = false) {
  if (!element) return;

  element.hidden = false;
  element.textContent = message;
  element.style.color = isError ? "var(--danger)" : "var(--muted)";
}

function hideTableMessage(element) {
  if (!element) return;

  element.hidden = true;
  element.textContent = "";
}

function showToast(message) {
  const toast = elements.toast;
  if (!toast) return;

  toast.hidden = false;
  toast.textContent = message;
  window.requestAnimationFrame(() => toast.classList.add("show"));

  window.clearTimeout(window.adminToastTimer);
  window.adminToastTimer = window.setTimeout(() => {
    toast.classList.remove("show");
    window.setTimeout(() => {
      toast.hidden = true;
    }, 180);
  }, 2200);
}

function defaultAdminProfile(auth) {
  const user = auth?.currentUser;

  return {
    fullName: user?.displayName || "Administrator",
    email: user?.email || "Not provided",
    role: "Operations Lead",
    phone: user?.phoneNumber || "Not provided",
    photoURL: "images/face.jpg"
  };
}

function currentAdminId(auth) {
  return auth?.currentUser?.uid || "movemate-admin";
}

function normalizedAdminProfile(profile, auth) {
  const fallback = defaultAdminProfile(auth);
  const data = profile || {};

  return {
    fullName: text(data.fullName, fallback.fullName),
    email: text(data.email, fallback.email),
    role: text(data.role, fallback.role),
    phone: text(data.phone, fallback.phone),
    photoURL: text(data.photoURL, fallback.photoURL)
  };
}

function renderAdminProfile() {
  const adminAuth = { currentUser: state.firebaseTools?.adminUser || state.firebaseTools?.auth?.currentUser };
  const admin = normalizedAdminProfile(state.admin, adminAuth);

  if (elements.adminProfileImage) elements.adminProfileImage.src = admin.photoURL;
  if (elements.adminProfilePreview) elements.adminProfilePreview.src = state.selectedAdminPhotoPreview || admin.photoURL;
  if (elements.adminProfileName) elements.adminProfileName.textContent = admin.fullName;
  if (elements.adminProfileRole) elements.adminProfileRole.textContent = admin.role;
  if (elements.adminModalName) elements.adminModalName.textContent = admin.fullName;
  if (elements.adminModalEmail) elements.adminModalEmail.textContent = admin.email;
  if (elements.adminModalRole) elements.adminModalRole.textContent = admin.role;
  if (elements.adminModalPhone) elements.adminModalPhone.textContent = admin.phone;
}

function openAdminMenu() {
  if (!elements.adminAccountMenu || !elements.adminProfileToggle) return;

  elements.adminAccountMenu.hidden = false;
  elements.adminProfileToggle.setAttribute("aria-expanded", "true");
  window.requestAnimationFrame(() => elements.adminAccountMenu.classList.add("open"));
}

function closeAdminMenu() {
  if (!elements.adminAccountMenu || !elements.adminProfileToggle) return;

  elements.adminAccountMenu.classList.remove("open");
  elements.adminProfileToggle.setAttribute("aria-expanded", "false");
  window.setTimeout(() => {
    if (!elements.adminAccountMenu.classList.contains("open")) {
      elements.adminAccountMenu.hidden = true;
    }
  }, 180);
}

function toggleAdminMenu() {
  if (elements.adminAccountMenu?.classList.contains("open")) {
    closeAdminMenu();
  } else {
    openAdminMenu();
  }
}

function openAdminProfileModal() {
  closeAdminMenu();
  renderAdminProfile();
  document.body.classList.add("admin-profile-open");
  elements.adminProfileBackdrop.hidden = false;
  elements.adminProfileModal?.setAttribute("aria-hidden", "false");
}

function closeAdminProfileModal() {
  document.body.classList.remove("admin-profile-open");
  elements.adminProfileModal?.setAttribute("aria-hidden", "true");
  resetAdminPhotoSelection();

  window.setTimeout(() => {
    if (!document.body.classList.contains("admin-profile-open") && elements.adminProfileBackdrop) {
      elements.adminProfileBackdrop.hidden = true;
    }
  }, 220);
}

function resetAdminPhotoSelection() {
  if (state.selectedAdminPhotoPreview) {
    URL.revokeObjectURL(state.selectedAdminPhotoPreview);
  }

  state.selectedAdminPhoto = null;
  state.selectedAdminPhotoPreview = null;
  if (elements.adminPhotoInput) elements.adminPhotoInput.value = "";
  renderAdminProfile();
}

async function importExistingFirebaseConfig() {
  let lastError;

  for (const path of firebaseConfigPaths) {
    try {
      const config = await import(path);
      const db = config.db || config.firestore;
      const storage = config.storage;
      const auth = config.auth;

      if (!db || !storage) {
        throw new Error(`Firebase config at ${path} must export db and storage.`);
      }

      return { db, storage, auth };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Firebase config could not be imported.");
}

async function importFirebaseHelpers() {
  const firestore = await import("https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js");
  const storage = await import("https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js");
  const auth = await import("https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js");

  return {
    collection: firestore.collection,
    doc: firestore.doc,
    onSnapshot: firestore.onSnapshot,
    setDoc: firestore.setDoc,
    updateDoc: firestore.updateDoc,
    deleteDoc: firestore.deleteDoc,
    serverTimestamp: firestore.serverTimestamp,
    ref: storage.ref,
    getDownloadURL: storage.getDownloadURL,
    uploadBytes: storage.uploadBytes,
    onAuthStateChanged: auth.onAuthStateChanged
  };
}

async function getProfilePhotoUrl(storage, storageRef, getDownloadURL, uid, profilePicUrl) {
  if (profilePicUrl) return profilePicUrl;
  if (!uid) return defaultAvatar;

  try {
    return await getDownloadURL(storageRef(storage, `profile_pics/${uid}`));
  } catch (error) {
    return defaultAvatar;
  }
}

async function resolveDriverPhotoUrl(record, storageTools) {
  const uid = record.uid || record.id;
  return getProfilePhotoUrl(
    storageTools.storage,
    storageTools.storageRef,
    storageTools.getDownloadURL,
    uid,
    record.profilePicUrl
  );
}

function normalizeCollection(snapshot) {
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
}

function isDriver(user) {
  return text(user.role, "").toLowerCase() === "driver";
}

function isRider(user) {
  return riderRoles.includes(text(user.role, "").toLowerCase());
}

function groupByMonth(records) {
  const formatter = new Intl.DateTimeFormat("en-ZA", { month: "short" });
  const groups = new Map();

  records.forEach((record) => {
    const date = getRecordDate(record);
    if (!date) return;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = formatter.format(date);
    const existing = groups.get(key) || { label, value: 0 };
    existing.value += 1;
    groups.set(key, existing);
  });

  const values = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, item]) => item)
    .slice(-8);

  if (!values.length) return { labels: ["No data"], values: [0] };

  return {
    labels: values.map((item) => item.label),
    values: values.map((item) => item.value)
  };
}

function updateChart(id, records) {
  const monthly = groupByMonth(records);
  chartData[id].labels = monthly.labels;
  chartData[id].values = monthly.values;
}

function updateStats() {
  const stats = {
    totalUsers: state.users.length,
    totalDrivers: state.drivers.length,
    verifiedDrivers: state.drivers.filter((driver) => driver.verified_driver === true).length,
    passengers: state.riders.length,
    trips: state.trips.length,
    bookings: state.bookings.length,
    rideRequests: state.rideRequests.length,
    chats: state.chats.length
  };

  elements.statCards.forEach((card) => {
    card.textContent = formatNumber(stats[card.dataset.stat] || 0);
  });
}

function updateCharts() {
  updateChart("dailyTripsChart", state.trips);
  updateChart("weeklyBookingsChart", state.bookings);
  updateChart("revenueChart", state.rideRequests);
  updateChart("driverGrowthChart", state.drivers);
  renderDashboardCharts();
}

function latestRecords() {
  return [
    ...state.users.map((record) => ({ record, type: isDriver(record) ? "Driver registered" : "Passenger created account" })),
    ...state.trips.map((record) => ({ record, type: "Trip record created" })),
    ...state.bookings.map((record) => ({ record, type: "Booking record created" })),
    ...state.rideRequests.map((record) => ({ record, type: "Ride request submitted" })),
    ...state.chats.map((record) => ({ record, type: "Chat activity recorded" }))
  ]
    .map((item) => ({ ...item, date: getRecordDate(item.record) }))
    .filter((item) => item.date)
    .sort((a, b) => b.date - a.date)
    .slice(0, 6);
}

function updateActivity() {
  if (!elements.activityFeed) return;

  const activity = latestRecords();
  if (!activity.length) {
    elements.activityFeed.innerHTML = `<li><span></span><div><strong>No dated activity found yet.</strong><small>Firestore</small></div></li>`;
    return;
  }

  elements.activityFeed.innerHTML = activity
    .map(
      (item) => `
        <li>
          <span></span>
          <div>
            <strong>${escapeHtml(item.type)}.</strong>
            <small>${escapeHtml(formatRelativeTime(item.date))}</small>
          </div>
        </li>
      `
    )
    .join("");
}

function updateOperationsCopy() {
  const pendingDrivers = state.drivers.filter((driver) => driver.verified_driver !== true).length;
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const todayTrips = state.trips.filter((trip) => {
    const date = getRecordDate(trip);
    return date && date.toISOString().slice(0, 10) === todayKey;
  }).length;

  const copy = {
    notifications: `${state.rideRequests.length} ride requests and ${state.bookings.length} bookings are currently in Firestore.`,
    tasks: `${pendingDrivers} driver checks and ${state.riders.length} rider accounts are available for review.`,
    summary: `${todayTrips} trips today`,
    health: state.firebaseReady ? "Realtime Firestore listeners are active." : "Realtime listeners are starting."
  };

  elements.liveCopy.forEach((element) => {
    element.textContent = copy[element.dataset.liveCopy] || "";
  });
}

function renderLiveDashboard() {
  state.drivers = state.users.filter(isDriver);
  state.riders = state.users.filter(isRider);
  updateStats();
  updateCharts();
  updateActivity();
  updateOperationsCopy();
}

function normalizeDriver(record, photoUrl) {
  const application = record.driver_application || {};
  const vehicle = record.vehicle || {};

  return {
    id: record.id,
    uid: text(record.uid, record.id),
    fullName: text(record.fullName || record.name),
    email: text(record.email),
    phone: text(record.phone),
    whatsapp: text(record.whatsapp),
    gender: text(record.gender || application.gender),
    driverStatus: text(record.driverStatus, "Not provided"),
    verifiedDriver: record.verified_driver === true,
    verificationStatus: formatBooleanStatus(record.verified_driver),
    driverRating: record.driver_rating ?? "New",
    applicationStatus: text(application.status, "Not submitted"),
    driverTier: text(application.driver_tier),
    subscriptionTier: text(application.subscription_tier),
    subscriptionAmount: text(application.subscription_amount),
    idNumber: text(application.id_number),
    reviewNote: text(application.review_note),
    createdAt: formatDate(record.createdAt),
    updatedAt: formatDate(record.updatedAt),
    submittedAt: formatDate(application.submitted_at),
    resubmittedAt: formatDate(application.resubmitted_at),
    vehicleModel: text(vehicle.car_model || application.car_model),
    carColor: text(vehicle.car_color || application.car_color),
    numberPlate: text(vehicle.number_plate || application.number_plate),
    vehicleSeats: text(vehicle.vehicle_seats || application.vehicle_seats),
    profilePicUrl: text(record.profilePicUrl, ""),
    idDocumentUrl: text(application.id_document_url, ""),
    proofOfPaymentUrl: text(application.proof_of_payment_url, ""),
    selfieUrl: text(application.selfie_url, ""),
    photoUrl,
    raw: record
  };
}

async function buildNormalizedDriver(record, storageTools) {
  const photoUrl = await resolveDriverPhotoUrl(record, storageTools);
  return normalizeDriver(record, photoUrl);
}

function normalizeRider(record) {
  return {
    id: record.id,
    uid: text(record.uid, record.id),
    fullName: text(record.fullName || record.name || record.displayName),
    email: text(record.email),
    phone: text(record.phone),
    createdAt: formatDate(record.createdAt || record.created_at),
    photoUrl: defaultAvatar,
    raw: record
  };
}

async function renderDriverRows(storageTools) {
  if (!elements.driverTableBody) return;

  if (!state.drivers.length) {
    elements.driverTableBody.innerHTML = "";
    setTableMessage(elements.driverMessage, "No registered drivers found.");
    return;
  }

  const drivers = await Promise.all(
    state.drivers.map(async (record) => buildNormalizedDriver(record, storageTools))
  );

  state.normalizedDrivers = drivers;
  hideTableMessage(elements.driverMessage);
  elements.driverTableBody.innerHTML = drivers
    .map((driver, index) => {
      const verification = driver.verificationStatus;
      const application = driver.applicationStatus;

      return `
        <tr>
          <td><img class="avatar" src="${driver.photoUrl}" alt="${escapeHtml(driver.fullName)}"></td>
          <td>${escapeHtml(driver.fullName)}</td>
          <td>${escapeHtml(driver.email)}</td>
          <td>${escapeHtml(driver.phone)}</td>
          <td>${escapeHtml(driver.vehicleModel)}</td>
          <td>${escapeHtml(driver.numberPlate)}</td>
          <td><span class="badge ${badgeClass(verification)}">${escapeHtml(verification)}</span></td>
          <td><span class="badge ${badgeClass(application)}">${escapeHtml(application)}</span></td>
          <td>${escapeHtml(driver.driverRating)}</td>
          <td class="action-cell">
            <button type="button" data-action="view-driver" data-index="${index}" data-driver-id="${escapeHtml(driver.id)}">View</button>
            <button type="button" data-action="approve" data-driver-id="${escapeHtml(driver.id)}">Approve</button>
            <button type="button" data-action="reject" data-driver-id="${escapeHtml(driver.id)}">Reject</button>
            <button type="button" data-action="suspend" data-driver-id="${escapeHtml(driver.id)}">Suspend</button>
            <button type="button" data-action="delete" data-driver-id="${escapeHtml(driver.id)}">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderRiderRows() {
  if (!elements.riderTableBody) return;

  if (!state.riders.length) {
    elements.riderTableBody.innerHTML = "";
    setTableMessage(elements.riderMessage, "No registered riders found.");
    return;
  }

  const riders = state.riders.map(normalizeRider);
  state.normalizedRiders = riders;
  hideTableMessage(elements.riderMessage);
  elements.riderTableBody.innerHTML = riders
    .map(
      (rider, index) => `
        <tr>
          <td><img class="avatar" src="${rider.photoUrl}" alt="${escapeHtml(rider.fullName)}"></td>
          <td>${escapeHtml(rider.fullName)}</td>
          <td>${escapeHtml(rider.email)}</td>
          <td>${escapeHtml(rider.phone)}</td>
          <td>${escapeHtml(rider.createdAt)}</td>
          <td class="action-cell">
            <button type="button" data-action="view-rider" data-index="${index}">View</button>
            <button type="button" data-action="suspend">Suspend</button>
            <button type="button" data-action="delete">Delete</button>
          </td>
        </tr>
      `
    )
    .join("");
}

function detailItem(label, value) {
  return `
    <div class="detail-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function formatFieldValue(value) {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value.toDate === "function" || value.seconds) return formatDate(value);
  if (Array.isArray(value)) return value.length ? value.map(formatFieldValue).join(", ") : "None";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function labelFromField(field) {
  return field
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function rawDetailItems(raw) {
  return Object.entries(raw)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => detailItem(labelFromField(key), formatFieldValue(value)))
    .join("");
}

function drawerSection(title, content) {
  return `
    <section class="drawer-section" aria-label="${escapeHtml(title)}">
      <h3 class="drawer-section-title">${escapeHtml(title)}</h3>
      ${content}
    </section>
  `;
}

function statusBadgeItem(label, value, badgeValue) {
  return `
    <div class="status-badge-item">
      <span>${escapeHtml(label)}</span>
      <strong class="badge ${statusBadgeClass(badgeValue ?? value)}">${escapeHtml(value)}</strong>
    </div>
  `;
}

function documentCard({ icon, title, url }) {
  const hasUrl = Boolean(url && url !== "Not provided");

  if (!hasUrl) {
    return `
      <article class="document-card">
        <div class="document-card-head">${icon} ${escapeHtml(title)}</div>
        <div class="document-preview-empty">Not provided</div>
      </article>
    `;
  }

  const isPdf = isPdfUrl(url);
  const preview = isPdf
    ? `<div class="document-preview document-preview-pdf"><i data-lucide="file-text"></i><span>PDF Document</span></div>`
    : `<img class="document-preview" src="${escapeHtml(url)}" alt="${escapeHtml(title)} preview">`;

  return `
    <article class="document-card">
      <div class="document-card-head">${icon} ${escapeHtml(title)}</div>
      ${preview}
      <div class="document-card-actions">
        <button type="button" data-doc-action="preview" data-doc-url="${escapeHtml(url)}" data-doc-title="${escapeHtml(title)}" data-doc-type="${isPdf ? "pdf" : "image"}">Preview</button>
        <button type="button" data-doc-action="open" data-doc-url="${escapeHtml(url)}">Open</button>
        <button type="button" data-doc-action="download" data-doc-url="${escapeHtml(url)}" data-doc-filename="${escapeHtml(title)}">Download</button>
      </div>
    </article>
  `;
}

function openDriverDrawer(driver) {
  if (!elements.drawer || !elements.drawerContent) return;

  state.openDriverId = driver.id;
  elements.drawerType.textContent = "Driver profile";
  elements.drawerTitle.textContent = driver.fullName;

  const verifiedLabel = verifiedDriverBadgeLabel(driver.verifiedDriver);

  elements.drawerContent.innerHTML = `
    <section class="driver-summary">
      <img class="drawer-avatar" src="${escapeHtml(driver.photoUrl)}" alt="${escapeHtml(driver.fullName)}">
      <div>
        <h3>${escapeHtml(driver.fullName)}</h3>
        <p>${escapeHtml(driver.email)}</p>
        <p>${escapeHtml(driver.phone)}</p>
      </div>
    </section>

    ${drawerSection(
      "Driver Status",
      `
        <div class="status-badges-row">
          ${statusBadgeItem("Driver Status", driver.driverStatus, driver.driverStatus)}
          ${statusBadgeItem("Verified Driver", verifiedLabel, driver.verifiedDriver ? "approved" : "pending")}
          ${statusBadgeItem("Application Status", driver.applicationStatus, driver.applicationStatus)}
        </div>
      `
    )}

    ${drawerSection(
      "Driver Profile",
      `
        <div class="detail-grid" aria-label="Driver profile information">
          ${detailItem("Full Name", driver.fullName)}
          ${detailItem("Email", driver.email)}
          ${detailItem("Phone", driver.phone)}
          ${detailItem("WhatsApp", driver.whatsapp)}
          ${detailItem("UID", driver.uid)}
          ${detailItem("Gender", driver.gender)}
          ${detailItem("Driver Rating", driver.driverRating)}
          ${detailItem("Verification Status", driver.verificationStatus)}
          ${detailItem("Application Status", driver.applicationStatus)}
          ${detailItem("Driver Status", driver.driverStatus)}
          ${detailItem("Created Date", driver.createdAt)}
          ${detailItem("Updated Date", driver.updatedAt)}
        </div>
      `
    )}

    ${drawerSection(
      "Driver Application",
      `
        <div class="detail-grid" aria-label="Driver application information">
          ${detailItem("Driver Tier", driver.driverTier)}
          ${detailItem("Subscription Tier", driver.subscriptionTier)}
          ${detailItem("Subscription Amount", driver.subscriptionAmount)}
          ${detailItem("ID Number", driver.idNumber)}
          ${detailItem("Application Status", driver.applicationStatus)}
          ${detailItem("Submitted Date", driver.submittedAt)}
          ${detailItem("Resubmitted Date", driver.resubmittedAt)}
          ${detailItem("Review Note", driver.reviewNote)}
        </div>
      `
    )}

    ${drawerSection(
      "Vehicle Information",
      `
        <div class="detail-grid" aria-label="Vehicle information">
          ${detailItem("Vehicle", driver.vehicleModel)}
          ${detailItem("Vehicle Colour", driver.carColor)}
          ${detailItem("Number Plate", driver.numberPlate)}
          ${detailItem("Vehicle Seats", driver.vehicleSeats)}
        </div>
      `
    )}

    ${drawerSection(
      "Driver Documents",
      `
        <div class="document-grid" aria-label="Driver documents">
          ${documentCard({ icon: "👤", title: "Profile Picture", url: driver.profilePicUrl })}
          ${documentCard({ icon: "🪪", title: "ID Document", url: driver.idDocumentUrl })}
          ${documentCard({ icon: "💵", title: "Proof of Payment", url: driver.proofOfPaymentUrl })}
          ${documentCard({ icon: "📸", title: "Live Selfie", url: driver.selfieUrl })}
        </div>
      `
    )}

    ${drawerSection(
      "Admin Actions",
      `
        <div class="drawer-action-buttons">
          <button type="button" class="primary-button" data-driver-action="approve" data-driver-id="${escapeHtml(driver.id)}">Approve</button>
          <button type="button" class="primary-button danger-button" data-driver-action="reject" data-driver-id="${escapeHtml(driver.id)}">Reject</button>
          <button type="button" data-driver-action="suspend" data-driver-id="${escapeHtml(driver.id)}">Suspend</button>
          <button type="button" data-driver-action="delete" data-driver-id="${escapeHtml(driver.id)}">Delete</button>
        </div>
      `
    )}
  `;

  if (window.lucide) window.lucide.createIcons();
  openDrawer();
}

async function refreshOpenDriverDrawer() {
  if (!state.openDriverId || !state.firebaseTools) return;

  const record = state.users.find((user) => user.id === state.openDriverId && isDriver(user));
  if (!record) {
    state.openDriverId = null;
    closeDriverDrawer();
    return;
  }

  const driver = await buildNormalizedDriver(record, state.firebaseTools);
  openDriverDrawer(driver);
}

function openRiderDrawer(rider) {
  if (!elements.drawer || !elements.drawerContent) return;

  elements.drawerType.textContent = "Rider profile";
  elements.drawerTitle.textContent = rider.fullName;
  elements.drawerContent.innerHTML = `
    <section class="driver-summary">
      <img class="drawer-avatar" src="${rider.photoUrl}" alt="${escapeHtml(rider.fullName)}">
      <div>
        <h3>${escapeHtml(rider.fullName)}</h3>
        <p>${escapeHtml(rider.email)}</p>
        <p>${escapeHtml(rider.phone)}</p>
      </div>
    </section>
    <section class="detail-grid" aria-label="Complete rider information">
      ${rawDetailItems(rider.raw)}
    </section>
  `;

  openDrawer();
}

function openDrawer() {
  document.body.classList.add("drawer-open");
  elements.drawerBackdrop.hidden = false;
  elements.drawer.setAttribute("aria-hidden", "false");
}

function closeDriverDrawer() {
  document.body.classList.remove("drawer-open");
  elements.drawer?.setAttribute("aria-hidden", "true");
  state.openDriverId = null;

  window.setTimeout(() => {
    if (!document.body.classList.contains("drawer-open") && elements.drawerBackdrop) {
      elements.drawerBackdrop.hidden = true;
    }
  }, 220);
}

function openDocumentPreview(title, url, type) {
  if (!elements.documentPreviewModal || !elements.documentPreviewBody) return;

  elements.documentPreviewTitle.textContent = title;
  elements.documentPreviewBody.innerHTML =
    type === "pdf"
      ? `<iframe src="${escapeHtml(url)}" title="${escapeHtml(title)}"></iframe>`
      : `<img src="${escapeHtml(url)}" alt="${escapeHtml(title)}">`;

  document.body.classList.add("document-preview-open");
  elements.documentPreviewBackdrop.hidden = false;
  elements.documentPreviewModal.hidden = false;
  elements.documentPreviewModal.setAttribute("aria-hidden", "false");
}

function closeDocumentPreview() {
  document.body.classList.remove("document-preview-open");
  elements.documentPreviewModal?.setAttribute("aria-hidden", "true");

  window.setTimeout(() => {
    if (!document.body.classList.contains("document-preview-open")) {
      if (elements.documentPreviewBackdrop) elements.documentPreviewBackdrop.hidden = true;
      if (elements.documentPreviewModal) elements.documentPreviewModal.hidden = true;
      if (elements.documentPreviewBody) elements.documentPreviewBody.innerHTML = "";
    }
  }, 220);
}

function openRejectModal(driverId) {
  state.pendingRejectDriverId = driverId;
  if (elements.rejectReasonInput) elements.rejectReasonInput.value = "";

  document.body.classList.add("reject-modal-open");
  elements.rejectReasonBackdrop.hidden = false;
  elements.rejectReasonModal.hidden = false;
  elements.rejectReasonModal.setAttribute("aria-hidden", "false");
  elements.rejectReasonInput?.focus();
}

function closeRejectModal() {
  document.body.classList.remove("reject-modal-open");
  elements.rejectReasonModal?.setAttribute("aria-hidden", "true");
  state.pendingRejectDriverId = null;

  window.setTimeout(() => {
    if (!document.body.classList.contains("reject-modal-open")) {
      if (elements.rejectReasonBackdrop) elements.rejectReasonBackdrop.hidden = true;
      if (elements.rejectReasonModal) elements.rejectReasonModal.hidden = true;
    }
  }, 220);
}

function openConfirmModal({ eyebrow, title, message, confirmLabel, onConfirm }) {
  state.pendingConfirmAction = onConfirm;
  if (elements.confirmActionEyebrow) elements.confirmActionEyebrow.textContent = eyebrow;
  if (elements.confirmActionTitle) elements.confirmActionTitle.textContent = title;
  if (elements.confirmActionMessage) elements.confirmActionMessage.textContent = message;
  if (elements.confirmActionButton) elements.confirmActionButton.textContent = confirmLabel;

  document.body.classList.add("confirm-modal-open");
  elements.confirmActionBackdrop.hidden = false;
  elements.confirmActionModal.hidden = false;
  elements.confirmActionModal.setAttribute("aria-hidden", "false");
}

function closeConfirmModal() {
  document.body.classList.remove("confirm-modal-open");
  elements.confirmActionModal?.setAttribute("aria-hidden", "true");
  state.pendingConfirmAction = null;

  window.setTimeout(() => {
    if (!document.body.classList.contains("confirm-modal-open")) {
      if (elements.confirmActionBackdrop) elements.confirmActionBackdrop.hidden = true;
      if (elements.confirmActionModal) elements.confirmActionModal.hidden = true;
    }
  }, 220);
}

async function downloadDocument(url, filename) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename.replace(/\s+/g, "-").toLowerCase();
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error("Unable to download document:", error);
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

function getDriverRecord(driverId) {
  return state.users.find((user) => user.id === driverId && isDriver(user));
}

async function approveDriver(driverId) {
  const tools = state.firebaseTools;
  if (!tools?.db) {
    showToast("Firebase is still loading. Please try again.");
    return;
  }

  try {
    await tools.updateDoc(tools.doc(tools.db, "users", driverId), {
      driverStatus: "approved",
      verified_driver: true,
      "driver_application.status": "approved",
      updatedAt: tools.serverTimestamp()
    });
    showToast("Driver approved successfully.");
  } catch (error) {
    console.error("Unable to approve driver:", error);
    showToast("Could not approve driver. Check Firebase permissions.");
  }
}

async function rejectDriver(driverId, reason) {
  const tools = state.firebaseTools;
  if (!tools?.db) {
    showToast("Firebase is still loading. Please try again.");
    return;
  }

  if (!reason.trim()) {
    showToast("Enter a rejection reason first.");
    return;
  }

  try {
    await tools.updateDoc(tools.doc(tools.db, "users", driverId), {
      driverStatus: "rejected",
      "driver_application.status": "rejected",
      "driver_application.review_note": reason.trim(),
      updatedAt: tools.serverTimestamp()
    });
    showToast("Driver application rejected.");
  } catch (error) {
    console.error("Unable to reject driver:", error);
    showToast("Could not reject driver. Check Firebase permissions.");
  }
}

async function suspendDriver(driverId) {
  const tools = state.firebaseTools;
  if (!tools?.db) {
    showToast("Firebase is still loading. Please try again.");
    return;
  }

  try {
    await tools.updateDoc(tools.doc(tools.db, "users", driverId), {
      driverStatus: "suspended",
      updatedAt: tools.serverTimestamp()
    });
    showToast("Driver suspended.");
  } catch (error) {
    console.error("Unable to suspend driver:", error);
    showToast("Could not suspend driver. Check Firebase permissions.");
  }
}

async function deleteDriver(driverId) {
  const tools = state.firebaseTools;
  if (!tools?.db) {
    showToast("Firebase is still loading. Please try again.");
    return;
  }

  try {
    await tools.deleteDoc(tools.doc(tools.db, "users", driverId));
    if (state.openDriverId === driverId) {
      state.openDriverId = null;
      closeDriverDrawer();
    }
    showToast("Driver record deleted.");
  } catch (error) {
    console.error("Unable to delete driver:", error);
    showToast("Could not delete driver. Check Firebase permissions.");
  }
}

function handleDriverAction(action, driverId) {
  const driver = getDriverRecord(driverId);
  if (!driver) {
    showToast("Driver record not found.");
    return;
  }

  if (action === "approve") {
    approveDriver(driverId);
    return;
  }

  if (action === "reject") {
    openRejectModal(driverId);
    return;
  }

  if (action === "suspend") {
    openConfirmModal({
      eyebrow: "Suspend driver",
      title: "Suspend this driver?",
      message: "This will suspend the driver account in Firestore. The account will not be deleted.",
      confirmLabel: "Suspend Driver",
      onConfirm: () => suspendDriver(driverId)
    });
    return;
  }

  if (action === "delete") {
    openConfirmModal({
      eyebrow: "Delete driver",
      title: "Delete this driver record?",
      message: "This action cannot be undone. Only the Firestore user document will be deleted. Firebase Authentication and Storage files will remain for now.",
      confirmLabel: "Delete Driver",
      onConfirm: () => deleteDriver(driverId)
    });
  }
}

async function saveAdminProfilePhoto() {
  if (!state.selectedAdminPhoto) {
    showToast("Choose a profile picture first.");
    return;
  }

  const tools = state.firebaseTools;
  if (!tools?.db || !tools?.storage) {
    showToast("Firebase is still loading. Please try again.");
    return;
  }

  if (elements.saveAdminPhoto) {
    elements.saveAdminPhoto.disabled = true;
    elements.saveAdminPhoto.textContent = "Saving...";
  }

  try {
    const safeName = state.selectedAdminPhoto.name.replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
    const imagePath = `admin_profile_pictures/${state.adminId}/${Date.now()}-${safeName}`;
    const imageRef = tools.storageRef(tools.storage, imagePath);

    await tools.uploadBytes(imageRef, state.selectedAdminPhoto);
    const photoURL = await tools.getDownloadURL(imageRef);

    await tools.setDoc(
      tools.doc(tools.db, "admins", state.adminId),
      {
        photoURL,
        updatedAt: tools.serverTimestamp()
      },
      { merge: true }
    );

    state.admin = {
      ...normalizedAdminProfile(state.admin, { currentUser: tools.adminUser || tools.auth?.currentUser }),
      photoURL
    };
    resetAdminPhotoSelection();
    renderAdminProfile();
    showToast("Profile picture updated.");
  } catch (error) {
    console.error("Unable to update administrator profile picture:", error);
    showToast("Could not save profile picture. Check Firebase permissions.");
  } finally {
    if (elements.saveAdminPhoto) {
      elements.saveAdminPhoto.disabled = false;
      elements.saveAdminPhoto.innerHTML = `<i data-lucide="save"></i>Save New Picture`;
      if (window.lucide) window.lucide.createIcons();
    }
  }
}

function listenToAdminProfile(tools) {
  state.adminId = tools.adminUser?.uid || currentAdminId(tools.auth);
  const adminRef = tools.doc(tools.db, "admins", state.adminId);

  return tools.onSnapshot(
    adminRef,
    async (snapshot) => {
      if (snapshot.exists()) {
        state.admin = snapshot.data();
        renderAdminProfile();
        return;
      }

      const fallback = defaultAdminProfile({ currentUser: tools.adminUser || tools.auth?.currentUser });
      state.admin = fallback;
      renderAdminProfile();

      try {
        await tools.setDoc(
          adminRef,
          {
            ...fallback,
            createdAt: tools.serverTimestamp(),
            updatedAt: tools.serverTimestamp()
          },
          { merge: true }
        );
      } catch (error) {
        console.error("Unable to create administrator profile:", error);
      }
    },
    (error) => {
      console.error("Unable to listen to administrator profile:", error);
      renderAdminProfile();
    }
  );
}

function startAdminProfileListener(tools) {
  if (!tools.auth || !tools.onAuthStateChanged) {
    return listenToAdminProfile(tools);
  }

  let unsubscribeProfile;
  return tools.onAuthStateChanged(tools.auth, (user) => {
    if (unsubscribeProfile) unsubscribeProfile();
    tools.adminUser = user;
    unsubscribeProfile = listenToAdminProfile(tools);
  });
}

function bindActions() {
  elements.adminProfileToggle?.addEventListener("click", toggleAdminMenu);
  elements.adminProfileToggle?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleAdminMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (!elements.adminAccount?.contains(event.target)) {
      closeAdminMenu();
    }
  });

  elements.adminAccountMenu?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-admin-menu]");
    if (!button) return;

    if (button.dataset.adminMenu === "profile") {
      openAdminProfileModal();
      return;
    }

    closeAdminMenu();
    showToast("Coming Soon");
  });

  elements.closeAdminProfile?.addEventListener("click", closeAdminProfileModal);
  elements.adminProfileBackdrop?.addEventListener("click", closeAdminProfileModal);

  elements.adminPhotoInput?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (state.selectedAdminPhotoPreview) {
      URL.revokeObjectURL(state.selectedAdminPhotoPreview);
    }

    state.selectedAdminPhoto = file;
    state.selectedAdminPhotoPreview = URL.createObjectURL(file);
    if (elements.adminProfilePreview) {
      elements.adminProfilePreview.src = state.selectedAdminPhotoPreview;
    }
  });

  elements.saveAdminPhoto?.addEventListener("click", saveAdminProfilePhoto);

  elements.driverTableBody?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    if (button.dataset.action === "view-driver") {
      const driver =
        state.normalizedDrivers?.[Number(button.dataset.index)] ||
        state.normalizedDrivers?.find((item) => item.id === button.dataset.driverId);
      if (driver) openDriverDrawer(driver);
      return;
    }

    const driverId = button.dataset.driverId;
    if (!driverId) return;

    handleDriverAction(button.dataset.action, driverId);
  });

  elements.drawerContent?.addEventListener("click", (event) => {
    const docButton = event.target.closest("button[data-doc-action]");
    if (docButton) {
      const url = docButton.dataset.docUrl;
      const title = docButton.dataset.docTitle || "Document";
      const type = docButton.dataset.docType || "image";

      if (docButton.dataset.docAction === "preview") {
        openDocumentPreview(title, url, type);
        return;
      }

      if (docButton.dataset.docAction === "open") {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      if (docButton.dataset.docAction === "download") {
        downloadDocument(url, docButton.dataset.docFilename || "document");
      }
      return;
    }

    const actionButton = event.target.closest("button[data-driver-action]");
    if (!actionButton?.dataset.driverId) return;

    handleDriverAction(actionButton.dataset.driverAction, actionButton.dataset.driverId);
  });

  elements.closeDocumentPreview?.addEventListener("click", closeDocumentPreview);
  elements.documentPreviewBackdrop?.addEventListener("click", closeDocumentPreview);

  elements.closeRejectReason?.addEventListener("click", closeRejectModal);
  elements.cancelRejectReason?.addEventListener("click", closeRejectModal);
  elements.rejectReasonBackdrop?.addEventListener("click", closeRejectModal);
  elements.confirmRejectReason?.addEventListener("click", async () => {
    const driverId = state.pendingRejectDriverId;
    const reason = elements.rejectReasonInput?.value || "";
    if (!driverId) return;

    if (!reason.trim()) {
      showToast("Enter a rejection reason first.");
      return;
    }

    await rejectDriver(driverId, reason);
    closeRejectModal();
  });

  elements.closeConfirmAction?.addEventListener("click", closeConfirmModal);
  elements.cancelConfirmAction?.addEventListener("click", closeConfirmModal);
  elements.confirmActionBackdrop?.addEventListener("click", closeConfirmModal);
  elements.confirmActionButton?.addEventListener("click", async () => {
    const action = state.pendingConfirmAction;
    closeConfirmModal();
    if (typeof action === "function") await action();
  });

  elements.riderTableBody?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    if (button.dataset.action === "view-rider") {
      const rider = state.normalizedRiders?.[Number(button.dataset.index)];
      if (rider) openRiderDrawer(rider);
      return;
    }

    showToast("Coming in next phase");
  });

  elements.closeDrawer?.addEventListener("click", closeDriverDrawer);
  elements.drawerBackdrop?.addEventListener("click", closeDriverDrawer);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAdminMenu();
      closeAdminProfileModal();
      closeDocumentPreview();
      closeRejectModal();
      closeConfirmModal();
      closeDriverDrawer();
    }
  });
}

function listenToCollection(db, collection, onSnapshot, name, stateKey) {
  return onSnapshot(
    collection(db, name),
    (snapshot) => {
      state[stateKey] = normalizeCollection(snapshot);
      state.firebaseReady = true;
      renderLiveDashboard();
    },
    (error) => {
      console.error(`Unable to listen to ${name}:`, error);
      showToast(`Could not load ${name}. Check Firebase permissions.`);
    }
  );
}

async function startRealtimeDashboard() {
  try {
    const { db, storage, auth } = await importExistingFirebaseConfig();
    const {
      collection,
      doc,
      onSnapshot,
      setDoc,
      updateDoc,
      deleteDoc,
      serverTimestamp,
      ref: storageRef,
      getDownloadURL,
      uploadBytes,
      onAuthStateChanged
    } = await importFirebaseHelpers();
    const storageTools = { storage, storageRef, getDownloadURL };
    state.firebaseTools = {
      db,
      storage,
      auth,
      doc,
      onSnapshot,
      setDoc,
      updateDoc,
      deleteDoc,
      serverTimestamp,
      storageRef,
      getDownloadURL,
      uploadBytes,
      onAuthStateChanged
    };

    startAdminProfileListener(state.firebaseTools);
    listenToCollection(db, collection, onSnapshot, "trips", "trips");
    listenToCollection(db, collection, onSnapshot, "bookings", "bookings");
    listenToCollection(db, collection, onSnapshot, "ride_requests", "rideRequests");
    listenToCollection(db, collection, onSnapshot, "chats", "chats");

    onSnapshot(
      collection(db, "users"),
      async (snapshot) => {
        state.users = normalizeCollection(snapshot);
        state.drivers = state.users.filter(isDriver);
        state.riders = state.users.filter(isRider);
        state.firebaseReady = true;
        renderLiveDashboard();
        await renderDriverRows(storageTools);
        renderRiderRows();
        await refreshOpenDriverDrawer();

        if (window.lucide) {
          window.lucide.createIcons();
        }
      },
      (error) => {
        console.error("Unable to load MoveMate users:", error);
        elements.driverTableBody.innerHTML = "";
        elements.riderTableBody.innerHTML = "";
        setTableMessage(elements.driverMessage, "We could not load registered drivers right now. Please check the Firebase connection and try again.", true);
        setTableMessage(elements.riderMessage, "We could not load registered riders right now. Please check the Firebase connection and try again.", true);
      }
    );
  } catch (error) {
    console.error("Unable to start MoveMate realtime dashboard:", error);
    setTableMessage(elements.driverMessage, "We could not load registered drivers right now. Please check the Firebase connection and try again.", true);
    setTableMessage(elements.riderMessage, "We could not load registered riders right now. Please check the Firebase connection and try again.", true);
  }
}

window.addEventListener("load", renderDashboardCharts);
window.addEventListener("resize", () => {
  window.clearTimeout(window.chartResizeTimer);
  window.chartResizeTimer = window.setTimeout(renderDashboardCharts, 120);
});

bindActions();
startRealtimeDashboard();
