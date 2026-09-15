/**
 * Landing — the SlideFlow marketing page.
 * Aurora / northern-lights aesthetic over deep midnight navy: layered light
 * ribbons, glass panels, glowing CTAs, a floating tilted editor mockup, and a
 * cinematic landscape finale. Composed from focused components in `src/landing/`.
 *
 * CTA wiring: "ابدأ الآن" / "Get Started" create a project and enter the studio;
 * template surfaces route to the templates gallery.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuroraBackground } from '../landing/AuroraBackground'
import { Header } from '../landing/Header'
import { Hero } from '../landing/Hero'
import { FeatureStrip } from '../landing/FeatureStrip'
import { TemplateShowcase } from '../landing/TemplateShowcase'
import { AISection } from '../landing/AISection'
import { ProductShowcase } from '../landing/ProductShowcase'
import { FinalCTA } from '../landing/FinalCTA'
import { Footer } from '../landing/Footer'
import { useLibrary } from '../store/useLibrary'
import { requestOpenProject } from '../services/openDeck'
import '../landing/landing.css'

export function LandingPage() {
  const navigate = useNavigate()
  const library = useLibrary()
  const [started, setStarted] = useState(false)

  const start = async () => {
    if (started) return
    setStarted(true)
    await library.init()
    const created = await library.createProject()
    requestOpenProject({ projectId: created.id })
  }

  return (
    <div className="slf-root relative min-h-full overflow-x-clip">
      <AuroraBackground />

      <Header onStart={() => void start()} />

      <main className="relative z-10">
        <Hero onStart={() => void start()} onTemplates={() => navigate('/templates')} />
        <FeatureStrip />
        <TemplateShowcase onOpen={() => navigate('/templates')} />
        <AISection />
        <ProductShowcase />
        <FinalCTA onStart={() => void start()} />
      </main>

      <Footer />
    </div>
  )
}
