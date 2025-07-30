"use client"

import type React from "react"
import { useTheme } from "next-themes"
import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LayoutDashboard, Users, CalendarCheck, LogIn, Eye, EyeOff } from "lucide-react"
import { AdminOverview } from "@/components/admin/overview"
import { StudentManager } from "@/components/admin/student-manager"
import { InterviewScheduler } from "@/components/admin/interview-scheduler"
import { Header } from "@/components/header"

export default function AdminPage() {
  const { theme } = useTheme()
  const isDarkMode = theme === "dark"
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState("")

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")

    // Mock admin credentials
    if (adminEmail === "admin@jocruit.com" && adminPassword === "password123") {
      setIsAdminLoggedIn(true)
    } else {
      setLoginError("Invalid email or password.")
    }
  }

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              {/* Only text logo */}
              <img
                src={isDarkMode ? "/images/jocruit-logo-dark.png" : "/images/jocruit-logo-light.png"}
                alt="JoCruit AIX Admin"
                className="h-8 w-auto"
              />
            </div>
            <p className="text-lg text-gray-600">Organization Login</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="Enter organization email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                <LogIn className="w-4 h-4 mr-2" />
                Login as Admin
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent">
      <Header isAdmin={true} onAdminLogout={() => setIsAdminLoggedIn(false)} />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            {/* Only text logo */}
            <img
              src={isDarkMode ? "/images/jocruit-logo-dark.png" : "/images/jocruit-logo-light.png"}
              alt="JoCruit AIX Admin Dashboard"
              className="h-8 w-auto"
            />
          </div>
          <p className="text-lg text-gray-600">Manage Candidates and Interviews for Your Organization</p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Candidate Management
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4" />
              Schedule Interviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverview />
          </TabsContent>

          <TabsContent value="students">
            <StudentManager />
          </TabsContent>

          <TabsContent value="schedule">
            <InterviewScheduler />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
