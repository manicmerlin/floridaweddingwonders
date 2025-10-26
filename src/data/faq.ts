/**
 * FAQ Data Structure
 * Bilingual FAQ content (English and Spanish) for wedding venue questions
 */

export interface FAQItem {
  id: string;
  question: {
    en: string;
    es: string;
  };
  answer: {
    en: string;
    es: string;
  };
  category: 'booking' | 'pricing' | 'planning' | 'venues' | 'vendors' | 'general';
}

export const faqData: FAQItem[] = [
  {
    id: 'booking-advance',
    category: 'booking',
    question: {
      en: 'How far in advance should I book a wedding venue in Florida?',
      es: '¿Con cuánta anticipación debo reservar un lugar para bodas en Florida?'
    },
    answer: {
      en: 'We recommend booking your Florida wedding venue 12-18 months in advance, especially for popular dates like winter months (December-April) and Saturdays. Peak season venues can book up 18-24 months ahead. For weekday or off-season weddings, 6-9 months may be sufficient. Beach venues and historic estates tend to book fastest.',
      es: 'Recomendamos reservar su lugar de boda en Florida con 12-18 meses de anticipación, especialmente para fechas populares como los meses de invierno (diciembre-abril) y los sábados. Los lugares de temporada alta pueden reservarse con 18-24 meses de anticipación. Para bodas entre semana o fuera de temporada, 6-9 meses pueden ser suficientes. Los lugares en la playa y las propiedades históricas tienden a reservarse más rápido.'
    }
  },
  {
    id: 'venue-cost',
    category: 'pricing',
    question: {
      en: 'What is the average cost of a wedding venue in Florida?',
      es: '¿Cuál es el costo promedio de un lugar para bodas en Florida?'
    },
    answer: {
      en: 'Florida wedding venue costs vary widely by location, capacity, and amenities. On average, expect to pay $3,000-$12,000 for venue rental alone. South Florida (Miami, Fort Lauderdale) and beachfront venues tend to be pricier ($8,000-$15,000+), while Central Florida and rustic venues may range $2,000-$8,000. All-inclusive packages with catering, bar, and coordination can range $80-$250+ per guest.',
      es: 'Los costos de los lugares para bodas en Florida varían ampliamente según la ubicación, capacidad y comodidades. En promedio, espere pagar $3,000-$12,000 solo por el alquiler del lugar. El sur de Florida (Miami, Fort Lauderdale) y los lugares frente al mar tienden a ser más caros ($8,000-$15,000+), mientras que el centro de Florida y los lugares rústicos pueden oscilar entre $2,000-$8,000. Los paquetes todo incluido con catering, bar y coordinación pueden oscilar entre $80-$250+ por invitado.'
    }
  },
  {
    id: 'best-season',
    category: 'planning',
    question: {
      en: 'What is the best time of year to get married in Florida?',
      es: '¿Cuál es la mejor época del año para casarse en Florida?'
    },
    answer: {
      en: 'The best wedding season in Florida is November through April, offering mild temperatures (65-80°F), low humidity, and minimal rain. Peak months are December-March. Summer (June-September) brings heat, humidity, and afternoon thunderstorms, but offers lower prices and greater availability. Fall (October-November) provides excellent weather at better rates. Consider hurricane season (June-November) when booking outdoor venues.',
      es: 'La mejor temporada de bodas en Florida es de noviembre a abril, ofreciendo temperaturas agradables (65-80°F), baja humedad y lluvia mínima. Los meses pico son diciembre-marzo. El verano (junio-septiembre) trae calor, humedad y tormentas eléctricas por la tarde, pero ofrece precios más bajos y mayor disponibilidad. El otoño (octubre-noviembre) proporciona excelente clima a mejores tarifas. Considere la temporada de huracanes (junio-noviembre) al reservar lugares al aire libre.'
    }
  },
  {
    id: 'guest-capacity',
    category: 'venues',
    question: {
      en: 'How do I choose the right venue size for my guest count?',
      es: '¿Cómo elijo el tamaño correcto del lugar para mi número de invitados?'
    },
    answer: {
      en: 'Choose a venue with a capacity range that comfortably fits your guest list. For a 100-guest wedding, look for venues rated 80-150 capacity. Too small feels cramped; too large feels empty. Consider space for ceremony, cocktail hour, reception, dance floor, and buffet/bar areas. Account for 10-15% no-shows when estimating final count. Ask venues about their recommended guest counts for different setup styles (seated dinner vs. cocktail reception).',
      es: 'Elija un lugar con un rango de capacidad que se adapte cómodamente a su lista de invitados. Para una boda de 100 invitados, busque lugares con capacidad de 80-150. Muy pequeño se siente apretado; muy grande se siente vacío. Considere el espacio para la ceremonia, hora de cóctel, recepción, pista de baile y áreas de buffet/bar. Tenga en cuenta un 10-15% de ausencias al estimar el conteo final. Pregunte a los lugares sobre sus conteos de invitados recomendados para diferentes estilos de configuración (cena sentada vs. recepción de cóctel).'
    }
  },
  {
    id: 'venue-included',
    category: 'venues',
    question: {
      en: 'What is typically included in a Florida venue rental?',
      es: '¿Qué suele incluirse en el alquiler de un lugar en Florida?'
    },
    answer: {
      en: 'Basic venue rentals typically include the space, tables, chairs, basic linens, and parking. Many Florida venues also provide ceremony and reception space, bridal suite, getting-ready rooms, and basic sound systems. Premium venues may include coordination services, bar service, and décor. Always clarify what\'s included: setup/cleanup, liability insurance, preferred vendor list, overtime fees, and whether catering/bar are exclusive or outsourced.',
      es: 'Los alquileres básicos de lugares generalmente incluyen el espacio, mesas, sillas, manteles básicos y estacionamiento. Muchos lugares en Florida también proporcionan espacio para ceremonia y recepción, suite nupcial, habitaciones para prepararse y sistemas de sonido básicos. Los lugares premium pueden incluir servicios de coordinación, servicio de bar y decoración. Siempre aclare qué está incluido: montaje/limpieza, seguro de responsabilidad, lista de proveedores preferidos, tarifas de tiempo extra y si el catering/bar son exclusivos o subcontratados.'
    }
  },
  {
    id: 'outdoor-weather',
    category: 'planning',
    question: {
      en: 'What should I consider for an outdoor Florida wedding?',
      es: '¿Qué debo considerar para una boda al aire libre en Florida?'
    },
    answer: {
      en: 'Florida outdoor weddings require careful planning: Always have a backup indoor/tent option for rain or extreme heat. Book during dry season (November-April) for best weather. Provide shade, fans, and hydration for guests. Consider afternoon thunderstorms (common June-September). Protect against bugs with citronella and consider sunset timing for lighting. Check venue\'s contingency policies and tent rental costs. Beach weddings need permits and tide schedules.',
      es: 'Las bodas al aire libre en Florida requieren planificación cuidadosa: Siempre tenga una opción de respaldo bajo techo/carpa para lluvia o calor extremo. Reserve durante la temporada seca (noviembre-abril) para mejor clima. Proporcione sombra, ventiladores e hidratación para los invitados. Considere las tormentas de la tarde (comunes de junio a septiembre). Proteja contra insectos con citronela y considere el momento del atardecer para la iluminación. Verifique las políticas de contingencia del lugar y los costos de alquiler de carpas. Las bodas en la playa necesitan permisos y horarios de mareas.'
    }
  },
  {
    id: 'vendor-restrictions',
    category: 'vendors',
    question: {
      en: 'Do venues have preferred or required vendor lists?',
      es: '¿Los lugares tienen listas de proveedores preferidos o requeridos?'
    },
    answer: {
      en: 'Many Florida venues have preferred vendor lists, but policies vary. Some venues require exclusive catering and bar service. Others strongly recommend preferred vendors (photographers, florists, DJs) who know the space well. Ask about restrictions: Can you bring outside vendors? Are there additional fees for non-preferred vendors? Some venues charge facility fees or require vendors to have specific insurance. Preferred vendors often offer discounts and know the venue\'s logistics, timeline, and setup requirements.',
      es: 'Muchos lugares en Florida tienen listas de proveedores preferidos, pero las políticas varían. Algunos lugares requieren servicio exclusivo de catering y bar. Otros recomiendan encarecidamente proveedores preferidos (fotógrafos, floristas, DJs) que conocen bien el espacio. Pregunte sobre restricciones: ¿Puede traer proveedores externos? ¿Hay tarifas adicionales para proveedores no preferidos? Algunos lugares cobran tarifas de instalaciones o requieren que los proveedores tengan seguro específico. Los proveedores preferidos a menudo ofrecen descuentos y conocen la logística, el cronograma y los requisitos de configuración del lugar.'
    }
  },
  {
    id: 'beach-permit',
    category: 'venues',
    question: {
      en: 'Do I need a permit for a beach wedding in Florida?',
      es: '¿Necesito un permiso para una boda en la playa en Florida?'
    },
    answer: {
      en: 'Yes, most Florida beaches require permits for weddings and events. Requirements vary by county and city. Permits typically cost $50-$300 and must be obtained weeks in advance. Rules often limit guest counts (usually under 50-75 people), prohibit alcohol, restrict setup times, and require cleanup. Private beach venues handle permits for you. Public beaches may have noise restrictions and require liability insurance. Check with local parks and recreation departments for specific requirements.',
      es: 'Sí, la mayoría de las playas de Florida requieren permisos para bodas y eventos. Los requisitos varían según el condado y la ciudad. Los permisos generalmente cuestan $50-$300 y deben obtenerse con semanas de anticipación. Las reglas a menudo limitan el número de invitados (generalmente menos de 50-75 personas), prohíben el alcohol, restringen los horarios de instalación y requieren limpieza. Los lugares de playa privados se encargan de los permisos por usted. Las playas públicas pueden tener restricciones de ruido y requerir seguro de responsabilidad. Consulte con los departamentos de parques y recreación locales para requisitos específicos.'
    }
  },
  {
    id: 'questions-to-ask',
    category: 'planning',
    question: {
      en: 'What questions should I ask when touring a venue?',
      es: '¿Qué preguntas debo hacer al visitar un lugar?'
    },
    answer: {
      en: 'Essential venue questions: What\'s included in rental price? Maximum guest capacity? Available dates and booking timeline? Payment schedule and cancellation policy? Setup/cleanup timeline and restrictions? Vendor policies (preferred vs. outside)? Backup plan for weather? Parking availability and cost? Liability insurance requirements? Alcohol policies and bar options? Overtime fees? Noise/music restrictions and curfew? Getting-ready spaces? Accessibility for disabled guests? Recent reviews or references?',
      es: 'Preguntas esenciales del lugar: ¿Qué está incluido en el precio de alquiler? ¿Capacidad máxima de invitados? ¿Fechas disponibles y cronograma de reserva? ¿Calendario de pagos y política de cancelación? ¿Cronograma y restricciones de montaje/limpieza? ¿Políticas de proveedores (preferidos vs. externos)? ¿Plan de respaldo para el clima? ¿Disponibilidad y costo de estacionamiento? ¿Requisitos de seguro de responsabilidad? ¿Políticas de alcohol y opciones de bar? ¿Tarifas de tiempo extra? ¿Restricciones de ruido/música y toque de queda? ¿Espacios para prepararse? ¿Accesibilidad para invitados discapacitados? ¿Referencias o reseñas recientes?'
    }
  },
  {
    id: 'all-inclusive',
    category: 'pricing',
    question: {
      en: 'Are all-inclusive packages worth it in Florida?',
      es: '¿Valen la pena los paquetes todo incluido en Florida?'
    },
    answer: {
      en: 'All-inclusive Florida wedding packages can be worth it for convenience and budget predictability. They typically include venue, catering, bar, coordinator, linens, and décor for a per-person price. Pros: Less planning stress, one vendor, known costs, often better deals. Cons: Less customization, may include services you don\'t need, locked into venue\'s vendors. Compare package costs to à la carte options. Best for couples wanting simplicity or destination weddings where coordinating multiple vendors is challenging.',
      es: 'Los paquetes de boda todo incluido en Florida pueden valer la pena por conveniencia y previsibilidad presupuestaria. Generalmente incluyen lugar, catering, bar, coordinador, mantelería y decoración por un precio por persona. Pros: Menos estrés de planificación, un proveedor, costos conocidos, a menudo mejores ofertas. Contras: Menos personalización, puede incluir servicios que no necesita, atado a los proveedores del lugar. Compare los costos del paquete con las opciones à la carte. Mejor para parejas que buscan simplicidad o bodas de destino donde coordinar múltiples proveedores es desafiante.'
    }
  },
  {
    id: 'tipping',
    category: 'general',
    question: {
      en: 'What is the tipping etiquette for Florida wedding vendors?',
      es: '¿Cuál es la etiqueta de propinas para proveedores de bodas en Florida?'
    },
    answer: {
      en: 'Florida wedding tipping guidelines: Venue coordinator: $250-$500 or 15-20% if exceptional service. Catering staff: 15-20% of food bill (check if gratuity is included). Bartenders: 10-15% or $50-$100 each. Photographer/Videographer: Optional, $100-$200 if exceptional. DJ/Band: $50-$150 per musician. Hair/Makeup: 15-20%. Delivery drivers: $20-$50 each. Officiant: $50-$100 donation if religious, $100-$500 if professional. Check contracts—some include gratuity.',
      es: 'Pautas de propinas para bodas en Florida: Coordinador del lugar: $250-$500 o 15-20% si el servicio es excepcional. Personal de catering: 15-20% de la factura de comida (verifique si la propina está incluida). Cantineros: 10-15% o $50-$100 cada uno. Fotógrafo/Videógrafo: Opcional, $100-$200 si es excepcional. DJ/Banda: $50-$150 por músico. Cabello/Maquillaje: 15-20%. Conductores de entrega: $20-$50 cada uno. Oficiante: donación de $50-$100 si es religioso, $100-$500 si es profesional. Verifique los contratos: algunos incluyen propina.'
    }
  },
  {
    id: 'insurance',
    category: 'general',
    question: {
      en: 'Do I need wedding insurance in Florida?',
      es: '¿Necesito seguro para bodas en Florida?'
    },
    answer: {
      en: 'Wedding insurance is highly recommended in Florida due to weather risks (hurricanes, tropical storms, rain). Policies cost $150-$550 and cover: Cancellation/postponement due to weather, illness, or venue issues. Liability insurance (often required by venues). Lost deposits from vendor bankruptcy. Damaged attire, gifts, or photos. Florida\'s hurricane season (June-November) makes coverage especially important. Many venues require $1-2 million liability coverage. Purchase policies 12-24 months before the wedding for best coverage.',
      es: 'El seguro de boda es muy recomendable en Florida debido a los riesgos climáticos (huracanes, tormentas tropicales, lluvia). Las pólizas cuestan $150-$550 y cubren: Cancelación/postergación debido al clima, enfermedad o problemas del lugar. Seguro de responsabilidad (a menudo requerido por los lugares). Depósitos perdidos por quiebra de proveedores. Vestimenta, regalos o fotos dañadas. La temporada de huracanes de Florida (junio-noviembre) hace que la cobertura sea especialmente importante. Muchos lugares requieren cobertura de responsabilidad de $1-2 millones. Compre pólizas 12-24 meses antes de la boda para mejor cobertura.'
    }
  }
];

/**
 * Get FAQs by category
 */
export function getFAQsByCategory(category: FAQItem['category']): FAQItem[] {
  return faqData.filter(faq => faq.category === category);
}

/**
 * Get all FAQ categories
 */
export function getAllCategories(): FAQItem['category'][] {
  return ['booking', 'pricing', 'planning', 'venues', 'vendors', 'general'];
}

/**
 * Get category label in specified language
 */
export function getCategoryLabel(category: FAQItem['category'], language: 'en' | 'es'): string {
  const labels = {
    booking: { en: 'Booking & Timing', es: 'Reservas y Tiempo' },
    pricing: { en: 'Pricing & Budget', es: 'Precios y Presupuesto' },
    planning: { en: 'Wedding Planning', es: 'Planificación de Bodas' },
    venues: { en: 'Venue Details', es: 'Detalles del Lugar' },
    vendors: { en: 'Vendors & Services', es: 'Proveedores y Servicios' },
    general: { en: 'General Questions', es: 'Preguntas Generales' }
  };
  
  return labels[category][language];
}
