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
    <section id="contact" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-4xl md:text-5xl font-serif text-neutral-900 mb-6">
              {siteContent.contactHeadingLine1}
              <br />
              {siteContent.contactHeadingLine2}
            </h2>
            <p className="text-lg text-neutral-600 mb-12 leading-relaxed">
              {siteContent.contactIntro}
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <MapPin className="text-amber-700 mt-1" size={24} strokeWidth={1.5} />
                <div>
                  <p className="font-medium text-neutral-900">{siteContent.contactStudioLabel}</p>
                  <p className="text-neutral-600">{siteContent.contactAddressLine1}<br />{siteContent.contactAddressLine2}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="text-amber-700 mt-1" size={24} strokeWidth={1.5} />
                <div>
                  <p className="font-medium text-neutral-900">{siteContent.contactPhoneLabel}</p>
                  <a href={`tel:${siteContent.contactPhoneE164}`} className="text-neutral-600 hover:text-neutral-900 transition-colors">
                    {siteContent.contactPhoneDisplay}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="text-amber-700 mt-1" size={24} strokeWidth={1.5} />
                <div>
                  <p className="font-medium text-neutral-900">{siteContent.contactEmailLabel}</p>
                  <a href={`mailto:${siteContent.contactEmail}`} className="text-neutral-600 hover:text-neutral-900 transition-colors">
                    {siteContent.contactEmail}
                  </a>
                </div>
              </div>
              <div>
                <a
                  href={`https://wa.me/${siteContent.contactPhoneE164}?text=${encodeURIComponent(siteContent.whatsappPrefillMessage)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#1f6f4a] text-white hover:bg-[#17573a] transition-colors duration-300 font-medium tracking-wide"
                >
                  {siteContent.whatsappButtonText}
                </a>
              </div>
            </div>
          </div>

          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-neutral-300 focus:border-amber-700 focus:ring-1 focus:ring-amber-700 outline-none transition-colors"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-neutral-300 focus:border-amber-700 focus:ring-1 focus:ring-amber-700 outline-none transition-colors"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-neutral-300 focus:border-amber-700 focus:ring-1 focus:ring-amber-700 outline-none transition-colors"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 border border-neutral-300 focus:border-amber-700 focus:ring-1 focus:ring-amber-700 outline-none transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full px-8 py-4 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors duration-300 font-medium tracking-wide"
              >
                Send Inquiry
              </button>
              {isSubmitted && (
                <p className="text-sm text-emerald-700">
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
