"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AiAvatar } from "@/components/ai-avatar"
import { Mic, MicOff, Video, VideoOff, Minimize2, Square, Play, Volume2, VolumeX } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface InterviewFullscreenProps {
  onExit: () => void
  candidateName: string
  jobTitle: string
}

interface TranscriptEntry {
  id: number
  speaker: "AI" | "User"
  text: string
  timestamp: string
}

export function InterviewFullscreen({ onExit, candidateName, jobTitle }: InterviewFullscreenProps) {
  const router = useRouter()
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [questionCount, setQuestionCount] = useState(1)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)

  const questions = [
    "Tell me about yourself and why you're interested in this position.",
    "What are your greatest strengths and how do they relate to this role?",
    "Describe a challenging situation you faced and how you handled it.",
    "Where do you see yourself in 5 years?",
    "Why do you want to work for our company?",
    "What are your salary expectations?",
    "Do you have any questions for me?",
  ]

  useEffect(() => {
    startCamera()
    startInterview()
    return () => {
      stopCamera()
    }
  }, [])

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [transcript])

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
    } catch (error) {
      console.error("Error accessing camera:", error)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const startInterview = () => {
    const firstQuestion = questions[0]
    setCurrentQuestion(firstQuestion)
    simulateAiSpeaking(firstQuestion)
  }

  const simulateAiSpeaking = (question: string) => {
    setIsAiSpeaking(true)
    addToTranscript("AI", question)

    // Simulate speaking duration based on question length
    const speakingDuration = Math.max(3000, question.length * 50)

    setTimeout(() => {
      setIsAiSpeaking(false)
    }, speakingDuration)
  }

  const addToTranscript = (speaker: "AI" | "User", text: string) => {
    const newEntry: TranscriptEntry = {
      id: Date.now(),
      speaker,
      text,
      timestamp: new Date().toLocaleTimeString(),
    }
    setTranscript((prev) => [...prev, newEntry])
  }

  const nextQuestion = () => {
    if (questionCount < questions.length) {
      const nextQ = questions[questionCount]
      setCurrentQuestion(nextQ)
      setQuestionCount(questionCount + 1)
      simulateAiSpeaking(nextQ)

      // Simulate user response after a delay
      setTimeout(() => {
        addToTranscript("User", "Thank you for the question. Let me think about that...")
      }, 5000)
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
  }

  const exitFullscreen = () => {
    stopCamera()
    // Encode the transcript to pass it safely in the URL
    const encodedTranscript = encodeURIComponent(JSON.stringify(transcript))
    router.push(
      `/interview-results?candidateName=${encodeURIComponent(candidateName)}&jobTitle=${encodeURIComponent(jobTitle)}&transcript=${encodedTranscript}`,
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header Controls */}
      <div className="bg-gray-900/90 backdrop-blur-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-white font-semibold">Interview in Progress</h2>
          <Badge variant="secondary" className="bg-red-600 text-white">
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
            LIVE
          </Badge>
        </div>

        <div className="flex items-center gap-2">
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
            onClick={() => setIsVideoEnabled(!isVideoEnabled)}
            className="rounded-full w-10 h-10 p-0"
          >
            {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </Button>

          <Button
            size="sm"
            variant={isSpeakerEnabled ? "default" : "destructive"}
            onClick={() => setIsSpeakerEnabled(!isSpeakerEnabled)}
            className="rounded-full w-10 h-10 p-0"
          >
            {isSpeakerEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>

          <Button
            size="sm"
            variant={isRecording ? "destructive" : "default"}
            onClick={toggleRecording}
            className="rounded-full w-10 h-10 p-0"
          >
            {isRecording ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>

          <Button size="sm" variant="outline" onClick={exitFullscreen} className="ml-4 bg-transparent">
            <Minimize2 className="w-4 h-4 mr-2" />
            Exit Fullscreen
          </Button>
        </div>
      </div>

      {/* Main Interview Area */}
      <div className="flex-1 flex">
        {/* AI Avatar Section - 1/4 of screen */}
        <div className="w-1/4 bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col">
          <div className="flex-1 flex items-center justify-center p-8">
            <AiAvatar isSpeaking={isAiSpeaking} />
          </div>

          {/* Current Question Display */}
          <div className="p-6 bg-gray-800/50">
            <h4 className="text-white font-semibold mb-2">Current Question:</h4>
            <p className="text-gray-300 text-sm leading-relaxed">{currentQuestion}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={nextQuestion} disabled={questionCount >= questions.length}>
                Next Question
              </Button>
              <Badge variant="outline" className="text-white border-gray-600">
                {questionCount}/{questions.length}
              </Badge>
            </div>
          </div>
        </div>

        {/* Video Section - 3/4 of screen */}
        <div className="w-3/4 flex flex-col">
          <div className="flex-1 relative bg-gray-900">
            {isVideoEnabled ? (
              <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <Video className="w-24 h-24 mx-auto mb-4 opacity-50" />
                  <p className="text-xl">Camera is off</p>
                </div>
              </div>
            )}

            {/* Candidate Info Overlay */}
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
              <p className="text-white font-semibold">{candidateName}</p>
              <p className="text-gray-300 text-sm">{jobTitle}</p>
            </div>

            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Recording
              </div>
            )}
          </div>

          {/* Transcript Section */}
          <div className="h-64 bg-gray-100 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700">
            <div className="p-4 border-b border-gray-300 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Live Transcript</h3>
            </div>
            <div ref={transcriptRef} className="h-48 overflow-y-auto p-4 space-y-3">
              {transcript.map((entry) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="flex-shrink-0">
                    <Badge
                      variant={entry.speaker === "AI" ? "default" : "secondary"}
                      className={entry.speaker === "AI" ? "bg-blue-600 text-white" : "bg-green-600 text-white"}
                    >
                      {entry.speaker}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{entry.text}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{entry.timestamp}</p>
                  </div>
                </div>
              ))}
              {transcript.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Transcript will appear here as the interview progresses...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
