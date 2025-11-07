export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'es';

interface NavigationItem {
  id: 'home' | 'categories' | 'blog' | 'contact' | 'about';
  label: string;
  path: string;
}

interface Translation {
  site: {
    title: string;
    description: string;
    localeNames: Record<Locale, string>;
    language: {
      label: string;
      srLabel: string;
    };
  };
  paths: {
    home: string;
    blog: string;
    categories: string;
    contact: string;
    about: string;
    labels: string;
    posts: string;
  };
  navigation: NavigationItem[];
  search: {
    label: string;
    placeholder: string;
    empty: string;
    error: string;
  };
  theme: {
    srLabel: string;
    ariaLabel: string;
    options: { value: 'light' | 'dark' | 'system'; label: string }[];
  };
  footer: {
    rights: string;
    archive: string;
    contactEmail: string;
    rss: string;
  };
  home: {
    metaTitle: string;
    metaDescription: string;
    strapline: string;
    heading: string;
    description: string;
    tags: string[];
    cta: string;
  };
  blog: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    description: string;
  };
  contact: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    intro: string;
    channelsHeading: string;
    emailLabel: string;
    originalArchiveLabel: string;
    note: string;
  };
  about: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    paragraphs: string[];
    principlesHeading: string;
    principles: string[];
  };
  categories: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    description: string;
    badge: string;
    backLink: string;
    empty: string;
    count: { singular: string; plural: string };
    fallbackDescriptionPrefix: string;
  };
  labelsList: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    description: string;
    badge: string;
    count: { singular: string; plural: string };
  };
  labelsDetail: {
    backLink: string;
    badge: string;
    count: { singular: string; plural: string };
    descriptionPrefix: string;
  };
  posts: {
    backToHome: string;
    updatedPrefix: string;
    originalLabel: string;
    footerNote: string;
    imageAlt: string;
    defaultDescriptionPrefix: string;
    navigation: {
      heading: string;
      previous: string;
      next: string;
    };
    share: {
      heading: string;
      x: string;
      facebook: string;
      instagram: string;
      email: string;
    };
  };
}

export const translations: Record<Locale, Translation> = {
  es: {
    site: {
      title: 'Plocos',
      description: 'Colección digital de arte, ideas y narrativas de Plocos.',
      localeNames: {
        es: 'Español',
        en: 'Inglés',
      },
      language: {
        label: 'Idioma',
        srLabel: 'Seleccionar idioma',
      },
    },
    paths: {
      home: '',
      blog: 'blog',
      categories: 'categorias',
      contact: 'contacto',
      about: 'nuestra-razon-de-ser',
      labels: 'labels',
      posts: 'posts',
    },
    navigation: [
      { id: 'home', label: 'Inicio', path: '' },
      { id: 'categories', label: 'Categorías', path: 'categorias' },
      { id: 'blog', label: 'Blog', path: 'blog' },
      { id: 'contact', label: 'Contacto', path: 'contacto' },
      { id: 'about', label: 'Nuestra razón de ser', path: 'nuestra-razon-de-ser' },
    ],
    search: {
      label: 'Buscar en Plocos',
      placeholder: 'Buscar artículos, etiquetas o ideas',
      empty: 'No se encontraron coincidencias. Ajusta los términos o explora una categoría.',
      error: 'Ocurrió un error al cargar el buscador. Intenta nuevamente.',
    },
    theme: {
      srLabel: 'Modo de tema',
      ariaLabel: 'Seleccionar modo de tema',
      options: [
        { value: 'light', label: 'Claro' },
        { value: 'dark', label: 'Oscuro' },
        { value: 'system', label: 'Sistema' },
      ],
    },
    footer: {
      rights: 'Todos los derechos reservados.',
      archive: 'Archivo original',
      contactEmail: 'contacto@plocos.com',
      rss: 'RSS',
    },
    home: {
      metaTitle: 'Plocos · Arte, ideas y narrativas',
      metaDescription: 'Archivo moderno de Plocos con contenido curado, arte y reflexiones.',
      strapline: 'Filosofía · Arte · Cartagena',
      heading: 'Pensamiento crítico, poesía visual y memoria viva de Plocos.',
      description:
        'Un laboratorio de ideas donde conviven manifiestos, ilustraciones y crónicas sensoriales. Recorre la voz de Plocos a través de archivos curados, experiencias sinestésicas y rutas de contemplación.',
      tags: ['Ensayos lumínicos', 'Poética visual', 'Bitácora crítica'],
      cta: 'Explorar todas las categorías',
    },
    blog: {
      metaTitle: 'Blog · Plocos',
      metaDescription: 'Listado completo de publicaciones de Plocos.',
      title: 'Blog',
      description:
        'Explora todas las entradas publicadas en el archivo. Usa el buscador superior para ir directo a palabras clave, etiquetas o preguntas específicas.',
    },
    contact: {
      metaTitle: 'Contacto · Plocos',
      metaDescription: 'Puntos de contacto con el archivo Plocos.',
      title: 'Contacto',
      intro:
        'Plocos es un laboratorio vivo que abraza el intercambio crítico y la colaboración creativa. Escríbenos para conversar sobre exposiciones, publicaciones, residencias o proyectos educativos.',
      channelsHeading: 'Canales activos',
      emailLabel: 'Correo electrónico',
      originalArchiveLabel: 'Archivo original',
      note:
        'Si buscas licencias de obra, colaboraciones curatoriales o material pedagógico, comparte el contexto y los plazos estimados para responder con la precisión que mereces.',
    },
    about: {
      metaTitle: 'Nuestra razón de ser · Plocos',
      metaDescription: 'Propósito y visión del archivo Plocos.',
      title: 'Nuestra razón de ser',
      paragraphs: [
        'Plocos es un territorio creativo donde la filosofía dialoga con la imagen, la poesía y la memoria caribe. Esta versión digital ofrece una experiencia pensada para la lectura lenta, la contemplación y el pensamiento crítico.',
        'Cada texto, ilustración y manifiesto se publica en un formato legible, con tipografías cálidas, colores evocadores y fichas curatoriales que facilitan la investigación. Las categorías permiten navegar por temas, símbolos y recorridos emocionales.',
        'El panel editorial basado en Decap CMS facilita la creación colaborativa de nuevos episodios, autores invitados y rutas temáticas, mientras que Astro asegura un sitio estático veloz y sostenible preparado para preservarse en el tiempo.',
      ],
      principlesHeading: 'Principios de diseño',
      principles: [
        'Luz tenue y contrastes mesurados para priorizar la lectura reflexiva.',
        'Estructura modular que conecta categorías, autores y líneas curatoriales.',
        'Experiencia accesible con soporte para modos claro, oscuro y sistema.',
        'Flujo editorial simple basado en Markdown para mantener viva la voz de Plocos.',
      ],
    },
    categories: {
      metaTitle: 'Categorías · Plocos',
      metaDescription: 'Explora las categorías curatoriales que organizan la obra de Plocos.',
      title: 'Categorías curatoriales',
      description:
        'Cada categoría es una puerta de entrada al archivo: manifiestos filosóficos, diarios lumínicos, exhibiciones, instructivos y refranes que componen la memoria de Plocos.',
      badge: 'Categoría',
      backLink: '← Todas las categorías',
      empty: 'No hay publicaciones asociadas aún, prueba el buscador o explora otras categorías.',
        fallbackDescriptionPrefix: 'Archivo curatorial',
      count: {
        singular: 'publicación seleccionada.',
        plural: 'publicaciones seleccionadas.',
      },
    },
    labelsList: {
      metaTitle: 'Etiquetas · Plocos',
      metaDescription: 'Explora las etiquetas y conceptos que atraviesan el archivo de Plocos.',
      title: 'Etiquetas del archivo',
      description:
        'Descubre el archivo completo de Plocos filtrado por etiquetas temáticas, símbolos recurrentes y proyectos curatoriales. Selecciona una etiqueta para profundizar en sus publicaciones.',
      badge: 'Etiqueta',
      count: {
        singular: 'publicación',
        plural: 'publicaciones',
      },
    },
    labelsDetail: {
      backLink: '← Todas las etiquetas',
      badge: 'Etiqueta',
      count: {
        singular: 'publicación asociada a esta etiqueta.',
        plural: 'publicaciones asociadas a esta etiqueta.',
      },
      descriptionPrefix: 'Publicaciones etiquetadas como',
    },
    posts: {
      backToHome: '← Volver al inicio',
      updatedPrefix: 'Actualizado el',
      originalLabel: 'Publicación original',
      footerNote: 'Reflexiones y arte por Plocos.',
      imageAlt: 'Ilustración de',
      defaultDescriptionPrefix: 'Entrada publicada el',
      navigation: {
        heading: 'Navegación',
        previous: '← Publicación anterior',
        next: 'Siguiente publicación →',
      },
      share: {
        heading: 'Compartir',
        x: 'Compartir en X',
        facebook: 'Compartir en Facebook',
        instagram: 'Compartir en Instagram',
        email: 'Enviar por correo',
      },
    },
  },
  en: {
    site: {
      title: 'Plocos',
      description: 'Digital collection of Plocos art, ideas, and narratives.',
      localeNames: {
        es: 'Spanish',
        en: 'English',
      },
      language: {
        label: 'Language',
        srLabel: 'Select language',
      },
    },
    paths: {
      home: '',
      blog: 'blog',
      categories: 'categories',
      contact: 'contact',
      about: 'our-purpose',
      labels: 'labels',
      posts: 'posts',
    },
    navigation: [
      { id: 'home', label: 'Home', path: '' },
      { id: 'categories', label: 'Categories', path: 'categories' },
      { id: 'blog', label: 'Blog', path: 'blog' },
      { id: 'contact', label: 'Contact', path: 'contact' },
      { id: 'about', label: 'Our purpose', path: 'our-purpose' },
    ],
    search: {
      label: 'Search Plocos',
      placeholder: 'Search articles, tags, or ideas',
      empty: 'No matches found. Adjust your terms or explore a category.',
      error: 'An error occurred while loading search. Please try again.',
    },
    theme: {
      srLabel: 'Theme mode',
      ariaLabel: 'Select theme mode',
      options: [
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'system', label: 'System' },
      ],
    },
    footer: {
      rights: 'All rights reserved.',
      archive: 'Original archive',
      contactEmail: 'contact@plocos.com',
      rss: 'RSS',
    },
    home: {
      metaTitle: 'Plocos · Art, ideas, and narratives',
      metaDescription: 'Plocos modern archive with curated content, art, and reflections.',
      strapline: 'Philosophy · Art · Cartagena',
      heading: 'Critical thinking, visual poetry, and the living memory of Plocos.',
      description:
        'A laboratory of ideas where manifestos, illustrations, and sensorial chronicles coexist. Explore Plocos’ voice through curated archives, synesthetic experiences, and routes of contemplation.',
      tags: ['Luminous essays', 'Visual poetry', 'Critical logbook'],
      cta: 'Explore all categories',
    },
    blog: {
      metaTitle: 'Blog · Plocos',
      metaDescription: 'Complete list of published entries from Plocos.',
      title: 'Blog',
      description:
        'Browse every entry published in the archive. Use the search above to jump directly to keywords, tags, or specific questions.',
    },
    contact: {
      metaTitle: 'Contact · Plocos',
      metaDescription: 'Contact points for the Plocos archive.',
      title: 'Contact',
      intro:
        'Plocos is a living laboratory that embraces critical exchange and creative collaboration. Write to us about exhibitions, publications, residencies, or educational projects.',
      channelsHeading: 'Active channels',
      emailLabel: 'Email',
      originalArchiveLabel: 'Original archive',
      note:
        'For licensing, curatorial collaborations, or educational material, share the context and timeline so we can respond with the care you deserve.',
    },
    about: {
      metaTitle: 'Our purpose · Plocos',
      metaDescription: 'Purpose and vision of the Plocos archive.',
      title: 'Our purpose',
      paragraphs: [
        'Plocos is a creative territory where philosophy converses with image, poetry, and Caribbean memory. This digital version is designed for slow reading, contemplation, and critical thinking.',
        'Each text, illustration, and manifesto is published in a legible format with warm typography, evocative colors, and curatorial cards that support research. Categories allow you to navigate themes, symbols, and emotional journeys.',
        'The Decap CMS editorial panel enables collaborative creation of new episodes, guest authors, and thematic routes, while Astro keeps the site fast, sustainable, and ready to be preserved over time.',
      ],
      principlesHeading: 'Design principles',
      principles: [
        'Subtle light and measured contrast to prioritize reflective reading.',
        'Modular structure connecting categories, authors, and curatorial lines.',
        'Accessible experience with support for light, dark, and system modes.',
        'Simple Markdown-based editorial flow to keep Plocos’ voice alive.',
      ],
    },
    categories: {
      metaTitle: 'Categories · Plocos',
      metaDescription: 'Explore the curatorial categories that organize Plocos’ work.',
      title: 'Curatorial categories',
      description:
        'Each category is a portal into the archive: philosophical manifestos, luminous diaries, exhibitions, instructions, and sayings that shape Plocos’ memory.',
      badge: 'Category',
      backLink: '← All categories',
      empty: 'There are no publications yet. Try the search bar or explore other categories.',
      fallbackDescriptionPrefix: 'Curatorial archive',
      count: {
        singular: 'selected publication.',
        plural: 'selected publications.',
      },
    },
    labelsList: {
      metaTitle: 'Tags · Plocos',
      metaDescription: 'Explore the tags and concepts that weave through the Plocos archive.',
      title: 'Archive tags',
      description:
        'Browse Plocos’ entire archive filtered by thematic tags, recurring symbols, and curatorial projects. Choose a tag to dive deeper into its publications.',
      badge: 'Tag',
      count: {
        singular: 'publication',
        plural: 'publications',
      },
    },
    labelsDetail: {
      backLink: '← All tags',
      badge: 'Tag',
      count: {
        singular: 'publication associated with this tag.',
        plural: 'publications associated with this tag.',
      },
      descriptionPrefix: 'Entries tagged as',
    },
    posts: {
      backToHome: '← Back to home',
      updatedPrefix: 'Updated on',
      originalLabel: 'Original publication',
      footerNote: 'Reflections and art by Plocos.',
      imageAlt: 'Illustration of',
      defaultDescriptionPrefix: 'Entry published on',
      navigation: {
        heading: 'Navigation',
        previous: '← Previous entry',
        next: 'Next entry →',
      },
      share: {
        heading: 'Share',
        x: 'Share on X',
        facebook: 'Share on Facebook',
        instagram: 'Share on Instagram',
        email: 'Send by email',
      },
    },
  },
};

export function getTranslations(locale?: string) {
  if (locale && locale in translations) {
    return translations[locale as Locale];
  }
  return translations[defaultLocale];
}

export function getLocalePath(locale: Locale, path: string) {
  return path.startsWith('/') ? path.slice(1) : path;
}
