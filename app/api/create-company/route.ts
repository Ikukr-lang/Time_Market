import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { name, ownerTgId } = await req.json()
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const existing = await prisma.company.findUnique({ where: { slug } })
  if (existing) return Response.json({ error: 'Slug занят' }, { status: 400 })

  const company = await prisma.company.create({
    data: { name, slug, ownerTgId: BigInt(ownerTgId) }
  })

  return Response.json(company)
}
