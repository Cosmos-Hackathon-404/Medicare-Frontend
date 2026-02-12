import { Mail } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-card border-t border-border py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">M</span>
              </div>
              <span className="font-bold text-foreground">Medicare AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Transforming healthcare with intelligent clinical documentation and patient record management.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="text-muted-foreground hover:text-foreground transition">Features</a></li>
              <li><a href="#team" className="text-muted-foreground hover:text-foreground transition">How It Works</a></li>
              <li><a href="#benefits" className="text-muted-foreground hover:text-foreground transition">Why Medicare AI</a></li>
            </ul>
          </div>

          {/* Get Started */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Get Started</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2 items-center">
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <a href="/sign-up" className="text-muted-foreground hover:text-foreground transition">Create an Account</a>
              </li>
              <li>
                <a href="/sign-in" className="text-muted-foreground hover:text-foreground transition">Sign In</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border my-8"></div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p className="text-muted-foreground">
            © {currentYear} Medicare AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
