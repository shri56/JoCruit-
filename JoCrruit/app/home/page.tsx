"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PracticeInterview } from "@/components/practice-interview"
import { AssignedInterviews } from "@/components/assigned-interviews"
import { Header } from "@/components/header"
import { Calendar, User } from "lucide-react"
import { useTheme } from "next-themes"
import { AuthModal } from "@/components/auth-modal"

export default function HomePage() {
  const { theme } = useTheme()
  const isDarkMode = theme === "dark"

  // Auth state lifted from Header
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string; isPremium: boolean } | null>(null)
  const [shouldStartFreeTrialAfterAuth, setShouldStartFreeTrialAfterAuth] = useState(false)

  const handleAuthSuccess = (userData: { name: string; email: string; isPremium: boolean }) => {
    setUser(userData)
    setIsLoggedIn(true)
    setShowAuthModal(false)
    // The PracticeInterview component will pick up `shouldStartFreeTrialAfterAuth`
    // and `isLoggedIn` changes to start the interview.
    // We reset it here to prevent re-triggering if the user navigates away and back.
    if (shouldStartFreeTrialAfterAuth) {
      setShouldStartFreeTrialAfterAuth(false) // Renamed to setShouldFreeTrialAfterAuth
    }
  }

  const onTriggerAuthModal = (mode: "signin" | "signup", triggerFreeTrial = false) => {
    setAuthMode(mode)
    setShouldStartFreeTrialAfterAuth(triggerFreeTrial)
    setShowAuthModal(true)
  }

  const onLogout = () => {
    setUser(null)
    setIsLoggedIn(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent">
      <Header
        isLoggedIn={isLoggedIn}
        user={user}
        onSignInClick={() => onTriggerAuthModal("signin")}
        onSignUpClick={() => onTriggerAuthModal("signup")}
        onLogout={onLogout}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img
              src={isDarkMode ? "/images/jocruit-logo-dark.png" : "/images/jocruit-logo-light.png"}
              alt="JoCruit AIX"
              className="h-8 w-auto"
            />
          </div>
          <p className="text-lg text-gray-600">AI-Powered Interview Practice & Assessment Platform</p>
        </div>

        <Tabs defaultValue="practice" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="practice" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Practice Interview
            </TabsTrigger>
            <TabsTrigger value="assigned" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              My Assigned Interviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="practice">
            <PracticeInterview
              isLoggedIn={isLoggedIn}
              onTriggerAuthModal={onTriggerAuthModal}
              shouldStartFreeTrialAfterAuth={shouldStartFreeTrialAfterAuth}
            />
          </TabsContent>

          <TabsContent value="assigned">
            <AssignedInterviews />
          </TabsContent>
        </Tabs>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  )
}
