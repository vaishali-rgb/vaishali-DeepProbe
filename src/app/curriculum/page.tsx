"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, BookOpen, Clock, Code, Database, Server, Workflow } from "lucide-react"
import KineticGrid from "@/components/ui/kinetic-grid"
import { Button } from "@/components/ui/button"
import curriculumData from "@/data/curriculum.json"

function getIconForType(type: string) {
  switch (type) {
    case "SETUP": return <Code className="w-5 h-5 text-blue-400" />
    case "BUILD": return <Workflow className="w-5 h-5 text-amber-400" />
    case "AI_CORE": return <Database className="w-5 h-5 text-purple-400" />
    case "SHIP_IT": return <Server className="w-5 h-5 text-emerald-400" />
    case "LEARN": return <BookOpen className="w-5 h-5 text-blue-300" />
    case "OPTIMIZE": return <Clock className="w-5 h-5 text-orange-400" />
    case "CAPSTONE": return <BookOpen className="w-5 h-5 text-primary" />
    default: return <BookOpen className="w-5 h-5 text-white/50" />
  }
}

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
            {curriculumData.days.map((mod, index) => (
              <motion.div
                key={mod.day}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (index % 10) * 0.1 }}
                className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 p-5 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 shadow-lg"
              >
                <div className="flex items-center sm:flex-col gap-4 sm:gap-0 sm:w-16 sm:text-center shrink-0">
                  <div>
                    <span className="block text-sm font-semibold text-white/50 uppercase tracking-wider">Day</span>
                    <span className="block text-2xl font-bold text-white">{mod.day}</span>
                  </div>
                  <div className="hidden sm:flex mt-4 w-12 h-12 rounded-full bg-white/5 items-center justify-center border border-white/10 mx-auto">
                    {getIconForType(mod.type)}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="sm:hidden w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                      {getIconForType(mod.type)}
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/70">{mod.type}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{mod.title}</h3>
                  
                  {mod.tools && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {mod.tools.map((tool: string, i: number) => (
                        <span key={i} className="text-[10px] uppercase tracking-wider text-blue-300 border border-blue-400/20 bg-blue-400/5 px-2 py-1 rounded">
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {mod.objectives && (
                    <ul className="space-y-2">
                      {mod.objectives.map((obj: string, i: number) => (
                        <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                          <span className="text-white/30 mt-0.5 shrink-0">•</span>
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </main>
      </div>
    </KineticGrid>
  )
}
