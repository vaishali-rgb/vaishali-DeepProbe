// Sarvam AI Client for STT and TTS
// Designed to degrade gracefully if API key is missing

const SARVAM_API_KEY = process.env.SARVAM_API_KEY

export async function speechToText(audioBlob: Blob): Promise<string> {
  if (!SARVAM_API_KEY) {
    console.warn("No SARVAM_API_KEY found. STT disabled.")
    throw new Error("Voice services are currently unavailable.")
  }

  const formData = new FormData()
  formData.append('file', audioBlob, 'audio.wav')
  // Depending on exact Sarvam API spec, default to English/Hindi mix
  formData.append('model', 'saaras:v3') 

  const res = await fetch('https://api.sarvam.ai/speech-to-text-translate', {
    method: 'POST',
    headers: {
      'api-subscription-key': SARVAM_API_KEY,
    },
    body: formData,
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Sarvam STT failed: ${errorText}`)
  }

  const data = await res.json()
  return data.transcript || ""
}

export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  if (!SARVAM_API_KEY) {
    console.warn("No SARVAM_API_KEY found. TTS disabled.")
    throw new Error("Voice services are currently unavailable.")
  }

  const res = await fetch('https://api.sarvam.ai/text-to-speech', {
    method: 'POST',
    headers: {
      'api-subscription-key': SARVAM_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: [text],
      target_language_code: "hi-IN", // Can also be en-IN based on hackathon requirement
      speaker: "meera",
      pitch: 0,
      pace: 1.05,
      loudness: 1.5,
      speech_sample_rate: 22050,
      enable_preprocessing: true,
      model: "bulbul:v1"
    })
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Sarvam TTS failed: ${errorText}`)
  }

  const data = await res.json()
  if (!data.audios || data.audios.length === 0) {
    throw new Error("No audio data returned from Sarvam")
  }
  
  // Sarvam returns base64 string in audios array
  const base64Audio = data.audios[0]
  const binaryString = atob(base64Audio)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}
