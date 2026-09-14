/**
 * Router + global mounting. The editor lives at /edit/:id, the marketing surfaces are
 * responsive, and the library is desktop-first — matching the brief's "desktop editor,
 * responsive marketing" split.
 */
import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { DashboardPage } from './pages/DashboardPage'
import { TemplatesPage } from './pages/TemplatesPage'
import { BrandPage } from './pages/BrandPage'
import { ElementsPage } from './pages/ElementsPage'
import { EditorPage } from './pages/EditorPage'
import { PreviewPage } from './pages/PreviewPage'
import { DialogHost } from './components/Dialogs'
import { ToastHost } from './components/ToastHost'
import { useDeckOpener } from './services/openDeck'
import { useUI } from './store/useUI'
import { useLibrary } from './store/useLibrary'

export function App() {
  useDeckOpener()
  const hydrate = useUI((s) => s.hydrate)
  const init = useLibrary((s) => s.init)

  useEffect(() => {
    void hydrate()
    void init()
  }, [hydrate, init])

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/app" element={<DashboardPage />}>
          <Route path="decks" element={null} />
          <Route path="brand" element={null} />
          <Route path="elements" element={null} />
          <Route path="trash" element={null} />
        </Route>
        <Route path="/brand" element={<BrandPage />} />
        <Route path="/elements" element={<ElementsPage />} />
        <Route path="/edit/:id" element={<EditorPage />} />
        <Route path="/preview/:id" element={<PreviewPage />} />
        <Route path="*" element={<ScrollTop><Navigate to="/" replace /></ScrollTop>} />
      </Routes>
      <ToastHost />
      <DialogHost />
    </>
  )
}

function ScrollTop({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])
  return <>{children}</>
}
