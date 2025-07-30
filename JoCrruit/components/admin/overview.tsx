"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, BarChart2, Download, Award, TrendingUp, TrendingDown, UserPlus } from "lucide-react"
import { useState } from "react"

// Mock data for admin dashboard
interface Student {
  id: string
  name: string
  email: string
  role: string
  interviewStatus: "Not Started" | "In Progress" | "Completed" | "Scheduled"
  score?: number
  isHireable?: boolean
}

const mockStudents: Student[] = [
  {
    id: "s1",
    name: "Alice Smith",
    email: "alice@example.com",
    role: "Software Engineer",
    interviewStatus: "Completed",
    score: 8.5,
    isHireable: true,
  },
  {
    id: "s2",
    name: "Bob Johnson",
    email: "bob@example.com",
    role: "Data Scientist",
    interviewStatus: "In Progress",
  },
  {
    id: "s3",
    name: "Charlie Brown",
    email: "charlie@example.com",
    role: "Business Analyst",
    interviewStatus: "Not Started",
  },
  {
    id: "s4",
    name: "Diana Prince",
    email: "diana@example.com",
    role: "UX Designer",
    interviewStatus: "Completed",
    score: 7.2,
    isHireable: true,
  },
  {
    id: "s5",
    name: "Eve Adams",
    email: "eve@example.com",
    role: "Software Engineer",
    interviewStatus: "Completed",
    score: 5.9,
    isHireable: false,
  },
  {
    id: "s6",
    name: "Frank White",
    email: "frank@example.com",
    role: "Product Manager",
    interviewStatus: "Scheduled",
  },
]

export function AdminOverview() {
  const [students, setStudents] = useState<Student[]>(mockStudents)

  const totalStudents = students.length
  const interviewsTaken = students.filter((s) => s.interviewStatus === "Completed").length
  const averageScore =
    interviewsTaken > 0
      ? (
          students.filter((s) => s.score !== undefined).reduce((sum, s) => sum + (s.score || 0), 0) / interviewsTaken
        ).toFixed(1)
      : "N/A"
  const hireableStudents = students.filter((s) => s.isHireable).length
  const hireablePercentage = interviewsTaken > 0 ? ((hireableStudents / interviewsTaken) * 100).toFixed(1) : "N/A"

  const downloadReport = () => {
    const headers = ["ID", "Name", "Email", "Role", "Interview Status", "Score (out of 10)", "Hireable"]
    const csvRows = students.map((s) => [
      s.id,
      s.name,
      s.email,
      s.role,
      s.interviewStatus,
      s.score !== undefined ? s.score.toFixed(1) : "N/A",
      s.isHireable !== undefined ? (s.isHireable ? "Yes" : "No") : "N/A",
    ])

    const csvContent = [headers.join(","), ...csvRows.map((row) => row.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", "jocruit_aix_report.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students Added</p>
              <p className="text-2xl font-bold">{totalStudents}</p>
            </div>
            <UserPlus className="w-8 h-8 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Interviews Completed</p>
              <p className="text-2xl font-bold">{interviewsTaken}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold">{averageScore}</p>
            </div>
            <BarChart2 className="w-8 h-8 text-purple-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hireable Percentage</p>
              <p className="text-2xl font-bold">{hireablePercentage}%</p>
            </div>
            <Award className="w-8 h-8 text-yellow-600" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Performance Trends</CardTitle>
          <Button variant="outline" size="sm" onClick={downloadReport}>
            <Download className="w-4 h-4 mr-2" />
            Download Report (CSV)
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              [Placeholder for Chart: Average Score Over Time / Completion Rate]
            </p>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-green-600">
              <TrendingUp className="w-5 h-5" />
              <p className="text-sm">Interview completion rate: +5% last month</p>
            </div>
            <div className="flex items-center gap-2 text-red-600">
              <TrendingDown className="w-5 h-5" />
              <p className="text-sm">Average score for new roles: -0.3 points</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
              <span>Alice Smith completed "Software Engineer" interview.</span>
              <span className="text-gray-500 dark:text-gray-400">2 hours ago</span>
            </li>
            <li className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
              <span>New student Charlie Brown added.</span>
              <span className="text-gray-500 dark:text-gray-400">1 day ago</span>
            </li>
            <li className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
              <span>Interview "Product Manager Trainee" scheduled for Frank White.</span>
              <span className="text-gray-500 dark:text-gray-400">3 days ago</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
