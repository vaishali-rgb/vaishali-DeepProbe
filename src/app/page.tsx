"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Menu, X, ShieldCheck, User } from "lucide-react"
import KineticGrid from "@/components/ui/kinetic-grid"

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

const navLinks = ['Modules', 'Clientele', 'Solutions', 'Billing']

export default function Home() {
  const router = useRouter()
  const [candidates, setCandidates] = useState<CandidateSummary[]>([])
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [starting, setStarting] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    fetch("/api/candidates")
      .then((res) => res.json())
      .then((data) => {
        setCandidates(data.candidates)
        if (data.candidates.length > 0) {
          setSelectedCandidateId(data.candidates[0].id)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load candidates", err)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId)

  const handleStart = () => {
    if (!selectedCandidateId) return
    setStarting(true)
    router.push(`/lobby/${selectedCandidateId}`)
  }

  return (
    <KineticGrid globalColor="default" className="font-sans">
      {/* Content Overlay */}
      <div className="relative z-10 flex h-full flex-col min-h-screen">
        {/* Navbar */}
        <nav className="flex items-center justify-between p-5 sm:px-8 sm:py-6 lg:px-12">
          {/* Logo */}
          <div className="flex items-center gap-2 text-[#010101] lg:text-white transition-colors duration-500">
            <svg viewBox="0 0 256 256" className="h-6 w-6 fill-current">
              <path d="M 128 128 C 128 198.692 70.692 256 0 256 C 0 185.308 57.308 128 128 128 Z M 128 128 C 198.692 128 256 185.308 256 256 C 185.308 256 128 198.692 128 128 Z M 0 0 C 70.692 0 128 57.308 128 128 C 57.308 128 0 70.692 0 0 Z M 256 0 C 256 70.692 198.692 128 128 128 C 128 57.308 185.308 0 256 0 Z" />
            </svg>
            <span className="text-lg font-semibold tracking-tight">nexum</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-3">
             <div className="flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-1.5 backdrop-blur-xl border border-white/10">
               {navLinks.map(link => (
                  <button key={link} className="flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors">
                    {link}
                    {link === 'Solutions' && <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
               ))}
             </div>
             <button className="self-stretch rounded-full px-5 text-sm font-medium text-white transition-opacity hover:opacity-90" style={{ background: 'linear-gradient(to bottom, #2B2B2B, #101010)' }}>
               Get started
             </button>
          </div>

          {/* Mobile Nav Toggle */}
          <button 
            onClick={() => setMenuOpen(!menuOpen)} 
            className="md:hidden relative z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-xl border border-white/10 text-[#010101] lg:text-white transition-colors"
          >
            <Menu className={`absolute transition-all duration-300 ${menuOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
            <X className={`absolute transition-all duration-300 ${menuOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
          </button>
        </nav>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {menuOpen && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md"
                style={{ pointerEvents: menuOpen ? 'auto' : 'none' }}
                onClick={() => setMenuOpen(false)}
              />
              {/* Drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="fixed right-0 top-0 z-40 h-full w-72 bg-black/90 backdrop-blur-xl flex flex-col pt-24"
              >
                 {/* links */}
                 <div className="flex flex-col gap-2 px-6">
                   {navLinks.map((link, index) => (
                     <motion.button
                       key={link}
                       initial={{ opacity: 0, x: 24 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: 24 }}
                       transition={{ delay: (index + 1) * 0.06, duration: 0.3 }}
                       className="flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium text-white/80 hover:bg-white/10 hover:text-white text-left"
                     >
                       {link}
                       {link === 'Solutions' && <ChevronDown className="h-4 w-4" />}
                     </motion.button>
                   ))}
                 </div>

                 {/* bottom CTA */}
                 <motion.div 
                   initial={{ opacity: 0, y: 16 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 16 }}
                   transition={{ delay: 0.3, duration: 0.4 }}
                   className="mt-auto px-6 pb-10"
                 >
                   <button 
                     className="w-full rounded-full py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                     style={{ background: 'linear-gradient(to bottom, #2B2B2B, #101010)' }}
                   >
                     Get started
                   </button>
                 </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="mt-auto flex flex-col lg:flex-row lg:items-end lg:justify-between px-5 pb-8 sm:px-8 sm:pb-12 lg:px-12 lg:pb-16 gap-6 sm:gap-8">
           
           {/* Left side */}
           <div className="max-w-xl">
             <h1 className="text-3xl sm:text-4xl lg:text-[3.5rem] font-semibold leading-[1.1] tracking-tight text-[#010101] lg:text-white transition-colors duration-500">
               AI Interview Agent
             </h1>
             <p className="mt-4 text-[#010101]/70 lg:text-white/70 text-lg transition-colors duration-500">
               Adaptive technical interviewer that builds an evidence-based understanding of candidates.
             </p>
             
             {/* CTA (Dropdown + Button) */}
             <div className="mt-6 sm:mt-8 flex flex-col sm:inline-flex sm:flex-row sm:items-center sm:rounded-full sm:bg-black/50 sm:backdrop-blur-xl sm:border sm:border-white/10 sm:p-1.5 gap-3 sm:gap-0">
               {/* Custom Dropdown */}
               <div className="relative w-full sm:w-64">
                 <button 
                   onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                   className="w-full flex items-center justify-between rounded-full bg-black/50 backdrop-blur-xl border border-white/10 px-5 py-3 sm:px-4 sm:py-2.5 text-sm text-white outline-none cursor-pointer"
                 >
                   <span className="truncate">
                     {loading ? "Loading candidates..." : (selectedCandidate ? `${selectedCandidate.name} - ${selectedCandidate.jobRole}` : "Select a candidate")}
                   </span>
                   <ChevronDown className={`h-4 w-4 text-white/50 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                 </button>
                 
                 <AnimatePresence>
                   {isDropdownOpen && (
                     <>
                       {/* Invisible Backdrop to close on click outside */}
                       <div 
                         className="fixed inset-0 z-40" 
                         onClick={() => setIsDropdownOpen(false)} 
                       />
                       
                       <motion.div 
                         initial={{ opacity: 0, y: 10, scale: 0.95 }}
                         animate={{ opacity: 1, y: 0, scale: 1 }}
                         exit={{ opacity: 0, y: 10, scale: 0.95 }}
                         transition={{ duration: 0.2 }}
                         className="absolute left-0 right-0 bottom-full mb-2 origin-bottom z-50 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col p-1 max-h-60 overflow-y-auto"
                       >
                         {candidates.map(c => (
                           <button
                             key={c.id}
                             onClick={() => {
                               setSelectedCandidateId(c.id)
                               setIsDropdownOpen(false)
                             }}
                             className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors ${selectedCandidateId === c.id ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                           >
                             {c.name} - {c.jobRole}
                           </button>
                         ))}
                       </motion.div>
                     </>
                   )}
                 </AnimatePresence>
               </div>
               
               <button 
                 onClick={handleStart}
                 disabled={!selectedCandidateId || starting}
                 className="rounded-full px-6 py-3 sm:py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                 style={{ background: 'linear-gradient(to bottom, #2B2B2B, #101010)' }}
               >
                 {starting ? 'Starting...' : 'Begin Interview'}
               </button>
             </div>
           </div>

           {/* Right side glass cards */}
           <div className="flex flex-col sm:flex-row gap-4 lg:w-auto lg:gap-5">
              {/* Stat card */}
              <div className="flex flex-col justify-between sm:w-64 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 p-5 sm:p-6 text-[#010101] lg:text-white transition-colors duration-500">
                 {selectedCandidate ? (
                   <>
                     <div className="text-3xl sm:text-4xl font-normal tracking-tight" style={{ fontFamily: "var(--font-silkscreen), cursive" }}>
                       {selectedCandidate.passedCount}/{selectedCandidate.totalMissions}
                     </div>
                     <div className="text-sm leading-relaxed mt-3 sm:mt-4 opacity-70">
                       Missions passed on first try: {selectedCandidate.missionsFirstTry}
                     </div>
                   </>
                 ) : (
                   <>
                     <div className="text-3xl sm:text-4xl font-normal tracking-tight" style={{ fontFamily: "var(--font-silkscreen), cursive" }}>
                       --/--
                     </div>
                     <div className="text-sm leading-relaxed mt-3 sm:mt-4 opacity-70">
                       Select a candidate to view performance stats.
                     </div>
                   </>
                 )}
              </div>

              {/* Testimonial style card for candidate info */}
              <div className="sm:w-64 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 p-5 sm:p-6 text-[#010101] lg:text-white transition-colors duration-500">
                 {selectedCandidate ? (
                   <>
                     <div className="mb-3 sm:mb-4 flex items-center gap-2">
                       <div className="flex h-6 w-6 items-center justify-center rounded bg-black text-white">
                         <ShieldCheck className="h-4 w-4" />
                       </div>
                       <span className="text-sm font-semibold">{selectedCandidate.status}</span>
                     </div>
                     <div className="text-sm leading-relaxed opacity-80">
                       "{selectedCandidate.education}. Ready for technical evaluation."
                     </div>
                     <div className="mt-4 sm:mt-5 flex items-center gap-3">
                       <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                         <User className="h-5 w-5" />
                       </div>
                       <div className="flex flex-col">
                         <span className="text-sm font-semibold">{selectedCandidate.name}</span>
                         <span className="text-xs opacity-60">{selectedCandidate.jobRole} ({selectedCandidate.yearsExperience}y exp)</span>
                       </div>
                     </div>
                   </>
                 ) : (
                   <>
                     <div className="mb-3 sm:mb-4 flex items-center gap-2 opacity-50">
                       <div className="flex h-6 w-6 items-center justify-center rounded bg-black/20 lg:bg-white/20 text-current">
                       </div>
                       <span className="text-sm font-semibold">Status</span>
                     </div>
                     <div className="text-sm leading-relaxed opacity-50">
                       Waiting for candidate selection...
                     </div>
                     <div className="mt-4 sm:mt-5 flex items-center gap-3 opacity-50">
                       <div className="h-9 w-9 rounded-full bg-white/20" />
                       <div className="flex flex-col gap-1 w-full">
                         <div className="h-3 w-20 rounded bg-white/20" />
                         <div className="h-2 w-16 rounded bg-white/10" />
                       </div>
                     </div>
                   </>
                 )}
              </div>
           </div>
        </main>
      </div>
    </KineticGrid>
  )
}
