"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Upload, Camera, CheckCircle, Truck, Loader2, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { uploadDeliveryPhoto, uploadSignature } from "@/lib/storage"
import { analyzeBillOfLading, type PalletAnalysis } from "@/lib/ai-processing"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SignaturePad } from "@/components/signature-pad"
import { sendDeliveryNotification } from "@/lib/email"

interface DeliveryData {
  driverName: string
  driverPhone: string
  driverEmail: string
  companyName: string
  pickupLocation: string
  deliveryLocation: string
  billOfLadingPhoto: File | null
  billOfLadingUrl: string
  palletCount: number
  palletAnalysis: PalletAnalysis | null
  signature: string
  signatureUrl: string
}

const STEPS = [
  { id: 1, title: "Driver Information", description: "Tell us about yourself" },
  { id: 2, title: "Delivery Details", description: "Pickup and delivery information" },
  { id: 3, title: "Bill of Lading", description: "Upload your documentation" },
  { id: 4, title: "Pallet Count", description: "Confirm pallet quantity" },
  { id: 5, title: "Confirmation", description: "Sign and complete" },
]

export default function DriverPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deliveryData, setDeliveryData] = useState<DeliveryData>({
    driverName: "",
    driverPhone: "",
    driverEmail: "",
    companyName: "",
    pickupLocation: "",
    deliveryLocation: "",
    billOfLadingPhoto: null,
    billOfLadingUrl: "",
    palletCount: 0,
    palletAnalysis: null,
    signature: "",
    signatureUrl: "",
  })

  const progress = (currentStep / STEPS.length) * 100

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleInputChange = (field: keyof DeliveryData, value: string | number | File | PalletAnalysis) => {
    setDeliveryData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessingPhoto(true)
    setUploadError(null)

    try {
      // Generate temporary delivery ID for file naming
      const tempDeliveryId = `temp-${Date.now()}`

      // Upload file to Supabase Storage
      const photoUrl = await uploadDeliveryPhoto(file, tempDeliveryId)

      // Update state with file and URL
      handleInputChange("billOfLadingPhoto", file)
      handleInputChange("billOfLadingUrl", photoUrl)

      // Auto-advance to next step
      setTimeout(() => {
        setCurrentStep(4)
      }, 500)

      // Process image with AI to extract pallet count
      const analysis = await analyzeBillOfLading(photoUrl)

      // Update state with AI analysis results
      handleInputChange("palletAnalysis", analysis)
      handleInputChange("palletCount", analysis.palletCount)
    } catch (error) {
      console.error("Photo upload/processing error:", error)
      setUploadError(error instanceof Error ? error.message : "Failed to process photo")
    } finally {
      setIsProcessingPhoto(false)
    }
  }

  const handleSignatureChange = (signatureDataUrl: string) => {
    handleInputChange("signature", signatureDataUrl)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      // Generate final delivery ID
      const deliveryId = `delivery-${Date.now()}`

      // Upload signature if present
      let signatureUrl = ""
      if (deliveryData.signature) {
        signatureUrl = await uploadSignature(deliveryData.signature, deliveryId)
        handleInputChange("signatureUrl", signatureUrl)
      }

      // Create delivery record
      const { data, error } = await supabase
        .from("deliveries")
        .insert({
          driver_name: deliveryData.driverName,
          driver_phone: deliveryData.driverPhone,
          driver_email: deliveryData.driverEmail,
          company_name: deliveryData.companyName,
          pickup_location: deliveryData.pickupLocation,
          delivery_location: deliveryData.deliveryLocation,
          pallet_count: deliveryData.palletCount,
          bill_of_lading_url: deliveryData.billOfLadingUrl,
          signature_url: signatureUrl,
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
          chat_responses: {
            driverInfo: {
              name: deliveryData.driverName,
              phone: deliveryData.driverPhone,
              email: deliveryData.driverEmail,
              company: deliveryData.companyName,
            },
            deliveryInfo: {
              pickup: deliveryData.pickupLocation,
              delivery: deliveryData.deliveryLocation,
            },
            aiAnalysis: deliveryData.palletAnalysis,
          },
        })
        .select()

      if (error) throw error

      // Create photo record
      if (deliveryData.billOfLadingUrl && data?.[0]) {
        await supabase.from("delivery_photos").insert({
          delivery_id: data[0].id,
          photo_url: deliveryData.billOfLadingUrl,
          photo_type: "bill_of_lading",
        })
      }

      // Create signature photo record
      if (signatureUrl && data?.[0]) {
        await supabase.from("delivery_photos").insert({
          delivery_id: data[0].id,
          photo_url: signatureUrl,
          photo_type: "signature",
        })
      }

      if (data?.[0]) {
        try {
          await sendDeliveryNotification({
            deliveryId: data[0].id,
            driverName: deliveryData.driverName,
            driverPhone: deliveryData.driverPhone,
            driverEmail: deliveryData.driverEmail,
            companyName: deliveryData.companyName,
            pickupLocation: deliveryData.pickupLocation,
            deliveryLocation: deliveryData.deliveryLocation,
            palletCount: deliveryData.palletCount,
            confirmedAt: data[0].confirmed_at,
            billOfLadingUrl: deliveryData.billOfLadingUrl,
            signatureUrl: signatureUrl,
            aiAnalysis: deliveryData.palletAnalysis
              ? {
                  confidence: deliveryData.palletAnalysis.confidence,
                  reasoning: deliveryData.palletAnalysis.reasoning,
                }
              : undefined,
          })
        } catch (emailError) {
          console.error("Email notification failed:", emailError)
          // Don't fail the entire submission if email fails
        }
      }

      console.log("Delivery created:", data)

      // Show success message
      alert("Delivery confirmed successfully! Admins have been notified via email.")
    } catch (error) {
      console.error("Error submitting delivery:", error)
      alert("Error submitting delivery. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-2">Hi there! Let's get started</h2>
              <p className="text-muted-foreground">First, tell us a bit about yourself</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="driverName">Your Name</Label>
                <Input
                  id="driverName"
                  placeholder="Enter your full name"
                  value={deliveryData.driverName}
                  onChange={(e) => handleInputChange("driverName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="driverPhone">Phone Number</Label>
                <Input
                  id="driverPhone"
                  placeholder="(555) 123-4567"
                  value={deliveryData.driverPhone}
                  onChange={(e) => handleInputChange("driverPhone", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="driverEmail">Email Address</Label>
                <Input
                  id="driverEmail"
                  type="email"
                  placeholder="your.email@company.com"
                  value={deliveryData.driverEmail}
                  onChange={(e) => handleInputChange("driverEmail", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Your trucking company"
                  value={deliveryData.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-2">Great! Now about this delivery</h2>
              <p className="text-muted-foreground">Where are you picking up and delivering?</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="pickupLocation">Pickup Location</Label>
                <Textarea
                  id="pickupLocation"
                  placeholder="Enter the full pickup address or location details"
                  value={deliveryData.pickupLocation}
                  onChange={(e) => handleInputChange("pickupLocation", e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="deliveryLocation">Delivery Location</Label>
                <Textarea
                  id="deliveryLocation"
                  placeholder="Enter the full delivery address or location details"
                  value={deliveryData.deliveryLocation}
                  onChange={(e) => handleInputChange("deliveryLocation", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-2">Upload your Bill of Lading</h2>
              <p className="text-muted-foreground">Take a clear photo of your documentation</p>
            </div>
            <div className="space-y-4">
              {uploadError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              {!deliveryData.billOfLadingPhoto ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">Upload Bill of Lading</p>
                    <p className="text-sm text-muted-foreground">Take a photo or select from your device</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                    disabled={isProcessingPhoto}
                  />
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <Button className="mt-4" disabled={isProcessingPhoto} asChild>
                      <span>
                        {isProcessingPhoto ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Take Photo
                          </>
                        )}
                      </span>
                    </Button>
                  </Label>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-green-600">Photo uploaded successfully!</p>
                    <p className="text-sm text-muted-foreground">
                      {isProcessingPhoto ? "Processing document to count pallets..." : "Document processed"}
                    </p>
                  </div>
                  {deliveryData.billOfLadingUrl && (
                    <div className="mt-4">
                      <img
                        src={deliveryData.billOfLadingUrl || "/placeholder.svg"}
                        alt="Bill of Lading"
                        className="max-w-full h-48 object-contain mx-auto rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-2">Pallet Count Analysis</h2>
              <p className="text-muted-foreground">AI has analyzed your document</p>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{deliveryData.palletCount}</div>
                <p className="text-lg font-medium">Pallets Detected</p>
                {deliveryData.palletAnalysis && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p className="font-medium">
                      Confidence: {Math.round(deliveryData.palletAnalysis.confidence * 100)}%
                    </p>
                    <p className="mt-2">{deliveryData.palletAnalysis.reasoning}</p>
                    {deliveryData.palletAnalysis.additionalNotes && (
                      <p className="mt-2 italic">{deliveryData.palletAnalysis.additionalNotes}</p>
                    )}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="palletCount">Adjust if needed</Label>
                <Input
                  id="palletCount"
                  type="number"
                  min="0"
                  value={deliveryData.palletCount}
                  onChange={(e) => handleInputChange("palletCount", Number.parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Please verify the AI count matches your actual pallet quantity
                </p>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-2">Almost done!</h2>
              <p className="text-muted-foreground">Please sign to confirm pickup</p>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                <h3 className="font-semibold mb-4">Delivery Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Driver:</span>
                    <span>{deliveryData.driverName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Company:</span>
                    <span>{deliveryData.companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pallets:</span>
                    <span className="font-semibold">{deliveryData.palletCount}</span>
                  </div>
                  {deliveryData.palletAnalysis && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">AI Confidence:</span>
                      <span>{Math.round(deliveryData.palletAnalysis.confidence * 100)}%</span>
                    </div>
                  )}
                </div>
              </div>

              <SignaturePad onSignatureChange={handleSignatureChange} />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return deliveryData.driverName && deliveryData.driverPhone && deliveryData.companyName
      case 2:
        return deliveryData.pickupLocation && deliveryData.deliveryLocation
      case 3:
        return deliveryData.billOfLadingPhoto && !isProcessingPhoto
      case 4:
        return deliveryData.palletCount > 0
      case 5:
        return deliveryData.signature.trim().length > 0
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-600 p-3 rounded-full">
                <Truck className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Pallet Pickup Process</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1]?.title}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              {STEPS.map((step) => (
                <span key={step.id} className={currentStep >= step.id ? "text-blue-600 font-medium" : ""}>
                  {step.title}
                </span>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <Card>
            <CardHeader>
              <CardTitle>{STEPS[currentStep - 1]?.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {renderStep()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                {currentStep < STEPS.length ? (
                  <Button onClick={handleNext} disabled={!canProceed()}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canProceed() || isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? "Submitting..." : "Confirm Pickup"}
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
