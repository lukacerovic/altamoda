import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen flex flex-col bg-[#fef9f1] text-[#1d1c17]">
        {/* Hero */}
        <section className="w-full h-[563px] relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-[#ded9d2]">
            <img
              alt="Luxury atelier interior"
              className="w-full h-full object-cover grayscale-[0.2] opacity-90"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWLUQRi5KiF9GA_UedLyqeZeB9to4I3qzwbm8Ob-kMfA8J-IzZhiYmTlRB9yd9JFWoRbSbWe6iXnRlxWhUgiX_9ugGo6rZBc3BpUYJ3X0NRMZZ11Mio73NnjNU7OgyZoBmC55_teN-MNM8fxA3HvEkiYQZEDHdu2LZDc-NFL-tcygUOI-naBCQ2Q6wxM3YSJ8d2vnA9M9WGJkJAP452qWqUBBD9jUki9fNIVvSd6uryo46ck6BDbtVybnM4wS7E232n5UhlYORod6t"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#fef9f1]" />
          </div>
          <div className="relative z-10 text-center px-6">
            <h1 className="font-serif italic text-5xl md:text-7xl lg:text-8xl tracking-tighter mb-4">
              Get in Touch
            </h1>
            <p className="text-lg md:text-xl text-[#524345] max-w-2xl mx-auto font-light leading-relaxed">
              Our atelier is a space of silent luxury and bespoke creation. Connect with us
              for inquiries regarding collections, heritage, and unique partnerships.
            </p>
          </div>
        </section>

        {/* Contact Info */}
        <section className="flex-grow bg-[#fef9f1] py-24 md:py-32">
          <div className="max-w-screen-xl mx-auto px-8 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 text-center items-start">
              {/* Connect */}
              <div className="flex flex-col items-center">
                <span className="text-xs tracking-[0.2em] text-[#703343] uppercase mb-10">
                  Connect
                </span>
                <div className="space-y-6">
                  <a className="block font-serif text-2xl hover:text-[#703343] transition-colors duration-300 italic" href="#">
                    Instagram
                  </a>
                  <a className="block font-serif text-2xl hover:text-[#703343] transition-colors duration-300 italic" href="#">
                    Pinterest
                  </a>
                  <a className="block font-serif text-2xl hover:text-[#703343] transition-colors duration-300 italic" href="#">
                    LinkedIn
                  </a>
                  <a className="block font-serif text-2xl hover:text-[#703343] transition-colors duration-300 italic" href="#">
                    Vogue Archive
                  </a>
                </div>
              </div>

              {/* Inquire */}
              <div className="flex flex-col items-center">
                <span className="text-xs tracking-[0.2em] text-[#703343] uppercase mb-10">
                  Inquire
                </span>
                <div className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-[10px] tracking-widest text-[#847375] uppercase mb-2">
                      Email
                    </p>
                    <a
                      className="block font-serif text-2xl hover:text-[#703343] transition-colors duration-300"
                      href="mailto:atelier@altamoda.com"
                    >
                      atelier@altamoda.com
                    </a>
                  </div>
                  <div className="pt-4 space-y-1">
                    <p className="text-[10px] tracking-widest text-[#847375] uppercase mb-2">
                      Private Line
                    </p>
                    <a
                      className="block font-serif text-2xl hover:text-[#703343] transition-colors duration-300"
                      href="tel:+39021234567"
                    >
                      +39 02 123 4567
                    </a>
                  </div>
                </div>
              </div>

              {/* Visit */}
              <div className="flex flex-col items-center">
                <span className="text-xs tracking-[0.2em] text-[#703343] uppercase mb-10">
                  Visit
                </span>
                <div className="space-y-6">
                  <address className="not-italic space-y-4">
                    <p className="font-serif text-2xl leading-snug italic">
                      Via Montenapoleone, 27
                      <br />
                      20121 Milano MI
                      <br />
                      Italy
                    </p>
                  </address>
                  <div className="pt-2">
                    <a
                      className="inline-flex items-center gap-2 text-xs tracking-widest text-[#703343] uppercase hover:opacity-70 transition-opacity duration-300"
                      href="#"
                    >
                      View on Map
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="bg-[#f8f3eb] py-24 border-t border-[#d7c1c4]/10">
          <div className="max-w-2xl mx-auto px-8 text-center">
            <h3 className="font-serif text-3xl mb-8">The Heritage Journal</h3>
            <p className="text-[#524345] mb-10 font-light italic">
              Receive seasonal insights from our atelier and updates on new heritage
              collections.
            </p>
            <form className="flex flex-col md:flex-row gap-4">
              <input
                className="flex-grow bg-transparent border-0 border-b border-[#847375] focus:border-[#703343] focus:ring-0 py-3 text-[#1d1c17] placeholder:text-[#847375]/50 transition-colors duration-500"
                placeholder="Your email address"
                type="email"
              />
              <button
                className="bg-[#8c4a5a] text-white px-8 py-3 text-xs tracking-widest uppercase hover:bg-[#703343] transition-colors duration-300"
                type="submit"
              >
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
