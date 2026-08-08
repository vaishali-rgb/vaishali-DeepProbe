"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, User, Bot, Search, AlertCircle, Sparkles, Flag, PlayCircle, Star } from "lucide-react"
import { use } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Match with EvidenceRecord from types
interface ReplayState {
  sessionId: string
  candidateName: string
  candidateRole: string
  questionCount: number
  curriculumDaysCovered: number[]
  phase: string
  evidence: {
    day: number
    topic: string
    question: string
    answer: string
    questionType: string
    evaluation: {
      score: number
      understanding: string
      strengths: string[]
      gaps: string[]
      misconceptions: string[]
    }
    reason: {
      trigger: string
      basedOn: string
      learningObjective: string
      goal: string
    }
    difficulty: string
  }[]
  startedAt: string
}

export default function ReplayPage(props: { params: Promise<{ sessionId: string }> }) {
  const params = use(props.params)
  const router = useRouter()
  const [data, setData] = useState<ReplayState | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/interview/${params.sessionId}/replay`)
      .then(res => res.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to load replay", err)
        setLoading(false)
      })
  }, [params.sessionId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!data || !data.evidence) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-4">Replay Not Found</h2>
        <Button onClick={() => router.push("/")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back Home
        </Button>
      </div>
    )
  }

  return (
    <main className="container mx-auto max-w-5xl p-6 py-12">
      <div className="flex justify-between items-center mb-8">
        <Button 
          variant="ghost" 
          onClick={() => router.push(`/results/${params.sessionId}`)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Results
        </Button>
        <Badge variant="outline" className="border-primary/50 text-primary">
          <PlayCircle className="w-3 h-3 mr-1" /> Replay Mode
        </Badge>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Interview Playback: {data.candidateName}</h1>
        <p className="text-muted-foreground flex gap-4">
          <span>{data.questionCount} Questions</span>
          <span>•</span>
          <span>{data.curriculumDaysCovered.length} Curriculum Days</span>
          <span>•</span>
          <span>Final Phase: {data.phase}</span>
        </p>
      </motion.div>

      <div className="space-y-6">
        {data.evidence.map((record, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden glass-panel border-border/50">
              <CardHeader className="bg-secondary/20 pb-4 border-b border-border/50">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                      Q{index + 1}
                    </div>
                    <div>
                      <CardTitle className="text-lg">Day {record.day}: {record.topic}</CardTitle>
                      <div className="text-sm text-muted-foreground flex gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px]">{record.questionType}</Badge>
                        <Badge variant="outline" className="text-[10px] capitalize">{record.difficulty}</Badge>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setActiveQuestion(activeQuestion === index ? null : index)}
                    className="gap-2"
                  >
                    <Search className="w-4 h-4" /> 
                    {activeQuestion === index ? "Hide Analysis" : "Why this question?"}
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="p-6 space-y-6">
                  {/* Q & A */}
                  <div className="space-y-4">
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div className="p-3 rounded-2xl bg-secondary/30 rounded-tl-sm">
                        <p className="text-sm">{record.question}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 rounded-tr-sm">
                        <p className="text-sm">{record.answer}</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Reasoning / Analysis Panel */}
                  <AnimatePresence>
                    {activeQuestion === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Reason Panel */}
                          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                            <h4 className="font-semibold flex items-center gap-2 mb-3 text-primary">
                              <Sparkles className="w-4 h-4" /> The "Why"
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-muted-foreground block text-xs">Trigger</span>
                                <span>{record.reason.trigger}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-xs">Based On</span>
                                <span>{record.reason.basedOn}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-xs">Goal</span>
                                <span>{record.reason.goal}</span>
                              </div>
                            </div>
                          </div>

                          {/* Evaluation Panel */}
                          <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-semibold flex items-center gap-2">
                                <Flag className="w-4 h-4" /> Evaluation
                              </h4>
                              <Badge variant={record.evaluation.score >= 7 ? "success" : record.evaluation.score >= 4 ? "warning" : "destructive"}>
                                Score: {record.evaluation.score}/10
                              </Badge>
                            </div>
                            
                            <div className="space-y-3 text-sm">
                              {record.evaluation.strengths.length > 0 && (
                                <div>
                                  <span className="text-emerald-400 block text-xs font-medium flex items-center gap-1 mb-1">
                                    <Star className="w-3 h-3" /> Strengths
                                  </span>
                                  <ul className="list-disc pl-4 text-foreground/80 space-y-1">
                                    {record.evaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                  </ul>
                                </div>
                              )}
                              {record.evaluation.gaps.length > 0 && (
                                <div>
                                  <span className="text-destructive block text-xs font-medium flex items-center gap-1 mb-1">
                                    <AlertCircle className="w-3 h-3" /> Gaps Identified
                                  </span>
                                  <ul className="list-disc pl-4 text-foreground/80 space-y-1">
                                    {record.evaluation.gaps.map((g, i) => <li key={i}>{g}</li>)}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </main>
  )
}
