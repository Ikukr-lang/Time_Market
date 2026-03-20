'use client'
import { useState, useEffect } from 'react'

export default function Create() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    window.Telegram?.WebApp.ready()
  }, [])

  const create = async () => {
    setLoading(true)
    const user = window.Telegram.WebApp.initDataUnsafe.user
    const res = await fetch('/api/create-company', {
      method: 'POST',
      body: JSON.stringify({ name, ownerTgId: user.id })
    })
    const data = await res.json()
    if (data.id) {
      window.Telegram.WebApp.showAlert('Компания создана! Откройте /start в боте')
      window.Telegram.WebApp.close()
    }
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Создать компанию</h1>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Название салона/компании"
        className="w-full p-4 border rounded-xl mb-4"
      />
      <button
        onClick={create}
        disabled={loading || !name}
        className="w-full bg-blue-600 text-white py-4 rounded-xl font-medium"
      >
        {loading ? 'Создаём...' : 'Создать компанию'}
      </button>
    </div>
  )
}
