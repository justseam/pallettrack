interface DeliveryEmailData {
  deliveryId: string
  driverName: string
  driverPhone: string
  driverEmail: string
  companyName: string
  pickupLocation: string
  deliveryLocation: string
  palletCount: number
  confirmedAt: string
  billOfLadingUrl?: string
  signatureUrl?: string
  aiAnalysis?: {
    confidence: number
    reasoning: string
  }
}

export async function sendDeliveryNotification(deliveryData: DeliveryEmailData): Promise<void> {
  try {
    const response = await fetch("/api/send-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(deliveryData),
    })

    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`)
    }

    console.log("Email notification sent successfully")
  } catch (error) {
    console.error("Error sending email notification:", error)
    throw error
  }
}
