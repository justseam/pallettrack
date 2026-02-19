"use client"

import { useState, useEffect } from "react"

interface DisplayStats {
  totalDeliveries: number
  totalPallets: number
  todayDeliveries: number
  todayPallets: number
  confirmedCount: number
}

interface RecentDelivery {
  driver: string
  company: string
  pallets: number
  status: string
  time: string
}

interface DisplayData {
  timestamp: string
  display: { width: number; height: number; type: string }
  stats: DisplayStats
  recent: RecentDelivery[]
}

type DisplayView = "dashboard" | "deliveries" | "status"

export function DisplayPreview({
  data,
  view = "dashboard",
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

  const timeStr = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
  const dateStr = currentTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  const renderDashboard = () => {
    if (!data) {
      return (
        <g>
          <text x={W / 2} y={H / 2 - 10} textAnchor="middle" fontSize="14" fontFamily="monospace" fill="black">
            Connecting...
          </text>
          <text x={W / 2} y={H / 2 + 14} textAnchor="middle" fontSize="11" fontFamily="monospace" fill="black">
            Waiting for data
          </text>
        </g>
      )
    }

    return (
      <g>
        {/* Header bar */}
        <rect x="0" y="0" width={W} height="42" fill="black" />
        <text x="10" y="17" fontSize="10" fontFamily="monospace" fill="white" fontWeight="bold">
          PALLET TRACKER
        </text>
        <text x={W - 10} y="17" textAnchor="end" fontSize="10" fontFamily="monospace" fill="white">
          {timeStr}
        </text>
        <text x="10" y="33" fontSize="9" fontFamily="monospace" fill="white">
          {dateStr}
        </text>
        <text x={W - 10} y="33" textAnchor="end" fontSize="9" fontFamily="monospace" fill="white">
          WiFi Connected
        </text>

        {/* Stats grid - 2x2 */}
        <rect x="8" y="50" width="136" height="62" rx="4" stroke="black" strokeWidth="1.5" fill="white" />
        <text x="76" y="70" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="black">
          TODAY
        </text>
        <text x="76" y="95" textAnchor="middle" fontSize="24" fontFamily="monospace" fill="black" fontWeight="bold">
          {data.stats.todayDeliveries}
        </text>
        <text x="76" y="108" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="black">
          deliveries
        </text>

        <rect x="156" y="50" width="136" height="62" rx="4" stroke="black" strokeWidth="1.5" fill="white" />
        <text x="224" y="70" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="black">
          TODAY PALLETS
        </text>
        <text x="224" y="95" textAnchor="middle" fontSize="24" fontFamily="monospace" fill="black" fontWeight="bold">
          {data.stats.todayPallets}
        </text>
        <text x="224" y="108" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="black">
          pallets
        </text>

        <rect x="8" y="120" width="136" height="62" rx="4" stroke="black" strokeWidth="1.5" fill="white" />
        <text x="76" y="140" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="black">
          ALL TIME
        </text>
        <text x="76" y="165" textAnchor="middle" fontSize="24" fontFamily="monospace" fill="black" fontWeight="bold">
          {data.stats.totalDeliveries}
        </text>
        <text x="76" y="178" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="black">
          deliveries
        </text>

        <rect x="156" y="120" width="136" height="62" rx="4" stroke="black" strokeWidth="1.5" fill="white" />
        <text x="224" y="140" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="black">
          TOTAL PALLETS
        </text>
        <text x="224" y="165" textAnchor="middle" fontSize="24" fontFamily="monospace" fill="black" fontWeight="bold">
          {data.stats.totalPallets}
        </text>
        <text x="224" y="178" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="black">
          pallets
        </text>

        {/* Divider */}
        <line x1="8" y1="194" x2={W - 8} y2="194" stroke="black" strokeWidth="1" />

        {/* Recent deliveries header */}
        <text x="10" y="212" fontSize="10" fontFamily="monospace" fill="black" fontWeight="bold">
          RECENT DELIVERIES
        </text>

        {/* Table header */}
        <rect x="8" y="220" width={W - 16} height="16" fill="black" />
        <text x="12" y="232" fontSize="8" fontFamily="monospace" fill="white">
          DRIVER
        </text>
        <text x="130" y="232" fontSize="8" fontFamily="monospace" fill="white">
          CO.
        </text>
        <text x="220" y="232" fontSize="8" fontFamily="monospace" fill="white" textAnchor="middle">
          PLT
        </text>
        <text x={W - 12} y="232" textAnchor="end" fontSize="8" fontFamily="monospace" fill="white">
          TIME
        </text>

        {/* Table rows */}
        {data.recent.map((delivery, i) => {
          const y = 240 + i * 28
          return (
            <g key={i}>
              {i % 2 === 0 && <rect x="8" y={y} width={W - 16} height="28" fill="#f0f0f0" />}
              <text x="12" y={y + 12} fontSize="8" fontFamily="monospace" fill="black">
                {delivery.driver}
              </text>
              <text x="12" y={y + 23} fontSize="7" fontFamily="monospace" fill="#666">
                {delivery.company}
              </text>
              <text x="220" y={y + 17} fontSize="12" fontFamily="monospace" fill="black" textAnchor="middle" fontWeight="bold">
                {delivery.pallets}
              </text>
              <text x={W - 12} y={y + 17} textAnchor="end" fontSize="8" fontFamily="monospace" fill="black">
                {delivery.time}
              </text>
            </g>
          )
        })}

        {data.recent.length === 0 && (
          <text x={W / 2} y="280" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#999">
            No deliveries yet
          </text>
        )}

        {/* Footer */}
        <line x1="8" y1={H - 24} x2={W - 8} y2={H - 24} stroke="black" strokeWidth="0.5" />
        <text x={W / 2} y={H - 10} textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#666">
          Waveshare ESP32-S3 RLCD 4.2" | Auto-refresh 30s
        </text>
      </g>
    )
  }

  const renderDeliveries = () => {
    if (!data) return renderDashboard()

    return (
      <g>
        {/* Header */}
        <rect x="0" y="0" width={W} height="42" fill="black" />
        <text x="10" y="17" fontSize="10" fontFamily="monospace" fill="white" fontWeight="bold">
          DELIVERY LIST
        </text>
        <text x={W - 10} y="17" textAnchor="end" fontSize="10" fontFamily="monospace" fill="white">
          {timeStr}
        </text>
        <text x="10" y="33" fontSize="9" fontFamily="monospace" fill="white">
          {data.stats.todayDeliveries} today | {data.stats.totalDeliveries} total
        </text>

        {/* Table header */}
        <rect x="4" y="50" width={W - 8} height="18" fill="black" />
        <text x="8" y="63" fontSize="9" fontFamily="monospace" fill="white">
          DRIVER
        </text>
        <text x="160" y="63" fontSize="9" fontFamily="monospace" fill="white">
          PALLETS
        </text>
        <text x={W - 8} y="63" textAnchor="end" fontSize="9" fontFamily="monospace" fill="white">
          STATUS
        </text>

        {/* Delivery rows */}
        {data.recent.map((delivery, i) => {
          const y = 72 + i * 60
          return (
            <g key={i}>
              <rect x="4" y={y} width={W - 8} height="56" rx="3" stroke="black" strokeWidth="1" fill={i % 2 === 0 ? "#f5f5f5" : "white"} />
              <text x="10" y={y + 16} fontSize="10" fontFamily="monospace" fill="black" fontWeight="bold">
                {delivery.driver}
              </text>
              <text x="10" y={y + 30} fontSize="8" fontFamily="monospace" fill="#666">
                {delivery.company}
              </text>
              <text x="10" y={y + 44} fontSize="8" fontFamily="monospace" fill="#999">
                {delivery.time}
              </text>
              <text x="180" y={y + 30} textAnchor="middle" fontSize="18" fontFamily="monospace" fill="black" fontWeight="bold">
                {delivery.pallets}
              </text>
              {delivery.status === "confirmed" ? (
                <g>
                  <rect x={W - 70} y={y + 8} width="56" height="16" rx="8" fill="black" />
                  <text x={W - 42} y={y + 20} textAnchor="middle" fontSize="7" fontFamily="monospace" fill="white">
                    CONFIRMED
                  </text>
                </g>
              ) : (
                <g>
                  <rect x={W - 66} y={y + 8} width="52" height="16" rx="8" stroke="black" strokeWidth="1" fill="white" />
                  <text x={W - 40} y={y + 20} textAnchor="middle" fontSize="7" fontFamily="monospace" fill="black">
                    PENDING
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {/* Footer */}
        <line x1="8" y1={H - 24} x2={W - 8} y2={H - 24} stroke="black" strokeWidth="0.5" />
        <text x={W / 2} y={H - 10} textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#666">
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
          {timeStr}
        </text>
        <text x="10" y="33" fontSize="9" fontFamily="monospace" fill="white">
          {dateStr}
        </text>

        {/* Device info */}
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
          SENSORS
        </text>
        <line x1="10" y1="270" x2={W - 10} y2="270" stroke="black" strokeWidth="0.5" />

        <text x="10" y="288" fontSize="9" fontFamily="monospace" fill="#666">Temperature</text>
        <text x={W - 10} y="288" textAnchor="end" fontSize="9" fontFamily="monospace" fill="black">72.4 F (SHTC3)</text>

        <text x="10" y="306" fontSize="9" fontFamily="monospace" fill="#666">Humidity</text>
        <text x={W - 10} y="306" textAnchor="end" fontSize="9" fontFamily="monospace" fill="black">45% RH</text>

        <text x="10" y="324" fontSize="9" fontFamily="monospace" fill="#666">RTC</text>
        <text x={W - 10} y="324" textAnchor="end" fontSize="9" fontFamily="monospace" fill="black">PCF85063 Synced</text>

        <text x="10" y="342" fontSize="9" fontFamily="monospace" fill="#666">Battery</text>
        <text x={W - 10} y="342" textAnchor="end" fontSize="9" fontFamily="monospace" fill="black">18650 - Charging</text>

        {/* Footer */}
        <line x1="8" y1={H - 24} x2={W - 8} y2={H - 24} stroke="black" strokeWidth="0.5" />
        <text x={W / 2} y={H - 10} textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#666">
          Waveshare ESP32-S3 RLCD 4.2"
        </text>
      </g>
    )
  }

  const renderContent = () => {
    switch (view) {
      case "deliveries":
        return renderDeliveries()
      case "status":
        return renderStatus()
      default:
        return renderDashboard()
    }
  }

  return (
    <div className="inline-block" style={{ width: W * scale, height: H * scale }}>
      {/* Display bezel */}
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
          {/* Subtle paper texture for RLCD look */}
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
