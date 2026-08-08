"use client"

import { useState, useRef } from "react"
import { Mic, Square, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VoiceRecorderProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

export function VoiceRecorder({ onTranscript, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        setIsProcessing(true)
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        
        // Cleanup stream tracks
        stream.getTracks().forEach(track => track.stop())

        const formData = new FormData()
        formData.append('audio', audioBlob)

        try {
          const res = await fetch('/api/stt', {
            method: 'POST',
            body: formData,
          })
          
          if (!res.ok) {
            throw new Error('STT failed')
          }
          
          const data = await res.json()
          if (data.transcript) {
            onTranscript(data.transcript)
          }
        } catch (error) {
          console.error("Error processing voice:", error)
          // Graceful degradation: do nothing if STT fails, user can just type
        } finally {
          setIsProcessing(false)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error("Microphone access denied or error:", err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  if (isProcessing) {
    return (
      <Button 
        type="button" 
        variant="secondary" 
        size="icon" 
        className="h-[60px] w-[60px] shrink-0 rounded-xl"
        disabled
      >
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </Button>
    )
  }

  return (
    <Button 
      type="button" 
      variant={isRecording ? "destructive" : "secondary"} 
      size="icon" 
      className={`h-[60px] w-[60px] shrink-0 rounded-xl transition-all ${isRecording ? "animate-pulse" : ""}`}
      onClick={isRecording ? stopRecording : startRecording}
      disabled={disabled}
    >
      {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-6 h-6" />}
    </Button>
  )
}
