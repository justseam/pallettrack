"use client"

import { useState, useEffect } from "react"

interface ClockData {
  time: string
  date: string
  day: string
  timestamp: string
}

interface WeatherData {
  temp: number
  feelsLike: number
  humidity: number
  condition: string
  wind: string
  location: string
  source: string
}

interface DisplayData {
  timestamp: string
  display: { width: number; height: number; type: string }
  clock: ClockData
  weather: WeatherData
}

type DisplayView = "widgets" | "weather" | "status"

export function DisplayPreview({
  data,
  view = "widgets",
  scale = 1.5,
}: {
  data: DisplayData | null
  view?: DisplayView
  scale?: number
}) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const W = 300
  const H = 400

  const liveTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
  const liveDate = currentTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
  const liveDay = currentTime.toLocaleDateString("en-US", { weekday: "long" })

  const clockTime = data?.clock?.time || liveTime
  const clockDate = data?.clock?.date || liveDate
  const clockDay = data?.clock?.day || liveDay

  const weather = data?.weather || {
    temp: 45,
    feelsLike: 38,
    humidity: 62,
    condition: "Partly Cloudy",
    wind: "12 mph NW",
    location: "New York",
    source: "demo",
  }

  const renderWidgets = () => {
    return (
      <g>
        {/* Header bar */}
        <rect x="0" y="0" width={W} height="42" fill="black" />
        <text x="10" y="17" fontSize="10" fontFamily="monospace" fill="white" fontWeight="bold">
          DISPLAY HUB
        </text>
        <text x={W - 10} y="17" textAnchor="end" fontSize="10" fontFamily="monospace" fill="white">
          {liveTime}
        </text>
        <text x="10" y="33" fontSize="9" fontFamily="monospace" fill="white">
          {liveDate}
        </text>
        <text x={W - 10} y="33" textAnchor="end" fontSize="9" fontFamily="monospace" fill="white">
          WiFi Connected
        </text>

        {/* Large clock */}
        <text x={W / 2} y="90" textAnchor="middle" fontSize="42" fontFamily="monospace" fill="black" fontWeight="bold">
          {liveTime}
        </text>
        <text x={W / 2} y="115" textAnchor="middle" fontSize="14" fontFamily="monospace" fill="black">
          {clockDay} — {clockDate}
        </text>

        {/* Divider */}
        <line x1="8" y1="135" x2={W - 8} y2="135" stroke="black" strokeWidth="1" />

        {/* Weather section */}
        <text x="10" y="157" fontSize="10" fontFamily="monospace" fill="black" fontWeight="bold">
          WEATHER
        </text>
        <text x={W - 10} y="157" textAnchor="end" fontSize="8" fontFamily="monospace" fill="#666">
          {weather.source === "demo" ? "DEMO DATA" : "LIVE"}
        </text>

        {/* Big temperature */}
        <text x="18" y="225" fontSize="52" fontFamily="monospace" fill="black" fontWeight="bold">
          {weather.temp}°
        </text>
        <text x="155" y="195" fontSize="9" fontFamily="monospace" fill="black">
          Feels like {weather.feelsLike}°F
        </text>
        <text x="155" y="210" fontSize="11" fontFamily="monospace" fill="black" fontWeight="bold">
          {weather.condition}
        </text>
        <text x="155" y="226" fontSize="9" fontFamily="monospace" fill="#666">
          {weather.location}
        </text>

        {/* Weather details row */}
        <rect x="8" y="245" width={W - 16} height="32" rx="4" stroke="black" strokeWidth="1" fill="white" />
        <text x="20" y="265" fontSize="9" fontFamily="monospace" fill="black">
          Humidity: {weather.humidity}%
        </text>
        <line x1={W / 2} y1="249" x2={W / 2} y2="273" stroke="black" strokeWidth="0.5" />
        <text x={W / 2 + 12} y="265" fontSize="9" fontFamily="monospace" fill="black">
          Wind: {weather.wind}
        </text>

        {/* Divider */}
        <line x1="8" y1="292" x2={W - 8} y2="292" stroke="black" strokeWidth="1" />

        {/* Onboard sensors section */}
        <text x="10" y="312" fontSize="10" fontFamily="monospace" fill="black" fontWeight="bold">
          DEVICE SENSORS
        </text>

        <rect x="8" y="320" width="136" height="48" rx="4" stroke="black" strokeWidth="1" fill="white" />
        <text x="76" y="340" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#666">
          INDOOR TEMP
        </text>
        <text x="76" y="360" textAnchor="middle" fontSize="16" fontFamily="monospace" fill="black" fontWeight="bold">
          72.4°F
        </text>

        <rect x="156" y="320" width="136" height="48" rx="4" stroke="black" strokeWidth="1" fill="white" />
        <text x="224" y="340" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#666">
          HUMIDITY
        </text>
        <text x="224" y="360" textAnchor="middle" fontSize="16" fontFamily="monospace" fill="black" fontWeight="bold">
          45% RH
        </text>

        {/* Footer */}
        <line x1="8" y1={H - 20} x2={W - 8} y2={H - 20} stroke="black" strokeWidth="0.5" />
        <text x={W / 2} y={H - 7} textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#888">
          ESP32-S3 RLCD 4.2" | SHTC3 | PCF85063 RTC | Auto-refresh 30s
        </text>
      </g>
    )
  }

  const renderWeather = () => {
    return (
      <g>
        {/* Header */}
        <rect x="0" y="0" width={W} height="42" fill="black" />
        <text x="10" y="17" fontSize="10" fontFamily="monospace" fill="white" fontWeight="bold">
          WEATHER
        </text>
        <text x={W - 10} y="17" textAnchor="end" fontSize="10" fontFamily="monospace" fill="white">
          {liveTime}
        </text>
        <text x="10" y="33" fontSize="9" fontFamily="monospace" fill="white">
          {weather.location}
        </text>
        <text x={W - 10} y="33" textAnchor="end" fontSize="8" fontFamily="monospace" fill="white">
          {weather.source === "demo" ? "DEMO" : "LIVE"}
        </text>

        {/* Giant temperature */}
        <text x={W / 2} y="130" textAnchor="middle" fontSize="72" fontFamily="monospace" fill="black" fontWeight="bold">
          {weather.temp}°
        </text>
        <text x={W / 2} y="155" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="#666">
          Feels like {weather.feelsLike}°F
        </text>

        {/* Condition */}
        <rect x="60" y="170" width="180" height="30" rx="15" fill="black" />
        <text x={W / 2} y="190" textAnchor="middle" fontSize="12" fontFamily="monospace" fill="white" fontWeight="bold">
          {weather.condition}
        </text>

        {/* Details */}
        <line x1="8" y1="220" x2={W - 8} y2="220" stroke="black" strokeWidth="1" />

        <text x="10" y="248" fontSize="9" fontFamily="monospace" fill="#666">Humidity</text>
        <text x={W - 10} y="248" textAnchor="end" fontSize="12" fontFamily="monospace" fill="black" fontWeight="bold">{weather.humidity}%</text>

        <line x1="20" y1="258" x2={W - 20} y2="258" stroke="#ddd" strokeWidth="0.5" />

        <text x="10" y="278" fontSize="9" fontFamily="monospace" fill="#666">Wind</text>
        <text x={W - 10} y="278" textAnchor="end" fontSize="12" fontFamily="monospace" fill="black" fontWeight="bold">{weather.wind}</text>

        <line x1="20" y1="288" x2={W - 20} y2="288" stroke="#ddd" strokeWidth="0.5" />

        <text x="10" y="308" fontSize="9" fontFamily="monospace" fill="#666">Feels Like</text>
        <text x={W - 10} y="308" textAnchor="end" fontSize="12" fontFamily="monospace" fill="black" fontWeight="bold">{weather.feelsLike}°F</text>

        {/* Indoor sensors */}
        <line x1="8" y1="330" x2={W - 8} y2="330" stroke="black" strokeWidth="1" />
        <text x="10" y="350" fontSize="10" fontFamily="monospace" fill="black" fontWeight="bold">
          INDOOR (SHTC3)
        </text>

        <text x="10" y="372" fontSize="9" fontFamily="monospace" fill="#666">Temperature</text>
        <text x={W - 10} y="372" textAnchor="end" fontSize="11" fontFamily="monospace" fill="black">72.4°F</text>

        {/* Footer */}
        <line x1="8" y1={H - 20} x2={W - 8} y2={H - 20} stroke="black" strokeWidth="0.5" />
        <text x={W / 2} y={H - 7} textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#888">
          Waveshare ESP32-S3 RLCD 4.2"
        </text>
      </g>
    )
  }

  const renderStatus = () => {
    return (
      <g>
        {/* Header */}
        <rect x="0" y="0" width={W} height="42" fill="black" />
        <text x="10" y="17" fontSize="10" fontFamily="monospace" fill="white" fontWeight="bold">
          DEVICE STATUS
        </text>
        <text x={W - 10} y="17" textAnchor="end" fontSize="10" fontFamily="monospace" fill="white">
          {liveTime}
        </text>
        <text x="10" y="33" fontSize="9" fontFamily="monospace" fill="white">
          {liveDate}
        </text>

        {/* Hardware */}
        <text x="10" y="66" fontSize="10" fontFamily="monospace" fill="black" fontWeight="bold">
          HARDWARE
        </text>
        <line x1="10" y1="72" x2={W - 10} y2="72" stroke="black" strokeWidth="0.5" />

        <text x="10" y="90" fontSize="9" fontFamily="monospace" fill="#666">Board</text>
        <text x={W - 10} y="90" textAnchor="end" fontSize="9" fontFamily="monospace" fill="black">ESP32-S3-RLCD-4.2</text>

        <text x="10" y="108" fontSize="9" fontFamily="monospace" fill="#666">Display</text>
        <text x={W - 10} y="108" textAnchor="end" fontSize="9" fontFamily="monospace" fill="black">300x400 RLCD (ST7305)</text>

        <text x="10" y="126" fontSize="9" fontFamily="monospace" fill="#666">SoC</text>
        <text x={W - 10} y="126" textAnchor="end" fontSize="9" fontFamily="monospace" fill="black">ESP32-S3 @ 240MHz</text>

        <text x="10" y="144" fontSize="9" fontFamily="monospace" fill="#666">Memory</text>
        <text x={W - 10} y="144" textAnchor="end" fontSize="9" fontFamily="monospace" fill="black">16MB Flash / 8MB PSRAM</text>

        {/* Network */}
        <text x="10" y="174" fontSize="10" fontFamily="monospace" fill="black" fontWeight="bold">
          NETWORK
        </text>
        <line x1="10" y1="180" x2={W - 10} y2="180" stroke="black" strokeWidth="0.5" />

        <text x="10" y="198" fontSize="9" fontFamily="monospace" fill="#666">WiFi</text>
        <text x={W - 10} y="198" textAnchor="end" fontSize="9" fontFamily="monospace" fill="black">Connected</text>

        <text x="10" y="216" fontSize="9" fontFamily="monospace" fill="#666">API Endpoint</text>
        <text x={W - 10} y="216" textAnchor="end" fontSize="9" fontFamily="monospace" fill="black">/api/display</text>

        <text x="10" y="234" fontSize="9" fontFamily="monospace" fill="#666">Refresh Rate</text>
        <text x={W - 10} y="234" textAnchor="end" fontSize="9" fontFamily="monospace" fill="black">30 seconds</text>

        {/* Sensors */}
        <text x="10" y="264" fontSize="10" fontFamily="monospace" fill="black" fontWeight="bold">
          SENSORS & AUDIO
        </text>
        <line x1="10" y1="270" x2={W - 10} y2="270" stroke="black" strokeWidth="0.5" />

        <text x="10" y="288" fontSize="9" fontFamily="monospace" fill="#666">Temperature</text>
        <text x={W - 10} y="288" textAnchor="end" fontSize="9" fontFamily="monospace" fill="black">72.4°F (SHTC3)</text>

        <text x="10" y="306" fontSize="9" fontFamily="monospace" fill="#666">Humidity</text>
        <text x={W - 10} y="306" textAnchor="end" fontSize="9" fontFamily="monospace" fill="black">45% RH</text>

        <text x="10" y="324" fontSize="9" fontFamily="monospace" fill="#666">RTC</text>
        <text x={W - 10} y="324" textAnchor="end" fontSize="9" fontFamily="monospace" fill="black">PCF85063 Synced</text>

        <text x="10" y="342" fontSize="9" fontFamily="monospace" fill="#666">Microphones</text>
        <text x={W - 10} y="342" textAnchor="end" fontSize="9" fontFamily="monospace" fill="black">Dual Array (ES7210)</text>

        <text x="10" y="360" fontSize="9" fontFamily="monospace" fill="#666">Speaker</text>
        <text x={W - 10} y="360" textAnchor="end" fontSize="9" fontFamily="monospace" fill="black">ES8311 Codec</text>

        {/* Footer */}
        <line x1="8" y1={H - 20} x2={W - 8} y2={H - 20} stroke="black" strokeWidth="0.5" />
        <text x={W / 2} y={H - 7} textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#888">
          Waveshare ESP32-S3 RLCD 4.2"
        </text>
      </g>
    )
  }

  const renderContent = () => {
    switch (view) {
      case "weather":
        return renderWeather()
      case "status":
        return renderStatus()
      default:
        return renderWidgets()
    }
  }

  return (
    <div className="inline-block" style={{ width: W * scale, height: H * scale }}>
      <div
        className="rounded-lg border-4 border-gray-800 bg-gray-900 p-2 shadow-xl"
        style={{ width: W * scale + 24, height: H * scale + 24 }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width={W * scale}
          height={H * scale}
          className="rounded"
          style={{
            backgroundColor: "#e8e4d9",
            filter: "contrast(1.2)",
          }}
        >
          <defs>
            <pattern id="rlcd-texture" width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="4" height="4" fill="#e8e4d9" />
              <rect width="1" height="1" fill="#e0dcd1" opacity="0.3" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#rlcd-texture)" />
          {renderContent()}
        </svg>
      </div>
    </div>
  )
}
