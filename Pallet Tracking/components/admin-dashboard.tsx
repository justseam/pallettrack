"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Truck,
  Users,
  Package,
  Mail,
  Eye,
  Download,
  Plus,
  Trash2,
  LogOut,
  Calendar,
  MapPin,
  Phone,
  Building,
  Send,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Delivery {
  id: string
  driver_name: string
  driver_phone: string
  driver_email: string
  company_name: string
  pickup_location: string
  delivery_location: string
  pallet_count: number
  bill_of_lading_url: string
  signature_url: string
  status: string
  confirmed_at: string
  created_at: string
  chat_responses: any
}

interface AdminUser {
  id: string
  email: string
  name: string
  is_active: boolean
  created_at: string
}

export function AdminDashboard() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [newAdminName, setNewAdminName] = useState("")
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()

    try {
      // Load deliveries
      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from("deliveries")
        .select("*")
        .order("created_at", { ascending: false })

      if (deliveriesError) throw deliveriesError
      setDeliveries(deliveriesData || [])

      // Load admin users
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .order("created_at", { ascending: false })

      if (adminError) throw adminError
      setAdminUsers(adminData || [])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const addAdminUser = async () => {
    if (!newAdminEmail || !newAdminName) return

    const supabase = createClient()

    try {
      const { error } = await supabase.from("admin_users").insert({
        email: newAdminEmail,
        name: newAdminName,
        is_active: true,
      })

      if (error) throw error

      setNewAdminEmail("")
      setNewAdminName("")
      loadData()
    } catch (error) {
      console.error("Error adding admin user:", error)
      alert("Error adding admin user")
    }
  }

  const toggleAdminStatus = async (id: string, currentStatus: boolean) => {
    const supabase = createClient()

    try {
      const { error } = await supabase.from("admin_users").update({ is_active: !currentStatus }).eq("id", id)

      if (error) throw error
      loadData()
    } catch (error) {
      console.error("Error updating admin status:", error)
    }
  }

  const deleteAdminUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this admin user?")) return

    const supabase = createClient()

    try {
      const { error } = await supabase.from("admin_users").delete().eq("id", id)

      if (error) throw error
      loadData()
    } catch (error) {
      console.error("Error deleting admin user:", error)
    }
  }

  const exportDeliveries = () => {
    const csvContent = [
      ["Date", "Driver", "Company", "Pickup", "Delivery", "Pallets", "Status"].join(","),
      ...deliveries.map((d) =>
        [
          new Date(d.created_at).toLocaleDateString(),
          d.driver_name,
          d.company_name,
          d.pickup_location.replace(/,/g, ";"),
          d.delivery_location.replace(/,/g, ";"),
          d.pallet_count,
          d.status,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `deliveries-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const testEmailNotification = async () => {
    try {
      const testData = {
        deliveryId: "test-" + Date.now(),
        driverName: "Test Driver",
        driverPhone: "(555) 123-4567",
        driverEmail: "test@driver.com",
        companyName: "Test Trucking Co.",
        pickupLocation: "123 Pickup St, City, State",
        deliveryLocation: "456 Delivery Ave, City, State",
        palletCount: 5,
        confirmedAt: new Date().toISOString(),
        aiAnalysis: {
          confidence: 0.95,
          reasoning: "Clear pallet count visible in document",
        },
      }

      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      })

      const result = await response.json()

      if (response.ok) {
        alert(`Test email sent successfully! ${result.successful} emails sent, ${result.failed} failed.`)
      } else {
        alert(`Failed to send test email: ${result.error}`)
      }
    } catch (error) {
      console.error("Error sending test email:", error)
      alert("Error sending test email")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Truck className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Pallet Tracking System</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deliveries.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pallets</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deliveries.reduce((sum, d) => sum + d.pallet_count, 0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminUsers.filter((u) => u.is_active).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Deliveries</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {deliveries.filter((d) => new Date(d.created_at).toDateString() === new Date().toDateString()).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="deliveries" className="space-y-6">
          <TabsList>
            <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
            <TabsTrigger value="admins">Admin Users</TabsTrigger>
          </TabsList>

          <TabsContent value="deliveries" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Deliveries</CardTitle>
                    <CardDescription>All pallet pickup confirmations</CardDescription>
                  </div>
                  <Button onClick={exportDeliveries}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Pallets</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveries.map((delivery) => (
                      <TableRow key={delivery.id}>
                        <TableCell>{new Date(delivery.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{delivery.driver_name}</TableCell>
                        <TableCell>{delivery.company_name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{delivery.pallet_count}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={delivery.status === "confirmed" ? "default" : "secondary"}>
                            {delivery.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedDelivery(delivery)}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Delivery Details</DialogTitle>
                                <DialogDescription>
                                  Complete information for delivery #{delivery.id.slice(0, 8)}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedDelivery && (
                                <div className="space-y-6">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <Truck className="h-4 w-4" />
                                        Driver Information
                                      </h4>
                                      <div className="space-y-1 text-sm">
                                        <p>
                                          <strong>Name:</strong> {selectedDelivery.driver_name}
                                        </p>
                                        <p className="flex items-center gap-1">
                                          <Phone className="h-3 w-3" />
                                          {selectedDelivery.driver_phone}
                                        </p>
                                        <p className="flex items-center gap-1">
                                          <Mail className="h-3 w-3" />
                                          {selectedDelivery.driver_email}
                                        </p>
                                        <p className="flex items-center gap-1">
                                          <Building className="h-3 w-3" />
                                          {selectedDelivery.company_name}
                                        </p>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        Delivery Details
                                      </h4>
                                      <div className="space-y-1 text-sm">
                                        <p>
                                          <strong>Pallets:</strong> {selectedDelivery.pallet_count}
                                        </p>
                                        <p>
                                          <strong>Status:</strong> {selectedDelivery.status}
                                        </p>
                                        <p>
                                          <strong>Confirmed:</strong>{" "}
                                          {new Date(selectedDelivery.confirmed_at).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      Locations
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4 text-sm">
                                      <div>
                                        <strong>Pickup:</strong>
                                        <p className="text-muted-foreground">{selectedDelivery.pickup_location}</p>
                                      </div>
                                      <div>
                                        <strong>Delivery:</strong>
                                        <p className="text-muted-foreground">{selectedDelivery.delivery_location}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {selectedDelivery.bill_of_lading_url && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Bill of Lading</h4>
                                      <img
                                        src={selectedDelivery.bill_of_lading_url || "/placeholder.svg"}
                                        alt="Bill of Lading"
                                        className="max-w-full h-48 object-contain border rounded"
                                      />
                                    </div>
                                  )}

                                  {selectedDelivery.signature_url && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Digital Signature</h4>
                                      <img
                                        src={selectedDelivery.signature_url || "/placeholder.svg"}
                                        alt="Digital Signature"
                                        className="max-w-full h-24 object-contain border rounded bg-white"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admins" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Admin Users</CardTitle>
                    <CardDescription>Manage who receives email notifications</CardDescription>
                  </div>
                  <Button variant="outline" onClick={testEmailNotification}>
                    <Send className="h-4 w-4 mr-2" />
                    Test Email
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="adminEmail">Email</Label>
                    <Input
                      id="adminEmail"
                      placeholder="admin@company.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="adminName">Name</Label>
                    <Input
                      id="adminName"
                      placeholder="Admin Name"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addAdminUser}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Admin
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminUsers.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium">{admin.name}</TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>
                          <Badge variant={admin.is_active ? "default" : "secondary"}>
                            {admin.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(admin.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleAdminStatus(admin.id, admin.is_active)}
                            >
                              {admin.is_active ? "Deactivate" : "Activate"}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => deleteAdminUser(admin.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
