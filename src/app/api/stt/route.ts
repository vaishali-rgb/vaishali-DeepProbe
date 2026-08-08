import { NextRequest, NextResponse } from "next/server"
import { speechToText } from "@/lib/sarvam/client"

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('audio') as Blob
    
    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    const transcript = await speechToText(file)
    return NextResponse.json({ transcript })
  } catch (error: any) {
    console.error("STT Route Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process audio" },
      { status: 500 }
    )
  }
}
