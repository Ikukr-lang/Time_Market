import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { companyId, name, surname, photoUrl } = await req.json()
  const specialist = await prisma.specialist.create({
    data: { companyId, name, surname, photoUrl }
  })
  return Response.json(specialist)
}
