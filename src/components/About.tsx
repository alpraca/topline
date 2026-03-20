export default function About() {
  return (
    <section id="about" className="section-shell py-20 md:py-24 px-6 md:px-10">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-14 items-center">
        <div className="order-2 md:order-1">
          <p className="lux-caption mb-4">About The Studio</p>
          <h2 className="section-title text-white mb-6 leading-tight">
            Design Rooted in
            <br />
            Quiet Confidence
          </h2>
          <div className="space-y-5 text-white/80 leading-relaxed">
            <p className="text-base md:text-lg">
              For over two decades, we have dedicated ourselves to the creation of residential interiors
              that transcend fleeting trends. Our work is guided by a deep respect for craftsmanship,
              an eye for enduring beauty, and an unwavering attention to detail.
            </p>
            <p>
              Every home is composed like a visual narrative: measured, tactile, and personal.
            </p>
          </div>
          <div className="mt-10 pt-8 border-t border-white/15 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-2">Founded</p>
              <p className="text-2xl font-serif text-white">New York, 2003</p>
            </div>
            <div className="h-12 w-12 border border-white/30"></div>
          </div>
        </div>
        <div className="order-1 md:order-2 panel-shell p-4 md:p-5 overflow-hidden">
          <img
            src="https://images.pexels.com/photos/276583/pexels-photo-276583.jpeg?auto=compress&cs=tinysrgb&w=800"
            alt="Interior detail"
            className="w-full h-[460px] md:h-[640px] object-cover"
          />
        </div>
      </div>
    </section>
  );
}
