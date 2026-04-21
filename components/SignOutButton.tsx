'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function SignOutButton() {
  return (
    <Button
      id="btn-signout"
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-foreground"
      onClick={() => signOut({ callbackUrl: '/login' })}
      title="Sair"
    >
      <LogOut className="w-4 h-4" />
    </Button>
  )
}
