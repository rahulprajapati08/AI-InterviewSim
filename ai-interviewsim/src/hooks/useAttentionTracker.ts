import * as faceapi from 'face-api.js'
import * as tf from '@tensorflow/tfjs'
import { useEffect, useState } from 'react'

export function useAttentionTracker(videoRef: React.RefObject<HTMLVideoElement>) {
  const [attention, setAttention] = useState<number>(1)

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    const loadModels = async () => {
      const MODEL_URL = '/models'

      // ✅ Initialize TensorFlow.js backend
      await tf.setBackend('webgl')  // or 'cpu' as fallback
      await tf.ready()

      // ✅ Load face-api.js models
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL)
      ])
    }

    const checkAttention = async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        const detections = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(true)

        if (!detections && attention !== 0) {
          setAttention(0)
        } else if (detections && attention !== 1) {
          setAttention(1)
        }
      }
    }

    loadModels().then(() => {
      intervalId = setInterval(checkAttention, 3000)
    })

    return () => clearInterval(intervalId)
  }, [videoRef, attention])

  return attention
}
