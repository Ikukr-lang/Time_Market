import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { specialistId, serviceId, startTime, clientName, clientTgId, slug } = await req.json()

  const booking = await prisma.booking.create({
    data: {
      specialistId,
      serviceId,
      startTime: new Date(startTime),
      clientName,
      clientTgId: clientTgId ? BigInt(clientTgId) : undefined
    },
    include: { specialist: true, service: true }
  })

  // Уведомление владельцу
  const company = await prisma.company.findUnique({ where: { slug } })
  if (company) {
    await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: company.ownerTgId,
        text: `✅ НОВАЯ ЗАПИСЬ!\n\nСпециалист: ${booking.specialist.name} ${booking.specialist.surname || ''}\nУслуга: ${booking.service.name}\nКлиент: ${clientName}\nВремя: ${new Date(startTime).toLocaleString('ru-RU')}`
      })
    })
  }

  return Response.json(booking)
}
