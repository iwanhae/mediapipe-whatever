import React, { useEffect, useRef, useState } from 'react'
import CamUtils from '@mediapipe/camera_utils'
import Pose, { POSE_LANDMARKS, POSE_LANDMARKS_LEFT, POSE_LANDMARKS_NEUTRAL, POSE_LANDMARKS_RIGHT } from '@mediapipe/pose'
import { Video } from '..'

const GetDistance = (p1: {
  x: number;
  y: number;
  z: number;
}, p2: {
  x: number;
  y: number;
  z: number;
}) => {
  return ((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2) ** 0.5
}

const ImageMap = (p: {
  x: number;
  y: number;
}) => {
  return { x: p.x * 640, y: p.y * 480 }
}

const featureList = [
  { a: 15, b: 16 },
  { a: 15, b: 11 },
  { a: 12, b: 14 },
  { a: 14, b: 16 },
  { a: 12, b: 28 },
  { a: 15, b: 23 },
  { a: 23, b: 24 },
  { a: 15, b: 27 },
  { a: 23, b: 27 },
  { a: 24, b: 26 },
  { a: 26, b: 28 },
  { a: 27, b: 28 },
]

const lineList = [
  { a: 0, b: 1 },
  { a: 0, b: 4 },
  { a: 1, b: 2 },
  { a: 2, b: 3 },
  { a: 3, b: 7 },
  { a: 4, b: 5 },
  { a: 5, b: 6 },
  { a: 6, b: 8 },
  { a: 9, b: 10 },
  { a: 11, b: 12 },
  { a: 11, b: 13 },
  { a: 11, b: 23 },
  { a: 12, b: 14 },
  { a: 12, b: 24 },
  { a: 13, b: 15 },
  { a: 14, b: 16 },
  { a: 15, b: 17 },
  { a: 15, b: 19 },
  { a: 15, b: 21 },
  { a: 16, b: 18 },
  { a: 16, b: 20 },
  { a: 16, b: 22 },
  { a: 23, b: 24 },
  { a: 23, b: 25 },
  { a: 24, b: 26 },
  { a: 25, b: 27 },
  { a: 26, b: 28 },
  { a: 27, b: 29 },
  { a: 27, b: 31 },
  { a: 28, b: 30 },
  { a: 28, b: 32 },
  { a: 29, b: 31 },
  { a: 30, b: 32 },
]

const Camera = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [diff, setDiff] = useState<number>(0)
  const pose = new Pose.Pose({
    locateFile: (file: string) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${Pose.VERSION}/${file}`;
    }
  })
  pose.setOptions({
    selfieMode: false,
    modelComplexity: 0,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  })


  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
    const prev = new Map()
    ctx.font = "15px Arial";
    pose.onResults((results: Pose.Results): void => {
      const cur = results.poseLandmarks
      const i = POSE_LANDMARKS_RIGHT.RIGHT_THUMB
      const j = POSE_LANDMARKS_LEFT.LEFT_THUMB
      const k = POSE_LANDMARKS.NOSE
      try {
        ctx.clearRect(0, 0, 1000, 1000)
        const w = 320
        let y = 0
        featureList.forEach((e) => {
          ctx.fillRect(0, y, GetDistance(cur[e.a], cur[e.b]) * w, 10)
          y += 10
        })
        ctx.strokeStyle = `rgb(255,0,0)`
        ctx.fillStyle = `rgb(255,0,0)`
        featureList.forEach((e, i) => {
          const p1 = ImageMap(cur[e.a])
          const p2 = ImageMap(cur[e.b])
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.closePath();
          ctx.stroke();
          ctx.fillText(`${i}`, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2)
        })

        ctx.strokeStyle = `rgb(128,128,128)`
        lineList.forEach((e) => {
          const p1 = ImageMap(cur[e.a])
          const p2 = ImageMap(cur[e.b])
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.closePath();
          ctx.stroke();
        })


        cur.map((e, i) => {
          const ptr = ImageMap(e)
          const v = e.visibility ? e.visibility : 0
          const c = `${255 - ((v + 1) / 2 * 255)}`

          const p = prev.get(i)
          if (p != undefined) {
            ctx.fillStyle = `rgb(255,0,0)`
            ctx.fillRect(ptr.x, ptr.y, 10, 10)
            const alpha = 0.7
            const beta = 1 - alpha
            ptr.x = (ptr.x * alpha) + (p.x * beta)
            ptr.y = (ptr.y * alpha) + (p.y * beta)
          }
          ctx.fillStyle = `rgb(${c},${c},${c})`
          ctx.fillText(`${i}`, ptr.x, ptr.y)
          ctx.fillRect(ptr.x, ptr.y, 10, 10)
          prev.set(i, ptr)
        })
      } catch {
        ctx.clearRect(0, 0, 1000, 1000)
        ctx.drawImage(videoRef.current as HTMLVideoElement, 0, 0)
        ctx.fillText(`ERROR`, 10, 50)
      }

    })
  })

  useEffect(() => {
    console.log(videoRef)
    const init = async () => {
      try {
        const video = videoRef.current as HTMLVideoElement
        const cam = new CamUtils.Camera(video, {
          onFrame: async () => {
            await pose.send({
              image: video
            })
          }
        })
        await cam.start()
      } catch (err) {
        console.error(err)
      }
    }
    init()
  })

  return (
    <div>
      <canvas width="640px" height="480px" ref={canvasRef}></canvas>
      <div>
        <video style={{ display: "none" }} ref={videoRef}></video>
      </div>
    </div>
  )
}

export default Camera