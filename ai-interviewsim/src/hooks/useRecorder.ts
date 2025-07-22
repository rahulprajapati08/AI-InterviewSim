import { useState, useRef } from 'react'

export const useRecorder = () => {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mediaRecorder = new MediaRecorder(stream)
    mediaRecorderRef.current = mediaRecorder

    audioChunksRef.current = []

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunksRef.current.push(e.data)
      }
    }

    mediaRecorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop())
    }

    mediaRecorder.start()
    setIsRecording(true)
  }

  const stopRecording = (): Promise<Blob> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.onstop = () => {
          setIsRecording(false)
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          resolve(audioBlob)
        }
        mediaRecorderRef.current.stop()
      }
    })
  }

  return { isRecording, startRecording, stopRecording }
}
