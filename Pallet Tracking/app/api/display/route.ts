import { type NextRequest, NextResponse } from "next/server"

const OPENWEATHERMAP_URL = "https://api.openweathermap.org/data/2.5/weather"

// Demo weather data used when no API key is provided
function getDemoWeather(location: string) {
  // Deterministic demo data based on location string
  const seed = location.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const temps = [28, 34, 42, 55, 63, 72, 78, 85, 68, 51, 39, 31]
  const conditions = [
    "Clear Sky",
    "Few Clouds",
    "Partly Cloudy",
    "Overcast",
    "Light Rain",
    "Sunny",
  ]
  const winds = ["5 mph N", "8 mph NE", "12 mph NW", "3 mph S", "15 mph W", "7 mph SE"]

  const temp = temps[seed % temps.length]
  return {
    temp,
    feelsLike: temp - 4,
    humidity: 40 + (seed % 45),
    condition: conditions[seed % conditions.length],
    wind: winds[seed % winds.length],
    location,
    source: "demo",
  }
}

async function fetchWeather(location: string, apiKey: string) {
  try {
    const url = `${OPENWEATHERMAP_URL}?q=${encodeURIComponent(location)}&appid=${apiKey}&units=imperial`
    const res = await fetch(url, { next: { revalidate: 300 } }) // cache 5min
    if (!res.ok) return getDemoWeather(location)

    const data = await res.json()
    return {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      condition: data.weather?.[0]?.main || "Unknown",
      wind: `${Math.round(data.wind.speed)} mph`,
      location: data.name || location,
      source: "openweathermap",
    }
  } catch {
    return getDemoWeather(location)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get("location") || "New York"
    const apiKey = searchParams.get("apiKey") || process.env.OPENWEATHERMAP_API_KEY || ""

    const now = new Date()

    // Clock data
    const clock = {
      time: now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      date: now.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      day: now.toLocaleDateString("en-US", { weekday: "long" }),
      timestamp: now.toISOString(),
    }

    // Weather data
    const weather = apiKey
      ? await fetchWeather(location, apiKey)
      : getDemoWeather(location)

    const displayData = {
      timestamp: now.toISOString(),
      display: {
        width: 300,
        height: 400,
        type: "rlcd_bw",
      },
      clock,
      weather,
    }

    return NextResponse.json(displayData, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error) {
    console.error("Error in display API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
