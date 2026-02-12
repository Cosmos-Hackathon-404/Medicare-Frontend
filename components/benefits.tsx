import { Card } from '@/components/ui/card'
import { TrendingUp, Award, Heart } from 'lucide-react'

const benefits = [
  {
    icon: TrendingUp,
    title: 'Save Time on Documentation',
    description: 'AI automatically generates clinical notes from recorded sessions',
    items: [
      'Automated clinical note generation',
      'Streamlined workflow automation',
      'Smart scheduling recommendations',
    ],
  },
  {
    icon: Award,
    title: 'AI-Powered Insights',
    description: 'Get intelligent suggestions for more informed clinical decisions',
    items: [
      'Contextual treatment suggestions',
      'Drug interaction warnings',
      'Symptom correlation analysis',
    ],
  },
  {
    icon: Heart,
    title: 'Better Patient Experience',
    description: 'Complete medical history follows the patient between doctors',
    items: [
      'Complete patient history access',
      'Continuity of care assurance',
      'Personalized treatment plans',
    ],
  },
]

export function Benefits() {
  return (
    <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Why Medicare AI
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built for healthcare professionals who want to spend more time on patients and less on paperwork.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <Card key={index} className="relative p-6 border border-border overflow-hidden group hover:border-primary/50 transition">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition -z-0"></div>
                
                <div className="relative z-10">
                  <div className="mb-4 inline-flex">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>

                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">{benefit.description}</p>

                  <ul className="space-y-2">
                    {benefit.items.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-primary">→</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-8 border border-border bg-primary/5">
            <h3 className="text-xl font-semibold text-foreground mb-4">For Healthcare Systems</h3>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-primary text-xl leading-none">•</span>
                <span className="text-muted-foreground">Seamless EHR integration with major providers</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary text-xl leading-none">•</span>
                <span className="text-muted-foreground">Bulk user management and compliance tools</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary text-xl leading-none">•</span>
                <span className="text-muted-foreground">Advanced analytics and reporting dashboards</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary text-xl leading-none">•</span>
                <span className="text-muted-foreground">Dedicated implementation and support team</span>
              </li>
            </ul>
          </Card>

          <Card className="p-8 border border-border bg-primary/5">
            <h3 className="text-xl font-semibold text-foreground mb-4">Security & Privacy</h3>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-primary text-xl leading-none">•</span>
                <span className="text-muted-foreground">Role-based access control for doctors and patients</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary text-xl leading-none">•</span>
                <span className="text-muted-foreground">Secure authentication via Clerk</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary text-xl leading-none">•</span>
                <span className="text-muted-foreground">Patient-controlled data sharing</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary text-xl leading-none">•</span>
                <span className="text-muted-foreground">Encrypted data storage with Convex</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </section>
  )
}
