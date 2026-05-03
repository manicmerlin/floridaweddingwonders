import type { Metadata } from 'next';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { SITE_CONFIG } from '@/lib/seo';
import { PAGE_HERO_IMAGES } from '@/lib/pageImages';

export const metadata: Metadata = {
  title: 'About Us | Sobre Nosotros - Florida Wedding Wonders',
  description: 'We\'ve seen the wedding world from every angle. Florida Wedding Wonders was built by people who have lived it - venue managers, planners, and digital creatives who understand the heartbeat of celebration.',
  keywords: ['about florida wedding wonders', 'miami wedding team', 'wedding venue directory', 'sobre nosotros', 'equipo de bodas'],
  openGraph: {
    title: 'About Us - Florida Wedding Wonders',
    description: 'Built by Miami natives who understand the wedding world from every angle.',
    url: `${SITE_CONFIG.url}/about`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  return (
    <>
      <Navigation />

      {/* Hero Section. Hoisted OUT of the gradient page-wrapper so no
          inherited padding/margin/overflow can clamp its width — it's a
          direct child of the page's top-level Fragment, rendering as a
          sibling of <Navigation /> directly under <body>. inline style
          width:'100vw' is set explicitly so the value comes from a literal
          CSS string (not a Tailwind arbitrary value that some Safari
          versions could miscompute). */}
      <div
        style={{ width: '100vw' }}
        className="relative text-white overflow-hidden flex items-center justify-center min-h-[18rem] sm:min-h-[22rem] md:min-h-[26rem]"
      >
        <Image
          src={PAGE_HERO_IMAGES.about}
          alt="A Florida wedding venue at golden hour"
          fill
          priority
          quality={85}
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/50"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 sm:py-16">
          <h1 className="text-5xl md:text-6xl font-bold text-center mb-4 drop-shadow-lg">
            About Us
          </h1>
          <p className="text-xl text-center text-blue-50 max-w-2xl mx-auto drop-shadow">
            Built by people who have lived the wedding world from every angle
          </p>
        </div>
      </div>

      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">

      {/* English Content */}
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="prose prose-lg prose-blue mx-auto">
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p className="text-xl text-gray-900 font-light">
              We've seen the wedding world from every angle.
            </p>
            
            <p>
              The quiet before the vows. The electricity right after "I do."
              The clinking of glasses, the glitter in tired eyes, the heartbeat of a night that means something.
            </p>

            <p className="text-lg font-semibold text-gray-900">
              Florida Wedding Wonders was built by people who have lived it.
            </p>

            <p>
              A venue manager who knew how to keep calm when the music skipped.
              Planners who have turned chaos into choreography.
              Digital-first creatives who see light where others see pixels.
            </p>

            <p>
              We built this because we were tired of watching beauty get buried under templates.
              Other sites talk in algorithms.
              <span className="font-semibold"> We want to talk in stories.</span>
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 my-8">
              <p className="text-gray-800 italic mb-0">
                Here, a venue gets to show its soul.
                A vendor gets to shine for what they've made possible.
                Every photo is proof that something extraordinary happened once and might happen again.
              </p>
            </div>

            <p>
              We're Miami natives.
              We understand the heat that never quite leaves your skin, the rhythm that sneaks into every celebration.
              Our city is a love song written in two languages, and we want to honor both.
            </p>

            <p className="text-lg text-gray-900">
              This is our way of saying: <span className="font-semibold">we see you.</span>
            </p>

            <p>
              Your work, your love, your vision deserve to be seen.
              We're open to feedback, open to collaboration, and always open to sharing a cafecito while we plan the next story worth telling.
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto border-t-2 border-blue-200"></div>
      </div>

      {/* Spanish Content */}
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-blue-900">
          Sobre Nosotros
        </h2>
        
        <div className="prose prose-lg prose-blue mx-auto">
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p className="text-xl text-gray-900 font-light">
              Hemos visto el mundo de las bodas desde todos los ángulos.
            </p>
            
            <p>
              El silencio nervioso antes del primer baile. La forma en que la luz se esconde dentro de una copa de champaña. El suspiro que nace cuando una canción se convierte en recuerdo.
            </p>

            <p className="text-lg font-semibold text-gray-900">
              Florida Wedding Wonders fue creada por personas que han vivido esos instantes.
            </p>

            <p>
              Un exgerente de salón que conoce la belleza que se esconde en los detalles.
              Planeadores de bodas que entienden que la alegría también necesita coreografía.
              Creativos digitales que creen que la tecnología aún puede sentirse humana.
            </p>

            <p>
              Hemos visto los otros sitios, los que convierten historias en listas, y decidimos hacer algo distinto.
              Aquí, cada lugar tiene una voz. Cada proveedor tiene su espacio para brillar.
              Porque cuando una florista transforma un salón en un sueño, o un DJ logra que desconocidos bailen como familia, eso también merece ser contado.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 my-8">
              <p className="text-gray-800 italic mb-0">
                Este sitio es nuestra carta de amor a esos momentos. Un mapa para parejas, creadores y cualquiera que busque la belleza bajo la luz de Florida.
              </p>
            </div>

            <p>
              Somos nativos de Miami.
              Llevamos el calor en la risa y el color en los huesos.
              Crecimos entre cafecitos, tráfico y música que le promete algo a la noche.
              Sabemos que las bodas aquí no son perfectas, son vivas.
            </p>

            <p className="text-lg text-gray-900 font-semibold">
              Estamos abiertos a tus ideas, a colaborar, y siempre dispuestos a escuchar la próxima historia que quieras contar.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-blue-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Share Your Story?</h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Whether you're a venue, vendor, or couple planning your perfect day, we'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/venues"
              className="bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Explore Venues
            </a>
            <a
              href="/venue-packages"
              className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors border-2 border-white"
            >
              List Your Venue
            </a>
          </div>
        </div>
      </div>

      </div>

      <Footer />
    </>
  );
}
