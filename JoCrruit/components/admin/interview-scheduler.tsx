"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { User, ListChecks, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Candidate {
  // Renamed from Student
  id: string
  name: string
  email: string
  role: string
}

interface InterviewTemplate {
  id: string
  title: string
  duration: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  description: string
  questions: number
}

const mockCandidates: Candidate[] = [
  // Renamed from mockStudents
  { id: "s1", name: "Alice Smith", email: "alice@example.com", role: "Software Engineer" },
  { id: "s2", name: "Bob Johnson", email: "bob@example.com", role: "Data Scientist" },
  { id: "s3", name: "Charlie Brown", email: "charlie@example.com", role: "Business Analyst" },
  { id: "s4", name: "Diana Prince", email: "diana@example.com", role: "UX Designer" },
  { id: "s5", name: "Eve Adams", email: "eve@example.com", role: "Software Engineer" },
  { id: "s6", name: "Frank White", email: "frank@example.com", role: "Product Manager" },
]

const mockInterviewTemplates: InterviewTemplate[] = [
  {
    id: "t1",
    title: "Software Engineering Intern Assessment",
    duration: "45 min",
    difficulty: "Intermediate",
    description: "Technical interview focusing on data structures, algorithms, and basic system design.",
    questions: 12,
  },
  {
    id: "t2",
    title: "Product Manager Behavioral Interview",
    duration: "60 min",
    difficulty: "Advanced",
    description: "Behavioral and case study interview for product management roles.",
    questions: 15,
  },
  {
    id: "t3",
    title: "Data Science Fundamentals",
    duration: "50 min",
    difficulty: "Advanced",
    description: "Comprehensive assessment covering statistics, machine learning, and business acumen.",
    questions: 18,
  },
  {
    id: "t4",
    title: "Marketing Associate Creative Assessment",
    duration: "40 min",
    difficulty: "Beginner",
    description: "Creative and analytical thinking assessment for marketing positions.",
    questions: 10,
  },
]

export function InterviewScheduler() {
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]) // Renamed from selectedStudents
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [dueDate, setDueDate] = useState("")
  const [instructions, setInstructions] = useState("")
  const [customInterviewTitle, setCustomInterviewTitle] = useState("")
  const [customInterviewDuration, setCustomInterviewDuration] = useState("")
  const [customInterviewDifficulty, setCustomInterviewDifficulty] = useState<
    "Beginner" | "Intermediate" | "Advanced" | ""
  >("")
  const [customInterviewDescription, setCustomInterviewDescription] = useState("")
  const [customInterviewQuestions, setCustomInterviewQuestions] = useState<number | "">("")
  const [useCustomInterview, setUseCustomInterview] = useState(false)

  const handleCandidateSelect = (candidateId: string, checked: boolean) => {
    // Renamed from handleStudentSelect
    if (checked) {
      setSelectedCandidates([...selectedCandidates, candidateId])
    } else {
      setSelectedCandidates(selectedCandidates.filter((id) => id !== candidateId))
    }
  }

  const handleSelectAllCandidates = (checked: boolean) => {
    // New function for select all
    if (checked) {
      setSelectedCandidates(mockCandidates.map((candidate) => candidate.id))
    } else {
      setSelectedCandidates([])
    }
  }

  const handleScheduleInterview = (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedCandidates.length === 0) {
      // Renamed from selectedStudents
      alert("Please select at least one candidate.")
      return
    }

    let interviewDetails: InterviewTemplate | null = null
    if (useCustomInterview) {
      if (
        !customInterviewTitle ||
        !customInterviewDuration ||
        !customInterviewDifficulty ||
        !customInterviewDescription ||
        customInterviewQuestions === ""
      ) {
        alert("Please fill all custom interview details.")
        return
      }
      interviewDetails = {
        id: `custom-${Date.now()}`,
        title: customInterviewTitle,
        duration: customInterviewDuration,
        difficulty: customInterviewDifficulty as "Beginner" | "Intermediate" | "Advanced",
        description: customInterviewDescription,
        questions: customInterviewQuestions as number,
      }
    } else {
      if (!selectedTemplate) {
        alert("Please select an interview template.")
        return
      }
      interviewDetails = mockInterviewTemplates.find((t) => t.id === selectedTemplate) || null
    }

    if (!interviewDetails || !dueDate) {
      alert("Please ensure all required fields are filled.")
      return
    }

    const scheduledInterviews = selectedCandidates.map((candidateId) => {
      // Renamed from selectedStudents
      const candidate = mockCandidates.find((s) => s.id === candidateId) // Renamed from mockStudents
      return {
        candidateName: candidate?.name, // Renamed from studentName
        candidateEmail: candidate?.email, // Renamed from studentEmail
        interviewTitle: interviewDetails?.title,
        dueDate,
        instructions,
        ...interviewDetails,
      }
    })

    console.log("Scheduled Interviews:", scheduledInterviews)
    alert(`Interviews scheduled for ${selectedCandidates.length} candidate(s)!`) // Renamed from selectedStudents

    // Reset form
    setSelectedCandidates([]) // Renamed from selectedStudents
    setSelectedTemplate("")
    setDueDate("")
    setInstructions("")
    setUseCustomInterview(false)
    setCustomInterviewTitle("")
    setCustomInterviewDuration("")
    setCustomInterviewDifficulty("")
    setCustomInterviewDescription("")
    setCustomInterviewQuestions("")
  }

  const allCandidatesSelected = selectedCandidates.length === mockCandidates.length && mockCandidates.length > 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Select Candidates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-2">
            {" "}
            {/* Added select all checkbox */}
            <Checkbox
              id="select-all-candidates"
              checked={allCandidatesSelected}
              onCheckedChange={handleSelectAllCandidates}
            />
            <Label htmlFor="select-all-candidates">Select All Candidates</Label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mockCandidates.map(
              (
                candidate, // Renamed from mockStudents
              ) => (
                <div key={candidate.id} className="flex items-center space-x-2 border p-3 rounded-md">
                  <Checkbox
                    id={`candidate-${candidate.id}`}
                    checked={selectedCandidates.includes(candidate.id)} // Renamed from selectedStudents
                    onCheckedChange={(checked) => handleCandidateSelect(candidate.id, checked as boolean)} // Renamed from handleStudentSelect
                  />
                  <Label htmlFor={`candidate-${candidate.id}`} className="flex flex-col">
                    <span className="font-medium">{candidate.name}</span>
                    <span className="text-sm text-gray-500">{candidate.email}</span>
                    <Badge variant="secondary" className="mt-1 w-fit">
                      {candidate.role}
                    </Badge>
                  </Label>
                </div>
              ),
            )}
          </div>
          {selectedCandidates.length > 0 && ( // Renamed from selectedStudents
            <p className="mt-4 text-sm text-gray-600">Selected {selectedCandidates.length} candidate(s).</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="w-5 h-5" />
            Interview Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="use-custom-interview"
              checked={useCustomInterview}
              onCheckedChange={(checked) => setUseCustomInterview(checked as boolean)}
            />
            <Label htmlFor="use-custom-interview">Create Custom Interview</Label>
          </div>

          {!useCustomInterview ? (
            <div className="space-y-2">
              <Label htmlFor="interview-template">Select Interview Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an existing template" />
                </SelectTrigger>
                <SelectContent>
                  {mockInterviewTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.title} ({template.duration}, {template.difficulty})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <p className="text-sm text-gray-600">
                  {mockInterviewTemplates.find((t) => t.id === selectedTemplate)?.description}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Custom Interview Configuration</h3>
              <div className="space-y-2">
                <Label htmlFor="custom-title">Interview Title</Label>
                <Input
                  id="custom-title"
                  placeholder="e.g., Senior Software Engineer Technical Interview"
                  value={customInterviewTitle}
                  onChange={(e) => setCustomInterviewTitle(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-duration">Duration</Label>
                  <Input
                    id="custom-duration"
                    placeholder="e.g., 60 min"
                    value={customInterviewDuration}
                    onChange={(e) => setCustomInterviewDuration(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-difficulty">Difficulty</Label>
                  <Select
                    value={customInterviewDifficulty}
                    onValueChange={(value) =>
                      setCustomInterviewDifficulty(value as "Beginner" | "Intermediate" | "Advanced")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-questions">Number of Questions</Label>
                  <Input
                    id="custom-questions"
                    type="number"
                    placeholder="e.g., 15"
                    value={customInterviewQuestions}
                    onChange={(e) => Number.parseInt(e.target.value) || ""}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-description">Description</Label>
                <Textarea
                  id="custom-description"
                  placeholder="Provide a brief description of this interview."
                  value={customInterviewDescription}
                  onChange={(e) => setCustomInterviewDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="due-date">Due Date</Label>
            <Input id="due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions for Candidates (Optional)</Label> {/* Renamed from Students */}
            <Textarea
              id="instructions"
              placeholder="e.g., Please ensure you are in a quiet environment."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleScheduleInterview}
        className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-lg" // Updated color
        disabled={selectedCandidates.length === 0 || !dueDate || (!useCustomInterview && !selectedTemplate)} // Renamed from selectedStudents
      >
        <Send className="w-5 h-5 mr-2" />
        Schedule Interview(s)
      </Button>
    </div>
  )
}
