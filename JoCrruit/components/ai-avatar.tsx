"use client"

import { useState, useEffect } from "react"
import { Bot } from "lucide-react"

interface AiAvatarProps {
  isSpeaking: boolean
  className?: string
}

export function AiAvatar({ isSpeaking, className = "" }: AiAvatarProps) {
  const [pulseIntensity, setPulseIntensity] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isSpeaking) {
      interval = setInterval(() => {
        setPulseIntensity(Math.random())
      }, 150)
    } else {
      setPulseIntensity(0)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isSpeaking])

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        {/* Outer pulse rings */}
        {isSpeaking && (
          <>
            <div
              className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"
              style={{
                transform: `scale(${1 + pulseIntensity * 0.3})`,
                animationDuration: "1s",
              }}
            />
            <div
              className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping"
              style={{
                transform: `scale(${1 + pulseIntensity * 0.5})`,
                animationDuration: "1.5s",
              }}
            />
          </>
        )}

        {/* Main avatar */}
        <div
          className={`relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl transition-all duration-200 ${
            isSpeaking ? "scale-110" : "scale-100"
          }`}
          style={{
            boxShadow: isSpeaking
              ? `0 0 ${20 + pulseIntensity * 30}px rgba(59, 130, 246, 0.5)`
              : "0 10px 25px rgba(0, 0, 0, 0.2)",
          }}
        >
          <Bot
            className={`w-16 h-16 text-white transition-all duration-200 ${isSpeaking ? "scale-110" : "scale-100"}`}
          />

          {/* Speaking indicator dots */}
          {isSpeaking && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-white rounded-full animate-bounce"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: "0.8s",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Interviewer</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{isSpeaking ? "Speaking..." : "Listening..."}</p>
      </div>
    </div>
  )
}
