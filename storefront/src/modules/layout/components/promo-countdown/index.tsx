"use client"

import { useEffect, useMemo, useState } from "react"

const getTimeParts = (target: number) => {
  const now = Date.now()
  const diff = Math.max(target - now, 0)

  const totalSeconds = Math.floor(diff / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  }
}

const PromoCountdown = () => {
  const targetTime = useMemo(() => {
    const target = new Date()
    target.setHours(23, 59, 59, 999)
    return target.getTime()
  }, [])

  const [timeParts, setTimeParts] = useState(() => getTimeParts(targetTime))

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeParts(getTimeParts(targetTime))
    }, 1000)

    return () => clearInterval(interval)
  }, [targetTime])

  return (
    <div className="flex items-center gap-1 text-xs font-semibold uppercase text-white">
      <span className="hidden md:inline">Ends in</span>
      <div className="flex items-center gap-1">
        <span className="rounded-full bg-white px-2 py-1 text-primary shadow-sm">
          {timeParts.hours}h
        </span>
        <span className="rounded-full bg-white px-2 py-1 text-primary shadow-sm">
          {timeParts.minutes}m
        </span>
        <span className="rounded-full bg-white px-2 py-1 text-primary shadow-sm">
          {timeParts.seconds}s
        </span>
      </div>
    </div>
  )
}

export default PromoCountdown
