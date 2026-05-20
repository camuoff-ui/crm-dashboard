import { Sidebar } from '@/components/layout/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-56 flex-1 min-h-screen bg-gray-50 p-8 min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
