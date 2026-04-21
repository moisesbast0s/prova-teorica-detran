import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Car, LayoutDashboard, BookOpen, History, PlayCircle } from 'lucide-react'
import { SignOutButton } from '@/components/SignOutButton'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 glass-card border-b border-border/50 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <Car className="w-4 h-4 text-primary" />
            </div>
            <span className="font-black text-lg gradient-text">DETRAN</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>
              Dashboard
            </NavLink>
            <NavLink href="/simulado" icon={<PlayCircle className="w-4 h-4" />}>
              Simulado
            </NavLink>
            <NavLink href="/questoes" icon={<BookOpen className="w-4 h-4" />}>
              Questões
            </NavLink>
            <NavLink href="/historico" icon={<History className="w-4 h-4" />}>
              Histórico
            </NavLink>
          </nav>

          {/* User */}
          <div className="flex items-center gap-3">
            {session.user.image && (
              <img
                src={session.user.image}
                alt={session.user.name ?? 'User'}
                className="w-8 h-8 rounded-full border border-border/50"
              />
            )}
            <span className="hidden md:block text-sm text-muted-foreground">
              {session.user.name}
            </span>
            <SignOutButton />
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex items-center gap-1 mt-2 overflow-x-auto pb-1">
          <NavLink href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>
            Dashboard
          </NavLink>
          <NavLink href="/simulado" icon={<PlayCircle className="w-4 h-4" />}>
            Simulado
          </NavLink>
          <NavLink href="/questoes" icon={<BookOpen className="w-4 h-4" />}>
            Questões
          </NavLink>
          <NavLink href="/historico" icon={<History className="w-4 h-4" />}>
            Histórico
          </NavLink>
        </nav>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  )
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
    >
      {icon}
      {children}
    </Link>
  )
}
