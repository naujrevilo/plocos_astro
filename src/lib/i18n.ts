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
    terms: string;
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
    contactLabel: string;
    rss: string;
    terms: string;
    donate: string;
    follow: string;
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
    pagination: {
      ariaLabel: string;
      previous: string;
      next: string;
      pageLabel: string;
    };
  };
  contact: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    intro: string;
    channelsHeading: string;
    emailLabel: string;
    donationHeading: string;
    donationDescription: string;
    donationButtonLabel: string;
    donationNotice: string;
    socialHeading: string;
    socialDescription: string;
    note: string;
    formHeading: string;
    formDescription: string;
    formNameLabel: string;
    formEmailLabel: string;
    formMessageLabel: string;
    formSubmitLabel: string;
    formPrivacy: string;
    formSpamLabel: string;
  };
  about: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    paragraphs: string[];
  };
  categories: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    description: string[];
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
      terms: 'terms',
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
    comments: {
      heading: string;
      description: string;
      empty: string;
      pending: string;
      success: string;
      error: string;
      nameLabel: string;
      emailLabel: string;
      messageLabel: string;
      submitLabel: string;
      moderationNotice: string;
    };
  };
  terms: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    updatedLabel: string;
    updatedValue: string;
    introduction: string;
  sections: { heading: string; body: string; bullets?: string[] }[];
    contactNotice: string;
    contactLinkLabel: string;
  };
}

export const translations: Record<Locale, Translation> = {
  es: {
    site: {
      title: 'Plocos',
      description: 'Colección digital de arte, ideas y narrativas de Plocos.',
      localeNames: {
        es: 'Español',
        en: 'English',
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
      terms: 'terminos',
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
      contactLabel: 'Correo',
      rss: 'RSS',
      terms: 'Términos del sitio',
      donate: 'Apoyar con PayPal',
      follow: 'Redes sociales',
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
      pagination: {
        ariaLabel: 'Paginación de entradas del blog',
        previous: 'Anterior',
        next: 'Siguiente',
        pageLabel: 'Página {{page}}',
      },
    },
    contact: {
      metaTitle: 'Contacto · Plocos',
      metaDescription: 'Puntos de contacto con el archivo Plocos.',
      title: 'Contacto',
      intro:
        'Plocos es un laboratorio vivo que abraza el intercambio crítico y la colaboración creativa. Escríbenos para conversar sobre exposiciones, publicaciones, residencias o proyectos educativos.',
  channelsHeading: 'Canales activos',
  emailLabel: 'Correo electrónico',
      donationHeading: 'Apoyo y donaciones',
      donationDescription:
        'Si quieres impulsar nuevas residencias, publicaciones o líneas de investigación en Plocos, puedes realizar un aporte único mediante PayPal. Cada contribución fortalece este archivo comunitario.',
      donationButtonLabel: 'Donar con PayPal',
      donationNotice:
        'La cuenta receptora temporal en PayPal es {{email}} mientras actualizamos la infraestructura de donaciones.',
      socialHeading: 'Redes y comunidad',
      socialDescription:
        'Sigue el proceso creativo, las exposiciones itinerantes y las activaciones educativas de Plocos en estos espacios digitales.',
      note:
        'Respondemos a cada mensaje en un máximo de 72 horas hábiles. Si tu solicitud es urgente, indica el plazo en el asunto del correo.',
      formHeading: 'Escríbenos desde el sitio',
      formDescription:
        'Completa este formulario y coordinaremos la respuesta según el tipo de proyecto. Si prefieres escribir directamente, también puedes usar el correo electrónico.',
      formNameLabel: 'Nombre',
      formEmailLabel: 'Correo de contacto',
      formMessageLabel: 'Mensaje',
      formSubmitLabel: 'Enviar mensaje',
      formPrivacy:
        'Al enviar aceptas que usemos tu información solo para responder esta conversación. No compartimos datos con terceros.',
      formSpamLabel: 'Déjalo en blanco y omite este campo (antispam)',
    },
    about: {
      metaTitle: 'Nuestra razón de ser · Plocos',
      metaDescription: 'Propósito y visión del archivo Plocos.',
      title: 'Nuestra razón de ser',
      paragraphs: [
        'No es únicamente un término de mi ideación, o la idea que origino esta propuesta virtual, es el ancla para generar nuevos pensamientos o inclusive, ideas. Un "Bloque de Pensamiento" (fusión de las palabras pensamiento del español y bloc del francés), y elemento central de este portal de arte y filosofía.',
        'Es una pieza de contenido, ya sea un argumento riguroso, una elucubración textual o un verso simbólico, diseñada para desatar la reflexión en el lector. Nace con la intención de establecer un diálogo distinto, de modo sintético y universal. En sus formas más concisas, puede presentarse como una única imagen o verso que ofrece un concepto denso y concreto que el lector puede integrar a su propia experiencia, transformando o enriqueciendo su pensar.',
        'Es una apuesta deliberada por la revelación sobre la simple narrativa, que busca convertir la distracción en una conexión profundamente pertinente. Su brevedad es deliberada; no busca ser "fácil", sino potente. Son piezas refinadas que pretenden un "anclaje" conceptual con una inversión de tiempo corta, buscando la conexión estética o intelectual inmediata.',        
      ],
    },
    categories: {
      metaTitle: 'Categorías · Plocos',
      metaDescription: 'Explora las categorías que organizan la obra de Plocos.',
      title: 'Categorías',
      description: [
        'Se toparán con categorías tituladas en latín; por ejemplo, "Ex lateribus cogite" que traduce: Piensa desde los lados/fuera del molde. Selecciones, cuya pretensión no es confundir, sino crear un espacio que busca posicionarse como intelectual y reflexivo.',
        'No solo visual ya que es analítico y discursivo. Donde se estilan conceptos que valoran la escritura ya sea como herramienta de análisis (filosofía) o como fin en sí misma (arte).',
        'Procuré mantener una redacción culta, articulada y soportada en una base de lectura filosófica, conservando una originalidad conceptual. En ellas, encontrarán el ploco, (Bloque de pensamiento), que aborda temas complejos desde ángulos frescos.',
      ],
      badge: 'Categoría',
      backLink: '← Todas las categorías',
      empty: 'No hay publicaciones asociadas aún, prueba el buscador o explora otras categorías.',
        fallbackDescriptionPrefix: 'Archivo',
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
        terms: 'terms',
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
      comments: {
        heading: 'Comentarios',
        description:
          'Participa en la conversación con respeto y contexto. Cada aporte pasa por moderación editorial antes de publicarse.',
        empty: 'Aún no hay comentarios publicados. Sé la primera persona en escribir.',
        pending:
          'Comentario recibido. Lo revisaremos antes de publicarlo para cuidar el archivo.',
        success: '¡Gracias por aportar a la conversación!',
        error:
          'No pudimos enviar tu comentario. Intenta de nuevo en unos minutos o contáctanos directamente.',
        nameLabel: 'Nombre',
        emailLabel: 'Correo (opcional, solo para responderte)',
        messageLabel: 'Comentario',
        submitLabel: 'Enviar comentario',
        moderationNotice:
          'Moderamos cada comentario para asegurar que la conversación se mantenga respetuosa y acorde con la línea editorial de Plocos.',
      },
    },
    terms: {
      metaTitle: 'Términos del sitio · Plocos',
      metaDescription:
        'Condiciones de uso y lineamientos editoriales del archivo digital Plocos.',
      title: 'Términos del sitio',
      updatedLabel: 'Última actualización',
      updatedValue: '8 de noviembre de 2025',
      introduction:
        'Al acceder a Plocos aceptas los lineamientos que protegen este archivo y orientan su uso responsable.',
      sections: [
        {
          heading: 'Uso editorial del contenido',
          body:
            'Las obras publicadas en Plocos —textos, imágenes y cualquier expresión artística— son propiedad exclusiva del autor salvo indicación contraria. El archivo se ofrece para consulta personal, educativa y cultural; cualquier reutilización requiere autorización escrita solicitada por los canales de contacto oficiales.',
        },
        {
          heading: 'Usos expresamente prohibidos',
          body:
            'No está permitido distribuir ni alojar el material de Plocos en soportes que vulneren la ética de este archivo. En particular, queda prohibido reutilizarlo en proyectos que:',
          bullets: [
            'Infrinjan o contravengan la dignidad humana y sus principios.',
            'Violen los derechos de niños, niñas y adolescentes.',
            'Sean inconstitucionales o contrarios a la ley.',
            'Limiten la libertad de expresión en cualquiera de sus formas.',
            'Promuevan violencia, explotación sexual, terrorismo, racismo, obscenidad o material pornográfico.',
            'Difundan enlaces P2P, torrents, descargas directas u otros esquemas destinados a lucrar con material protegido.',
          ],
        },
        {
          heading: 'Derechos de autor',
          body:
            'Toda obra conserva sus derechos. Cualquier reproducción aprobada debe citar la fuente, preservar la integridad de la pieza y respetar el contexto original.',
        },
        {
          heading: 'Contribuciones y comentarios',
          body:
            'Si compartes material o anotaciones con el archivo, podremos ajustar estilo y formato para mantener la coherencia editorial. El envío de contenido implica que cuentas con los permisos necesarios.',
        },
        {
          heading: 'Responsabilidad editorial',
          body:
            'El uso que terceras personas hagan del contenido —con o sin nuestro consentimiento— no implica respaldo de sus opiniones, mensajes o posturas. Rechazamos cualquier interpretación que busque vincular a Plocos con agendas ajenas.',
        },
        {
          heading: 'Privacidad y datos',
          body:
            'No recolectamos datos personales más allá de la información indispensable para responder tus mensajes. Las métricas anónimas se revisan periódicamente para mejorar la experiencia.',
        },
      ],
      contactNotice:
        'Si necesitas claridad adicional o deseas tramitar permisos específicos, contáctanos y revisaremos tu solicitud.',
      contactLinkLabel: 'Ir a contacto',
    },
  },
  en: {
    site: {
      title: 'Plocos',
      description: 'Digital collection of Plocos art, ideas, and narratives.',
      localeNames: {
        es: 'Español',
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
      terms: 'terms',
    },
    navigation: [
      { id: 'home', label: 'Home', path: '' },
      { id: 'categories', label: 'Categories', path: 'categories' },
      { id: 'blog', label: 'Blog', path: 'blog' },
      { id: 'contact', label: 'Contact', path: 'contact' },
      { id: 'about', label: 'Our reason for being', path: 'our-purpose' },
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
      contactLabel: 'Email',
      rss: 'RSS',
      terms: 'Site terms',
      donate: 'Support via PayPal',
      follow: 'Social',
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
      pagination: {
        ariaLabel: 'Blog pagination',
        previous: 'Previous',
        next: 'Next',
        pageLabel: 'Page {{page}}',
      },
    },
    contact: {
      metaTitle: 'Contact · Plocos',
      metaDescription: 'Contact points for the Plocos archive.',
      title: 'Contact',
      intro:
        'Plocos is a living laboratory that embraces critical exchange and creative collaboration. Write to us about exhibitions, publications, residencies, or educational projects.',
  channelsHeading: 'Active channels',
  emailLabel: 'Email',
      donationHeading: 'Support and donations',
      donationDescription:
        'If you want to fuel new residencies, publications, or research lines at Plocos, you can make a one-time contribution through PayPal. Every contribution nurtures this community archive.',
      donationButtonLabel: 'Donate with PayPal',
      donationNotice:
        'The temporary PayPal receiving account is {{email}} while we update our donation infrastructure.',
      socialHeading: 'Social channels',
      socialDescription:
        'Follow Plocos’ creative process, traveling exhibitions, and educational activations across these spaces.',
      note:
        'We reply to every message within 72 business hours. If your request is time-sensitive, include the deadline in the email subject.',
      formHeading: 'Write to us from the site',
      formDescription:
        'Fill out this form and we will coordinate the response according to the nature of your project. If you prefer, you can also email us directly.',
      formNameLabel: 'Name',
      formEmailLabel: 'Contact email',
      formMessageLabel: 'Message',
      formSubmitLabel: 'Send message',
      formPrivacy:
        'By submitting you agree that we will use your information only to continue this conversation. We do not share data with third parties.',
      formSpamLabel: 'Leave this field empty (spam protection)',
    },
    about: {
      metaTitle: 'Our reason for being · Plocos',
      metaDescription: 'Purpose and vision of the Plocos archive.',
      title: 'Our reason for being',
      paragraphs: [
        'It is not merely a term of my own invention, or the idea that gave rise to this virtual proposal; it is the anchor for generating new thoughts or even ideas. A "Thought Block" (a fusion of the Spanish word "pensamiento" and the French word "bloc"), and the central element of this art and philosophy portal.',
        'It is a piece of content, whether a rigorous argument, a textual elaboration or a symbolic verse, designed to spark reflection in the reader. It was created with the intention of establishing a different dialogue, in a synthetic and universal way. In its most concise forms, it can be presented as a single image or verse that offers a dense and concrete concept that the reader can integrate into their own experience, transforming or enriching their thinking.',
        'It is a deliberate commitment to revelation over simple narrative, seeking to turn distraction into a deeply relevant connection. Its brevity is deliberate; it does not seek to be "easy", but powerful. These are refined pieces that aim for a conceptual "anchor" with a short investment of time, seeking immediate aesthetic or intellectual connection.',
      ],
    },
    categories: {
      metaTitle: 'Categories · Plocos',
      metaDescription: 'Explore the categories that organize Plocos’ work.',
      title: 'Categories',
      description: [
        'You will encounter categories with Latin titles; for example, "Ex lateribus cogite", which translates as: Think outside the box. Selections, whose aim is not to confuse, but to create a space that seeks to position itself as intellectual and reflective.',
        'Not only visual, as it is analytical and discursive. Where concepts that value writing are used, either as a tool for analysis (philosophy) or as an end in itself (art).',
        'I tried to maintain a cultured, articulate style based on philosophical reading, while preserving conceptual originality. In them, you will find the ploco (thought block), which addresses complex issues from fresh angles.',
      ],
      badge: 'Category',
      backLink: '← All categories',
      empty: 'There are no publications yet. Try the search bar or explore other categories.',
      fallbackDescriptionPrefix: 'Archive',
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
        terms: 'terms',
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
        comments: {
          heading: 'Comments',
          description:
            'Join the conversation with context and respect. Every contribution goes through editorial moderation before it appears.',
          empty: 'No comments have been published yet. Be the first to share your thoughts.',
          pending: 'Comment received. We will review it before publishing to safeguard the archive.',
          success: 'Thanks for contributing to the conversation!',
          error:
            'We could not send your comment. Please try again shortly or reach out via email.',
          nameLabel: 'Name',
          emailLabel: 'Email (optional, used only to reply)',
          messageLabel: 'Comment',
          submitLabel: 'Post comment',
          moderationNotice:
            'We moderate each comment to keep the discussion aligned with Plocos’ editorial standards.',
        },
    },
    terms: {
      metaTitle: 'Site Terms · Plocos',
      metaDescription:
        'Usage guidelines and editorial policies for the Plocos digital archive.',
      title: 'Site Terms',
      updatedLabel: 'Last updated',
      updatedValue: 'November 8, 2025',
      introduction:
        'By accessing Plocos you agree to the guidelines that protect this archive and ensure responsible use.',
      sections: [
        {
          heading: 'Editorial use of the content',
          body:
            'Works published on Plocos—texts, images, and every form of artistic expression—remain the exclusive property of the author unless otherwise noted. The archive is provided for personal, educational, and cultural reference; any reuse requires written permission requested through our official contact channels.',
        },
        {
          heading: 'Explicitly prohibited uses',
          body:
            'The material may not be distributed or hosted in contexts that compromise the ethics of this archive. In particular, it cannot be reused in projects that:',
          bullets: [
            'Infringe or undermine human dignity and its principles.',
            'Violate the rights of children and adolescents.',
            'Are unconstitutional or unlawful.',
            'Restrict freedom of expression in any of its forms.',
            'Promote violence, sexual exploitation, terrorism, racism, obscenity, or pornographic material.',
            'Distribute P2P links, torrents, direct downloads, or other schemes intended to profit from copyrighted works.',
          ],
        },
        {
          heading: 'Copyright',
          body:
            'Every work retains its copyright. Any approved reproduction must credit the source, preserve the integrity of the piece, and respect the original context.',
        },
        {
          heading: 'Contributions and feedback',
          body:
            'When you share materials or notes with the archive, we may adjust style and formatting to maintain editorial coherence. Submitting content assumes you hold the necessary permissions.',
        },
        {
          heading: 'Editorial responsibility',
          body:
            'The way third parties use this content—whether or not we granted permission—does not imply that Plocos endorses their opinions, messages, or agendas. We reject any interpretation that attempts to link the archive to unrelated initiatives.',
        },
        {
          heading: 'Privacy and data',
          body:
            'We do not collect personal data beyond what is essential to reply to your messages. Anonymous metrics are reviewed periodically to improve the experience.',
        },
      ],
      contactNotice:
        'If you need further clarification or want to process specific permissions, get in touch and we will review your request.',
      contactLinkLabel: 'Contact us',
    },
  },
};

export function getTranslations(locale?: string) {
  if (locale && locale in translations) {
    return translations[locale as Locale];
  }
  return translations[defaultLocale];
}

export function getLocalePath(_locale: Locale, path: string) {
  return path.startsWith('/') ? path.slice(1) : path;
}
