import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get today's date boundaries
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // Fetch summary stats
    const { data: allDeliveries, error: deliveriesError } = await supabase
      .from("deliveries")
      .select("id, pallet_count, created_at, status")
      .order("created_at", { ascending: false })

    if (deliveriesError) {
      console.error("Error fetching deliveries:", deliveriesError)
      return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
    }

    const deliveries = allDeliveries || []

    const todayDeliveries = deliveries.filter((d) => {
      const created = new Date(d.created_at)
      return created >= todayStart && created <= todayEnd
    })

    const totalPallets = deliveries.reduce((sum, d) => sum + d.pallet_count, 0)
    const todayPallets = todayDeliveries.reduce((sum, d) => sum + d.pallet_count, 0)

    // Fetch latest 5 deliveries with details for the display
    const { data: recentDeliveries, error: recentError } = await supabase
      .from("deliveries")
      .select("driver_name, company_name, pallet_count, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5)

    if (recentError) {
      console.error("Error fetching recent deliveries:", recentError)
    }

    // Format for ESP32 display consumption (300x400 B&W RLCD)
    const displayData = {
      // Metadata
      timestamp: new Date().toISOString(),
      display: {
        width: 300,
        height: 400,
        type: "rlcd_bw",
      },

      // Summary stats
      stats: {
        totalDeliveries: deliveries.length,
        totalPallets,
        todayDeliveries: todayDeliveries.length,
        todayPallets,
        confirmedCount: deliveries.filter((d) => d.status === "confirmed").length,
      },

      // Recent deliveries (trimmed for display)
      recent: (recentDeliveries || []).map((d) => ({
        driver: d.driver_name.length > 18 ? d.driver_name.substring(0, 16) + ".." : d.driver_name,
        company: d.company_name.length > 18 ? d.company_name.substring(0, 16) + ".." : d.company_name,
        pallets: d.pallet_count,
        status: d.status,
        time: new Date(d.created_at).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      })),
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
