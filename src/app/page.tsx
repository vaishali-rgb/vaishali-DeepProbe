"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Bot, User, ArrowRight, ShieldCheck, Clock, Award } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface CandidateSummary {
  id: string
  name: string
  jobRole: string
  yearsExperience: number
  education: string
  status: string
  missionsCompleted: number
  missionsFirstTry: number
  commitDays: number
  totalMissions: number
  passedCount: number
  failedCount: number
  skippedCount: number
}

export default function Home() {
  const router = useRouter()
  const [candidates, setCandidates] = useState<CandidateSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/candidates")
      .then((res) => res.json())
      .then((data) => {
        setCandidates(data.candidates)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load candidates", err)
        setLoading(false)
      })
  }, [])

  const handleSelectCandidate = (id: string) => {
    router.push(`/lobby/${id}`)
  }

  return (
    <main className="container mx-auto max-w-6xl p-6 py-12 flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-primary/10 border border-primary/20 text-primary">
          <Bot className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4 text-glow">
          AI Interview Agent
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Adaptive technical interviewer that builds an evidence-based understanding of candidates.
        </p>
      </motion.div>

      {loading ? (
        <div className="w-full flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((candidate, i) => (
            <motion.div
              key={candidate.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="h-full flex flex-col hover:border-glow transition-all hover:-translate-y-1">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={candidate.status === 'Active' ? 'success' : 'secondary'}>
                      {candidate.status}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {candidate.yearsExperience}y exp
                    </Badge>
                  </div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    {candidate.name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {candidate.jobRole}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="glass p-3 rounded-lg flex flex-col gap-1">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Passed
                        </span>
                        <span className="font-semibold text-lg">{candidate.passedCount}/{candidate.totalMissions}</span>
                      </div>
                      <div className="glass p-3 rounded-lg flex flex-col gap-1">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Consistency
                        </span>
                        <span className="font-semibold text-lg">{candidate.commitDays} days</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full group" 
                    onClick={() => handleSelectCandidate(candidate.id)}
                  >
                    Start Interview
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </main>
  )
}
