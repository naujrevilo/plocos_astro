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
      privacy: 'privacidad',
      cookiePolicy: 'politica-de-cookies',
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
          heading: 'Naturaleza y propósito editorial',
          body:
            'Plocos es un archivo digital de carácter editorial, filosófico y artístico, mantenido por su editor con el propósito de preservar, organizar y difundir pensamiento crítico, poesía visual y memoria viva. El espacio no constituye una plataforma comercial, una red social ni un servicio de alojamiento masivo; cada pieza es seleccionada, curada y publicada bajo criterios editoriales propios, sin ánimo de lucro directo sobre el material expuesto. La navegación, lectura y consulta del archivo son gratuitas. El editor se reserva la posibilidad de ofrecer, en el futuro, servicios complementarios —impresiones bajo demanda, talleres, residencias o publicaciones físicas— que se regirán por sus propias condiciones. Este pacto regula exclusivamente el uso editorial del archivo y la relación entre el editor y cada visitante.',
        },
        {
          heading: 'Advertencia de contenido sensible',
          body:
            'Determinadas piezas del archivo abordan temáticas filosóficas, existenciales, políticas o estéticas que algunas personas pueden percibir como intensas, perturbadoras o confrontativas. Esto incluye, entre otras, reflexiones sobre la muerte, la violencia histórica, la crítica institucional, la sexualidad, el sufrimiento humano y las crisis de sentido. Tales tratamientos responden a la línea editorial del archivo y a la convicción de que el pensamiento crítico no evade la complejidad. El editor invita a cada visitante a decidir con autonomía si desea continuar la lectura. Si el contenido de una pieza resulta emocionalmente difícil, se recomienda detener la navegación y, si es necesario, buscar acompañamiento profesional o personal. No se asume que la exposición a estos materiales produzca bienestar o confort; su valor reside en la reflexión que habilitan.',
        },
        {
          heading: 'Edad mínima y capacidad',
          body:
            'El archivo está dirigido a personas mayores de quince (15) años. Quienes accedan al sitio desde jurisdicciones que fijen una edad mínima distinta para el consumo de contenido editorial sin acompañamiento —por ejemplo, catorce años en algunas legislaciones o dieciséis en otras— declaran, al continuar la navegación, que cumplen con el umbral aplicable en su lugar de residencia. El editor no realiza verificación activa de edad ni recoge datos para ese fin. Las personas adultas responsables que permitan el acceso de menores a su cargo aceptan supervisar la lectura y asumen la responsabilidad derivada de esa decisión. Si en algún momento el editor identifica que una pieza exige una restricción de edad superior, lo señalará de manera visible al inicio del contenido correspondiente.',
        },
        {
          heading: 'Suscripciones, pagos y reembolsos',
          body:
            'En la fecha de publicación de estas condiciones, el acceso al archivo es gratuito y no exige registro. Si en el futuro el editor habilita servicios pagos —boletines premium, publicaciones físicas, talleres, residencias o piezas impresas bajo demanda—, las condiciones específicas de cada oferta se informarán antes de cualquier cobro y se regirán por la legislación colombiana de protección al consumidor, en particular el Estatuto del Consumidor (Ley 1480/2011). El visitante tendrá derecho de retracto dentro de los cinco (5) días hábiles siguientes al pago, salvo las excepciones legales aplicables —bienes personalizados, servicios ya ejecutados con consentimiento, entre otras—. Las solicitudes de reembolso se tramitarán por el mismo canal usado para el pago y se resolverán en un plazo máximo de quince (15) días calendario.',
        },
        {
          heading: 'Protección anti-IA y anti-scraping',
          body:
            'El contenido del archivo —textos, imágenes, ilustraciones y combinaciones entre ellos— se publica para consulta humana y forma parte del trabajo editorial de Plocos. Queda prohibida su recolección, copia, extracción, reentrenamiento, ajuste, evaluación o cualquier forma de reutilización destinada a desarrollar, mejorar o entrenar modelos de inteligencia artificial, ya sea de manera directa o a través de intermediarios, agentes, datasets o servicios de terceros. Esta prohibición incluye el web scraping automatizado, el raspado selectivo y la construcción de corpus paralelos sin autorización escrita previa. El archivo implementa medidas técnicas razonables —entre ellas, directivas en robots.txt, metaetiquetas y patrones de bloqueo— para desalentar tales prácticas. La violación de esta cláusula puede generar responsabilidad civil y, cuando corresponda, las acciones legales que la legislación colombiana aplicable contemple.',
        },
        {
          heading: 'Usos expresamente prohibidos',
          body:
            'No está permitido distribuir, alojar o reutilizar el material de Plocos en contextos que vulneren la ética de este archivo, los derechos de terceros o el ordenamiento jurídico colombiano. En particular, queda prohibido reutilizarlo en proyectos que:',
          bullets: [
            'Infrinjan o contravengan la dignidad humana y sus principios.',
            'Violen los derechos de niños, niñas y adolescentes.',
            'Sean inconstitucionales, contrarios a la ley o desconozcan normas vigentes.',
            'Limiten, censuren o distorsionen la libertad de expresión en cualquiera de sus formas.',
            'Promuevan violencia, explotación sexual, terrorismo, racismo, obscenidad o material pornográfico.',
            'Difundan enlaces P2P, torrents, descargas directas u otros esquemas destinados a lucrar con material protegido por derechos de autor.',
          ],
        },
        {
          heading: 'Revocación de acceso',
          body:
            'El editor puede revocar, restringir o suspender el acceso de cualquier visitante al archivo cuando existan indicios razonables de incumplimiento de estas condiciones, de uso automatizado no autorizado, de extracción masiva con fines de entrenamiento de inteligencia artificial, de intentos de eludir las medidas técnicas de protección o de cualquier conducta que perturbe el funcionamiento del sitio. La decisión se comunicará, cuando sea posible, por los medios de contacto conocidos. Esta medida no excluye otras acciones legales disponibles. El visitante, por su parte, puede retirar en cualquier momento los consentimientos otorgados a través del mecanismo «Gestionar cookies» del pie de página, eliminando la clave «astro-consent» del almacenamiento local de su navegador o escribiendo directamente al editor. La revocación no tiene efectos retroactivos sobre tratamientos ya realizados dentro del marco legal aplicable.',
        },
        {
          heading: 'Propiedad intelectual',
          body:
            'Las obras publicadas en Plocos son de autoría del editor o de los colaboradores acreditados en cada pieza. Salvo indicación contraria, todos los derechos morales y patrimoniales pertenecen a sus respectivos titulares y se reservan. Cualquier reproducción total o parcial —incluyendo traducción, adaptación, compilación o inclusión en otros soportes— requiere cita de fuente, preservación de la integridad de la pieza y autorización escrita previa, salvo los usos de citación honesta, ilustración educativa y referencia crítica reconocidos por la legislación colombiana sobre derechos de autor (Decisión Andina 486 y Ley 23 de 1982, entre otras). El uso de las obras en actividades comerciales, su inclusión en publicaciones remuneradas o su explotación económica sin licencia expresa constituye una infracción sancionable. Las solicitudes de licenciamiento se tramitan por los canales oficiales de contacto.',
        },
        {
          heading: 'Contribuciones, comentarios y moderación',
          body:
            'Los aportes enviados al archivo —comentarios, colaboraciones editoriales, sugerencias o materiales gráficos— pasan por moderación editorial antes de su publicación. El editor puede ajustar el estilo, la extensión o el formato para preservar la coherencia del archivo, retirar contenido que vulnere estas condiciones o que resulte ajeno a la línea editorial, y responder o no a los aportes según su criterio. El envío de contenido implica que quien comenta cuenta con los permisos necesarios sobre el material remitido y acepta su publicación bajo las mismas condiciones del archivo. No se admiten ataques personales, discursos de odio, spam ni material protegido por derechos de terceros sin la autorización correspondiente. Las contribuciones remuneradas se regularán por acuerdos específicos firmados con cada colaborador.',
        },
        {
          heading: 'Privacidad y datos personales',
          body:
            'El tratamiento de datos personales asociados a la visita del archivo —incluyendo cookies, analítica anonimizada y comunicaciones opcionales— se rige por la Política de Privacidad publicada en la ruta /privacidad de este mismo sitio, la cual forma parte integral de estas condiciones. Allí se detallan las finalidades, las bases legales conforme a la Ley 1581/2012 y al Decreto 1377/2013, los derechos de Acceso, Rectificación, Cancelación y Oposición (derechos ARCO) y los canales habilitados para ejercerlos. La Política de Privacidad prevalece sobre este resumen en caso de divergencia. Al continuar la navegación, el visitante confirma haber leído la Política de Privacidad o, cuando menos, haber sido informado de su existencia y del lugar donde puede consultarla.',
        },
        {
          heading: 'Ley aplicable y jurisdicción',
          body:
            'Las presentes condiciones se interpretan y se ejecutan de conformidad con las leyes de la República de Colombia, en particular la Ley 1581/2012 sobre protección de datos personales, el Decreto 1377/2013 que la reglamenta parcialmente, la Decisión Andina 486 sobre Propiedad Industrial, la Ley 23 de 1982 sobre derechos de autor y el Código Civil colombiano en lo que resulte aplicable. Cualquier controversia, reclamación o disputa derivada de la navegación, uso o interpretación de estas condiciones se somete a los jueces y tribunales competentes de la ciudad de Cartagena de Indias, Distrito Turístico y Cultural, sin perjuicio de los derechos irrenunciables que la legislación colombiana o las normas de protección al consumidor otorguen al visitante. La eventual declaración de nulidad de alguna cláusula no afecta la validez de las restantes.',
        },
      ],
      contactNotice:
        'Si necesitas claridad adicional o deseas tramitar permisos específicos, contáctanos y revisaremos tu solicitud.',
      contactLinkLabel: 'Ir a contacto',
    },
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
        'Este archivo contiene reflexiones filosóficas, artísticas y críticas que pueden resultar intensas. Algunas piezas abordan la muerte, la violencia histórica, el sufrimiento humano y otras temáticas difíciles. Decide con autonomía si quieres continuar leyendo.',
      acknowledge: 'Entiendo, continuar',
      reject: 'Salir del sitio',
    },
    privacy: {
      metaTitle: 'Política de privacidad · Plocos',
      metaDescription:
        'Cómo Plocos trata los datos personales conforme a la Ley 1581/2012 y al Decreto 1377/2013.',
      title: 'Política de privacidad',
      sections: [
        {
          heading: 'Responsable del tratamiento',
          body:
            'El responsable del tratamiento de los datos personales recogidos a través de este archivo es el editor de Plocos, con domicilio en Cartagena de Indias (Colombia) y canal de contacto habilitado en la dirección que aparece al final de esta política. Cualquier solicitud, queja o reclamo se puede presentar por ese mismo canal y será atendida en los plazos previstos por la Superintendencia de Industria y Comercio (SIC).',
        },
        {
          heading: 'Datos que tratamos',
          body:
            'Tratamos únicamente los datos indispensables para responder a las comunicaciones que el visitante inicia voluntariamente (nombre, dirección de correo electrónico y contenido del mensaje) y los datos técnicos generados por la navegación —dirección IP, agente de usuario, páginas consultadas— cuando el visitante ha aceptado las cookies analíticas. No vendemos, no cedemos y no enriquecemos datos con terceros. Tampoco realizamos perfilado automatizado con fines publicitarios ni tomamos decisiones automatizadas que produzcan efectos jurídicos sobre el visitante.',
        },
        {
          heading: 'Finalidades y bases legales',
          body:
            'Los datos se utilizan para: (a) responder mensajes y coordinar proyectos editoriales (base legal: consentimiento y ejecución de solicitudes del visitante); (b) mantener la seguridad e integridad del archivo y prevenir usos abusivos (base legal: interés legítimo del editor); (c) medir el tráfico de forma agregada y mejorar la experiencia (base legal: consentimiento mediante el banner de cookies); (d) cumplir obligaciones legales y atender requerimientos de autoridades competentes (base legal: cumplimiento de un deber legal).',
        },
        {
          heading: 'Conservación de los datos',
          body:
            'Los plazos de conservación se aplican según la categoría y la finalidad del dato:',
        },
        {
          heading: 'Derechos del visitante',
          body:
            'Conforme a la Ley 1581/2012, todo visitante puede ejercer en cualquier momento los derechos de Acceso, Rectificación, Cancelación y Oposición (derechos ARCO). Para hacerlo, basta con enviar una solicitud al canal de contacto habilitado; el procedimiento es el siguiente:',
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
        {
          category: 'Comentarios publicados',
          period: 'Mientras el comentario esté visible en el archivo y hasta dos (2) años después de su retiro.',
        },
      ],
      arcoProcedure: [
        'Escribir a expresatura@plocos.com indicando nombre completo y medio de contacto para respuesta.',
        'Describir con claridad la solicitud y, cuando aplique, los datos objeto de Access, Rectificación, Cancelación u Oposición.',
        'Adjuntar copia del documento de identidad o instrumento que acredite la representación, si actúa en nombre de un tercero.',
        'Recibir respuesta en los plazos previstos por la Superintendencia de Industria y Comercio (SIC).',
      ],
    },
    cookiePolicy: {
      metaTitle: 'Política de cookies · Plocos',
      metaDescription:
        'Inventario de cookies utilizadas por Plocos: esenciales, analítica anonimizada, búsqueda y protección anti-IA.',
      title: 'Política de cookies',
      intro:
        'Una cookie es un pequeño archivo de texto que un sitio web almacena en el dispositivo del visitante para recordar sus preferencias o medir el uso. Esta política describe las cookies que Plocos utiliza, con qué fines y cómo administrarlas. Las cookies estrictamente necesarias se cargan siempre porque hacen posible el funcionamiento del archivo; las demás requieren tu consentimiento.',
      updatedLabel: 'Última actualización',
      updatedValue: '20 de agosto de 2026',
      categories: [
        {
          heading: 'Estrictamente necesarias',
          description:
            'Habilitan funciones básicas como recordar tus preferencias de cookies, mantener la sesión entre páginas y proteger el sitio contra usos indebidos. No requieren consentimiento porque sin ellas el archivo no podría operar.',
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
          heading: 'Analítica anonimizada',
          description:
            'Nos permiten medir el tráfico del sitio de forma agregada, sin identificar individualmente a las visitantes, para entender qué piezas se leen y cómo mejorar el archivo. Si rechazas esta categoría, el sitio sigue funcionando con normalidad.',
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
          heading: 'Búsqueda en el archivo',
          description:
            'El buscador integrado utiliza Algolia para devolver resultados rápidos y relevantes. Estas cookies permiten recordar consultas recientes y mejorar la experiencia sin identificar personalmente al visitante.',
          cookies: [
            {
              name: 'aind',
              provider: 'Algolia Search',
              purpose: 'Identificador anónimo del visitante para métricas internas de Algolia.',
              duration: 'Persistente hasta 1 año en el dispositivo del visitante.',
              party: 'third',
            },
            {
              name: '_algolia_*',
              provider: 'Algolia Search',
              purpose: 'Cookies auxiliares técnicas necesarias para la operativa del buscador.',
              duration: 'Variable según uso, persistente hasta 1 año.',
              party: 'third',
            },
          ],
        },
        {
          heading: 'Protección anti-IA (informativa)',
          description:
            'Esta categoría no instala cookies. Su propósito es documentar las medidas técnicas adoptadas para impedir el uso del contenido en entrenamiento de inteligencia artificial. Consulta la sección «Protección anti-IA y anti-scraping» del pacto.',
          cookies: [],
        },
      ],
      revocation: [
        'Abrir el enlace «Gestionar cookies» en el pie de página y modificar tus preferencias.',
        'Borrar manualmente la clave «astro-consent» del almacenamiento local del navegador desde las herramientas de desarrollador.',
        'Configurar tu navegador para bloquear o limitar cookies de terceros; ten en cuenta que algunas funciones del archivo pueden dejar de estar disponibles.',
        'Escribir a expresatura@plocos.com para solicitar asistencia personalizada.',
      ],
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
      rss: 'RSS',
      terms: 'Site terms',
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
