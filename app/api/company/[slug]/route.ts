import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const company = await prisma.company.findUnique({
    where: { slug: params.slug },
    include: {
      specialists: {
        include: {
          services: true,
          bookings: { include: { service: true } }
        }
      }
    }
  })
  return Response.json(company)
}
