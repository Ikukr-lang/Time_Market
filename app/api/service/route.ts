import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { specialistId, name, price, duration } = await req.json()
  const service = await prisma.service.create({
    data: { specialistId, name, price, duration }
  })
  return Response.json(service)
}
