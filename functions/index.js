const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const nodemailer = require("nodemailer");

const notificationEmail = process.env.NOTIFICATION_EMAIL || "williamdeekgaratsi@gmail.com";
const gmailEmail = process.env.GMAIL_EMAIL || notificationEmail;
const pendingStatuses = new Set(["submitted", "pending", "under_review", "resubmitted"]);

function clean(value, fallback = "Not provided") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function escapeHtml(value) {
  return clean(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function toMillis(value) {
  if (!value) return "";
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value.seconds) return value.seconds * 1000;
  return String(value);
}

function applicationMarker(application) {
  if (!application || typeof application !== "object") return "";

  return [
    clean(application.status, "").toLowerCase(),
    toMillis(application.submitted_at),
    toMillis(application.resubmitted_at),
    clean(application.id_number, ""),
    clean(application.number_plate, ""),
    clean(application.car_model, "")
  ].join("|");
}

function isPendingDriverApplication(application) {
  if (!application || typeof application !== "object") return false;

  const status = clean(application.status, "").toLowerCase();
  return !status || pendingStatuses.has(status);
}

function shouldNotify(before, after) {
  const beforeApplication = before?.driver_application;
  const afterApplication = after?.driver_application;

  if (!isPendingDriverApplication(afterApplication)) return false;
  return applicationMarker(beforeApplication) !== applicationMarker(afterApplication);
}

function buildEmail({ userId, user, application }) {
  const vehicle = user.vehicle || {};
  const name = clean(user.fullName || user.name || user.displayName);
  const phone = clean(user.phone || application.phone);
  const email = clean(user.email);
  const vehicleModel = clean(vehicle.car_model || application.car_model);
  const numberPlate = clean(vehicle.number_plate || application.number_plate);
  const status = clean(application.status, "submitted");

  const lines = [
    "A new driver application was submitted in MoveMate.",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Status: ${status}`,
    `Vehicle: ${vehicleModel}`,
    `Number plate: ${numberPlate}`,
    `User ID: ${userId}`,
    "",
    "Open the admin dashboard to review the driver's documents and approve or reject the application."
  ];

  return {
    subject: `New driver application: ${name}`,
    text: lines.join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
        <h2>New driver application</h2>
        <p>A new driver application was submitted in MoveMate.</p>
        <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
          <tr><td><strong>Name</strong></td><td>${escapeHtml(name)}</td></tr>
          <tr><td><strong>Email</strong></td><td>${escapeHtml(email)}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${escapeHtml(phone)}</td></tr>
          <tr><td><strong>Status</strong></td><td>${escapeHtml(status)}</td></tr>
          <tr><td><strong>Vehicle</strong></td><td>${escapeHtml(vehicleModel)}</td></tr>
          <tr><td><strong>Number plate</strong></td><td>${escapeHtml(numberPlate)}</td></tr>
          <tr><td><strong>User ID</strong></td><td>${escapeHtml(userId)}</td></tr>
        </table>
        <p>Open the admin dashboard to review the driver's documents and approve or reject the application.</p>
      </div>
    `
  };
}

exports.notifyDriverApplication = onDocumentWritten(
  {
    document: "users/{userId}",
    region: "europe-west1",
    secrets: ["GMAIL_APP_PASSWORD"]
  },
  async (event) => {
    const before = event.data?.before.exists ? event.data.before.data() : null;
    const after = event.data?.after.exists ? event.data.after.data() : null;

    if (!after || !shouldNotify(before, after)) return;

    const appPassword = process.env.GMAIL_APP_PASSWORD;
    if (!appPassword) {
      logger.error("GMAIL_APP_PASSWORD secret is not configured.");
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailEmail,
        pass: appPassword
      }
    });

    const email = buildEmail({
      userId: event.params.userId,
      user: after,
      application: after.driver_application
    });

    await transporter.sendMail({
      from: `MoveMate Admin <${gmailEmail}>`,
      to: notificationEmail,
      ...email
    });

    logger.info("Driver application notification sent.", {
      userId: event.params.userId,
      to: notificationEmail
    });
  }
);
