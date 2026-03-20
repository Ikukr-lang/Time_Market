'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function Booking() {
  const searchParams = useSearchParams()
  const slug = searchParams.get('slug')
  const [company, setCompany] = useState<any>(null)
  const [step, setStep] = useState(1)
  const [selectedSpecialist, setSelectedSpecialist] = useState<any>(null)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [selectedTime, setSelectedTime] = useState('')
  const [clientName, setClientName] = useState('')

  useEffect(() => {
    window.Telegram?.WebApp.ready()
    if (slug) loadCompany()
  }, [slug])

  const loadCompany = async () => {
    const res = await fetch(`/api/company/${slug}`)
    setCompany(await res.json())
  }

  const loadSlots = async () => {
    if (!selectedSpecialist || !selectedDate || !selectedService) return
    const res = await fetch(`/api/available?slug=${slug}&specialistId=${selectedSpecialist.id}&date=${selectedDate}&duration=${selectedService.duration}`)
    setAvailableSlots(await res.json())
    setStep(4)
  }

  const book = async () => {
    const user = window.Telegram.WebApp.initDataUnsafe.user
    await fetch('/api/book', {
      method: 'POST',
      body: JSON.stringify({
        specialistId: selectedSpecialist.id,
        serviceId: selectedService.id,
        startTime: selectedTime,
        clientName: clientName || user?.first_name,
        clientTgId: user?.id,
        slug
      })
    })
    window.Telegram.WebApp.showAlert('✅ Запись подтверждена!')
    window.Telegram.WebApp.close()
  }

  if (!company) return <div className="p-6 text-center">Загрузка...</div>

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">{company.name}</h1>

      {step === 1 && (
        <div>
          <h2 className="text-xl mb-4">Выберите специалиста</h2>
          <div className="grid grid-cols-2 gap-4">
            {company.specialists.map((s: any) => (
              <div key={s.id} onClick={() => { setSelectedSpecialist(s); setStep(2) }} className="cursor-pointer border p-4 rounded-2xl text-center hover:bg-gray-50">
                {s.photoUrl && <img src={s.photoUrl} className="round-photo mx-auto mb-3" />}
                <p className="font-medium">{s.name}</p>
                {s.surname && <p className="text-sm text-gray-500">{s.surname}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 2 && selectedSpecialist && (
        <div>
          <h2 className="text-xl mb-4">Услуги {selectedSpecialist.name}</h2>
          {selectedSpecialist.services.map((srv: any) => (
            <div key={srv.id} onClick={() => { setSelectedService(srv); setStep(3) }} className="border p-5 rounded-2xl mb-3 cursor-pointer hover:bg-gray-50">
              <p className="font-medium">{srv.name}</p>
              <p className="text-lg font-semibold">{srv.price} ₽ • {srv.duration} мин</p>
            </div>
          ))}
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="text-xl mb-4">Выберите дату</h2>
          <input type="date" min={new Date().toISOString().slice(0,10)} onChange={e => { setSelectedDate(e.target.value); loadSlots() }} className="w-full p-4 border rounded-xl" />
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 className="text-xl mb-4">Свободное время</h2>
          <div className="grid grid-cols-3 gap-3">
            {availableSlots.map((slot, i) => (
              <button key={i} onClick={() => { setSelectedTime(slot.start); setStep(5) }} className="p-4 border rounded-xl hover:bg-blue-50">
                {slot.time}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 5 && (
        <div>
          <h2 className="text-xl mb-6">Подтверждение</h2>
          <input type="text" placeholder="Ваше имя" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full p-4 border rounded-xl mb-6" />
          <button onClick={book} className="w-full bg-green-600 text-white py-5 rounded-2xl text-xl font-medium">
            Записаться
          </button>
        </div>
      )}
    </div>
  )
}
