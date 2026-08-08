import { NextRequest, NextResponse } from "next/server"
import { textToSpeech } from "@/lib/sarvam/client"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 })
    }

    const audioBuffer = await textToSpeech(body.text)
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error: any) {
    console.error("TTS Route Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate speech" },
      { status: 500 }
    )
  }
}
