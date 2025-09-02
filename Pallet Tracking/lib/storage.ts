import { createClient } from "@/lib/supabase/client"

export async function uploadDeliveryPhoto(file: File, deliveryId: string): Promise<string> {
  const supabase = createClient()

  // Generate unique filename
  const fileExt = file.name.split(".").pop()
  const fileName = `${deliveryId}-${Date.now()}.${fileExt}`
  const filePath = `bill-of-lading/${fileName}`

  // Upload file to Supabase Storage
  const { data, error } = await supabase.storage.from("delivery-photos").upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) {
    console.error("Upload error:", error)
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("delivery-photos").getPublicUrl(filePath)

  return publicUrl
}

export async function uploadSignature(signatureDataUrl: string, deliveryId: string): Promise<string> {
  const supabase = createClient()

  // Convert base64 to blob
  const response = await fetch(signatureDataUrl)
  const blob = await response.blob()

  // Generate unique filename
  const fileName = `${deliveryId}-signature-${Date.now()}.png`
  const filePath = `signatures/${fileName}`

  // Upload signature to Supabase Storage
  const { data, error } = await supabase.storage.from("delivery-photos").upload(filePath, blob, {
    cacheControl: "3600",
    upsert: false,
    contentType: "image/png",
  })

  if (error) {
    console.error("Signature upload error:", error)
    throw new Error(`Failed to upload signature: ${error.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("delivery-photos").getPublicUrl(filePath)

  return publicUrl
}

export async function deleteDeliveryPhoto(filePath: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.storage.from("delivery-photos").remove([filePath])

  if (error) {
    console.error("Delete error:", error)
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}
