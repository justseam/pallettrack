import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const deliveryData = await request.json()
    const supabase = await createClient()

    // Get active admin emails
    const { data: adminUsers, error: adminError } = await supabase
      .from("admin_users")
      .select("email, name")
      .eq("is_active", true)

    if (adminError) {
      console.error("Error fetching admin users:", adminError)
      return NextResponse.json({ error: "Failed to fetch admin users" }, { status: 500 })
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.warn("No active admin users found for email notifications")
      return NextResponse.json({ message: "No active admin users to notify" }, { status: 200 })
    }

    // Create email content
    const emailSubject = `New Pallet Delivery Confirmed - ${deliveryData.palletCount} Pallets`
    const emailHtml = generateEmailTemplate(deliveryData)
    const emailText = generateEmailText(deliveryData)

    // Send emails to all active admins
    const emailPromises = adminUsers.map(async (admin) => {
      try {
        // Using a simple email service simulation
        // In production, you would integrate with services like Resend, SendGrid, etc.
        console.log(`Sending email to ${admin.email}:`)
        console.log(`Subject: ${emailSubject}`)
        console.log(`Content: ${emailText}`)

        // Simulate email sending delay
        await new Promise((resolve) => setTimeout(resolve, 100))

        return { success: true, email: admin.email }
      } catch (error) {
        console.error(`Failed to send email to ${admin.email}:`, error)
        return { success: false, email: admin.email, error }
      }
    })

    const results = await Promise.all(emailPromises)
    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    console.log(`Email notifications: ${successful} sent, ${failed} failed`)

    return NextResponse.json({
      message: "Email notifications processed",
      successful,
      failed,
      results,
    })
  } catch (error) {
    console.error("Error in send-notification API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateEmailTemplate(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Pallet Delivery Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .section { margin-bottom: 20px; }
        .label { font-weight: bold; color: #374151; }
        .value { margin-left: 10px; }
        .pallet-count { font-size: 24px; font-weight: bold; color: #2563eb; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚛 Pallet Delivery Confirmed</h1>
        </div>
        <div class="content">
          <div class="section">
            <h2>Delivery Summary</h2>
            <p><span class="label">Pallets Confirmed:</span> <span class="pallet-count">${data.palletCount}</span></p>
            <p><span class="label">Confirmed At:</span> <span class="value">${new Date(data.confirmedAt).toLocaleString()}</span></p>
            <p><span class="label">Status:</span> <span class="value">✅ Confirmed</span></p>
          </div>
          
          <div class="section">
            <h3>Driver Information</h3>
            <p><span class="label">Name:</span> <span class="value">${data.driverName}</span></p>
            <p><span class="label">Phone:</span> <span class="value">${data.driverPhone}</span></p>
            <p><span class="label">Email:</span> <span class="value">${data.driverEmail}</span></p>
            <p><span class="label">Company:</span> <span class="value">${data.companyName}</span></p>
          </div>
          
          <div class="section">
            <h3>Delivery Details</h3>
            <p><span class="label">Pickup Location:</span></p>
            <p style="margin-left: 20px; color: #6b7280;">${data.pickupLocation}</p>
            <p><span class="label">Delivery Location:</span></p>
            <p style="margin-left: 20px; color: #6b7280;">${data.deliveryLocation}</p>
          </div>
          
          ${
            data.aiAnalysis
              ? `
          <div class="section">
            <h3>AI Analysis</h3>
            <p><span class="label">Confidence:</span> <span class="value">${Math.round(data.aiAnalysis.confidence * 100)}%</span></p>
            <p><span class="label">Analysis:</span> <span class="value">${data.aiAnalysis.reasoning}</span></p>
          </div>
          `
              : ""
          }
          
          <div class="section">
            <h3>Documentation</h3>
            ${data.billOfLadingUrl ? `<p>📄 <a href="${data.billOfLadingUrl}">View Bill of Lading</a></p>` : ""}
            ${data.signatureUrl ? `<p>✍️ <a href="${data.signatureUrl}">View Digital Signature</a></p>` : ""}
          </div>
        </div>
        <div class="footer">
          <p>This is an automated notification from the Pallet Tracking System</p>
          <p>Delivery ID: ${data.deliveryId}</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateEmailText(data: any): string {
  return `
PALLET DELIVERY CONFIRMED

Delivery Summary:
- Pallets Confirmed: ${data.palletCount}
- Confirmed At: ${new Date(data.confirmedAt).toLocaleString()}
- Status: Confirmed

Driver Information:
- Name: ${data.driverName}
- Phone: ${data.driverPhone}
- Email: ${data.driverEmail}
- Company: ${data.companyName}

Delivery Details:
- Pickup Location: ${data.pickupLocation}
- Delivery Location: ${data.deliveryLocation}

${
  data.aiAnalysis
    ? `
AI Analysis:
- Confidence: ${Math.round(data.aiAnalysis.confidence * 100)}%
- Analysis: ${data.aiAnalysis.reasoning}
`
    : ""
}

Documentation:
${data.billOfLadingUrl ? `- Bill of Lading: ${data.billOfLadingUrl}` : ""}
${data.signatureUrl ? `- Digital Signature: ${data.signatureUrl}` : ""}

---
This is an automated notification from the Pallet Tracking System
Delivery ID: ${data.deliveryId}
  `.trim()
}
