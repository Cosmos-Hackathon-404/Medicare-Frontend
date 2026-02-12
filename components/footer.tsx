import { Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-card border-t border-border py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
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

          {/* Product */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="text-muted-foreground hover:text-foreground transition">Features</a></li>
              <li><a href="#benefits" className="text-muted-foreground hover:text-foreground transition">How It Works</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition">Security</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition">Integrations</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#team" className="text-muted-foreground hover:text-foreground transition">About</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition">Blog</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition">Careers</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition">Contact</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2 items-center">
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <a href="mailto:info@medicareai.com" className="text-muted-foreground hover:text-foreground transition">info@medicareai.com</a>
              </li>
              <li className="flex gap-2 items-center">
                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <a href="tel:+1234567890" className="text-muted-foreground hover:text-foreground transition">+1 (234) 567-890</a>
              </li>
              <li className="flex gap-2 items-center">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">San Francisco, CA</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border my-8"></div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p className="text-muted-foreground">
            © {currentYear} Medicare AI. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-muted-foreground hover:text-foreground transition">Privacy Policy</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition">Terms of Service</a>
            <a href="/admin" className="text-muted-foreground hover:text-foreground transition">Admin</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
