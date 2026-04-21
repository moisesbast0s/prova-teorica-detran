'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

const GUEST_ID_STORAGE_KEY = 'detran-quiz:guest-id'

function createGuestId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getGuestId() {
  const storedGuestId = localStorage.getItem(GUEST_ID_STORAGE_KEY)
  if (storedGuestId) return storedGuestId

  const guestId = createGuestId()
  localStorage.setItem(GUEST_ID_STORAGE_KEY, guestId)
  return guestId
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    await signIn('credentials', { name, guestId: getGuestId(), callbackUrl: '/dashboard' })
  }

  return (
    <div className="glass-card rounded-2xl p-8 w-full max-w-sm">
      <h2 className="text-xl font-bold text-center mb-2">Bem-vindo!</h2>
      <p className="text-muted-foreground text-sm text-center mb-8">
        Digite seu nome para começar a estudar
      </p>

      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <Input
            id="input-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Qual o seu nome?"
            className="h-12 bg-background/50 text-base px-4"
            disabled={loading}
            required
            autoComplete="off"
          />
        </div>

        <Button
          id="btn-login"
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full h-12 text-base font-semibold gap-2"
          size="lg"
        >
          {loading ? 'Entrando...' : 'Entrar'}
          {!loading && <ArrowRight className="w-5 h-5" />}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground text-center mt-6">
        Seu progresso será salvo automaticamente.
      </p>
    </div>
  )
}
