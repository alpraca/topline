export default function About() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="order-2 md:order-1">
          <h2 className="text-4xl md:text-5xl font-serif text-neutral-900 mb-6 leading-tight">
            Design Rooted in
            <br />
            Quiet Confidence
          </h2>
          <div className="space-y-6 text-neutral-700 leading-relaxed">
            <p className="text-lg">
              For over two decades, we have dedicated ourselves to the creation of residential interiors
              that transcend fleeting trends. Our work is guided by a deep respect for craftsmanship,
              an eye for enduring beauty, and an unwavering attention to detail.
            </p>
            <p>
              We believe that a home should be a sanctuary—a place where every material, every texture,
              and every carefully chosen piece contributes to a sense of calm and permanence. Our
              approach is collaborative, thoughtful, and deeply personal.
            </p>
            <p>
              Each project begins with listening. We seek to understand not just how you live, but how
              you wish to live. The result is a space that feels both timeless and unmistakably yours.
            </p>
          </div>
          <div className="mt-10 pt-10 border-t border-neutral-200">
            <p className="text-sm uppercase tracking-widest text-neutral-500 mb-2">Founded</p>
            <p className="text-2xl font-serif text-neutral-900">New York, 2003</p>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <img
            src="https://images.pexels.com/photos/276583/pexels-photo-276583.jpeg?auto=compress&cs=tinysrgb&w=800"
            alt="Interior detail"
            className="w-full h-[600px] object-cover"
          />
        </div>
      </div>
    </section>
  );
}
