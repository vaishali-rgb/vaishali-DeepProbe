"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, UserPlus, Play, BarChart, History } from "lucide-react"
import KineticGrid from "@/components/ui/kinetic-grid"
import { Button } from "@/components/ui/button"

const guideSteps = [
  {
    icon: <UserPlus className="w-6 h-6 text-blue-400" />,
    title: "1. Select a Candidate",
    description: "On the home page, select a candidate from the dropdown. You'll see their past mission performance."
  },
  {
    icon: <Play className="w-6 h-6 text-emerald-400" />,
    title: "2. Conduct Interview",
    description: "Begin the technical interview. The AI Agent will adapt its questions based on the candidate's background and live responses."
  },
  {
    icon: <BarChart className="w-6 h-6 text-purple-400" />,
    title: "3. Review Results",
    description: "After 8+ questions, the AI will evaluate the session and generate a report of strengths, gaps, and next steps."
  },
  {
    icon: <History className="w-6 h-6 text-amber-400" />,
    title: "4. Analyze Replay",
    description: "Jump into Replay Mode to see exactly why the AI asked each question and how it evaluated the candidate's answers."
  }
]

export default function GuidePage() {
  const router = useRouter()

  return (
    <KineticGrid globalColor="default" className="font-sans">
      <div className="relative z-10 flex h-full flex-col min-h-screen">
        <main className="container mx-auto max-w-4xl p-6 py-12 flex-1">
          <div className="flex items-center mb-8">
            <Button 
              variant="ghost" 
              onClick={() => router.push("/")}
              className="text-white/70 hover:text-white bg-black/20 hover:bg-black/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back Home
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl font-bold mb-4 text-white">Platform User Guide</h1>
            <p className="text-xl text-white/70">
              How to evaluate candidates using the AI Interviewer platform.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guideSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 shadow-lg flex flex-col gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-white/70 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </main>
      </div>
    </KineticGrid>
  )
}
