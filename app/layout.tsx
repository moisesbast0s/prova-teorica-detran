import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DETRAN Quiz — Banco de Questões para Prova Teórica',
  description:
    'Prepare-se para a prova teórica do DETRAN com simulados completos, banco de questões e estatísticas de desempenho.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
