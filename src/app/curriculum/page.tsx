"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, BookOpen, Clock, Code, Database, Server, Workflow } from "lucide-react"
import KineticGrid from "@/components/ui/kinetic-grid"
import { Button } from "@/components/ui/button"

const curriculumModules = [
  { day: 1, title: "VS Code & Python Environment Setup", icon: <Code className="w-5 h-5 text-blue-400" /> },
  { day: 3, title: "Variables, Data Types & Basic Logic", icon: <Code className="w-5 h-5 text-blue-400" /> },
  { day: 5, title: "Functions & Modular Programming", icon: <Code className="w-5 h-5 text-blue-400" /> },
  { day: 8, title: "Object-Oriented Programming Fundamentals", icon: <Code className="w-5 h-5 text-blue-400" /> },
  { day: 12, title: "FastAPI & RESTful Design", icon: <Server className="w-5 h-5 text-emerald-400" /> },
  { day: 15, title: "Database Modeling & SQL", icon: <Database className="w-5 h-5 text-purple-400" /> },
  { day: 18, title: "LLM APIs & Prompt Engineering", icon: <Workflow className="w-5 h-5 text-amber-400" /> },
  { day: 22, title: "Multi-Agent Orchestration", icon: <Workflow className="w-5 h-5 text-amber-400" /> },
  { day: 28, title: "Docker & Kubernetes Deployment", icon: <Server className="w-5 h-5 text-emerald-400" /> },
  { day: 31, title: "Capstone Project & Final Demo", icon: <BookOpen className="w-5 h-5 text-primary" /> },
]

export default function CurriculumPage() {
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
            <h1 className="text-4xl font-bold mb-4 text-white">Full-Stack AI Curriculum</h1>
            <p className="text-xl text-white/70">
              The 31-day intensive program that candidates are evaluated against.
            </p>
          </motion.div>

          <div className="space-y-4">
            {curriculumModules.map((mod, index) => (
              <motion.div
                key={mod.day}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-6 p-5 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 shadow-lg"
              >
                <div className="flex-shrink-0 w-16 text-center">
                  <span className="block text-sm font-semibold text-white/50 uppercase tracking-wider">Day</span>
                  <span className="block text-2xl font-bold text-white">{mod.day}</span>
                </div>
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  {mod.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{mod.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </main>
      </div>
    </KineticGrid>
  )
}
