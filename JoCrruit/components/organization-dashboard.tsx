"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Building2,
  Users,
  Calendar,
  Clock,
  Play,
  Eye,
  Plus,
  Search,
  MoreHorizontal,
  GraduationCap,
  Briefcase,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const predefinedInterviews = [
  {
    id: 1,
    title: "Software Engineering Intern",
    organization: "Tech University",
    type: "university",
    duration: "45 min",
    questions: 12,
    difficulty: "Intermediate",
    candidates: 156,
    status: "active",
    description: "Technical interview focusing on data structures, algorithms, and system design basics.",
  },
  {
    id: 2,
    title: "Product Manager - Entry Level",
    organization: "InnovateCorp",
    type: "company",
    duration: "60 min",
    questions: 15,
    difficulty: "Advanced",
    candidates: 89,
    status: "active",
    description: "Behavioral and case study interview for product management roles.",
  },
  {
    id: 3,
    title: "Data Science Graduate Program",
    organization: "State University",
    type: "university",
    duration: "50 min",
    questions: 18,
    difficulty: "Advanced",
    candidates: 234,
    status: "draft",
    description: "Comprehensive assessment covering statistics, machine learning, and business acumen.",
  },
  {
    id: 4,
    title: "Marketing Associate",
    organization: "BrandCo",
    type: "company",
    duration: "40 min",
    questions: 10,
    difficulty: "Beginner",
    candidates: 67,
    status: "active",
    description: "Creative and analytical thinking assessment for marketing positions.",
  },
]

const interviewStats = {
  totalInterviews: 24,
  activeCandidates: 546,
  completedToday: 89,
  averageScore: 7.2,
}

export function OrganizationDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const filteredInterviews = predefinedInterviews.filter((interview) => {
    const matchesSearch =
      interview.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.organization.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || interview.type === filterType
    const matchesStatus = filterStatus === "all" || interview.status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Interviews</p>
                <p className="text-2xl font-bold">{interviewStats.totalInterviews}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Candidates</p>
                <p className="text-2xl font-bold">{interviewStats.activeCandidates}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold">{interviewStats.completedToday}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold">{interviewStats.averageScore}/10</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Interview Management</CardTitle>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Interview
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="interviews" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="interviews">All Interviews</TabsTrigger>
              <TabsTrigger value="university">University</TabsTrigger>
              <TabsTrigger value="company">Company</TabsTrigger>
            </TabsList>

            <TabsContent value="interviews" className="space-y-4">
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

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
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
                            <Badge
                              variant={interview.status === "active" ? "default" : "secondary"}
                              className={interview.status === "active" ? "bg-green-100 text-green-800" : ""}
                            >
                              {interview.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              {interview.type === "university" ? (
                                <GraduationCap className="w-4 h-4" />
                              ) : (
                                <Briefcase className="w-4 h-4" />
                              )}
                              {interview.organization}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {interview.duration}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {interview.candidates} candidates
                            </div>
                          </div>

                          <p className="text-gray-700 mb-4">{interview.description}</p>

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
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </Button>
                          <Button size="sm" className="bg-primary hover:bg-primary/90">
                            <Play className="w-4 h-4 mr-2" />
                            Start
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="university">
              <div className="space-y-4">
                {filteredInterviews
                  .filter((i) => i.type === "university")
                  .map((interview) => (
                    <Card key={interview.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-2">
                          <GraduationCap className="w-6 h-6 text-blue-600" />
                          <h3 className="text-lg font-semibold">{interview.title}</h3>
                          <Badge variant="secondary">{interview.organization}</Badge>
                        </div>
                        <p className="text-gray-700 mb-4">{interview.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{interview.duration}</span>
                            <span>{interview.questions} questions</span>
                            <span>{interview.candidates} candidates</span>
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

            <TabsContent value="company">
              <div className="space-y-4">
                {filteredInterviews
                  .filter((i) => i.type === "company")
                  .map((interview) => (
                    <Card key={interview.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-2">
                          <Briefcase className="w-6 h-6 text-green-600" />
                          <h3 className="text-lg font-semibold">{interview.title}</h3>
                          <Badge variant="secondary">{interview.organization}</Badge>
                        </div>
                        <p className="text-gray-700 mb-4">{interview.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{interview.duration}</span>
                            <span>{interview.questions} questions</span>
                            <span>{interview.candidates} candidates</span>
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
