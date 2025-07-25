"use client"

import { useEffect, useState } from "react"

interface TrailPoint {
  x: number
  y: number
  id: number
}

export function MouseTrail() {
  const [trail, setTrail] = useState<TrailPoint[]>([])

  useEffect(() => {
    let animationId: number
    let trailId = 0

    const handleMouseMove = (e: MouseEvent) => {
      const newPoint: TrailPoint = {
        x: e.clientX,
        y: e.clientY,
        id: trailId++,
      }

      setTrail((prev) => [...prev.slice(-20), newPoint])
    }

    const animate = () => {
      setTrail((prev) =>
        prev.map((point) => ({
          ...point,
          x: point.x + (Math.random() - 0.5) * 0.5,
          y: point.y + (Math.random() - 0.5) * 0.5,
        })),
      )
      animationId = requestAnimationFrame(animate)
    }

    window.addEventListener("mousemove", handleMouseMove)
    animate()

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {trail.map((point, index) => (
        <div
          key={point.id}
          className="absolute w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-70 animate-pulse"
          style={{
            left: point.x - 4,
            top: point.y - 4,
            opacity: (index / trail.length) * 0.7,
            transform: `scale(${(index / trail.length) * 0.8 + 0.2})`,
            transition: "all 0.1s ease-out",
          }}
        />
      ))}
    </div>
  )
}
