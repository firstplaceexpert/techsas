import { getCurrentUser } from '@/lib/auth/permissions'
import DashboardShell from '@/components/layout/DashboardShell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile } = await getCurrentUser()

  return (
    <DashboardShell profile={profile}>
      {children}
    </DashboardShell>
  )
}

