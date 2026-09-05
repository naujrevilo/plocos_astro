# Primera Visita al Sitio — Flujo del Usuario

```mermaid
flowchart TD
    Start[Visitante llega a plocos.netlify.app] --> Splash{Sensitive Content<br/>Splash vista antes?}

    Splash -->|primera vez| ShowSplash["🔞 Muestra splash<br/>'Este sitio contiene contenido<br/> filosófico explícito.<br/>¿Continuar o salir?'"]
    ShowSplash --> SplashChoice{Visitante elige}
    SplashChoice -->|Continuar| SetSplashOK["localStorage['splash-seen']<br/>= true"]
    SplashChoice -->|Salir| Goodbye["Cierra la pestaña<br/>(window.close)"]

    Splash -->|ya visto| SkipSplash[Skip splash]

    SetSplashOK --> CookieCheck{Cookie consent<br/>mostrado antes?}
    SkipSplash --> CookieCheck

    CookieCheck -->|primera vez| ShowBanner["🍪 Banner de cookies<br/>'Aceptar todo / Rechazar /<br/>Administrar categorías'"]
    ShowBanner --> BannerChoice{Visitante elige}
    BannerChoice -->|Aceptar todo| SetConsentAll["localStorage['astro-consent']<br/>{analytics: true}"]
    BannerChoice -->|Rechazar| SetConsentNone["localStorage['astro-consent']<br/>{analytics: false}"]
    BannerChoice -->|Administrar| ShowModal["Modal con 4 toggles:<br/>Esenciales (siempre on)<br/>Analítica (off por default)<br/>Búsqueda<br/>Anti-IA info"]
    ShowModal --> SaveCustom["Guarda preferencias custom"]

    CookieCheck -->|ya tiene decisión| SkipBanner[Skip banner]

    SetConsentAll --> ShowSite
    SetConsentNone --> ShowSite
    SaveCustom --> ShowSite
    SkipBanner --> ShowSite

    ShowSite["📄 Carga la página<br/>(navbar + contenido + footer)"]
```

## ¿Qué pasa cuando acepto cookies?

```mermaid
flowchart LR
    Accept[Acepto cookies] --> Storage["localStorage['astro-consent']<br/>{categories: {analytics: true},<br/>updatedAt, expiresAt}"]
    Storage -.->|Trigger| ConsentGate["src/lib/consent-gate.ts<br/>lee la decisión"]

    ConsentGate -->|analytics: true| LoadGA["Carga GoogleAnalytics<br/>(script async)"]
    ConsentGate -->|analytics: false| SkipGA["NO carga GoogleAnalytics<br/>(privacidad preservada)"]

    LoadGA --> TrackEvents["Empieza a medir:<br/>page views, scroll depth,<br/>tiempo en página"]
```

## ¿Qué pasa si rechazo?

- **Analítica**: NO se carga Google Analytics. No se miden page views.
- **Esenciales**: siempre activas (necesarias para que el sitio funcione).
- **Búsqueda**: si la rechazas, el índice de búsqueda puede no actualizarse localmente.
- **Anti-IA info**: no afecta funcionalidad, solo documenta el bloqueo de AI crawlers en robots.txt.

## ¿Cuándo vuelve a aparecer el banner?

```mermaid
stateDiagram-v2
    [*] --> Visto: Visita inicial
    Visto --> Configurado: Click Aceptar/Rechazar/Administrar
    Configurado --> Expira: Pasan 30 días
    Expira --> BannerDeNuevo: Vuelve a mostrar banner
    BannerDeNuevo --> Configurado: Usuario decide de nuevo

    note right of Expira
        expiresAt = updatedAt + 30 días
        Después expira, el banner
        vuelve a aparecer para renovar
    end note
```

## Splash: ¿qué es exactamente?

Es un modal que aparece ANTES de cualquier cookie. Reconoce al usuario como adulto informado.

```mermaid
graph LR
    Splash["🔞 Sensitive Content Warning"] --> H1["Plocos es un espacio de<br/>reflexión filosófica sin filtros"]
    Splash --> H2["Algunas secciones incluyen<br/>análisis de violencia,<br/>sexualidad, sufrimiento humano"]
    Splash --> H3["Si te incomoda este tipo<br/>de contenido, sal ahora"]
    Splash --> H4["Si decides continuar,<br/>asumes la responsabilidad<br/>de tu interpretación"]
    Splash --> Botones["[Continuar] [Salir]"]

    Botones -->|Continuar| SetLocalStorage["localStorage['splash-seen']=true<br/>splash no vuelve a aparecer"]
    Botones -->|Salir| Close["window.close()<br/>(puede ser bloqueado por browser)"]
```

El splash se renderiza en `BaseLayout.astro` antes del header. Usa `localStorage` (no cookie) para recordar la decisión.

## Navegación después del splash

```mermaid
graph LR
    Site[Sitio cargado] --> Header[SiteHeader]
    Site --> Main[Contenido principal]
    Site --> Footer[SiteFooter]

    Header --> Logo[Logo PLOCOS]
    Header --> Nav[Inicio | Categorías | Blog | Contacto | Razón de ser]
    Header --> Search[🔍 Buscar]
    Header --> Theme[🌗 Tema]
    Header --> Lang[🇨🇴 / 🇺🇸]

    Main --> Content[Contenido específico de la página]
    Footer --> Terminos[Términos]
    Footer --> Privacy[Privacidad]
    Footer --> Cookies[Política de cookies]
    Footer --> ManageCookies[Gestionar cookies]
    Footer --> RSS[RSS feed]
    Footer --> Social[Redes sociales]
```

Última actualización: 2026-09-05
