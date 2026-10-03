import pactoEsData from '../content/_data/pacto.es.json';
import pactoEnData from '../content/_data/pacto.en.json';

/**
 * Pre-existing legal-review markers preserved per REQ-pacto-15. These 9
 * markers were inline in the legacy 11-section en.terms which was replaced
 * by the 8-section pacto.en.json at WU1 T1.2. The literal marker text is
 * preserved here as a production-gate artefact; the legacy bodies themselves
 * have been retired in favour of the new 8-section pacto client text
 * (Engram observation #99).
 *
 * The 5 markers in en.privacy remain inline. Total preserved = 14.
 * PR2 adds 8 new markers (one per translated pacto section) -> 22.
 */
export const PRESERVED_LEGACY_EN_PACTO_MARKERS: readonly string[] = [
  '[EN: TODO legal review by Colombian attorney]', // 1. Nature and editorial purpose
  '[EN: TODO legal review by Colombian attorney]', // 2. Sensitive content notice
  '[EN: TODO legal review by Colombian attorney]', // 3. Minimum age and capacity
  '[EN: TODO legal review by Colombian attorney]', // 4. Subscriptions, payments, and refunds
  '[EN: TODO legal review by Colombian attorney]', // 5. Anti-AI and anti-scraping protection
  '[EN: TODO legal review by Colombian attorney]', // 7. Access revocation
  '[EN: TODO legal review by Colombian attorney]', // 8. Intellectual property
  '[EN: TODO legal review by Colombian attorney]', // 9. Contributions, comments, and moderation
  '[EN: TODO legal review by Colombian attorney]', // 11. Applicable law and jurisdiction
];

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
    book: string;
    auditores: string;
    repositorio: string;
    contact: string;
    suscripcion: string;
    terms: string;
    privacy: string;
    cookiePolicy: string;
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
    rss: string;
    terms: string;

    follow: string;
    manageCookies: string;
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
  consent: {
    headline: string;
    description: string;
    acceptLabel: string;
    rejectLabel: string;
    manageLabel: string;
    preferencesTitle: string;
    saveLabel: string;
    cookiePolicyLink: string;
    privacyPolicyLink: string;
    categories: {
      essential: string;
      analytics: string;
    };
  };
  splash: {
    title: string;
    body: string;
    acknowledge: string;
    reject: string;
  };
  privacy: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    sections: { heading: string; body: string; bullets?: string[] }[];
    contactEmail: string;
    responseTimelines: { consultas: string; reclamos: string };
    retention: { category: string; period: string }[];
    arcoProcedure: string[];
  };
  cookiePolicy: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    intro: string;
    updatedLabel: string;
    updatedValue: string;
    categories: {
      heading: string;
      description: string;
      cookies: { name: string; provider: string; purpose: string; duration: string; party: 'first' | 'third' }[];
    }[];
    revocation: string[];
  };
  av: {
    collection: {
      title: string;
      description: string;
      empty: string;
      detailAlt: string;
      mediumLabel: string;
      dimensionsLabel: string;
      yearLabel: string;
      coverLabel: string;
      galleryLabel: string;
    };
  };
  editor: {
    appTitle: string;
    loginCta: string;
    collections: { posts: { label: string }; audiovisuales: { label: string } };
    saveSuccess: string;
    saveError: string;
  };
  auth: {
    signInLabel: string;
    signUpLabel: string;
    accountLabel: string;
    signOutLabel: string;
    subscriptionRequiredCta: string;
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
      book: 'libro',
      auditores: 'auditores',
      repositorio: 'repositorio',
      contact: 'contacto',
      suscripcion: 'suscripcion',
      terms: 'terminos',
      privacy: 'privacidad',
      cookiePolicy: 'politica-de-cookies',
    },
    navigation: [
      { id: 'home', label: 'Inicio', path: '' },
      { id: 'book', label: 'No más que la Vida', path: 'libro' },
      { id: 'auditores', label: 'Auditores', path: 'auditores' },
      { id: 'repositorio', label: 'Repositorio', path: 'repositorio' },
      { id: 'contact', label: 'Contacto', path: 'contacto' },
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
    search: {
      label: 'Search Plocos',
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
      rss: 'RSS',
      terms: 'Términos del sitio',
      follow: 'Redes sociales',
      manageCookies: 'Gestionar cookies',
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
    terms: pactoEsData as Translation['terms'],
    consent: {
      headline: 'Tu privacidad, tu decisión',
      description:
        'Usamos cookies para que el archivo funcione, medir el tráfico de forma anónima y recordar tus preferencias. Puedes aceptar todo, rechazar lo opcional o ajustar las categorías una por una.',
      acceptLabel: 'Aceptar todas',
      rejectLabel: 'Rechazar opcionales',
      manageLabel: 'Administrar preferencias',
      preferencesTitle: 'Administrar categorías de cookies',
      saveLabel: 'Guardar preferencias',
      cookiePolicyLink: 'Ver política de cookies',
      privacyPolicyLink: 'Ver política de privacidad',
      categories: {
        essential: 'Esenciales (siempre activas)',
        analytics: 'Analítica anonimizada',
      },
    },
    splash: {
      title: 'Aviso de contenido sensible',
      body:
        'Los textos y obras aquí expuestos transitan sin censura con contenido sensible. Si decide continuar, asume los términos de nuestros <a href="/terminos">Términos del Sitio</a>.',
      acknowledge: 'Entiendo, continuar',
      reject: 'Salir del sitio',
    },
    privacy: {
      metaTitle: 'Política de privacidad · Plocos',
      metaDescription:
        'Cómo Plocos trata los datos personales de suscriptores, colaboradores, auditores y visitantes conforme a la Ley 1581/2012 y al Decreto 1377/2013.',
      title: 'Política de privacidad',
      sections: [
        {
          heading: 'Responsable del tratamiento',
          body:
            'El responsable del tratamiento de los datos personales recogidos a través de este archivo es Michel Saer, con domicilio en Cartagena de Indias (Colombia) y canal de contacto habilitado en la dirección que aparece al final de esta política. Cualquier solicitud, queja o reclamo se puede presentar por ese mismo canal y será atendida en los plazos previstos por la Superintendencia de Industria y Comercio (SIC).',
        },
        {
          heading: 'Encargados del tratamiento',
          body:
            'Para operar la plataforma de suscripción al libro digital «No más que la Vida», Plocos contrata los siguientes encargados, quienes tratan datos personales exclusivamente según las finalidades descritas en esta política y bajo cláusulas contractuales que exigen garantías equivalentes o superiores a la legislación colombiana: (a) Clerk (autenticación y sesión); (b) PayPal y Wompi (procesamiento de pagos, dual según geografía del suscriptor); (c) Netlify (hosting y funciones serverless); (d) Resend (envío de correos transaccionales, aprobaciones, notificaciones de iteración); (e) Google Cloud Platform, donde Google Gemini procesa las anotaciones de los Colaboradores en el motor de triaje algorítmico. El detalle técnico de cada cookie y transferencia se publica en la Política de Cookies.',
        },
        {
          heading: 'Datos que tratamos',
          body:
            'Tratamos las siguientes categorías de datos personales según el tipo de usuario. Suscriptores (Lector o Colaborador): nombre, dirección de correo electrónico, número de celular, ciudad, país, género, fecha de nacimiento (para verificar mayoría de edad conforme al artículo 12 de la Ley 1581/2012), y los datos de facturación que la pasarela de pago retiene (Plocos no almacena números completos de tarjeta). Colaboradores y Auditores: además de los anteriores, las anotaciones topográficas que depositan en el Repositorio público (capítulo, párrafo, contenido, fecha) y, si otorgan consentimiento expreso, su dirección de correo electrónico visible junto a su seudónimo. Visitantes anónimos: únicamente los datos técnicos necesarios para servir el sitio (dirección IP, agente de usuario, idioma preferido). No vendemos, no cedemos y no enriquecemos datos con terceros con fines publicitarios.',
        },
        {
          heading: 'Datos del Repositorio público',
          body:
            'El Repositorio público indexa los aportes aprobados (anotaciones topográficas) y los datos del suscriptor que los depositó. El Colaborador puede, mediante el panel de control de su cuenta, decidir si su dirección de correo electrónico aparece públicamente asociada a sus aportes. Mientras el toggle esté activo, la autorización es expresa, previa e informada conforme al artículo 9 de la Ley 1581/2012. El Colaborador puede desactivar la visibilidad en cualquier momento; los aportes previamente indexados se anonimizan en la siguiente iteración del Repositorio.',
        },
        {
          heading: 'Finalidades y bases legales',
          body:
            'Los datos se utilizan para: (a) gestionar suscripciones, procesar pagos y entregar acceso al libro digital (base legal: ejecución del contrato); (b) moderar el Repositorio, ejecutar el motor de triaje y mantener la trazabilidad de los aportes (base legal: consentimiento del Colaborador y ejecución del Habeas Scriptum); (c) mantener la seguridad e integridad del archivo y prevenir usos abusivos (base legal: interés legítimo del editor); (d) medir el tráfico de forma agregada y mejorar la experiencia (base legal: consentimiento mediante el banner de cookies); (e) cumplir obligaciones legales y atender requerimientos de autoridades competentes (base legal: cumplimiento de un deber legal).',
        },
        {
          heading: 'Conservación de los datos',
          body:
            'Los plazos de conservación se aplican según la categoría y la finalidad del dato:',
        },
        {
          heading: 'Delegado de protección de datos',
          body:
            'El responsable del tratamiento designa como punto de contacto único para todas las cuestiones relativas al tratamiento de datos personales, incluyendo el ejercicio de derechos ARCO, a Michel Saer, contactable en expresatura@plocos.com. La SIC puede requerir el nombre del delegado en cualquier momento conforme al artículo 23 de la Ley 1581/2012.',
        },
        {
          heading: 'Derechos del visitante y del suscriptor',
          body:
            'Conforme a la Ley 1581/2012, todo titular puede ejercer en cualquier momento los derechos de Acceso, Rectificación, Cancelación y Oposición (derechos ARCO), y los derechos adicionales de supresión y portabilidad previstos en desarrollo normativo. Para hacerlo, basta con enviar una solicitud al canal de contacto habilitado. La cancelación (eliminación) de la cuenta se ejecuta en cascada: se elimina la fila en `users`, las suscripciones, las anotaciones del Repositorio y, en la siguiente iteración, los perfiles públicos asociados. El procedimiento es el siguiente:',
        },
        {
          heading: 'Transferencias internacionales',
          body:
            'Algunos proveedores tecnológicos que utilizamos pueden almacenar datos en servidores fuera de Colombia. En todos los casos exigimos garantías equivalentes o superiores a las previstas por la legislación colombiana (cláusulas contractuales tipo, decisiones de adecuación o certificaciones reconocidas). El listado actualizado de proveedores y países de tratamiento se publica en la Política de Cookies.',
        },
        {
          heading: 'Cambios a esta política',
          body:
            'El editor puede modificar esta política para reflejar cambios normativos, técnicos o editoriales. Las versiones anteriores se conservan y quedan disponibles para consulta. La fecha de la última actualización aparece al pie de esta misma página.',
        },
      ],
      contactEmail: 'expresatura@plocos.com',
      responseTimelines: {
        consultas: 'consultas generales en un máximo de diez (10) días hábiles',
        reclamos: 'reclamos formales en un máximo de quince (15) días hábiles',
      },
      retention: [
        {
          category: 'Cuenta de suscriptor',
          period: 'Mientras la suscripción esté activa. Al cancelar, los datos personales se eliminan en un máximo de treinta (30) días.',
        },
        {
          category: 'Anotaciones del Repositorio',
          period: 'Permanentes mientras el aporte esté aprobado e indexado, salvo que el titular solicite supresión (derecho ARCO de Cancelación).',
        },
        {
          category: 'Datos de facturación',
          period: 'Los retiene la pasarela de pago (PayPal o Wompi) según su propia política. Plocos conserva únicamente identificadores de transacción para cumplimiento fiscal (cinco años).',
        },
        {
          category: 'Mensajes de contacto',
          period: 'Mientras dure la conversación y hasta tres (3) años después para fines de trazabilidad editorial.',
        },
        {
          category: 'Cookies analíticas',
          period: 'Trece (13) meses desde la última visita o hasta que el visitante retire su consentimiento.',
        },
        {
          category: 'Registros de seguridad del servidor',
          period: 'Doce (12) meses para atender incidentes y requerimientos de autoridades.',
        },
      ],
      arcoProcedure: [
        'Escribir a expresatura@plocos.com indicando nombre completo, número de identificación y medio de contacto para respuesta.',
        'Describir con claridad la solicitud y, cuando aplique, los datos objeto de Acceso, Rectificación, Cancelación u Oposición.',
        'Adjuntar copia del documento de identidad o instrumento que acredite la representación, si actúa en nombre de un tercero.',
        'Recibir respuesta en los plazos previstos por la Superintendencia de Industria y Comercio (SIC).',
        'La cancelación elimina la cuenta y los datos personales en un máximo de treinta (30) días calendario desde la confirmación de la solicitud.',
      ],
    },
    cookiePolicy: {
      metaTitle: 'Política de cookies · Plocos',
      metaDescription:
        'Inventario de cookies y almacenamiento local utilizadas por la plataforma de suscripción Plocos: esenciales, autenticación, paywall, anotaciones, idioma, analítica anonimizada y protección anti-IA.',
      title: 'Política de cookies',
      intro:
        'Una cookie es un pequeño archivo de texto que un sitio web almacena en el dispositivo del visitante para recordar sus preferencias o medir el uso. Esta política describe las cookies y el almacenamiento local que Plocos utiliza, con qué fines y cómo administrarlas. Las cookies estrictamente necesarias y las de autenticación se cargan siempre porque hacen posible el funcionamiento de la plataforma; las demás requieren tu consentimiento.',
      updatedLabel: 'Última actualización',
      updatedValue: '2 de octubre de 2026',
      categories: [
        {
          heading: 'Estrictamente necesarias',
          description:
            'Habilitan funciones básicas como recordar tus preferencias de cookies, mantener la sesión entre páginas y proteger el sitio contra usos indebidos. No requieren consentimiento porque sin ellas la plataforma no podría operar.',
          cookies: [
            {
              name: 'astro-consent',
              provider: 'Plocos (integración astro-consent)',
              purpose: 'Almacenar las preferencias de consentimiento del visitante.',
              duration: '30 días desde la última actualización.',
              party: 'first',
            },
            {
              name: 'plocos-sensitive-content-acknowledged',
              provider: 'Plocos',
              purpose: 'Recordar que el visitante reconoció el aviso de contenido sensible.',
              duration: 'Persistente hasta que el visitante borre el almacenamiento del navegador.',
              party: 'first',
            },
          ],
        },
        {
          heading: 'Autenticación y sesión',
          description:
            'Permiten que un suscriptor (Lector, Colaborador o Auditor) mantenga la sesión iniciada, que el panel de cuenta refleje su rol y que el Habeas Scriptum quede registrado. Clerk es el encargado de tratarlas conforme a su propia política de privacidad.',
          cookies: [
            {
              name: '__session',
              provider: 'Clerk',
              purpose: 'Mantener la sesión del usuario entre páginas y protegerla contra falsificación.',
              duration: 'Sesión (cookie de sesión, se borra al cerrar el navegador).',
              party: 'first',
            },
            {
              name: '__client',
              provider: 'Clerk',
              purpose: 'Token de cliente para inicializar el SDK de Clerk en el navegador.',
              duration: '1 año.',
              party: 'first',
            },
          ],
        },
        {
          heading: 'Estado de paywall',
          description:
            'Permiten que el sistema recuerde qué iteración y qué capítulos ya fueron desbloqueados para el suscriptor, evitando que tenga que volver a pagar o reautenticarse en cada visita. Se almacenan en `localStorage` con clave opaca por seguridad.',
          cookies: [
            {
              name: 'plocos-paywall-iteration',
              provider: 'Plocos',
              purpose: 'Recordar la última iteración desbloqueada para evitar redirecciones redundantes al paywall.',
              duration: 'Persistente hasta que el visitante borre el almacenamiento del navegador.',
              party: 'first',
            },
            {
              name: 'plocos-paywall-chapter',
              provider: 'Plocos',
              purpose: 'Recordar el último capítulo accedido por el suscriptor.',
              duration: 'Persistente hasta que el visitante borre el almacenamiento del navegador.',
              party: 'first',
            },
          ],
        },
        {
          heading: 'Borrador de anotaciones',
          description:
            'Si un Colaborador empieza a redactar una anotación y la abandona sin enviarla, el sistema guarda el borrador en `localStorage` para que pueda retomarla al volver. No se envía al servidor hasta que el usuario hace clic explícito en «Enviar».',
          cookies: [
            {
              name: 'plocos-annotation-draft',
              provider: 'Plocos',
              purpose: 'Recuperar borradores de anotaciones no enviadas al recargar o cambiar de capítulo.',
              duration: '7 días desde la última edición o hasta que se envíe o descarte.',
              party: 'first',
            },
          ],
        },
        {
          heading: 'Preferencia de idioma',
          description:
            'Almacenan la elección de idioma del visitante (ES o EN) para evitar redirecciones innecesarias entre versiones localizadas. Se sincroniza con `Astro.currentLocale` para mantener consistencia con el flag de idioma del header.',
          cookies: [
            {
              name: 'plocos-locale',
              provider: 'Plocos',
              purpose: 'Recordar el idioma elegido por el visitante.',
              duration: '1 año.',
              party: 'first',
            },
          ],
        },
        {
          heading: 'Analítica anonimizada',
          description:
            'Nos permiten medir el tráfico de la plataforma de forma agregada, sin identificar individualmente a los suscriptores, para entender qué iteraciones se leen y cómo mejorar la experiencia. Si rechazas esta categoría, la plataforma sigue funcionando con normalidad.',
          cookies: [
            {
              name: '_ga',
              provider: 'Google Analytics 4',
              purpose: 'Generar un identificador anónimo para distinguir visitantes únicos.',
              duration: '13 meses desde la última visita.',
              party: 'third',
            },
            {
              name: '_ga_<container-id>',
              provider: 'Google Analytics 4',
              purpose: 'Almacenar el estado de sesión del identificador anónimo.',
              duration: '13 meses desde la última visita.',
              party: 'third',
            },
          ],
        },
        {
          heading: 'Protección anti-IA (informativa)',
          description:
            'Esta categoría no instala cookies. Su propósito es documentar las medidas técnicas adoptadas para impedir el uso del contenido en entrenamiento de inteligencia artificial (meta `noai, noimageai`, `robots.txt` con 8 user-agents bloqueados, cookies HTTP-only en acciones sensibles). Consulta la sección IV del Términos del Sitio.',
          cookies: [],
        },
      ],
      revocation: [
        'Abrir el enlace «Gestionar cookies» en el pie de página y modificar tus preferencias.',
        'Borrar manualmente la clave «astro-consent» del almacenamiento local del navegador desde las herramientas de desarrollador.',
        'Configurar tu navegador para bloquear o limitar cookies de terceros; ten en cuenta que algunas funciones de la plataforma pueden dejar de estar disponibles.',
        'Escribir a expresatura@plocos.com para solicitar asistencia personalizada o ejercer tu derecho ARCO de Cancelación (ver Política de Privacidad).',
      ],
    },
    av: {
      collection: {
        title: '',
        description: '',
        empty: '',
        detailAlt: '',
        mediumLabel: '',
        dimensionsLabel: '',
        yearLabel: '',
        coverLabel: '',
        galleryLabel: '',
      },
    },
    editor: {
      appTitle: '',
      loginCta: '',
      collections: { posts: { label: '' }, audiovisuales: { label: '' } },
      saveSuccess: '',
      saveError: '',
    },
    auth: {
      signInLabel: 'Iniciar sesión',
      signUpLabel: 'Crear cuenta',
      accountLabel: 'Mi cuenta',
      signOutLabel: 'Cerrar sesión',
      subscriptionRequiredCta: 'Suscríbete para acceder',
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
      book: 'book',
      auditores: 'auditors',
      repositorio: 'repository',
      contact: 'contact',
      suscripcion: 'subscription',
      terms: 'terms',
      privacy: 'privacy',
      cookiePolicy: 'cookie-policy',
    },
    navigation: [
      { id: 'home', label: 'Home', path: '' },
      { id: 'book', label: 'No más que la Vida', path: 'book' },
      { id: 'auditores', label: 'Auditors', path: 'auditors' },
      { id: 'repositorio', label: 'Repository', path: 'repository' },
      { id: 'contact', label: 'Contact', path: 'contact' },
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
      rss: 'RSS',
      terms: 'Site terms',
      follow: 'Social',
      manageCookies: 'Manage cookies',
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
    terms: pactoEnData as Translation['terms'],
    consent: {
      headline: 'Your privacy, your choice',
      description:
        'We use cookies to keep the archive running, measure traffic anonymously, and remember your preferences. You can accept everything, decline the optional ones, or fine-tune each category.',
      acceptLabel: 'Accept all',
      rejectLabel: 'Decline optional',
      manageLabel: 'Manage preferences',
      preferencesTitle: 'Manage cookie categories',
      saveLabel: 'Save preferences',
      cookiePolicyLink: 'View cookie policy',
      privacyPolicyLink: 'View privacy policy',
      categories: {
        essential: 'Essential (always active)',
        analytics: 'Anonymised analytics',
      },
    },
    splash: {
      title: 'Sensitive content notice',
      body:
        'The texts and works presented here transit uncensored with sensitive content. If you decide to continue, you accept the terms of our <a href="/en/terms">Site Terms</a>.',
      acknowledge: 'I understand, continue',
      reject: 'Leave the site',
    },
    privacy: {
      metaTitle: 'Privacy Policy · Plocos',
      metaDescription:
        'How Plocos processes personal data of subscribers, collaborators, auditors, and visitors under Ley 1581/2012 and Decreto 1377/2013. [EN: TODO legal review by Colombian attorney]',
      title: 'Privacy Policy',
      sections: [
        {
          heading: 'Data controller',
          body:
            'The data controller for the personal data collected through this archive is Michel Saer, domiciled in Cartagena de Indias (Colombia), with the contact channel enabled at the address shown at the end of this policy. Any request, complaint, or claim may be submitted through that same channel and will be addressed within the timeframes provided by the Superintendencia de Industria y Comercio (SIC). [EN: TODO legal review by Colombian attorney]',
        },
        {
          heading: 'Data processors',
          body:
            'To operate the subscription platform for the digital book “No más que la Vida”, Plocos engages the following processors, who treat personal data exclusively for the purposes described in this policy and under contractual clauses that require guarantees equivalent to or stronger than Colombian law: (a) Clerk (authentication and session); (b) PayPal and Wompi (payment processing, dual depending on the subscriber’s geography); (c) Netlify (hosting and serverless functions); (d) Resend (transactional email: approvals, notifications, iteration reminders); (e) Google Cloud Platform, where Google Gemini processes collaborator annotations through the algorithmic triage engine. Detailed cookie and transfer mechanics are published in the Cookie Policy. [EN: TODO legal review by Colombian attorney]',
        },
        {
          heading: 'Data we process',
          body:
            'We process the following categories of personal data depending on the user type. Subscribers (Reader or Collaborator): name, email address, mobile phone, city, country, gender, date of birth (to verify age of majority under artículo 12 of Ley 1581/2012), and the billing data retained by the payment gateway (Plocos does not store full card numbers). Collaborators and Auditors: in addition to the above, the topographic annotations they deposit in the public Repository (chapter, paragraph, content, date) and, if they grant explicit consent, their email address visible alongside their pseudonym. Anonymous visitors: only the technical data required to serve the site (IP address, user agent, preferred language). We do not sell, transfer, or enrich data with third parties for advertising purposes. [EN: TODO legal review by Colombian attorney]',
        },
        {
          heading: 'Public Repository data',
          body:
            'The public Repository indexes approved contributions (topographic annotations) and the subscriber data of the contributor. The Collaborator can, via the account control panel, decide whether their email address appears publicly attached to their contributions. While the toggle is active, the authorisation is express, prior, and informed per artículo 9 of Ley 1581/2012. The Collaborator can disable visibility at any time; previously indexed contributions are anonymised in the next Repository iteration. [EN: TODO legal review by Colombian attorney]',
        },
        {
          heading: 'Purposes and legal bases',
          body:
            'Data is used to: (a) manage subscriptions, process payments, and deliver access to the digital book (legal basis: performance of the contract); (b) moderate the Repository, run the triage engine, and maintain contribution traceability (legal basis: consent of the Collaborator and performance of the Habeas Scriptum); (c) maintain the security and integrity of the archive and prevent abusive uses (legal basis: legitimate interest of the editor); (d) measure traffic in aggregate form and improve the experience (legal basis: consent through the cookie banner); (e) comply with legal obligations and attend to the requirements of competent authorities (legal basis: compliance with a legal duty). [EN: TODO legal review by Colombian attorney]',
        },
        {
          heading: 'Data retention',
          body:
            'Retention periods apply according to the category and purpose of the data: [EN: TODO legal review by Colombian attorney]',
        },
        {
          heading: 'Data Protection Officer',
          body:
            'The data controller designates as single point of contact for all matters related to personal data processing, including the exercise of ARCO rights, Michel Saer, reachable at expresatura@plocos.com. The SIC may require the name of the officer at any time per artículo 23 of Ley 1581/2012. [EN: TODO legal review by Colombian attorney]',
        },
        {
          heading: 'Visitor and subscriber rights',
          body:
            'Under Ley 1581/2012, every data subject may exercise at any time the rights of Access, Rectification, Cancellation, and Opposition (ARCO rights), and the additional rights of erasure and portability provided for in regulatory development. To do so, simply send a request to the enabled contact channel. Account cancellation (erasure) is executed in cascade: the `users` row is deleted along with subscriptions, Repository annotations, and (in the next iteration) the associated public profiles. The procedure is as follows: [EN: TODO legal review by Colombian attorney]',
        },
        {
          heading: 'International transfers',
          body:
            'Some technology providers we use may store data on servers outside Colombia. In all cases we require guarantees equivalent to or stronger than those provided by Colombian law (standard contractual clauses, adequacy decisions, or recognised certifications). The updated list of providers and countries of processing is published in the Cookie Policy.',
        },
        {
          heading: 'Changes to this policy',
          body:
            'The editor may modify this policy to reflect regulatory, technical, or editorial changes. Previous versions are preserved and remain available for consultation. The last update date appears at the foot of this page.',
        },
      ],
      contactEmail: 'expresatura@plocos.com',
      responseTimelines: {
        consultas: 'general inquiries within ten (10) business days',
        reclamos: 'formal complaints within fifteen (15) business days',
      },
      retention: [
        {
          category: 'Subscriber account',
          period: 'For as long as the subscription is active. On cancellation, personal data is erased within thirty (30) days.',
        },
        {
          category: 'Repository annotations',
          period: 'Permanent while the contribution is approved and indexed, unless the data subject requests erasure (ARCO Cancellation right).',
        },
        {
          category: 'Billing data',
          period: 'Retained by the payment gateway (PayPal or Wompi) under their own policy. Plocos keeps only transaction identifiers for tax compliance (five years).',
        },
        {
          category: 'Contact messages',
          period: 'For the duration of the conversation and up to three (3) years afterwards for editorial traceability purposes.',
        },
        {
          category: 'Analytics cookies',
          period: 'Thirteen (13) months from the last visit or until the visitor withdraws consent.',
        },
        {
          category: 'Server security logs',
          period: 'Twelve (12) months to handle incidents and requests from authorities.',
        },
      ],
      arcoProcedure: [
        'Write to expresatura@plocos.com indicating full name, identification number, and a contact channel for reply.',
        'Clearly describe the request and, where applicable, the data subject to Access, Rectification, Cancellation, or Opposition.',
        'Attach a copy of the identity document or instrument evidencing representation, if acting on behalf of a third party.',
        'Receive a response within the timeframes provided by the Superintendencia de Industria y Comercio (SIC).',
        'Cancellation erases the account and personal data within a maximum of thirty (30) calendar days from the confirmation of the request.',
      ],
    },
    cookiePolicy: {
      metaTitle: 'Cookie Policy · Plocos',
      metaDescription:
        'Inventory of cookies and local storage used by the Plocos subscription platform: essential, authentication, paywall, annotations, language, anonymised analytics, and AI protection. [EN: TODO legal review by Colombian attorney]',
      title: 'Cookie Policy',
      intro:
        'A cookie is a small text file that a website stores on the visitor’s device to remember preferences or measure usage. This policy describes the cookies and local storage Plocos uses, with what purposes, and how to manage them. Strictly necessary and authentication cookies are always loaded because they make the platform work; all others require your consent.',
      updatedLabel: 'Last updated',
      updatedValue: 'October 2, 2026',
      categories: [
        {
          heading: 'Strictly necessary',
          description:
            'Enable basic functions such as remembering your cookie preferences, keeping the session across pages, and protecting the site against improper uses. They do not require consent because without them the platform could not operate.',
          cookies: [
            {
              name: 'astro-consent',
              provider: 'Plocos (astro-consent integration)',
              purpose: 'Store the visitor’s consent preferences.',
              duration: '30 days from the last update.',
              party: 'first',
            },
            {
              name: 'plocos-sensitive-content-acknowledged',
              provider: 'Plocos',
              purpose: 'Remember that the visitor acknowledged the sensitive content notice.',
              duration: 'Persistent until the visitor clears the browser storage.',
              party: 'first',
            },
          ],
        },
        {
          heading: 'Authentication and session',
          description:
            'Allow a subscriber (Reader, Collaborator, or Auditor) to keep the session active, the account panel to reflect their role, and the Habeas Scriptum to be registered. Clerk is the processor that handles them under its own privacy policy. [EN: TODO legal review by Colombian attorney]',
          cookies: [
            {
              name: '__session',
              provider: 'Clerk',
              purpose: 'Maintain the user session across pages and protect it against forgery.',
              duration: 'Session (session cookie, cleared when the browser closes).',
              party: 'first',
            },
            {
              name: '__client',
              provider: 'Clerk',
              purpose: 'Client token to initialise the Clerk SDK in the browser.',
              duration: '1 year.',
              party: 'first',
            },
          ],
        },
        {
          heading: 'Paywall state',
          description:
            'Allow the system to remember which iteration and which chapters have been unlocked for the subscriber, preventing the need to repurchase or re-authenticate on every visit. Stored in `localStorage` with an opaque key for security.',
          cookies: [
            {
              name: 'plocos-paywall-iteration',
              provider: 'Plocos',
              purpose: 'Remember the last unlocked iteration to avoid redundant paywall redirects.',
              duration: 'Persistent until the visitor clears the browser storage.',
              party: 'first',
            },
            {
              name: 'plocos-paywall-chapter',
              provider: 'Plocos',
              purpose: 'Remember the last chapter accessed by the subscriber.',
              duration: 'Persistent until the visitor clears the browser storage.',
              party: 'first',
            },
          ],
        },
        {
          heading: 'Annotation draft',
          description:
            'If a Collaborator starts drafting an annotation and abandons it without submitting, the system saves the draft in `localStorage` so they can pick it up on return. The draft is not sent to the server until the user explicitly clicks "Submit".',
          cookies: [
            {
              name: 'plocos-annotation-draft',
              provider: 'Plocos',
              purpose: 'Recover unsent annotation drafts when reloading or changing chapter.',
              duration: '7 days from the last edit or until submitted or discarded.',
              party: 'first',
            },
          ],
        },
        {
          heading: 'Language preference',
          description:
            'Store the visitor’s language choice (ES or EN) to avoid unnecessary redirects between localised versions. Synchronised with `Astro.currentLocale` to stay consistent with the language flag in the header.',
          cookies: [
            {
              name: 'plocos-locale',
              provider: 'Plocos',
              purpose: 'Remember the language chosen by the visitor.',
              duration: '1 year.',
              party: 'first',
            },
          ],
        },
        {
          heading: 'Anonymised analytics',
          description:
            'Allow us to measure platform traffic in aggregate form, without individually identifying subscribers, so we understand which iterations are read and how to improve the experience. If you decline this category, the platform keeps working normally.',
          cookies: [
            {
              name: '_ga',
              provider: 'Google Analytics 4',
              purpose: 'Generate an anonymous identifier to distinguish unique visitors.',
              duration: '13 months from the last visit.',
              party: 'third',
            },
            {
              name: '_ga_<container-id>',
              provider: 'Google Analytics 4',
              purpose: 'Store the session state of the anonymous identifier.',
              duration: '13 months from the last visit.',
              party: 'third',
            },
          ],
        },
        {
          heading: 'AI protection (informational)',
          description:
            'This category does not install cookies. Its purpose is to document the technical measures adopted to prevent the use of the content in AI training (meta `noai, noimageai`, `robots.txt` with 8 user-agents blocked, HTTP-only cookies on sensitive actions). See section IV of the Site Terms.',
          cookies: [],
        },
      ],
      revocation: [
        'Open the “Manage cookies” link in the footer and modify your preferences.',
        'Manually delete the “astro-consent” key from the browser’s local storage through the developer tools.',
        'Configure your browser to block or limit third-party cookies; bear in mind that some platform functions may become unavailable.',
        'Write to expresatura@plocos.com to request personalised assistance or to exercise your ARCO Cancellation right (see Privacy Policy).',
      ],
    },
    av: {
      collection: {
        title: '',
        description: '',
        empty: '',
        detailAlt: '',
        mediumLabel: '',
        dimensionsLabel: '',
        yearLabel: '',
        coverLabel: '',
        galleryLabel: '',
      },
    },
    editor: {
      appTitle: '',
      loginCta: '',
      collections: { posts: { label: '' }, audiovisuales: { label: '' } },
      saveSuccess: '',
      saveError: '',
    },
    auth: {
      signInLabel: 'Sign in',
      signUpLabel: 'Sign up',
      accountLabel: 'My account',
      signOutLabel: 'Sign out',
      subscriptionRequiredCta: 'Subscribe to access',
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
