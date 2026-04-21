import type { Metadata } from 'next'
import { Car } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Login — DETRAN Quiz',
  description: 'Acesse o DETRAN Quiz para iniciar seus simulados',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Car className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-black gradient-text">DETRAN Quiz</h1>
        <p className="text-muted-foreground text-sm">Banco de Questões para Prova Teórica</p>
      </div>
      {children}
    </div>
  )
}
