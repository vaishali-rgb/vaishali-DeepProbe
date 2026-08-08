"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle2, Trophy, Target, Lightbulb, PlayCircle, LogOut } from "lucide-react"
import { use } from "react"
import KineticGrid from "@/components/ui/kinetic-grid"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { FeedbackResponse } from "@/lib/types/api"

export default function ResultsPage(props: { params: Promise<{ sessionId: string }> }) {
  const params = use(props.params)
  const router = useRouter()
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null)

  useEffect(() => {
    // Attempt to load from session storage first
    const stored = sessionStorage.getItem(`interview_${params.sessionId}_feedback`)
    if (stored) {
      try {
        setFeedback(JSON.parse(stored))
      } catch (e) {
        console.error(e)
      }
    } else {
      // If not in storage, we would typically fetch from the DB.
      // For this hackathon, state is in memory, so we can redirect to replay
      // if feedback isn't found locally.
    }
  }, [params.sessionId])

  if (!feedback) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <KineticGrid globalColor="default" className="font-sans">
      <div className="relative z-10 flex h-full flex-col min-h-screen">
        <main className="container mx-auto max-w-5xl p-6 py-12 flex-1">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mb-6">
              <Trophy className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-4 text-white">Interview Completed</h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Here is your personalized assessment based on the evidence gathered.
            </p>
          </motion.div>

          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Summary Card */}
            <motion.div variants={item}>
              <Card className="border-white/10 bg-black/50 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl flex items-center justify-between text-white">
                    <span className="flex items-center gap-2"><Target className="w-5 h-5 text-white/70" /> Overall Assessment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg leading-relaxed text-white/90 mb-4">
                    {feedback.summary}
                  </p>
                  {feedback.curriculumCoverage.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
                      <span className="text-sm text-white/50 flex items-center mr-2">Curriculum Covered:</span>
                      {feedback.curriculumCoverage.map((day, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-sm">
                          {day}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Technical Skills Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div variants={item}>
                <Card className="h-full border-emerald-500/30 bg-black/50 backdrop-blur-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" /> Technical Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {feedback.technicalStrengths.map((strength, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                          <span className="text-white/90 leading-relaxed">{strength}</span>
                        </li>
                      ))}
                      {feedback.technicalStrengths.length === 0 && (
                        <li className="text-white/50 italic">No specific technical strengths recorded.</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="h-full border-destructive/30 bg-black/50 backdrop-blur-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                      <Target className="w-5 h-5" /> Technical Gaps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {feedback.technicalGaps.map((gap, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 shrink-0" />
                          <span className="text-white/90 leading-relaxed">{gap}</span>
                        </li>
                      ))}
                      {feedback.technicalGaps.length === 0 && (
                        <li className="text-white/50 italic">No technical gaps identified.</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Misconceptions Row (Only show if present) */}
            {feedback.misconceptions.length > 0 && (
              <motion.div variants={item}>
                <Card className="border-purple-500/30 bg-black/50 backdrop-blur-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-purple-400">
                      <Lightbulb className="w-5 h-5" /> Detected Misconceptions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {feedback.misconceptions.map((misc, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                          <span className="text-white/90 leading-relaxed">{misc}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Next Steps */}
            <motion.div variants={item}>
              <Card className="border-amber-500/30 bg-black/50 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-amber-400">
                    <Target className="w-5 h-5" /> Actionable Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {feedback.recommendedNextSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <span className="text-white/90 leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 flex justify-center gap-4 flex-wrap"
          >
            <Button onClick={() => router.push("/")} variant="outline" size="lg">
              <LogOut className="w-4 h-4 mr-2" /> Exit
            </Button>
            <Button onClick={() => router.push(`/replay/${params.sessionId}`)} size="lg" className="group">
              <PlayCircle className="w-4 h-4 mr-2 group-hover:text-primary-foreground" /> 
              Review Replay
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </main>
      </div>
    </KineticGrid>
  )
}
