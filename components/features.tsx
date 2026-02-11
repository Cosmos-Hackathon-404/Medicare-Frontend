import { Card } from '@/components/ui/card'
import { FileText, Brain, Users, Lock, Clock, BarChart3 } from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'Automated Documentation',
    description: 'AI automatically generates comprehensive clinical notes from doctor-patient conversations',
  },
  {
    icon: Brain,
    title: 'Medical Report Summaries',
    description: 'Intelligent AI distills complex medical reports into actionable summaries',
  },
  {
    icon: Users,
    title: 'Unified Patient Record',
    description: 'Every patient interaction is preserved, creating a complete medical timeline',
  },
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'Military-grade encryption ensures all patient data remains completely secure',
  },
  {
    icon: Clock,
    title: 'Pre-Diagnosis Insights',
    description: 'AI provides contextual insights to help doctors make faster, informed decisions',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description: 'Comprehensive dashboards track patient progress and treatment effectiveness',
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Powerful Features Built for Modern Healthcare
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Medicare AI combines cutting-edge artificial intelligence with healthcare expertise to streamline clinical workflows and improve patient outcomes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card
                key={index}
                className="p-6 border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="mb-4 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            )
          })}
        </div>

        <div className="mt-16 p-8 rounded-2xl bg-primary/5 border border-primary/20">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-primary mb-2">500K+</p>
              <p className="text-muted-foreground">Patient Records Managed</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2">10K+</p>
              <p className="text-muted-foreground">Healthcare Professionals</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2">99.9%</p>
              <p className="text-muted-foreground">System Uptime</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
