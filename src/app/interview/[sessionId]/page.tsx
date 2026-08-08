"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Send, User, Bot, AlertCircle, CheckCircle, ShieldCheck } from "lucide-react"
import { use } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { VoiceRecorder } from "@/components/ui/voice-recorder"

interface Message {
  id: string
  role: "interviewer" | "candidate"
  content: string
}

export default function InterviewPage(props: { params: Promise<{ sessionId: string }> }) {
  const params = use(props.params)
  const router = useRouter()
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isDone, setIsDone] = useState(false)
  
  // Stats
  const [questionsCount, setQuestionsCount] = useState(0)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load initial message from session storage
    const initialDataStr = sessionStorage.getItem(`interview_${params.sessionId}_initial`)
    if (initialDataStr) {
      try {
        const initialData = JSON.parse(initialDataStr)
        setMessages([{
          id: Date.now().toString(),
          role: "interviewer",
          content: initialData.reply
        }])
        sessionStorage.removeItem(`interview_${params.sessionId}_initial`)
      } catch (e) {
        console.error(e)
      }
    }
  }, [params.sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    const text = input.trim()
    if (!text || isTyping || isDone) return
    
    setInput("")
    
    // Add user message
    const userMsg: Message = { id: Date.now().toString(), role: "candidate", content: text }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)
    
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: params.sessionId,
          message: text
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        console.error("API Error:", data)
        setIsTyping(false)
        return
      }
      
      setQuestionsCount(prev => prev + 1)
      
      // Add interviewer response
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: "interviewer", 
        content: data.reply 
      }
      
      setMessages(prev => [...prev, aiMsg])
      
      if (data.done) {
        setIsDone(true)
        // Store feedback for results page
        if (data.feedback) {
          sessionStorage.setItem(`interview_${params.sessionId}_feedback`, JSON.stringify(data.feedback))
        }
        
        // Wait a moment then go to results
        setTimeout(() => {
          router.push(`/results/${params.sessionId}`)
        }, 3000)
      }
    } catch (err) {
      console.error("Failed to send message", err)
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Calculate progress (target 8 questions)
  const progressPercent = Math.min(Math.max((questionsCount / 8) * 100, 0), 100)

  return (
    <main className="container mx-auto max-w-5xl h-screen flex flex-col p-4 md:p-6 overflow-hidden">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-card/50 p-4 rounded-2xl border border-border/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 text-primary rounded-xl">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI Technical Interview</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Secure Session: {params.sessionId}
            </p>
          </div>
        </div>
        
        <div className="w-full md:w-1/3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Interview Progress</span>
            <span className="font-medium text-primary">{questionsCount} / 8+ Qs</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col min-h-0 border-border/50 shadow-xl overflow-hidden glass-card">
        <CardContent className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
              <p>Connecting to AI Interviewer...</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === "candidate" ? "justify-end" : "justify-start"} mb-6`}
                >
                  <div className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${msg.role === "candidate" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.role === "interviewer" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                    }`}>
                      {msg.role === "interviewer" ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    
                    <div className={`p-4 rounded-2xl ${
                      msg.role === "candidate" 
                        ? "bg-primary text-primary-foreground rounded-tr-sm" 
                        : "bg-secondary/60 text-secondary-foreground border border-border/50 rounded-tl-sm backdrop-blur-sm"
                    }`}>
                      <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{msg.content}</p>
                      
                      {msg.role === "interviewer" && (
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/tts', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ text: msg.content })
                                })
                                if (!res.ok) throw new Error("TTS failed")
                                const blob = await res.blob()
                                const url = URL.createObjectURL(blob)
                                const audio = new Audio(url)
                                audio.play()
                              } catch (e) {
                                console.error("TTS play failed:", e)
                              }
                            }}
                            className="text-xs text-primary hover:underline flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
                            title="Play audio"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
                            Listen
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start mb-6"
                >
                  <div className="flex gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center animate-pulse">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="p-4 rounded-2xl bg-secondary/30 rounded-tl-sm flex items-center gap-1">
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} className="h-1" />
        </CardContent>
        
        {/* Input Area */}
        <div className="p-4 bg-background/50 backdrop-blur-md border-t border-border/50">
          <form onSubmit={handleSend} className="relative max-w-4xl mx-auto flex items-end gap-2">
            <div className="relative flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isDone ? "Interview completed..." : "Type your response here... (Press Enter to send)"}
                className="w-full min-h-[60px] max-h-[200px] resize-none rounded-xl border border-input bg-transparent px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isTyping || isDone}
                rows={1}
              />
            </div>
            
            <VoiceRecorder 
              onTranscript={(text) => {
                setInput(text)
                // Optionally auto-send: handleSend(undefined, text) if you alter handleSend signature
              }} 
              disabled={isTyping || isDone} 
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-[60px] w-[60px] shrink-0 rounded-xl transition-all"
              disabled={!input.trim() || isTyping || isDone}
            >
              {isDone ? <CheckCircle className="w-6 h-6" /> : <Send className="w-6 h-6 ml-1" />}
            </Button>
          </form>
        </div>
      </Card>
    </main>
  )
}
