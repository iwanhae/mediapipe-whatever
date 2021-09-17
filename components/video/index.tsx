import React, { useEffect, useRef, useState } from 'react'
import CamUtils from '@mediapipe/camera_utils'
import Pose, { POSE_LANDMARKS, POSE_LANDMARKS_LEFT, POSE_LANDMARKS_NEUTRAL, POSE_LANDMARKS_RIGHT } from '@mediapipe/pose'


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
    ctx.font = "30px Arial";
    pose.onResults((results: Pose.Results): void => {
      const cur = results.poseWorldLandmarks
      const i = POSE_LANDMARKS_RIGHT.RIGHT_THUMB
      const j = POSE_LANDMARKS_LEFT.LEFT_THUMB
      const k = POSE_LANDMARKS.NOSE
      try {
        let tmp = 0
        tmp += (cur[i].x - cur[j].x) ** 2
        tmp += (cur[i].y - cur[j].y) ** 2
        tmp += (cur[i].z - cur[j].z) ** 2
        tmp **= 0.5
        ctx.clearRect(0,0,1000,1000)
        ctx.fillText(`Thumb Distance: ${tmp.toFixed(4)}`, 10, 50)
        ctx.fillText(`x: ${cur[k].x.toFixed(4)} y: ${cur[k].y.toFixed(4)} z: ${cur[k].z.toFixed(4)}`, 10, 100)
        ctx.fillText(`vis: ${cur[k].visibility?.toFixed(4)}`, 10, 130)

        cur.map((e, i) => {
          let x = (e.x + 1) * 320
          let y = (e.y + 1) * 480
          const v = e.visibility ? e.visibility : 0
          const c = `${255 - ((v + 1) / 2 * 255)}`

          const p  = prev.get(i)
          if (p != undefined) {
            ctx.fillStyle = `rgb(255,0,0)`
            ctx.fillRect(x, y, 10, 10)
            const alpha = 0.7
            const beta = 1 - alpha
            x = (x * alpha) + (p.x * beta)
            y = (y * alpha) + (p.y * beta)
          }
          ctx.fillStyle = `rgb(${c},${c},${c})`
          ctx.fillRect(x, y, 10, 10)
          prev.set(i, {x, y})
        })
      } catch {
        ctx.clearRect(0,0,1000,1000)
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
        <video ref={videoRef}></video>
      </div>      
    </div>
  )
}

export default Camera