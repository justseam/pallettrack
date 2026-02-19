"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Monitor,
  RefreshCw,
  Wifi,
  Copy,
  Check,
  LayoutDashboard,
  Clock,
  CloudSun,
  Thermometer,
  Battery,
  Info,
  Settings,
  Mic,
  Speaker,
  Sun,
  Moon,
} from "lucide-react"
import { DisplayPreview } from "@/components/display-preview"
import { useTheme } from "next-themes"

export interface WidgetConfig {
  clock: boolean
  weather: boolean
  weatherLocation: string
  apiKey: string
}

export type DisplayView = "widgets" | "weather" | "status"

const DEFAULT_CONFIG: WidgetConfig = {
  clock: true,
  weather: true,
  weatherLocation: "New York",
  apiKey: "",
}

export default function HomePage() {
  const [displayData, setDisplayData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [activeView, setActiveView] = useState<DisplayView>("widgets")
  const [copied, setCopied] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [config, setConfig] = useState<WidgetConfig>(DEFAULT_CONFIG)
  const { theme, setTheme } = useTheme()

  const fetchDisplayData = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (config.weatherLocation) params.set("location", config.weatherLocation)
      if (config.apiKey) params.set("apiKey", config.apiKey)

      const response = await fetch(`/api/display?${params}`)
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
  }, [config.weatherLocation, config.apiKey])

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

    display.clearDisplay();

    // Header
    display.fillRect(0, 0, 300, 42, BLACK);
    display.setTextColor(WHITE);
    display.setFont(MONO_10);
    display.drawString(10, 14, "DISPLAY HUB");

    const char* time = doc["clock"]["time"];
    display.drawStringRight(290, 14, time);

    const char* date = doc["clock"]["date"];
    display.setFont(MONO_9);
    display.drawString(10, 30, date);
    display.drawStringRight(290, 30, "WiFi OK");

    display.setTextColor(BLACK);

    // Large time
    display.setFont(MONO_48);
    display.drawStringCentered(150, 100, time);

    display.setFont(MONO_12);
    display.drawStringCentered(150, 125, date);

    // Weather section
    display.drawLine(8, 150, 292, 150, BLACK);
    display.setFont(MONO_10);
    display.drawString(10, 168, "WEATHER");

    float temp = doc["weather"]["temp"];
    int humidity = doc["weather"]["humidity"];
    const char* condition = doc["weather"]["condition"];
    const char* location = doc["weather"]["location"];

    display.setFont(MONO_36);
    char tempStr[10];
    snprintf(tempStr, sizeof(tempStr), "%.0fF", temp);
    display.drawString(10, 220, tempStr);

    display.setFont(MONO_10);
    display.drawString(160, 195, condition);
    display.drawString(160, 212, location);

    char humStr[20];
    snprintf(humStr, sizeof(humStr), "Humidity: %d%%", humidity);
    display.setFont(MONO_9);
    display.drawString(160, 230, humStr);

    // Sensor data from onboard SHTC3
    display.drawLine(8, 260, 292, 260, BLACK);
    display.setFont(MONO_10);
    display.drawString(10, 278, "DEVICE SENSORS");

    // Read SHTC3 here and display...
    display.setFont(MONO_9);
    display.drawString(10, 298, "Indoor: --F  Humidity: --%");

    // Footer
    display.drawLine(8, 376, 292, 376, BLACK);
    display.setFont(MONO_8);
    display.drawStringCentered(150, 390,
      "ESP32-S3 RLCD 4.2 | Auto-refresh 30s");

    display.refresh();
  }

  http.end();
}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Top nav */}
      <header className="border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-black dark:bg-white p-2 rounded-lg">
              <Monitor className="h-5 w-5 text-white dark:text-black" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Display Hub</h1>
              <p className="text-xs text-muted-foreground">Waveshare ESP32-S3-RLCD-4.2</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={autoRefresh ? "default" : "secondary"} className="text-xs">
              {autoRefresh ? "Live" : "Paused"}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} style={autoRefresh ? { animationDuration: "3s" } : {}} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[auto_1fr] gap-8">
          {/* Display Preview Column */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Display Preview</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant={activeView === "widgets" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveView("widgets")}
                    >
                      <LayoutDashboard className="h-3.5 w-3.5 mr-1" />
                      Widgets
                    </Button>
                    <Button
                      variant={activeView === "weather" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveView("weather")}
                    >
                      <CloudSun className="h-3.5 w-3.5 mr-1" />
                      Weather
                    </Button>
                    <Button
                      variant={activeView === "status" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveView("status")}
                    >
                      <Info className="h-3.5 w-3.5 mr-1" />
                      Device
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  300 x 400 reflective LCD — no backlight, ambient light only
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

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick status cards */}
            <div className="grid sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Wifi className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">WiFi</p>
                      <p className="text-xs text-muted-foreground">HTTP / REST</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Mic className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Dual Mic</p>
                      <p className="text-xs text-muted-foreground">ES7210 ADC</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Speaker className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Speaker</p>
                      <p className="text-xs text-muted-foreground">ES8311 Codec</p>
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
                      <p className="text-sm font-medium">18650</p>
                      <p className="text-xs text-muted-foreground">+ USB-C</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main tabs */}
            <Tabs defaultValue="widgets">
              <TabsList className="w-full">
                <TabsTrigger value="widgets" className="flex-1">
                  <Settings className="h-3.5 w-3.5 mr-1.5" />
                  Widgets
                </TabsTrigger>
                <TabsTrigger value="endpoint" className="flex-1">
                  <Wifi className="h-3.5 w-3.5 mr-1.5" />
                  API
                </TabsTrigger>
                <TabsTrigger value="firmware" className="flex-1">
                  <Monitor className="h-3.5 w-3.5 mr-1.5" />
                  Firmware
                </TabsTrigger>
                <TabsTrigger value="specs" className="flex-1">
                  <Info className="h-3.5 w-3.5 mr-1.5" />
                  Specs
                </TabsTrigger>
              </TabsList>

              {/* Widget Config */}
              <TabsContent value="widgets" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Widget Configuration</CardTitle>
                    <CardDescription>Choose what data to show on your display</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Clock */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Clock</p>
                          <p className="text-sm text-muted-foreground">Large time and date display</p>
                        </div>
                      </div>
                      <Switch
                        checked={config.clock}
                        onCheckedChange={(checked) => setConfig({ ...config, clock: checked })}
                      />
                    </div>

                    {/* Weather */}
                    <div className="space-y-3 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CloudSun className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Weather</p>
                            <p className="text-sm text-muted-foreground">Current conditions and temperature</p>
                          </div>
                        </div>
                        <Switch
                          checked={config.weather}
                          onCheckedChange={(checked) => setConfig({ ...config, weather: checked })}
                        />
                      </div>
                      {config.weather && (
                        <div className="grid sm:grid-cols-2 gap-3 pt-2">
                          <div>
                            <Label htmlFor="location" className="text-xs">Location</Label>
                            <Input
                              id="location"
                              placeholder="e.g. New York"
                              value={config.weatherLocation}
                              onChange={(e) => setConfig({ ...config, weatherLocation: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="apiKey" className="text-xs">
                              OpenWeatherMap API Key
                            </Label>
                            <Input
                              id="apiKey"
                              type="password"
                              placeholder="Optional - uses demo data without"
                              value={config.apiKey}
                              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Onboard Sensors */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Thermometer className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Onboard Sensors</p>
                          <p className="text-sm text-muted-foreground">SHTC3 temperature & humidity (always active on device)</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Built-in</Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* API Endpoint */}
              <TabsContent value="endpoint" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">API Endpoint</CardTitle>
                    <CardDescription>
                      The ESP32 fetches this endpoint over WiFi every 30 seconds
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <code className="flex-1 bg-muted px-4 py-2.5 rounded-lg text-sm font-mono break-all">
                        {typeof window !== "undefined" ? window.location.origin : ""}/api/display
                      </code>
                      <Button variant="outline" size="sm" onClick={handleCopyEndpoint} className="shrink-0">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Response Format</h4>
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`GET /api/display

{
  "timestamp": "2026-02-19T...",
  "display": { "width": 300, "height": 400, "type": "rlcd_bw" },
  "clock": {
    "time": "02:30 PM",
    "date": "Wed, Feb 19",
    "day": "Wednesday",
    "timestamp": "2026-02-19T14:30:00Z"
  },
  "weather": {
    "temp": 45,
    "feelsLike": 38,
    "humidity": 62,
    "condition": "Partly Cloudy",
    "wind": "12 mph NW",
    "location": "New York"
  }
}`}
                      </pre>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Query Parameters</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><code className="bg-muted px-1 rounded">?location=Chicago</code> — set weather location</p>
                        <p><code className="bg-muted px-1 rounded">?apiKey=xxx</code> — use real OpenWeatherMap data</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Firmware */}
              <TabsContent value="firmware" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Arduino Firmware</CardTitle>
                    <CardDescription>
                      Flash this to your ESP32-S3-RLCD-4.2 via Arduino IDE
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Prerequisites</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Arduino IDE with ESP32 board support</li>
                        <li>ArduinoJson library (v7+)</li>
                        <li>Waveshare ST7305 display driver library</li>
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
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-96 overflow-y-auto">
                        {arduinoSketch}
                      </pre>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Upload Steps</h4>
                      <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                        <li>Select board: <strong>ESP32S3 Dev Module</strong></li>
                        <li>Flash Size: <strong>16MB</strong>, PSRAM: <strong>OPI PSRAM</strong></li>
                        <li>Replace WiFi credentials in the sketch</li>
                        <li>Update <code className="bg-muted px-1 rounded">apiUrl</code> with your deployment URL</li>
                        <li>Connect via USB-C, upload, open Serial Monitor (115200)</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Specs */}
              <TabsContent value="specs" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Hardware Specifications</CardTitle>
                    <CardDescription>Waveshare ESP32-S3-RLCD-4.2</CardDescription>
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
                          <span>None (ambient reflective)</span>
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
                          <Thermometer className="h-4 w-4" /> Sensors & Audio
                        </h4>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <span className="text-muted-foreground">Temp/Humidity</span>
                          <span>SHTC3</span>
                          <span className="text-muted-foreground">RTC</span>
                          <span>PCF85063</span>
                          <span className="text-muted-foreground">Microphones</span>
                          <span>Dual array (ES7210 ADC)</span>
                          <span className="text-muted-foreground">Speaker</span>
                          <span>Onboard (ES8311 codec)</span>
                          <span className="text-muted-foreground">Storage</span>
                          <span>TF Card Slot</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                          <Battery className="h-4 w-4" /> Power
                        </h4>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <span className="text-muted-foreground">Main</span>
                          <span>18650 Li-ion holder</span>
                          <span className="text-muted-foreground">RTC Backup</span>
                          <span>Rechargeable coin cell</span>
                          <span className="text-muted-foreground">Charging</span>
                          <span>USB-C</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
