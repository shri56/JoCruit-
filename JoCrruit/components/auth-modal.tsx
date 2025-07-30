"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, Chrome } from "lucide-react"
import { useTheme } from "next-themes"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: "signin" | "signup"
  onAuthSuccess: (user: { name: string; email: string; isPremium: boolean }) => void
}

export function AuthModal({ isOpen, onClose, mode, onAuthSuccess }: AuthModalProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const { theme, setTheme } = useTheme()
  const isDarkMode = theme === "dark"

  const handleSubmit = (e: React.FormEvent, authType: "signin" | "signup") => {
    e.preventDefault()

    // Mock authentication - in real app, this would call your auth API
    const mockUser = {
      name: authType === "signup" ? formData.name : "John Doe",
      email: formData.email,
      isPremium: false,
    }

    onAuthSuccess(mockUser)
    setTheme("light") // Switch to light theme on successful auth
    setFormData({ name: "", email: "", password: "", confirmPassword: "" })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleGoogleSignIn = () => {
    alert("Simulating Google Sign-In. In a real app, this would initiate OAuth flow.")
    // Mock success for demonstration
    onAuthSuccess({ name: "Google User", email: "google.user@example.com", isPremium: false })
    setTheme("light") // Switch to light theme on successful Google auth
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/80 backdrop-blur-lg border border-white/20 dark:bg-gray-900/80 dark:border-gray-700/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img
              src={isDarkMode ? "/images/jocruit-logo-dark.png" : "/images/jocruit-logo-light.png"}
              alt="JoCruit AIX"
              className="h-6 w-auto"
            />
            <span>JoCruit AIX</span>
          </DialogTitle>
          <DialogDescription>Sign in to access your personalized interview experience</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={mode} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/20 dark:bg-gray-800/20">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            <form onSubmit={(e) => handleSubmit(e, "signin")} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  className="bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                    className="bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30"
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

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                Sign In
              </Button>
            </form>

            <div className="text-center">
              <Button variant="link" className="text-sm text-blue-600">
                Forgot your password?
              </Button>
            </div>
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
              <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400">OR</span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <Button onClick={handleGoogleSignIn} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
              <Chrome className="w-4 h-4 mr-2" /> Sign in with Google
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={(e) => handleSubmit(e, "signup")} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  className="bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  className="bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                    className="bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30"
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

              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                <Input
                  id="signup-confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  required
                  className="bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30"
                />
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                Create Account
              </Button>
            </form>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
              <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400">OR</span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <Button onClick={handleGoogleSignIn} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
              <Chrome className="w-4 h-4 mr-2" /> Sign up with Google
            </Button>

            <div className="text-center text-xs text-gray-600">
              By signing up, you agree to our{" "}
              <Button variant="link" className="text-xs text-blue-600 p-0 h-auto">
                Terms of Service
              </Button>{" "}
              and{" "}
              <Button variant="link" className="text-xs text-blue-600 p-0 h-auto">
                Privacy Policy
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
