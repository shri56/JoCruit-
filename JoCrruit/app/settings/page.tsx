"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Lock, Bell, Bot, Mic, Mail, Globe } from "lucide-react"
import { Header } from "@/components/header"
import { useTheme } from "next-themes"

export default function SettingsPage() {
  const { theme } = useTheme()
  const isDarkMode = theme === "dark"

  const [emailNotifications, setEmailNotifications] = useState(true)
  const [inAppNotifications, setInAppNotifications] = useState(true)
  const [aiVoicePreference, setAiVoicePreference] = useState("standard")
  const [aiFeedbackLevel, setAiFeedbackLevel] = useState("detailed")
  const [defaultLanguage, setDefaultLanguage] = useState("en")

  const handleSaveSettings = () => {
    alert("Settings saved successfully!")
    // In a real app, this would send data to a backend API
    console.log({
      emailNotifications,
      inAppNotifications,
      aiVoicePreference,
      aiFeedbackLevel,
      defaultLanguage,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          {/* Only text logo */}
          <img
            src={isDarkMode ? "/images/jocruit-logo-dark.png" : "/images/jocruit-logo-light.png"}
            alt="JoCruit AIX"
            className="h-8 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Configure your JoCruit AIX experience</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Account Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" placeholder="Enter current password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" placeholder="Enter new password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" placeholder="Confirm new password" />
              </div>
              <Button variant="outline" className="w-full bg-transparent">
                Update Password
              </Button>
              <div className="border-t pt-4 space-y-2">
                <h3 className="font-semibold">Email Address</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your current email: john.doe@example.com</p>
                <Button variant="outline" className="w-full bg-transparent">
                  Change Email
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email Notifications
                </Label>
                <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive updates on new features, interview tips, and performance summaries via email.
              </p>

              <div className="flex items-center justify-between">
                <Label htmlFor="in-app-notifications" className="flex items-center gap-2">
                  <Bell className="w-4 h-4" /> In-App Notifications
                </Label>
                <Switch
                  id="in-app-notifications"
                  checked={inAppNotifications}
                  onCheckedChange={setInAppNotifications}
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get real-time alerts and messages directly within the JoCruit AIX platform.
              </p>
            </CardContent>
          </Card>

          {/* AI Preferences Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                AI Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ai-voice">AI Interviewer Voice</Label>
                <Select value={aiVoicePreference} onValueChange={setAiVoicePreference}>
                  <SelectTrigger id="ai-voice">
                    <SelectValue placeholder="Select AI voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard (Clear & Professional)</SelectItem>
                    <SelectItem value="friendly">Friendly (Warm & Encouraging)</SelectItem>
                    <SelectItem value="formal">Formal (Authoritative & Direct)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose the voice style of your AI interviewer.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-feedback-level">AI Feedback Level</Label>
                <Select value={aiFeedbackLevel} onValueChange={setAiFeedbackLevel}>
                  <SelectTrigger id="ai-feedback-level">
                    <SelectValue placeholder="Select feedback level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">Concise (Key points only)</SelectItem>
                    <SelectItem value="detailed">Detailed (In-depth analysis)</SelectItem>
                    <SelectItem value="minimal">Minimal (Score only)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Adjust the depth of AI feedback you receive after interviews.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="mic-access" className="flex items-center gap-2">
                  <Mic className="w-4 h-4" /> Microphone Access
                </Label>
                <Button variant="outline" size="sm">
                  Manage Permissions
                </Button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ensure microphone access is enabled for voice recognition.
              </p>
            </CardContent>
          </Card>

          {/* General Preferences Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                General Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="default-language">Default Language</Label>
                <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
                  <SelectTrigger id="default-language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Set your preferred language for the platform interface.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" value="America/New_York (UTC-5)" readOnly />
                <p className="text-sm text-gray-600 dark:text-gray-400">Your timezone is automatically detected.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button onClick={handleSaveSettings} className="w-full max-w-md bg-primary hover:bg-primary/90">
            Save All Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
