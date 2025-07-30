"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Home, Printer } from "lucide-react"
import Link from "next/link"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { Header } from "@/components/header"
import { useTheme } from "next-themes"

interface TranscriptEntry {
  id: number
  speaker: "AI" | "User"
  text: string
  timestamp: string
}

export default function InterviewResultsPage() {
  const searchParams = useSearchParams()
  const [candidateName, setCandidateName] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const reportRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const isDarkMode = theme === "dark"

  useEffect(() => {
    const name = searchParams.get("candidateName") || "Candidate"
    const title = searchParams.get("jobTitle") || "Job Interview"
    const transcriptJson = searchParams.get("transcript")

    setCandidateName(name)
    setJobTitle(title)
    if (transcriptJson) {
      try {
        setTranscript(JSON.parse(decodeURIComponent(transcriptJson)))
      } catch (e) {
        console.error("Failed to parse transcript:", e)
        setTranscript([])
      }
    }
  }, [searchParams])

  const generatePdf = async () => {
    if (reportRef.current) {
      const input = reportRef.current
      const canvas = await html2canvas(input, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      pdf.save(`${candidateName}-${jobTitle}-Interview-Report.pdf`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <img
            src={isDarkMode ? "/images/jocruit-logo-dark.png" : "/images/jocruit-logo-light.png"}
            alt="JoCruit AIX"
            className="h-8 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Interview Results</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Review your performance and generate a detailed report.
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <Button onClick={generatePdf} className="bg-primary hover:bg-primary/90">
            <Download className="w-4 h-4 mr-2" />
            Generate PDF Report
          </Button>
          <Link href="/" passHref>
            <Button variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Card className="mb-8" ref={reportRef}>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Interview Report for {candidateName} - {jobTitle}
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">Date: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <h3 className="font-semibold text-lg mb-2">Overall Score</h3>
                <p className="text-4xl font-bold text-green-600">8.5/10</p>
                <p className="text-sm text-gray-600">Based on AI analysis</p>
              </Card>
              <Card className="p-4">
                <h3 className="font-semibold text-lg mb-2">Key Strengths</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                  <li>Clear communication</li>
                  <li>Strong problem-solving</li>
                  <li>Good technical depth</li>
                </ul>
              </Card>
              <Card className="p-4">
                <h3 className="font-semibold text-lg mb-2">Areas for Improvement</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                  <li>Provide more specific examples</li>
                  <li>Improve pacing in long answers</li>
                  <li>Expand on behavioral responses</li>
                </ul>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-xl flex items-center gap-2">
                <Printer className="w-5 h-5" />
                Full Transcript
              </h3>
              <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                {transcript.length > 0 ? (
                  transcript.map((entry) => (
                    <div key={entry.id} className="mb-3">
                      <Badge
                        variant={entry.speaker === "AI" ? "default" : "secondary"}
                        className={entry.speaker === "AI" ? "bg-blue-600 text-white" : "bg-green-600 text-white"}
                      >
                        {entry.speaker}
                      </Badge>
                      <span className="ml-2 text-sm text-gray-900 dark:text-gray-100">{entry.text}</span>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{entry.timestamp}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No transcript available for this session.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
