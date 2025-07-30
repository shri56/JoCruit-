"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Mic, MicOff, Video, VideoOff, Play, Square, Download, LinkIcon, Crown, Check } from "lucide-react" // Renamed Link to LinkIcon to avoid conflict with Next.js Link
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { PhoneInput } from "@/components/phone-input"
import { InterviewFullscreen } from "@/components/interview-fullscreen"
import { useRouter } from "next/navigation"

const jobTitles = [
  "Software Engineer",
  "Data Scientist",
  "Product Manager",
  "Business Analyst",
  "UX Designer",
  "Marketing Manager",
  "Sales Representative",
  "Financial Analyst",
  "HR Manager",
  "Operations Manager",
]

const commonResponsibilities = {
  "Software Engineer": [
    "Develop and maintain web applications",
    "Write clean, efficient code",
    "Collaborate with cross-functional teams",
    "Debug and troubleshoot issues",
    "Participate in code reviews",
  ],
  "Data Scientist": [
    "Analyze large datasets",
    "Build predictive models",
    "Create data visualizations",
    "Collaborate with stakeholders",
    "Present findings to leadership",
  ],
  "Business Analyst": [
    "Gather and analyze business requirements",
    "Create process documentation",
    "Facilitate stakeholder meetings",
    "Identify process improvements",
    "Support system implementations",
  ],
}

interface PracticeInterviewProps {
  isLoggedIn: boolean
  onTriggerAuthModal: (mode: "signin" | "signup", triggerFreeTrial: boolean) => void
  shouldStartFreeTrialAfterAuth: boolean
}

export function PracticeInterview({
  isLoggedIn,
  onTriggerAuthModal,
  shouldStartFreeTrialAfterAuth,
}: PracticeInterviewProps) {
  const router = useRouter()
  const [jobTitle, setJobTitle] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [responsibilities, setResponsibilities] = useState<string[]>([])
  const [candidateName, setCandidateName] = useState("")
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isMicEnabled, setIsMicEnabled] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(false)
  const [interviewStarted, setInterviewStarted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [hasUsedFreeTrial, setHasUsedFreeTrial] = useState(false) // This state should ideally come from a user context/backend
  const [isPremium, setIsPremium] = useState(false) // Mock premium status for demonstration
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [countryCode, setCountryCode] = useState("US")
  const [customJobTitle, setCustomJobTitle] = useState("")
  const [showCustomJobInput, setShowCustomJobInput] = useState(false)
  const [showAiFeaturesModal, setShowAiFeaturesModal] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (jobTitle && commonResponsibilities[jobTitle as keyof typeof commonResponsibilities]) {
      setResponsibilities(commonResponsibilities[jobTitle as keyof typeof commonResponsibilities])
    }
  }, [jobTitle])

  // Effect to start interview after successful authentication for free trial
  useEffect(() => {
    if (shouldStartFreeTrialAfterAuth && isLoggedIn) {
      // Ensure all necessary data is present before starting
      if (canStartInterview) {
        startInterviewInternal(true) // Call the internal function to avoid re-triggering auth modal
      } else {
        console.warn("Attempted to start free trial after auth, but form data is incomplete.")
      }
    }
  }, [shouldStartFreeTrialAfterAuth, isLoggedIn]) // Depend on these props

  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (
      file &&
      (file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    ) {
      if (file.size <= 5 * 1024 * 1024) {
        // 5MB limit
        setResumeFile(file)
      } else {
        alert("File size must be less than 5MB")
      }
    } else {
      alert("Please upload a PDF, DOC, or DOCX file")
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsVideoEnabled(true)
      setIsMicEnabled(true)
    } catch (error) {
      console.error("Error accessing camera:", error)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsVideoEnabled(false)
    setIsMicEnabled(false)
  }

  // Internal function to start the interview, called after checks
  const startInterviewInternal = async (isFreeTrial = false) => {
    if (!isVideoEnabled) {
      await startCamera()
    }
    setInterviewStarted(true)
    setCurrentQuestion("Tell me about yourself and why you're interested in this position.")

    if (isFreeTrial) {
      setHasUsedFreeTrial(true)
    }
  }

  // Public function to trigger interview start, handles auth/trial logic
  const handleStartInterviewClick = async (isFreeTrialAttempt = false) => {
    if (!canStartInterview) {
      alert("Please fill in all required details (Job Title, Description, Name, Phone, Resume) to start the interview.")
      return
    }

    if (isFreeTrialAttempt) {
      if (!isLoggedIn) {
        onTriggerAuthModal("signup", true) // Trigger signup modal and indicate free trial intent
        return
      }
      if (hasUsedFreeTrial && !isPremium) {
        setShowPricingModal(true)
        return
      }
    }

    // If all checks pass, or if it's a premium user, proceed
    await startInterviewInternal(isFreeTrialAttempt)
  }

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true)
    } else {
      setIsRecording(false)
    }
  }

  const handleUpgrade = () => {
    // In a real app, this would integrate with a payment processor
    setIsPremium(true)
    setShowPricingModal(false)
    // Simulate payment success
    alert("Payment successful! You now have unlimited access.")
  }

  const canStartInterview = (jobTitle || customJobTitle) && candidateName && phoneNumber && resumeFile && jobDescription

  const exitFullscreen = () => {
    setInterviewStarted(false)
    setCurrentQuestion("")
    stopCamera()
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel - Job Details & Setup */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {/* Only text logo */}
              <img src="/images/jocruit-logo-dark.png" alt="JoCruit AIX Icon" className="h-8 w-auto" />
              <span>Interview Setup</span>
              {isPremium && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Subscription Status / Free Trial */}
            {!isPremium && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-900">
                    {hasUsedFreeTrial ? "Free trial used" : "Free trial available"}
                  </span>
                </div>
                <p className="text-xs text-blue-700">
                  {hasUsedFreeTrial
                    ? "Upgrade to Premium for unlimited practice interviews"
                    : "Try one free practice interview, then upgrade for unlimited access"}
                </p>
              </div>
            )}

            {/* Job Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600">
                <LinkIcon className="w-4 h-4" /> {/* Changed to LinkIcon */}
                <span className="text-sm font-medium">Import job from website</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Select
                  value={showCustomJobInput ? "custom" : jobTitle}
                  onValueChange={(value) => {
                    if (value === "custom") {
                      setShowCustomJobInput(true)
                      setJobTitle("")
                    } else {
                      setShowCustomJobInput(false)
                      setJobTitle(value)
                      setCustomJobTitle("")
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a job title" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTitles.map((title) => (
                      <SelectItem key={title} value={title}>
                        {title}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">
                      <span className="text-primary">+ Add Custom Job Title</span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {showCustomJobInput && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Enter custom job title"
                      value={customJobTitle}
                      onChange={(e) => {
                        setCustomJobTitle(e.target.value)
                        setJobTitle(e.target.value)
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCustomJobInput(false)
                        setJobTitle("")
                        setCustomJobTitle("")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobDescription">Job Description</Label>
                <Textarea
                  id="jobDescription"
                  placeholder="Enter job description or key requirements..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Resume Upload - Make it prominent and mandatory */}
              <div className="space-y-3 border-2 border-dashed border-primary-300 rounded-lg p-6 bg-primary-50/50">
                <div className="text-center">
                  <Upload className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Upload Your Resume</h4>
                  <p className="text-sm text-gray-600 mb-4">Required to generate personalized interview questions</p>

                  <Label htmlFor="resume" className="cursor-pointer">
                    <Button
                      type="button"
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90 text-white py-3"
                      onClick={() => document.getElementById("resume")?.click()}
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      {resumeFile ? "Change Resume" : "Import My Resume"}
                    </Button>
                  </Label>
                  <Input
                    id="resume"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                  />

                  {resumeFile && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-center gap-2 text-green-700">
                        <Download className="w-4 h-4" />
                        <span className="font-medium">{resumeFile.name}</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">Resume uploaded successfully</p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, DOC, DOCX (Max 5MB)</p>
                </div>
              </div>

              {responsibilities.length > 0 && (
                <div className="space-y-2">
                  <Label>Key Responsibilities</Label>
                  <div className="flex flex-wrap gap-2">
                    {responsibilities.map((resp, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {resp}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Personal Details */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Personal Details</h3>

              <div className="space-y-2">
                <Label htmlFor="candidateName">Name</Label>
                <Input
                  id="candidateName"
                  placeholder="Enter your full name"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                />
              </div>

              <PhoneInput
                value={phoneNumber}
                onChange={setPhoneNumber}
                countryCode={countryCode}
                onCountryChange={setCountryCode}
              />
            </div>

            {/* AI Features Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">AI Features for Enhanced Experience</h3>
              <p className="text-sm text-gray-600">
                Leverage JoCruit AIX's advanced capabilities to master your interviews.
              </p>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>
                  <span className="font-medium">AI-Powered Personalized Questions:</span> Questions tailored to your
                  resume and the job description.
                </li>
                <li>
                  <span className="font-medium">Real-time Voice Recognition:</span> Accurate transcription of your
                  responses.
                </li>
                <li>
                  <span className="font-medium">AI Voice Synthesis:</span> Natural-sounding AI interviewer for a
                  realistic experience.
                </li>
                <li>
                  <span className="font-medium">Comprehensive Performance Analytics:</span> Detailed feedback on your
                  answers, tone, and pacing.
                </li>
                <li>
                  <span className="font-medium">Video Recording & Playback:</span> Review your performance to identify
                  areas for improvement.
                </li>
                <li>
                  <span className="font-medium">AI-driven Resume Analysis:</span> Get insights and suggestions to
                  optimize your resume.
                </li>
              </ul>
              <Button variant="outline" onClick={() => setShowAiFeaturesModal(true)}>
                Learn More About AI Features
              </Button>
            </div>

            {/* Pricing/Trial Buttons */}
            {!isPremium && !hasUsedFreeTrial && (
              <Button
                onClick={() => handleStartInterviewClick(true)} // Pass true for free trial attempt
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
                disabled={!canStartInterview}
              >
                <Play className="w-5 h-5 mr-2" />
                Start One-Time Free Trial
              </Button>
            )}

            {!isPremium && (
              <Button
                onClick={() => router.push("/payment")} // Redirect to payment page
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isPremium}
              >
                <Crown className="w-4 h-4 mr-2" />
                Get Unlimited Interviews - $9.99/month
              </Button>
            )}
            {isPremium && (
              <Button className="w-full bg-primary/80 cursor-not-allowed" disabled>
                <Crown className="w-4 h-4 mr-2" />
                Premium Active
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Right Panel - Video Interface */}
        <Card className="h-fit">
          <CardContent className="p-6">
            <div className="aspect-video bg-gray-900 rounded-lg relative overflow-hidden mb-4">
              {isVideoEnabled ? (
                <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white">
                  <Video className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg mb-2">Camera not detected.</p>
                  <p className="text-sm opacity-75">Ensure you have allowed browser permission.</p>
                </div>
              )}

              {/* Video Controls Overlay */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                <Button
                  size="sm"
                  variant={isMicEnabled ? "default" : "destructive"}
                  onClick={() => setIsMicEnabled(!isMicEnabled)}
                  className="rounded-full w-10 h-10 p-0"
                >
                  {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>

                <Button
                  size="sm"
                  variant={isVideoEnabled ? "default" : "destructive"}
                  onClick={isVideoEnabled ? stopCamera : startCamera}
                  className="rounded-full w-10 h-10 p-0"
                >
                  {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>

                {interviewStarted && (
                  <Button
                    size="sm"
                    variant={isRecording ? "destructive" : "default"}
                    onClick={toggleRecording}
                    className="rounded-full w-10 h-10 p-0"
                  >
                    {isRecording ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                )}
              </div>
            </div>

            {/* Interview Question Display */}
            {interviewStarted && currentQuestion && (
              <Card className="mb-4 bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Current Question:</h4>
                  <p className="text-blue-800">{currentQuestion}</p>
                  {/* Placeholder for AI Feedback */}
                  <div className="mt-3 p-2 bg-blue-100 rounded-md text-sm text-blue-800 border border-blue-300">
                    <p className="font-semibold">AI Feedback (Mock):</p>
                    <p>
                      Your answer was clear and concise. Remember to elaborate with specific examples from your
                      experience.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Start Interview Button - Orange Blurred Glass */}
            {!interviewStarted ? (
              <Button
                onClick={() => handleStartInterviewClick()} // No free trial attempt here, just regular start
                disabled={!canStartInterview || (!isPremium && hasUsedFreeTrial && !isLoggedIn)} // Disable if free trial used and not premium/logged in
                className="w-full bg-primary/20 backdrop-blur-md border border-primary/30 text-white py-3 text-lg rounded-lg shadow-lg transition-all duration-300 hover:bg-primary/30 hover:border-primary/50"
              >
                <Play className="w-5 h-5 mr-2" />
                Begin Interview
              </Button>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={() =>
                    setCurrentQuestion("What are your greatest strengths and how do they relate to this role?")
                  }
                  variant="outline"
                  className="w-full"
                >
                  Next Question
                </Button>
                <Button
                  onClick={() => {
                    setInterviewStarted(false)
                    setCurrentQuestion("")
                    stopCamera()
                  }}
                  variant="destructive"
                  className="w-full"
                >
                  End Interview
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fullscreen Interview Mode */}
      {interviewStarted && ( // Only show fullscreen if interview has started
        <InterviewFullscreen
          onExit={exitFullscreen}
          candidateName={candidateName}
          jobTitle={jobTitle || customJobTitle}
        />
      )}

      {/* Pricing Modal */}
      <Dialog open={showPricingModal} onOpenChange={setShowPricingModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Upgrade to Premium
            </DialogTitle>
            <DialogDescription>Get unlimited access to AI-powered interview practice</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-blue-900">$9.99</div>
                <div className="text-sm text-blue-600">per month</div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Unlimited practice interviews</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>AI-powered personalized questions</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Video recording & playback</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Performance analytics</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Resume-based question generation</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowPricingModal(false)} className="flex-1">
                Maybe Later
              </Button>
              <Button onClick={handleUpgrade} className="flex-1 bg-primary hover:bg-primary/90">
                Upgrade Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Features Modal */}
      <Dialog open={showAiFeaturesModal} onOpenChange={setShowAiFeaturesModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              Advanced AI Features
            </DialogTitle>
            <DialogDescription>Unlock your full potential with JoCruit AIX's intelligent tools.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold">Personalized Question Generation</h4>
                <p className="text-sm text-gray-700">
                  Our AI analyzes your resume and the job description to create highly relevant and challenging
                  interview questions, ensuring you're prepared for anything.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold">Real-time Voice & Tone Analysis</h4>
                <p className="text-sm text-gray-700">
                  Get instant feedback on your speaking pace, clarity, and confidence. Our AI helps you refine your
                  delivery for maximum impact.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold">AI-Driven Performance Reports</h4>
                <p className="text-sm text-gray-700">
                  Receive detailed reports after each interview, highlighting strengths, weaknesses, and actionable tips
                  for improvement across various competencies.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold">Resume Optimization Suggestions</h4>
                <p className="text-sm text-gray-700">
                  Upload your resume and let our AI suggest improvements to better align it with target job roles and
                  pass applicant tracking systems.
                </p>
              </div>
            </div>
          </div>
          <Button onClick={() => setShowAiFeaturesModal(false)} className="w-full bg-primary hover:bg-primary/90">
            Got It!
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
