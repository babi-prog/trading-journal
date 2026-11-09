import { useEffect } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import { Toaster } from 'sonner'
import { BootScreen } from '@/components/layout/BootScreen'
import { AppShell } from '@/components/layout/AppShell'
import { TooltipProvider } from '@/components/ui/Tooltip'
import { DashboardPage } from '@/pages/DashboardPage'
import { TradesPage } from '@/pages/TradesPage'
import { CalendarPage } from '@/pages/CalendarPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { PlaybookPage } from '@/pages/PlaybookPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { useJournalStore } from '@/store/useJournalStore'

function App() {
  const hydrate = useJournalStore((state) => state.hydrate)
  const hydrated = useJournalStore((state) => state.hydrated)
  const settings = useJournalStore((state) => state.settings)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    document.documentElement.dataset.accent = settings.accent
  }, [settings.accent])

  if (!hydrated) {
    return <BootScreen />
  }

  return (
    <TooltipProvider delayDuration={250}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="trades" element={<TradesPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="playbook" element={<PlaybookPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0e131d',
            border: '1px solid #283446',
            color: '#edf0f6',
            fontSize: '12px',
          },
        }}
      />
    </TooltipProvider>
  )
}

export default App
