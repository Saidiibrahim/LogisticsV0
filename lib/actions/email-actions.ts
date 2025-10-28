"use server"

import { format, parseISO } from "date-fns"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Send roster assignment notification to a driver.
 * @param driverEmail - Driver's email address
 * @param driverName - Driver's name
 * @param assignments - Array of dates assigned to this driver
 * @param weekStart - Week start date (Monday)
 * @returns Success status and notification ID
 */
export async function sendRosterNotification(
  driverEmail: string,
  driverName: string,
  assignments: string[], // Array of ISO date strings
  weekStart: string
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.error("[email] RESEND_API_KEY not configured")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const weekStartFormatted = format(parseISO(weekStart), "MMMM d, yyyy")

    const { data, error } = await resend.emails.send({
      from: "Route Calendar <refprep@ibrahimscode.dev>",
      to: [driverEmail],
      subject: `Your Driver Schedule - Week of ${weekStartFormatted}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .date-list { background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .date-item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .date-item:last-child { border-bottom: none; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">CourierRun</h1>
      <p style="margin: 10px 0 0 0;">Weekly Driver Schedule</p>
    </div>
    <div class="content">
      <h2>Hello ${driverName},</h2>
      <p>Your driving schedule for the week of <strong>${weekStartFormatted}</strong> has been published.</p>

      <div class="date-list">
        <h3 style="margin-top: 0;">Your Assigned Days:</h3>
        ${assignments
          .map((date) => {
            try {
              const formatted = format(parseISO(date), "EEEE, MMMM d")
              return `<div class="date-item">📅 ${formatted}</div>`
            } catch {
              return `<div class="date-item">📅 ${date}</div>`
            }
          })
          .join("")}
      </div>

      <p>Please review your schedule and contact your team leader if you have any questions or concerns.</p>

      <p><strong>Important:</strong> Make sure to check in before your shift and complete your pre-trip vehicle inspection.</p>

      <div class="footer">
        <p>This is an automated notification from CourierRun.</p>
        <p>Please do not reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
      `,
    })

    if (error) {
      console.error("[email] sendRosterNotification error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, notificationId: data?.id }
  } catch (error) {
    console.error("[email] sendRosterNotification exception:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Send roster change notification to a driver.
 * @param driverEmail - Driver's email address
 * @param driverName - Driver's name
 * @param changedDates - Array of dates that were changed
 * @param weekStart - Week start date (Monday)
 * @returns Success status and notification ID
 */
export async function sendRosterChangeNotification(
  driverEmail: string,
  driverName: string,
  changedDates: string[],
  weekStart: string
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.error("[email] RESEND_API_KEY not configured")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const weekStartFormatted = format(parseISO(weekStart), "MMMM d, yyyy")

    const { data, error } = await resend.emails.send({
      from: "Route Calendar <refprep@ibrahimscode.dev>",
      to: [driverEmail],
      subject: `Schedule Update - Week of ${weekStartFormatted}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .alert { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .date-list { background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">⚠️ Schedule Change</h1>
      <p style="margin: 10px 0 0 0;">Route Calendar</p>
    </div>
    <div class="content">
      <h2>Hello ${driverName},</h2>

      <div class="alert">
        <strong>Your schedule has been updated!</strong>
      </div>

      <p>Your driving schedule for the week of <strong>${weekStartFormatted}</strong> has been modified.</p>

      <div class="date-list">
        <h3 style="margin-top: 0;">Changed Dates:</h3>
        ${changedDates
          .map((date) => {
            try {
              const formatted = format(parseISO(date), "EEEE, MMMM d")
              return `<div style="padding: 10px 0;">🔄 ${formatted}</div>`
            } catch {
              return `<div style="padding: 10px 0;">🔄 ${date}</div>`
            }
          })
          .join("")}
      </div>

      <p>Please review the updated schedule in Route Calendar and contact your team leader if you have any questions.</p>

      <div class="footer">
        <p>This is an automated notification from Route Calendar.</p>
        <p>Please do not reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
      `,
    })

    if (error) {
      console.error("[email] sendRosterChangeNotification error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, notificationId: data?.id }
  } catch (error) {
    console.error("[email] sendRosterChangeNotification exception:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Send weekly roster summary to team leaders/admins.
 * @param recipientEmail - Recipient's email address
 * @param weekStart - Week start date (Monday)
 * @param totalDrivers - Total number of drivers
 * @param totalAssignments - Total number of shift assignments
 * @returns Success status and notification ID
 */
export async function sendWeeklyRosterSummary(
  recipientEmail: string,
  weekStart: string,
  totalDrivers: number,
  totalAssignments: number
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.error("[email] RESEND_API_KEY not configured")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const weekStartFormatted = format(parseISO(weekStart), "MMMM d, yyyy")

    const { data, error } = await resend.emails.send({
      from: "Route Calendar <refprep@ibrahimscode.dev>",
      to: [recipientEmail],
      subject: `Weekly Roster Published - Week of ${weekStartFormatted}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .stat-card { background-color: white; padding: 20px; border-radius: 6px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: bold; color: #10b981; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">✅ Roster Published</h1>
      <p style="margin: 10px 0 0 0;">Route Calendar</p>
    </div>
    <div class="content">
      <h2>Weekly Roster Summary</h2>
      <p>The roster for the week of <strong>${weekStartFormatted}</strong> has been published and all drivers have been notified.</p>

      <div class="stats">
        <div class="stat-card">
          <div class="stat-value">${totalDrivers}</div>
          <div style="color: #6b7280; margin-top: 5px;">Drivers</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${totalAssignments}</div>
          <div style="color: #6b7280; margin-top: 5px;">Assignments</div>
        </div>
      </div>

      <p>All scheduled drivers have received their weekly assignments via email.</p>

      <div class="footer">
        <p>This is an automated notification from Route Calendar.</p>
        <p>Please do not reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
      `,
    })

    if (error) {
      console.error("[email] sendWeeklyRosterSummary error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, notificationId: data?.id }
  } catch (error) {
    console.error("[email] sendWeeklyRosterSummary exception:", error)
    return { success: false, error: String(error) }
  }
}
