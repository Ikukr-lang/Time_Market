import { Telegraf } from 'telegraf'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

const bot = new Telegraf(process.env.BOT_TOKEN!)

bot.start(async (ctx) => {
  const payload = ctx.payload || ''
  const userId = ctx.from.id

  if (payload.startsWith('company-')) {
    const slug = payload.slice(8)
    const company = await prisma.company.findUnique({ where: { slug } })
    if (!company) return ctx.reply('❌ Компания не найдена')

    const url = `${process.env.NEXT_PUBLIC_VERCEL_URL}/booking?slug=${slug}`
    return ctx.reply(`📅 Запись в ${company.name}`, {
      reply_markup: { inline_keyboard: [[{ text: 'Открыть запись', web_app: { url } }]] }
    })
  }

  // Владелец
  let company = await prisma.company.findFirst({ where: { ownerTgId: BigInt(userId) } })
  if (!company) {
    const createUrl = `${process.env.NEXT_PUBLIC_VERCEL_URL}/create`
    return ctx.reply('👋 Создайте свою компанию!', {
      reply_markup: { inline_keyboard: [[{ text: 'Создать компанию', web_app: { url: createUrl } }]] }
    })
  }

  const adminUrl = `${process.env.NEXT_PUBLIC_VERCEL_URL}/admin?slug=${company.slug}`
  ctx.reply('🔧 Ваша админ-панель:', {
    reply_markup: { inline_keyboard: [[{ text: 'Открыть админку', web_app: { url: adminUrl } }]] }
  })
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  await bot.handleUpdate(body)
  return Response.json({ ok: true })
}
