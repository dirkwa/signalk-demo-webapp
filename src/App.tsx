import { ServerProvider } from './context/ServerContext.tsx'
import { UnitPrefsProvider } from './context/UnitPrefsContext.tsx'
import { ServerCard } from './cards/ServerCard.tsx'
import { AuthCard } from './cards/AuthCard.tsx'
import { LiveDataCard } from './cards/LiveDataCard.tsx'
import { UnitPrefsCard } from './cards/UnitPrefsCard.tsx'
import { AppDataCard } from './cards/AppDataCard.tsx'
import { AlarmsCard } from './cards/AlarmsCard.tsx'
import { ResourcesCard } from './cards/ResourcesCard.tsx'

export function App() {
  return (
    <ServerProvider>
      <UnitPrefsProvider>
        <div className="min-h-screen bg-gray-50 p-4">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">SignalK Demo Webapp</h1>
            <p className="text-sm text-gray-500">API reference &amp; developer tool</p>
          </header>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2 lg:col-span-3">
              <ServerCard />
            </div>
            <AuthCard />
            <UnitPrefsCard />
            <AppDataCard />
            <div className="md:col-span-2 lg:col-span-3">
              <LiveDataCard />
            </div>
            <AlarmsCard />
            <ResourcesCard />
          </div>
        </div>
      </UnitPrefsProvider>
    </ServerProvider>
  )
}
