'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function Admin() {
  const searchParams = useSearchParams()
  const slug = searchParams.get('slug')
  const [company, setCompany] = useState<any>(null)
  const [newSpecialist, setNewSpecialist] = useState({ name: '', surname: '' })
  const [photoUrl, setPhotoUrl] = useState('')
  const [newService, setNewService] = useState({ specialistId: '', name: '', price: '', duration: '' })

  useEffect(() => {
    window.Telegram?.WebApp.ready()
    if (slug) loadData()
  }, [slug])

  const loadData = async () => {
    const res = await fetch(`/api/company/${slug}`)
    setCompany(await res.json())
  }

  const uploadPhoto = async (e: any) => {
    const file = e.target.files[0]
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const { url } = await res.json()
    setPhotoUrl(url)
  }

  const addSpecialist = async () => {
    await fetch('/api/specialist', {
      method: 'POST',
      body: JSON.stringify({ companyId: company.id, ...newSpecialist, photoUrl })
    })
    loadData()
  }

  const addService = async () => {
    await fetch('/api/service', {
      method: 'POST',
      body: JSON.stringify(newService)
    })
    loadData()
  }

  if (!company) return <div className="p-6">Загрузка...</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{company.name}</h1>
      <p className="text-sm text-gray-500 mb-6">Ссылка для клиентов: t.me/{process.env.NEXT_PUBLIC_BOT_USERNAME}?start=company-{slug}</p>

      {/* Специалисты */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Специалисты</h2>
        {company.specialists.map((s: any) => (
          <div key={s.id} className="flex gap-4 items-center mb-4 border p-4 rounded-xl">
            {s.photoUrl && <img src={s.photoUrl} className="round-photo" />}
            <div>
              <p className="font-medium">{s.name} {s.surname}</p>
              <p className="text-sm text-gray-500">{s.services.length} услуг</p>
            </div>
          </div>
        ))}

        {/* Форма добавления */}
        <div className="border p-4 rounded-xl">
          <input type="text" placeholder="Имя" onChange={e => setNewSpecialist({...newSpecialist, name: e.target.value})} className="w-full p-3 border rounded mb-2" />
          <input type="text" placeholder="Фамилия" onChange={e => setNewSpecialist({...newSpecialist, surname: e.target.value})} className="w-full p-3 border rounded mb-2" />
          <input type="file" onChange={uploadPhoto} className="mb-3" />
          <button onClick={addSpecialist} className="bg-green-600 text-white px-6 py-2 rounded-xl">Добавить специалиста</button>
        </div>
      </div>

      {/* Услуги */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Добавить услугу</h2>
        <select onChange={e => setNewService({...newService, specialistId: e.target.value})} className="w-full p-3 border rounded mb-3">
          <option value="">Выберите специалиста</option>
          {company.specialists.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="text" placeholder="Название услуги" onChange={e => setNewService({...newService, name: e.target.value})} className="w-full p-3 border rounded mb-3" />
        <input type="number" placeholder="Цена" onChange={e => setNewService({...newService, price: e.target.value})} className="w-full p-3 border rounded mb-3" />
        <input type="number" placeholder="Длительность (мин)" onChange={e => setNewService({...newService, duration: e.target.value})} className="w-full p-3 border rounded mb-3" />
        <button onClick={addService} className="bg-blue-600 text-white px-6 py-2 rounded-xl">Добавить услугу</button>
      </div>

      {/* Записи */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Записи</h2>
        {company.specialists.flatMap((s: any) => s.bookings).map((b: any) => (
          <div key={b.id} className="p-4 border rounded-xl mb-3">
            {b.clientName} — {b.service.name} ({new Date(b.startTime).toLocaleString('ru-RU')})
          </div>
        ))}
      </div>
    </div>
  )
}
