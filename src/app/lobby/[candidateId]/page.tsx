"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Play, User, Brain, ShieldAlert, CheckCircle2 } from "lucide-react"
import { use } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { CandidateProfile } from "@/lib/types/candidate"

export default function LobbyPage(props: { params: Promise<{ candidateId: string }> }) {
  const params = use(props.params)
  const router = useRouter()
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    fetch(`/api/candidates/${params.candidateId}`)
      .then((res) => res.json())
      .then((data) => {
        setCandidate(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load candidate", err)
        setLoading(false)
      })
  }, [params.candidateId])

  const handleStartInterview = async () => {
    if (!candidate) return
    setStarting(true)
    
    // Generate a random session ID
    const sessionId = Math.random().toString(36).substring(2, 15)
    
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          candidate
        })
      })
      
      if (res.ok) {
        // We'll pass the initial AI message via URL or session storage 
        // to the live interview page, or just have it re-fetch.
        // For simplicity, we just navigate to the interview page.
        sessionStorage.setItem(`interview_${sessionId}_initial`, JSON.stringify(await res.json()))
        router.push(`/interview/${sessionId}`)
      } else {
        console.error("Failed to start interview")
        setStarting(false)
      }
    } catch (err) {
      console.error(err)
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-4">Candidate Not Found</h2>
        <Button onClick={() => router.push("/")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Candidates
        </Button>
      </div>
    )
  }

  const { member, signals, missions } = candidate
  const passedMissions = missions.filter(m => m.passed)
  const failedMissions = missions.filter(m => m.passed === false && !m.skipped)
  const skippedMissions = missions.filter(m => m.skipped)

  return (
    <section className="relative min-h-screen w-full font-sans text-white bg-black">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 h-full w-full object-cover z-0"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260803_192301_9231ed6b-c55c-4a48-909c-4ebe11cf2e11.mp4"
      />
      
      {/* Content Overlay */}
      <div className="relative z-10 flex h-full flex-col p-6 py-12">
        <main className="container mx-auto max-w-4xl">
          <button 
            onClick={() => router.push("/")}
            className="mb-8 flex items-center text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Candidate Selection
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Left Column - Start Action */}
            <div className="md:col-span-1 space-y-6">
              <div className="rounded-2xl bg-white/10 backdrop-blur-lg p-6">
                <h2 className="text-xl font-semibold mb-2">Interview Lobby</h2>
                <p className="text-sm text-white/70 mb-6">
                  Ready to begin the AI engineering technical assessment?
                </p>
                <button 
                  className="w-full rounded-full py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center relative overflow-hidden group"
                  style={{ background: 'linear-gradient(to bottom, #2B2B2B, #101010)' }}
                  onClick={handleStartInterview}
                  disabled={starting}
                >
                  {starting ? (
                    <span className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin mr-2" />
                      Initializing AI...
                    </span>
                  ) : (
                    <>
                      <span className="relative z-10 flex items-center">
                        <Play className="w-5 h-5 mr-2 fill-current" /> Begin Interview
                      </span>
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    </>
                  )}
                </button>
              </div>

              <div className="rounded-2xl bg-white/10 backdrop-blur-lg p-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Brain className="w-4 h-4 text-white" /> Key Signals
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-black/20">
                    <span className="text-white/70">Completion Rate</span>
                    <span className="font-semibold">{Math.round((signals.missionsCompleted / 31) * 100)}%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-black/20">
                    <span className="text-white/70">First-Try Rate</span>
                    <span className="font-semibold">{Math.round((signals.missionsFirstTry / Math.max(1, signals.missionsCompleted)) * 100)}%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-black/20">
                    <span className="text-white/70">Active Days</span>
                    <span className="font-semibold">{signals.commitDays} / 31</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Candidate Brief */}
            <div className="md:col-span-2 space-y-6">
              <div className="rounded-2xl bg-white/10 backdrop-blur-lg p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6">
                  <div>
                    <h2 className="text-3xl mb-2 flex items-center gap-3 font-semibold">
                      <User className="w-8 h-8 text-white" />
                      {member.name}
                    </h2>
                    <p className="text-base text-white/70">
                      {member.jobRole} • {member.yearsExperience} years experience
                    </p>
                  </div>
                  <Badge variant={member.status === 'Active' ? 'secondary' : 'outline'} className="mt-4 sm:mt-0 text-sm px-3 py-1 bg-black/30 border-none text-white">
                    {member.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-black/20 p-4 rounded-xl">
                    <p className="text-sm text-white/70 mb-1">Education</p>
                    <p className="font-medium">{member.education}</p>
                  </div>
                  <div className="bg-black/20 p-4 rounded-xl">
                    <p className="text-sm text-white/70 mb-1">Total Missions</p>
                    <p className="font-medium">{missions.length}</p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-4 border-b border-white/20 pb-2">Mission Highlights</h3>
                
                <div className="space-y-4">
                  {passedMissions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-emerald-400 flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4" /> Strongly Grasped
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {passedMissions.slice(0, 6).map(m => (
                          <Badge key={m.day} variant="outline" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-100">
                            Day {m.day}: {m.title}
                          </Badge>
                        ))}
                        {passedMissions.length > 6 && (
                          <Badge variant="outline" className="bg-white/10 text-white/70 border-none">+{passedMissions.length - 6} more</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {failedMissions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-400 flex items-center gap-2 mb-2 mt-4">
                        <ShieldAlert className="w-4 h-4" /> Areas for Review
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {failedMissions.map(m => (
                          <Badge key={m.day} variant="outline" className="bg-red-500/10 border-red-500/20 text-red-100">
                            Day {m.day}: {m.title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </section>
  )
}
