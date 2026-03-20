import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addMinutes, isWithinInterval } from 'date-fns'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  const specialistId = req.nextUrl.searchParams.get('specialistId')
  const dateStr = req.nextUrl.searchParams.get('date')
  const duration = parseInt(req.nextUrl.searchParams.get('duration') || '0')

  if (!slug || !specialistId || !dateStr || !duration) return Response.json([])

  const dayStart = new Date(dateStr)
  dayStart.setHours(9, 0, 0, 0)
  const dayEnd = new Date(dateStr)
  dayEnd.setHours(20, 0, 0, 0)

  const bookings = await prisma.booking.findMany({
    where: { specialistId, startTime: { gte: dayStart, lt: dayEnd } },
    include: { service: true }
  })

  const slots: { time: string; start: string }[] = []
  let current = new Date(dayStart)

  while (current < dayEnd) {
    const end = addMinutes(current, duration)
    const overlap = bookings.some(b => {
      const bStart = new Date(b.startTime)
      const bEnd = addMinutes(bStart, b.service.duration)
      return isWithinInterval(current, { start: bStart, end: bEnd }) ||
             isWithinInterval(end, { start: bStart, end: bEnd })
    })

    if (!overlap) {
      slots.push({
        time: current.toTimeString().slice(0, 5),
        start: current.toISOString()
      })
    }
    current = addMinutes(current, 15)
  }

  return Response.json(slots)
}
