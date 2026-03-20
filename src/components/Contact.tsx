import { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext';

export default function Contact() {
  const { addInquiry, siteContent } = useSiteData();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addInquiry({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      message: formData.message.trim()
    });

    setFormData({
      name: '',
      email: '',
      phone: '',
      message: ''
    });
    setIsSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="contact" className="section-shell py-20 md:py-24 px-6 md:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16">
          <div>
            <p className="lux-caption mb-4">Contact</p>
            <h2 className="section-title text-white mb-6">
              {siteContent.contactHeadingLine1}
              <br />
              {siteContent.contactHeadingLine2}
            </h2>
            <p className="text-sm md:text-base text-white/70 mb-12 leading-relaxed max-w-md">
              {siteContent.contactIntro}
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="icon-chip h-10 w-10 shrink-0">
                  <MapPin size={18} strokeWidth={2} />
                </div>
                <div>
                  <p className="font-medium text-white">{siteContent.contactStudioLabel}</p>
                  <p className="text-white/70">{siteContent.contactAddressLine1}<br />{siteContent.contactAddressLine2}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="icon-chip h-10 w-10 shrink-0">
                  <Phone size={18} strokeWidth={2} />
                </div>
                <div>
                  <p className="font-medium text-white">{siteContent.contactPhoneLabel}</p>
                  <a href={`tel:${siteContent.contactPhoneE164}`} className="text-white/70 hover:text-white transition-colors">
                    {siteContent.contactPhoneDisplay}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="icon-chip h-10 w-10 shrink-0">
                  <Mail size={18} strokeWidth={2} />
                </div>
                <div>
                  <p className="font-medium text-white">{siteContent.contactEmailLabel}</p>
                  <a href={`mailto:${siteContent.contactEmail}`} className="text-white/70 hover:text-white transition-colors">
                    {siteContent.contactEmail}
                  </a>
                </div>
              </div>
              <div>
                <a
                  href={`https://wa.me/${siteContent.contactPhoneE164}?text=${encodeURIComponent(siteContent.whatsappPrefillMessage)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[var(--olive)] text-white hover:opacity-90 transition-all duration-300 font-semibold uppercase text-xs tracking-[0.15em]"
                >
                  {siteContent.whatsappButtonText}
                </a>
              </div>
            </div>
          </div>

          <div className="panel-shell p-6 md:p-8 lg:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-black/25 text-white border border-white/20 focus:border-[var(--bronze)] focus:ring-1 focus:ring-[var(--bronze)] outline-none transition-colors"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-black/25 text-white border border-white/20 focus:border-[var(--bronze)] focus:ring-1 focus:ring-[var(--bronze)] outline-none transition-colors"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/25 text-white border border-white/20 focus:border-[var(--bronze)] focus:ring-1 focus:ring-[var(--bronze)] outline-none transition-colors"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-black/25 text-white border border-white/20 focus:border-[var(--bronze)] focus:ring-1 focus:ring-[var(--bronze)] outline-none transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full px-8 py-4 bg-neutral-900 text-white hover:bg-black transition-colors duration-300 font-semibold uppercase text-xs tracking-[0.18em]"
              >
                Send Inquiry
              </button>
              {isSubmitted && (
                <p className="text-sm text-emerald-300">
                  Thank you. Your message has been received successfully.
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
