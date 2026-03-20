export default function Footer() {
  return (
    <footer className="py-12 px-6 bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          <div>
            <h3 className="text-2xl font-serif mb-4">Studio Intérieur</h3>
            <p className="text-neutral-400 leading-relaxed">
              Crafting timeless residential spaces with refined sensibility and unwavering attention to detail.
            </p>
          </div>
          <div>
            <h4 className="text-sm uppercase tracking-widest mb-4 text-neutral-500">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#portfolio" className="text-neutral-300 hover:text-white transition-colors">Portfolio</a></li>
              <li><a href="#about" className="text-neutral-300 hover:text-white transition-colors">About</a></li>
              <li><a href="#services" className="text-neutral-300 hover:text-white transition-colors">Services</a></li>
              <li><a href="#contact" className="text-neutral-300 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm uppercase tracking-widest mb-4 text-neutral-500">Contact</h4>
            <ul className="space-y-2 text-neutral-300">
              <li>123 Madison Avenue</li>
              <li>New York, NY 10016</li>
              <li className="pt-2">+1 (212) 555-0123</li>
              <li>hello@studiointerieur.com</li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-neutral-800 text-center text-neutral-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Studio Intérieur. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
