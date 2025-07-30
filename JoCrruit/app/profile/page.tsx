"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Award, History, ImageIcon, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { useTheme } from "next-themes"

export default function ProfilePage() {
  const { theme } = useTheme()
  const isDarkMode = theme === "dark"

  // Mock user data
  const [user, setUser] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    jobTitle: "Software Engineer",
    isPremium: true,
    profilePicture: "/placeholder.svg?height=100&width=100",
    memberSince: "January 2023",
  })

  // Mock interview performance data
  const mockPerformance = {
    totalInterviews: 15,
    completedInterviews: 12,
    averageScore: 8.2,
    highestScore: 9.5,
    feedbackHighlights: [
      "Strong communication skills",
      "Good problem-solving approach",
      "Needs more specific examples for behavioral questions",
    ],
  }

  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUser((prev) => ({ ...prev, profilePicture: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Profile</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Manage your personal information and view your progress
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Personal Information Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user.profilePicture || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Label htmlFor="profile-picture-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" /> Change Photo
                  </Button>
                  <Input
                    id="profile-picture-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    className="hidden"
                  />
                </Label>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={user.name} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user.email} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={user.phone} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input id="jobTitle" value={user.jobTitle} readOnly />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Member Since: {user.memberSince}</span>
                {user.isPremium ? (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">Premium</Badge>
                ) : (
                  <Badge variant="secondary">Free User</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Interview Performance Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Interview Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{mockPerformance.totalInterviews}</p>
                  <p className="text-sm text-gray-600">Total Interviews</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{mockPerformance.completedInterviews}</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{mockPerformance.averageScore}</p>
                  <p className="text-sm text-gray-600">Average Score</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{mockPerformance.highestScore}</p>
                  <p className="text-sm text-gray-600">Highest Score</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Recent Feedback Highlights
                </h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  {mockPerformance.feedbackHighlights.map((highlight, index) => (
                    <li key={index}>{highlight}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Custom Avatars (Coming Soon!)
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Personalize your interview experience with unique AI interviewer avatars.
                </p>
                <Button variant="outline" disabled>
                  Browse Avatars
                </Button>
              </div>

              <Button className="w-full bg-primary hover:bg-primary/90">View Detailed Analytics</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
