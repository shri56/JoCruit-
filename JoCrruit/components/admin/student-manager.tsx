"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Edit, UserPlus, FileText } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, University, Users } from "lucide-react"

interface Candidate {
  // Renamed from Student
  id: string
  name: string
  email: string
  role: string
}

const mockCandidates: Candidate[] = [
  { id: "s1", name: "Alice Smith", email: "alice@example.com", role: "Software Engineer" },
  { id: "s2", name: "Bob Johnson", email: "bob@example.com", role: "Data Scientist" },
  { id: "s3", name: "Charlie Brown", email: "charlie@example.com", role: "Business Analyst" },
]

const predefinedRoles = [
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

export function StudentManager() {
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates)
  const [newCandidate, setNewCandidate] = useState<Omit<Candidate, "id">>({ name: "", email: "", role: "" })
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [organizationName, setOrganizationName] = useState("")
  const [organizationType, setOrganizationType] = useState<"university" | "company">("company")

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault()
    if (newCandidate.name && newCandidate.email && newCandidate.role) {
      setCandidates([...candidates, { ...newCandidate, id: `s${candidates.length + 1}` }])
      setNewCandidate({ name: "", email: "", role: "" })
    }
  }

  const handleEditCandidate = (id: string) => {
    const candidateToEdit = candidates.find((s) => s.id === id)
    if (candidateToEdit) {
      setNewCandidate({ name: candidateToEdit.name, email: candidateToEdit.email, role: candidateToEdit.role })
      setEditingCandidateId(id)
    }
  }

  const handleUpdateCandidate = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCandidateId && newCandidate.name && newCandidate.email && newCandidate.role) {
      setCandidates(
        candidates.map((s) => (s.id === editingCandidateId ? { ...newCandidate, id: editingCandidateId } : s)),
      )
      setNewCandidate({ name: "", email: "", role: "" })
      setEditingCandidateId(null)
    }
  }

  const handleDeleteCandidate = (id: string) => {
    setCandidates(candidates.filter((s) => s.id !== id))
  }

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "text/csv") {
      setCsvFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        const lines = text.split("\n").filter(Boolean)
        const newCandidatesFromCsv: Candidate[] = lines.slice(1).map((line, index) => {
          const [name, email, role] = line.split(",").map((s) => s.trim())
          return { id: `csv${candidates.length + index + 1}`, name, email, role }
        })
        setCandidates([...candidates, ...newCandidatesFromCsv])
        alert("Candidates imported from CSV!")
      }
      reader.readAsText(file)
    } else {
      alert("Please upload a valid CSV file.")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Organization Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="organizationName">Organization Name</Label>
            <Input
              id="organizationName"
              placeholder="e.g., Tech University, InnovateCorp"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organizationType">Organization Type</Label>
            <Select
              value={organizationType}
              onValueChange={(value) => setOrganizationType(value as "university" | "company")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="university" className="flex items-center gap-2">
                  <University className="w-4 h-4" /> University
                </SelectItem>
                <SelectItem value="company" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Company
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Candidate Credentials
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Individual Candidate */}
          <form onSubmit={editingCandidateId ? handleUpdateCandidate : handleAddCandidate} className="space-y-4">
            <h3 className="font-semibold text-lg">
              {editingCandidateId ? "Edit Candidate" : "Add Individual Candidate"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="candidate-name">Name</Label>
                <Input
                  id="candidate-name"
                  placeholder="Candidate Name"
                  value={newCandidate.name}
                  onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="candidate-email">Email ID</Label>
                <Input
                  id="candidate-email"
                  type="email"
                  placeholder="Candidate Email"
                  value={newCandidate.email}
                  onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="candidate-role">Role</Label>
                <Select
                  value={newCandidate.role}
                  onValueChange={(value) => setNewCandidate({ ...newCandidate, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {predefinedRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {editingCandidateId ? (
                <>
                  <Edit className="w-4 h-4 mr-2" /> Update Candidate
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" /> Add Candidate
                </>
              )}
            </Button>
            {editingCandidateId && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingCandidateId(null)
                  setNewCandidate({ name: "", email: "", role: "" })
                }}
              >
                Cancel Edit
              </Button>
            )}
          </form>

          {/* Upload CSV */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="font-semibold text-lg">Bulk Upload (CSV)</h3>
            <div className="space-y-2">
              <Label htmlFor="csv-upload">Upload CSV File</Label>
              <Input id="csv-upload" type="file" accept=".csv" onChange={handleCsvUpload} />
              {csvFile && (
                <p className="text-sm text-gray-600">
                  Selected: <span className="font-medium">{csvFile.name}</span>
                </p>
              )}
              <p className="text-sm text-gray-500">
                Standard CSV format: `Name, Mail ID, Role` (e.g., `John Doe, john@example.com, Software Engineer`)
              </p>
            </div>
            <Button variant="outline" onClick={() => alert("CSV Template Downloaded!")}>
              <FileText className="w-4 h-4 mr-2" /> Download CSV Template
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Managed Candidates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell className="font-medium">{candidate.name}</TableCell>
                  <TableCell>{candidate.email}</TableCell>
                  <TableCell>{candidate.role}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditCandidate(candidate.id)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteCandidate(candidate.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {candidates.length === 0 && <p className="text-center text-gray-500 py-4">No candidates added yet.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
