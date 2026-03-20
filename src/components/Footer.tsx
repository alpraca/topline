import { useSiteData } from '../context/SiteDataContext';

export default function Footer() {
  const { siteContent } = useSiteData();

  return (
    <footer className="py-14 md:py-16 px-6 md:px-10 bg-[#0a0a0b] text-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-4">Studio</p>
            <h3 className="text-3xl font-serif mb-4">{siteContent.footerBrandTitle}</h3>
            <p className="text-neutral-300/80 leading-relaxed max-w-sm">{siteContent.footerBrandDescription}</p>
          </div>
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.22em] mb-4 text-neutral-500">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#portfolio" className="text-neutral-300 hover:text-white transition-colors uppercase tracking-[0.14em] text-xs">Portfolio</a></li>
              <li><a href="#about" className="text-neutral-300 hover:text-white transition-colors uppercase tracking-[0.14em] text-xs">About</a></li>
              <li><a href="#services" className="text-neutral-300 hover:text-white transition-colors uppercase tracking-[0.14em] text-xs">Services</a></li>
              <li><a href="#contact" className="text-neutral-300 hover:text-white transition-colors uppercase tracking-[0.14em] text-xs">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.22em] mb-4 text-neutral-500">Contact</h4>
            <ul className="space-y-2 text-neutral-300/90">
              <li>{siteContent.contactAddressLine1}</li>
              <li>{siteContent.contactAddressLine2}</li>
              <li className="pt-2">
                <a href={`tel:${siteContent.contactPhoneE164}`} className="hover:text-white transition-colors">
                  {siteContent.contactPhoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${siteContent.contactEmail}`} className="hover:text-white transition-colors">
                  {siteContent.contactEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/10 text-center text-neutral-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Studio Intérieur. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
