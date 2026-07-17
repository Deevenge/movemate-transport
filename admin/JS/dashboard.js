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

const defaultAvatar =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="36" fill="#E7FBFD"/>
      <circle cx="80" cy="62" r="30" fill="#18C6D8"/>
      <path d="M31 139c8-31 27-47 49-47s41 16 49 47" fill="#0F172A"/>
    </svg>
  `);

const driverState = {
  drivers: [],
  firebaseReady: false
};

const driverElements = {
  tableBody: document.getElementById("driversTableBody"),
  message: document.getElementById("driversTableMessage"),
  drawer: document.getElementById("driverDrawer"),
  drawerBackdrop: document.getElementById("driverDrawerBackdrop"),
  drawerTitle: document.getElementById("drawerDriverName"),
  drawerContent: document.getElementById("driverDrawerContent"),
  closeDrawer: document.getElementById("closeDriverDrawer"),
  toast: document.getElementById("adminToast")
};

const chartData = {
  dailyTripsChart: {
    type: "bar",
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    values: [482, 526, 514, 588, 642, 701, 668],
    color: chartTheme.cyan
  },
  weeklyBookingsChart: {
    type: "line",
    labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
    values: [820, 910, 870, 1040, 1165, 1240, 1194, 1370],
    color: chartTheme.green
  },
  revenueChart: {
    type: "area",
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    values: [62000, 68400, 71800, 79200, 83930, 88400, 94900],
    color: chartTheme.cyan
  },
  driverGrowthChart: {
    type: "line",
    labels: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    values: [860, 940, 1015, 1094, 1188, 1286],
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
  const max = Math.max(...values) * 1.08;
  const min = Math.min(...values) * 0.92;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  return values.map((value, index) => {
    const x = padding.left + (chartWidth / (values.length - 1 || 1)) * index;
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
  const max = Math.max(...config.values) * 1.12;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const gap = 12;
  const barWidth = Math.max(18, chartWidth / config.values.length - gap);
  const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);

  gradient.addColorStop(0, config.color);
  gradient.addColorStop(1, "rgba(24, 198, 216, 0.2)");

  config.values.forEach((value, index) => {
    const x = padding.left + index * (chartWidth / config.values.length) + gap / 2;
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

window.addEventListener("load", renderDashboardCharts);
window.addEventListener("resize", () => {
  window.clearTimeout(window.chartResizeTimer);
  window.chartResizeTimer = window.setTimeout(renderDashboardCharts, 120);
});

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

function formatBooleanStatus(value) {
  return value === true ? "Verified" : "Not verified";
}

function formatDate(value) {
  if (!value) return "Not provided";

  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);

  if (Number.isNaN(date.getTime())) return "Not provided";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function badgeClass(status) {
  const normalized = text(status, "").toLowerCase();

  if (["verified", "approved", "active", "complete", "completed"].includes(normalized)) return "success";
  if (["pending", "submitted", "review", "in review"].includes(normalized)) return "warning";
  if (["rejected", "suspended", "blocked", "not verified"].includes(normalized)) return "danger";

  return "muted";
}

function showTableMessage(message, isError = false) {
  if (!driverElements.message) return;

  driverElements.message.hidden = false;
  driverElements.message.textContent = message;
  driverElements.message.style.color = isError ? "var(--danger)" : "var(--muted)";
}

function hideTableMessage() {
  if (!driverElements.message) return;

  driverElements.message.hidden = true;
  driverElements.message.textContent = "";
}

function showToast(message) {
  const toast = driverElements.toast;
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

async function importExistingFirebaseConfig() {
  let lastError;

  for (const path of firebaseConfigPaths) {
    try {
      const config = await import(path);
      const db = config.db || config.firestore;
      const storage = config.storage;

      if (!db || !storage) {
        throw new Error(`Firebase config at ${path} must export db and storage.`);
      }

      return { db, storage };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Firebase config could not be imported.");
}

async function importFirebaseHelpers() {
  const firestore = await import("https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js");
  const storage = await import("https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js");

  return {
    collection: firestore.collection,
    getDocs: firestore.getDocs,
    query: firestore.query,
    where: firestore.where,
    ref: storage.ref,
    getDownloadURL: storage.getDownloadURL
  };
}

async function getDriverPhotoUrl(storage, storageRef, getDownloadURL, uid) {
  if (!uid) return defaultAvatar;

  try {
    return await getDownloadURL(storageRef(storage, `profile_pics/${uid}`));
  } catch (error) {
    return defaultAvatar;
  }
}

function normalizeDriver(doc, photoUrl) {
  const data = doc.data();
  const application = data.driver_application || {};
  const vehicle = data.vehicle || {};

  return {
    id: doc.id,
    uid: text(data.uid, doc.id),
    fullName: text(data.fullName || data.name),
    email: text(data.email),
    phone: text(data.phone),
    whatsapp: text(data.whatsapp),
    verifiedDriver: data.verified_driver === true,
    verificationStatus: formatBooleanStatus(data.verified_driver),
    driverRating: data.driver_rating ?? "New",
    applicationStatus: text(application.status, "Not submitted"),
    idNumber: text(application.id_number),
    createdAt: formatDate(data.createdAt),
    submittedAt: formatDate(application.submitted_at),
    vehicleModel: text(vehicle.car_model || application.car_model),
    carColor: text(vehicle.car_color || application.car_color),
    numberPlate: text(vehicle.number_plate || application.number_plate),
    vehicleSeats: text(vehicle.vehicle_seats || application.vehicle_seats),
    photoUrl,
    raw: data
  };
}

function renderDriverRows(drivers) {
  if (!driverElements.tableBody) return;

  driverElements.tableBody.innerHTML = drivers
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
            <button type="button" data-action="view" data-driver-index="${index}">View</button>
            <button type="button" data-action="approve">Approve</button>
            <button type="button" data-action="reject">Reject</button>
            <button type="button" data-action="suspend">Suspend</button>
            <button type="button" data-action="delete">Delete</button>
          </td>
        </tr>
      `;
    })
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

function openDriverDrawer(driver) {
  if (!driverElements.drawer || !driverElements.drawerContent) return;

  driverElements.drawerTitle.textContent = driver.fullName;
  driverElements.drawerContent.innerHTML = `
    <section class="driver-summary">
      <img class="drawer-avatar" src="${driver.photoUrl}" alt="${escapeHtml(driver.fullName)}">
      <div>
        <h3>${escapeHtml(driver.fullName)}</h3>
        <p>${escapeHtml(driver.email)}</p>
        <p>${escapeHtml(driver.phone)}</p>
      </div>
    </section>
    <section class="detail-grid" aria-label="Complete driver information">
      ${detailItem("Full Name", driver.fullName)}
      ${detailItem("Email", driver.email)}
      ${detailItem("Phone", driver.phone)}
      ${detailItem("WhatsApp", driver.whatsapp)}
      ${detailItem("UID", driver.uid)}
      ${detailItem("Driver Rating", driver.driverRating)}
      ${detailItem("Verification Status", driver.verificationStatus)}
      ${detailItem("Application Status", driver.applicationStatus)}
      ${detailItem("Vehicle", driver.vehicleModel)}
      ${detailItem("Car Colour", driver.carColor)}
      ${detailItem("Number Plate", driver.numberPlate)}
      ${detailItem("Vehicle Seats", driver.vehicleSeats)}
      ${detailItem("ID Number", driver.idNumber)}
      ${detailItem("Created Date", driver.createdAt)}
      ${detailItem("Submitted Date", driver.submittedAt)}
    </section>
  `;

  document.body.classList.add("drawer-open");
  driverElements.drawerBackdrop.hidden = false;
  driverElements.drawer.setAttribute("aria-hidden", "false");
}

function closeDriverDrawer() {
  document.body.classList.remove("drawer-open");
  driverElements.drawer?.setAttribute("aria-hidden", "true");

  window.setTimeout(() => {
    if (!document.body.classList.contains("drawer-open") && driverElements.drawerBackdrop) {
      driverElements.drawerBackdrop.hidden = true;
    }
  }, 220);
}

function bindDriverActions() {
  driverElements.tableBody?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;

    if (action === "view") {
      const driver = driverState.drivers[Number(button.dataset.driverIndex)];
      if (driver) openDriverDrawer(driver);
      return;
    }

    showToast("Coming in next phase");
  });

  driverElements.closeDrawer?.addEventListener("click", closeDriverDrawer);
  driverElements.drawerBackdrop?.addEventListener("click", closeDriverDrawer);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDriverDrawer();
  });
}

async function loadDrivers() {
  if (!driverElements.tableBody) return;

  try {
    const { db, storage } = await importExistingFirebaseConfig();
    const { collection, getDocs, query, where, ref: storageRef, getDownloadURL } = await importFirebaseHelpers();
    const driversQuery = query(collection(db, "users"), where("role", "==", "driver"));
    const snapshot = await getDocs(driversQuery);

    if (snapshot.empty) {
      driverElements.tableBody.innerHTML = "";
      showTableMessage("No registered drivers found.");
      return;
    }

    const drivers = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const uid = doc.data().uid || doc.id;
        const photoUrl = await getDriverPhotoUrl(storage, storageRef, getDownloadURL, uid);
        return normalizeDriver(doc, photoUrl);
      })
    );

    driverState.drivers = drivers;
    driverState.firebaseReady = true;
    hideTableMessage();
    renderDriverRows(drivers);

    if (window.lucide) {
      window.lucide.createIcons();
    }
  } catch (error) {
    console.error("Unable to load MoveMate drivers:", error);
    driverElements.tableBody.innerHTML = "";
    showTableMessage("We could not load registered drivers right now. Please check the Firebase connection and try again.", true);
  }
}

bindDriverActions();
loadDrivers();
