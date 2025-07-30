"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Clock,
  Play,
  Eye,
  Search,
  GraduationCap,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Timer,
  User,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock data for assigned interviews - in real app, this would come from API based on user
const assignedInterviews = [
  {
    id: 1,
    title: "Software Engineering Intern - Summer 2024",
    organization: "Tech University Career Center",
    organizationType: "university",
    assignedBy: "Dr. Sarah Johnson",
    dueDate: "2024-02-15",
    duration: "45 min",
    questions: 12,
    difficulty: "Intermediate",
    status: "pending",
    priority: "high",
    description:
      "Technical interview focusing on data structures, algorithms, and system design basics. This interview is part of your Computer Science capstone requirement.",
    instructions:
      "Please complete this interview before the deadline. Make sure you have a quiet environment and stable internet connection.",
  },
  {
    id: 2,
    title: "Marketing Associate Position",
    organization: "BrandCorp Recruitment",
    organizationType: "company",
    assignedBy: "Jennifer Martinez - HR Manager",
    dueDate: "2024-02-20",
    duration: "40 min",
    questions: 10,
    difficulty: "Beginner",
    status: "completed",
    priority: "medium",
    score: 8.5,
    completedDate: "2024-02-10",
    description:
      "Creative and analytical thinking assessment for marketing positions. Focus on campaign strategy and consumer behavior.",
    instructions: "This is your final interview round. Results will be shared within 48 hours of completion.",
  },
  {
    id: 3,
    title: "Data Science Graduate Program Assessment",
    organization: "State University - Data Science Dept",
    organizationType: "university",
    assignedBy: "Prof. Michael Chen",
    dueDate: "2024-02-25",
    duration: "60 min",
    questions: 18,
    difficulty: "Advanced",
    status: "in-progress",
    priority: "high",
    progress: 65,
    description:
      "Comprehensive assessment covering statistics, machine learning, and business acumen for graduate program admission.",
    instructions: "You can pause and resume this interview. Complete all sections for full evaluation.",
  },
  {
    id: 4,
    title: "Product Manager Trainee",
    organization: "InnovateTech Solutions",
    organizationType: "company",
    assignedBy: "Alex Thompson - Talent Acquisition",
    dueDate: "2024-03-01",
    duration: "50 min",
    questions: 15,
    difficulty: "Advanced",
    status: "scheduled",
    priority: "medium",
    scheduledTime: "2024-02-18T14:00:00",
    description:
      "Behavioral and case study interview for product management trainee roles. Focus on problem-solving and leadership potential.",
    instructions: "Live interview scheduled. Please join 5 minutes early and have your resume ready.",
  },
]

const interviewStats = {
  totalAssigned: 4,
  completed: 1,
  pending: 2,
  inProgress: 1,
  averageScore: 8.5,
}

export function AssignedInterviews() {
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")

  useEffect(() => {
    async function fetchAssigned() {
      setLoading(true)
      try {
        const res = await fetch("/api/users/assigned-interviews")
        if (res.ok) {
          const data = await res.json()
          setInterviews(data.data.interviews)
        }
      } catch {}
      setLoading(false)
    }
    fetchAssigned()
  }, [])

  const filteredInterviews = interviews.filter((interview) => {
    const matchesSearch =
      interview.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.organization.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || interview.status === filterStatus
    const matchesType = filterType === "all" || interview.organizationType === filterType

    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "scheduled":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-orange-100 text-orange-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "in-progress":
        return <Timer className="w-4 h-4" />
      case "pending":
        return <AlertCircle className="w-4 h-4" />
      case "scheduled":
        return <Calendar className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assigned</p>
                <p className="text-2xl font-bold">{interviewStats.totalAssigned}</p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{interviewStats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{interviewStats.pending}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{interviewStats.inProgress}</p>
              </div>
              <Timer className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Score</p>
                <p className="text-2xl font-bold text-purple-600">{interviewStats.averageScore}/10</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            My Assigned Interviews
          </CardTitle>
          <p className="text-sm text-gray-600">Interviews assigned to you by your university or potential employers</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Interviews</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search interviews..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="university">University</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Interview List */}
              <div className="space-y-4">
                {filteredInterviews.map((interview) => (
                  <Card key={interview.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{interview.title}</h3>
                            <Badge className={`${getStatusColor(interview.status)} border`}>
                              {getStatusIcon(interview.status)}
                              <span className="ml-1 capitalize">{interview.status}</span>
                            </Badge>
                            <Badge className={getPriorityColor(interview.priority)} variant="secondary">
                              {interview.priority} priority
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              {interview.organizationType === "university" ? (
                                <GraduationCap className="w-4 h-4" />
                              ) : (
                                <Briefcase className="w-4 h-4" />
                              )}
                              {interview.organization}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {interview.assignedBy}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {interview.duration}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Due: {new Date(interview.dueDate).toLocaleDateString()}
                            </div>
                          </div>

                          <p className="text-gray-700 mb-3">{interview.description}</p>

                          {interview.instructions && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                              <p className="text-sm text-blue-800">
                                <strong>Instructions:</strong> {interview.instructions}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center gap-4">
                            <Badge variant="outline">{interview.questions} questions</Badge>
                            <Badge
                              variant="outline"
                              className={
                                interview.difficulty === "Beginner"
                                  ? "border-green-300 text-green-700"
                                  : interview.difficulty === "Intermediate"
                                    ? "border-yellow-300 text-yellow-700"
                                    : "border-red-300 text-red-700"
                              }
                            >
                              {interview.difficulty}
                            </Badge>
                            {interview.score && (
                              <Badge className="bg-green-100 text-green-800">Score: {interview.score}/10</Badge>
                            )}
                            {interview.progress && (
                              <Badge className="bg-blue-100 text-blue-800">Progress: {interview.progress}%</Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {interview.status === "completed" ? (
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              View Results
                            </Button>
                          ) : (
                            <>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-2" />
                                Preview
                              </Button>
                              <Button size="sm" className="bg-primary hover:bg-primary/90">
                                <Play className="w-4 h-4 mr-2" />
                                {interview.status === "in-progress" ? "Continue" : "Start"}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Other tab contents would filter by status */}
            <TabsContent value="pending">
              <div className="space-y-4">
                {filteredInterviews
                  .filter((i) => i.status === "pending")
                  .map((interview) => (
                    <Card key={interview.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold mb-2">{interview.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{interview.organization}</p>
                            <p className="text-sm text-red-600">
                              Due: {new Date(interview.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Button size="sm" className="bg-primary hover:bg-primary/90">
                            <Play className="w-4 h-4 mr-2" />
                            Start Interview
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="in-progress">
              <div className="space-y-4">
                {filteredInterviews
                  .filter((i) => i.status === "in-progress")
                  .map((interview) => (
                    <Card key={interview.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold mb-2">{interview.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{interview.organization}</p>
                            {interview.progress && (
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${interview.progress}%` }}
                                ></div>
                              </div>
                            )}
                            <p className="text-sm text-blue-600">Progress: {interview.progress}%</p>
                          </div>
                          <Button size="sm" className="bg-primary hover:bg-primary/90">
                            <Play className="w-4 h-4 mr-2" />
                            Continue
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="completed">
              <div className="space-y-4">
                {filteredInterviews
                  .filter((i) => i.status === "completed")
                  .map((interview) => (
                    <Card key={interview.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold mb-2">{interview.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{interview.organization}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-green-600">Completed: {interview.completedDate}</span>
                              {interview.score && <span className="text-blue-600">Score: {interview.score}/10</span>}
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View Results
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
