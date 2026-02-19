"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Monitor,
  RefreshCw,
  Wifi,
  ArrowLeft,
  Copy,
  Check,
  LayoutDashboard,
  List,
  Info,
  Thermometer,
  Battery,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { DisplayPreview } from "@/components/display-preview"

interface DisplayData {
  timestamp: string
  display: { width: number; height: number; type: string }
  stats: {
    totalDeliveries: number
    totalPallets: number
    todayDeliveries: number
    todayPallets: number
    confirmedCount: number
  }
  recent: {
    driver: string
    company: string
    pallets: number
    status: string
    time: string
  }[]
}

type DisplayView = "dashboard" | "deliveries" | "status"

export default function DisplayPage() {
  const [displayData, setDisplayData] = useState<DisplayData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [activeView, setActiveView] = useState<DisplayView>("dashboard")
  const [copied, setCopied] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchDisplayData = useCallback(async () => {
    try {
      const response = await fetch("/api/display")
      if (response.ok) {
        const data = await response.json()
        setDisplayData(data)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error("Failed to fetch display data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDisplayData()
  }, [fetchDisplayData])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchDisplayData, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchDisplayData])

  const handleCopyEndpoint = () => {
    const endpoint = `${window.location.origin}/api/display`
    navigator.clipboard.writeText(endpoint)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRefresh = () => {
    setIsLoading(true)
    fetchDisplayData()
  }

  const arduinoSketch = `#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "ST7305.h"  // Waveshare RLCD driver

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// API endpoint - replace with your server URL
const char* apiUrl = "${typeof window !== "undefined" ? window.location.origin : "https://your-app.vercel.app"}/api/display";

// Refresh interval (ms)
const unsigned long REFRESH_INTERVAL = 30000;
unsigned long lastRefresh = 0;

ST7305 display;

void setup() {
  Serial.begin(115200);

  // Initialize display
  display.begin();
  display.clearDisplay();
  display.setTextColor(BLACK);
  display.setFont(MONO_8);
  display.drawString(10, 200, "Connecting to WiFi...");
  display.refresh();

  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi connected: " + WiFi.localIP().toString());

  display.clearDisplay();
  display.drawString(10, 200, "WiFi connected!");
  display.refresh();
  delay(1000);

  // Initial data fetch
  fetchAndRender();
}

void loop() {
  if (millis() - lastRefresh >= REFRESH_INTERVAL) {
    fetchAndRender();
    lastRefresh = millis();
  }
}

void fetchAndRender() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(apiUrl);
  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();

    JsonDocument doc;
    deserializeJson(doc, payload);

    int todayDel = doc["stats"]["todayDeliveries"];
    int todayPal = doc["stats"]["todayPallets"];
    int totalDel = doc["stats"]["totalDeliveries"];
    int totalPal = doc["stats"]["totalPallets"];

    display.clearDisplay();

    // Header
    display.fillRect(0, 0, 300, 42, BLACK);
    display.setTextColor(WHITE);
    display.setFont(MONO_10);
    display.drawString(10, 14, "PALLET TRACKER");
    display.setFont(MONO_9);
    display.drawString(10, 30, getTimeString());

    // Stats boxes
    display.setTextColor(BLACK);
    display.drawRect(8, 50, 136, 62, BLACK);
    display.setFont(MONO_9);
    display.drawStringCentered(76, 68, "TODAY");
    display.setFont(MONO_24);
    display.drawStringCentered(76, 94, String(todayDel));

    display.drawRect(156, 50, 136, 62, BLACK);
    display.setFont(MONO_9);
    display.drawStringCentered(224, 68, "TODAY PALLETS");
    display.setFont(MONO_24);
    display.drawStringCentered(224, 94, String(todayPal));

    display.drawRect(8, 120, 136, 62, BLACK);
    display.setFont(MONO_9);
    display.drawStringCentered(76, 138, "ALL TIME");
    display.setFont(MONO_24);
    display.drawStringCentered(76, 164, String(totalDel));

    display.drawRect(156, 120, 136, 62, BLACK);
    display.setFont(MONO_9);
    display.drawStringCentered(224, 138, "TOTAL PALLETS");
    display.setFont(MONO_24);
    display.drawStringCentered(224, 164, String(totalPal));

    // Recent deliveries
    display.drawLine(8, 194, 292, 194, BLACK);
    display.setFont(MONO_10);
    display.drawString(10, 210, "RECENT DELIVERIES");

    display.fillRect(8, 220, 284, 16, BLACK);
    display.setTextColor(WHITE);
    display.setFont(MONO_8);
    display.drawString(12, 230, "DRIVER");
    display.drawString(130, 230, "CO.");
    display.drawStringCentered(220, 230, "PLT");
    display.drawStringRight(288, 230, "TIME");

    display.setTextColor(BLACK);
    JsonArray recent = doc["stats"]["recent"];
    for (int i = 0; i < recent.size() && i < 5; i++) {
      int y = 240 + i * 28;
      if (i % 2 == 0) display.fillRect(8, y, 284, 28, LIGHT_GRAY);
      display.setFont(MONO_8);
      display.drawString(12, y + 12, recent[i]["driver"].as<String>());
      display.setFont(MONO_7);
      display.drawString(12, y + 23, recent[i]["company"].as<String>());
      display.setFont(MONO_12);
      display.drawStringCentered(220, y + 17, String(recent[i]["pallets"].as<int>()));
      display.setFont(MONO_8);
      display.drawStringRight(288, y + 17, recent[i]["time"].as<String>());
    }

    display.refresh();
  }

  http.end();
}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Monitor className="h-8 w-8" />
                Waveshare Display Manager
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                ESP32-S3-RLCD-4.2 | 300x400 Reflective LCD | ST7305 Driver
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={autoRefresh ? "default" : "secondary"}>
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} style={autoRefresh ? { animationDuration: "3s" } : {}} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[auto_1fr] gap-8">
          {/* Display Preview Column */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Display Preview</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant={activeView === "dashboard" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveView("dashboard")}
                    >
                      <LayoutDashboard className="h-3.5 w-3.5 mr-1" />
                      Dashboard
                    </Button>
                    <Button
                      variant={activeView === "deliveries" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveView("deliveries")}
                    >
                      <List className="h-3.5 w-3.5 mr-1" />
                      Deliveries
                    </Button>
                    <Button
                      variant={activeView === "status" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveView("status")}
                    >
                      <Info className="h-3.5 w-3.5 mr-1" />
                      Status
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Pixel-accurate preview of the 4.2" RLCD (300x400)
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-6">
                <DisplayPreview data={displayData} view={activeView} scale={1.4} />
              </CardContent>
            </Card>

            {lastRefresh && (
              <p className="text-center text-xs text-muted-foreground">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Configuration Column */}
          <div className="space-y-6">
            {/* Device Info Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Wifi className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Connection</p>
                      <p className="text-xs text-muted-foreground">WiFi / HTTP GET</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Thermometer className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Sensors</p>
                      <p className="text-xs text-muted-foreground">SHTC3 Temp/Humidity</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <Battery className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Power</p>
                      <p className="text-xs text-muted-foreground">18650 + USB-C</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Setup Tabs */}
            <Tabs defaultValue="endpoint">
              <TabsList className="w-full">
                <TabsTrigger value="endpoint" className="flex-1">API Endpoint</TabsTrigger>
                <TabsTrigger value="firmware" className="flex-1">Firmware</TabsTrigger>
                <TabsTrigger value="specs" className="flex-1">Specs</TabsTrigger>
              </TabsList>

              <TabsContent value="endpoint" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">API Endpoint</CardTitle>
                    <CardDescription>
                      The ESP32 fetches data from this endpoint over WiFi
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <code className="flex-1 bg-gray-100 dark:bg-gray-800 px-4 py-2.5 rounded-lg text-sm font-mono break-all">
                        {typeof window !== "undefined" ? window.location.origin : ""}/api/display
                      </code>
                      <Button variant="outline" size="sm" onClick={handleCopyEndpoint} className="shrink-0">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Response Format</h4>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-x-auto">
{`GET /api/display

{
  "timestamp": "2026-02-19T...",
  "display": { "width": 300, "height": 400, "type": "rlcd_bw" },
  "stats": {
    "totalDeliveries": 42,
    "totalPallets": 156,
    "todayDeliveries": 3,
    "todayPallets": 12,
    "confirmedCount": 40
  },
  "recent": [
    {
      "driver": "John Smith",
      "company": "ABC Trucking",
      "pallets": 5,
      "status": "confirmed",
      "time": "02:15 PM"
    }
  ]
}`}
                      </pre>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">How It Works</h4>
                      <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                        <li>ESP32-S3 connects to your WiFi network</li>
                        <li>Sends HTTP GET to <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/api/display</code> every 30 seconds</li>
                        <li>Parses JSON response with ArduinoJson</li>
                        <li>Renders stats and delivery list on the 300x400 RLCD</li>
                        <li>RLCD retains image without power (reflective, no backlight)</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="firmware" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Arduino Firmware Sketch</CardTitle>
                    <CardDescription>
                      Flash this to your ESP32-S3-RLCD-4.2 using Arduino IDE or ESP-IDF
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Prerequisites</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Arduino IDE with ESP32 board support</li>
                        <li>ArduinoJson library (v7+)</li>
                        <li>Waveshare ST7305 display driver library</li>
                        <li>WiFi credentials for your network</li>
                      </ul>
                    </div>

                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2 z-10"
                        onClick={() => {
                          navigator.clipboard.writeText(arduinoSketch)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        }}
                      >
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-x-auto max-h-96 overflow-y-auto">
                        {arduinoSketch}
                      </pre>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Upload Steps</h4>
                      <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                        <li>Open Arduino IDE and select board: <strong>ESP32S3 Dev Module</strong></li>
                        <li>Set Flash Size to <strong>16MB</strong> and PSRAM to <strong>OPI PSRAM</strong></li>
                        <li>Replace WiFi credentials in the sketch</li>
                        <li>Update the <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">apiUrl</code> with your deployment URL</li>
                        <li>Connect ESP32 via USB-C and upload</li>
                        <li>Open Serial Monitor (115200 baud) to verify WiFi connection</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="specs" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Hardware Specifications</CardTitle>
                    <CardDescription>
                      Waveshare ESP32-S3-RLCD-4.2 Development Board
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                          <Monitor className="h-4 w-4" /> Display
                        </h4>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <span className="text-muted-foreground">Type</span>
                          <span>Reflective LCD (RLCD)</span>
                          <span className="text-muted-foreground">Size</span>
                          <span>4.2 inches</span>
                          <span className="text-muted-foreground">Resolution</span>
                          <span>300 x 400 pixels</span>
                          <span className="text-muted-foreground">Color</span>
                          <span>Black & White</span>
                          <span className="text-muted-foreground">Driver IC</span>
                          <span>ST7305</span>
                          <span className="text-muted-foreground">Backlight</span>
                          <span>None (ambient light reflective)</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                          <Info className="h-4 w-4" /> Processor
                        </h4>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <span className="text-muted-foreground">SoC</span>
                          <span>ESP32-S3-WROOM-1-N16R8</span>
                          <span className="text-muted-foreground">CPU</span>
                          <span>Dual-core LX7 @ 240MHz</span>
                          <span className="text-muted-foreground">Flash</span>
                          <span>16MB</span>
                          <span className="text-muted-foreground">PSRAM</span>
                          <span>8MB (OPI)</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                          <Wifi className="h-4 w-4" /> Connectivity
                        </h4>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <span className="text-muted-foreground">WiFi</span>
                          <span>802.11 b/g/n (2.4GHz)</span>
                          <span className="text-muted-foreground">Bluetooth</span>
                          <span>BLE 5.0</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                          <Thermometer className="h-4 w-4" /> Sensors & Peripherals
                        </h4>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <span className="text-muted-foreground">Temp/Humidity</span>
                          <span>SHTC3</span>
                          <span className="text-muted-foreground">RTC</span>
                          <span>PCF85063</span>
                          <span className="text-muted-foreground">Audio ADC</span>
                          <span>ES7210 (dual mic array)</span>
                          <span className="text-muted-foreground">Audio Codec</span>
                          <span>ES8311 + Speaker</span>
                          <span className="text-muted-foreground">Storage</span>
                          <span>TF Card Slot</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                          <Battery className="h-4 w-4" /> Power
                        </h4>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <span className="text-muted-foreground">Main Battery</span>
                          <span>18650 Li-ion holder</span>
                          <span className="text-muted-foreground">RTC Backup</span>
                          <span>Rechargeable coin cell holder</span>
                          <span className="text-muted-foreground">USB</span>
                          <span>USB-C (charge + data)</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                          <Clock className="h-4 w-4" /> Development
                        </h4>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <span className="text-muted-foreground">Frameworks</span>
                          <span>Arduino IDE / ESP-IDF</span>
                          <span className="text-muted-foreground">USB Interface</span>
                          <span>USB-C (native USB on ESP32-S3)</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
