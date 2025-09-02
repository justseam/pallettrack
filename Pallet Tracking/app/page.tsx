import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Truck, Package, CheckCircle, Users } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-full">
              <Truck className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 text-balance">Pallet Tracking System</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-pretty">
            Streamline your delivery process with our comprehensive pallet tracking solution
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Driver Interface Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Package className="h-10 w-10 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Driver Portal</CardTitle>
              <CardDescription>Quick and easy pallet pickup confirmation for drivers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Answer quick questions
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Upload Bill of Lading photo
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Digital signature confirmation
                </div>
              </div>
              <Button asChild className="w-full" size="lg">
                <Link href="/driver">Start Pickup Process</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Admin Interface Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Users className="h-10 w-10 text-indigo-600" />
              </div>
              <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
              <CardDescription>Manage deliveries and configure notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  View all deliveries
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Manage email notifications
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Export delivery reports
                </div>
              </div>
              <Button asChild variant="outline" className="w-full bg-transparent" size="lg">
                <Link href="/admin">Access Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-500 dark:text-gray-400">
            Secure, reliable, and easy to use pallet tracking for your business
          </p>
        </div>
      </div>
    </div>
  )
}
