# Algolia — Setup desde cero

> Guía paso a paso para configurar Algolia en la cuenta del cliente, asumiendo que el índice anterior fue eliminado.

## Prerrequisitos

- Cuenta de Algolia del cliente creada (Free plan: 10k records, 50k search operations/mes)
- Repo del cliente transferido y deployado al menos una vez
- Acceso de admin al sitio de Netlify del cliente

---

## 1. Crear el índice en Algolia

1. Login en [dashboard.algolia.com](https://dashboard.algolia.com/)
2. Menú izquierdo → **Indices** → **Create new index**
3. **Index name**: `plocos_netlify_app_<APP_ID>_articles` (el nombre exacto que usa `src/lib/algoliasearch.js` toma `process.env.ALGOLIA_INDEX_NAME`; podés ponerle el que quieras mientras coincida con el valor que pongas en env vars)
4. **Primary key for the index**: `objectID` (es lo que usa el sync script; los posts tienen `objectID: slug`)
5. Click **Create**

## 2. Configurar atributos del índice

1. En el índice recién creado → **Configuration** tab → **Searchable attributes**
2. Agregar en este orden (importa para ranking):
   - `title`
   - `description`
   - `content`
3. Click **Save**

Opcional: en **Ranking and Sorting** → **Custom ranking** agregar `desc(pubDate)` para que posts más recientes rankeen más alto en empates.

## 3. Generar las API keys

1. Settings → **API Keys** → **All API Keys**
2. Necesitas **dos** keys distintas:
   - **Admin API Key** (con permisos de escritura) — usar SOLO server-side
   - **Search-Only API Key** (con permisos solo de lectura) — usar en el cliente JS
3. Copia cada una y guárdalas por separado:
   ```
   ALGOLIA_ADMIN_KEY=  (la de escritura, larga, NO exponer)
   ALGOLIA_SEARCH_KEY= (la de solo lectura, safe para el browser)
   ```

> ⚠️ **Nunca** pongas la Admin Key en una variable `PUBLIC_ALGOLIA_*`. Las `PUBLIC_*` se exponen al bundle JS del cliente.

## 4. Configurar env vars en Netlify (sitio del cliente)

URL: https://app.netlify.com → sitio del cliente → Site settings → **Environment variables**

Agregar las **6 variables** siguientes (Production scope como mínimo):

| Variable | Valor | Scope |
|---|---|---|
| `ALGOLIA_APP_ID` | `<app id>` | Production, Preview, Deploy |
| `ALGOLIA_WRITE_API_KEY` | `<admin key>` | Production, Preview, Deploy |
| `ALGOLIA_INDEX_NAME` | `plocos_netlify_app_<app_id>_articles` | Production, Preview, Deploy |
| `PUBLIC_ALGOLIA_APP_ID` | `<mismo app id>` | Production, Preview, Deploy |
| `PUBLIC_ALGOLIA_SEARCH_API_KEY` | `<search-only key>` | Production, Preview, Deploy |
| `PUBLIC_ALGOLIA_INDEX_NAME` | `<mismo index name>` | Production, Preview, Deploy |

> Astro **no** expone variables sin prefijo `PUBLIC_` al bundle del cliente. Si las `PUBLIC_*` no están en Netlify, el botón de búsqueda renderiza pero no devuelve nada.

Después de guardar las variables, **trigger un nuevo deploy** (Deploys → Trigger deploy → Deploy site) para que la build tome las nuevas env vars.

## 5. Configurar GitHub Secrets

URL: https://github.com/<CLIENT_USERNAME>/plocos_astro → Settings → **Secrets and variables** → **Actions** → **New repository secret**

Agregar **3 secrets** (los que usa el workflow `algolia-sync.yml`):

| Secret | Valor |
|---|---|
| `ALGOLIA_APP_ID` | `<app id>` |
| `ALGOLIA_WRITE_API_KEY` | `<admin key>` |
| `ALGOLIA_INDEX_NAME` | `<index name>` |

## 6. Verificar que el código usa los nombres correctos

El código ya está alineado (post-fix `20cc57d`):

- `src/lib/algoliasearch.js`: usa `ALGOLIA_APP_ID`, `ALGOLIA_WRITE_API_KEY`, `ALGOLIA_INDEX_NAME` ✓
- `src/components/Search.vue`: usa `PUBLIC_ALGOLIA_APP_ID`, `PUBLIC_ALGOLIA_SEARCH_API_KEY`, `PUBLIC_ALGOLIA_INDEX_NAME` ✓
- `.github/workflows/algolia-sync.yml`: pasa `ALGOLIA_WRITE_API_KEY` ✓

Si en algún momento futuro se vuelve a romper, el síntoma es: el botón renderiza, no muestra resultados, y DevTools muestra `Failed to load Algolia search client` o `cannot read properties of undefined (reading 'initIndex')`.

## 7. Trigger el primer sync

El sync corre automáticamente en cada push a `main` vía `.github/workflows/algolia-sync.yml`.

**Para forzarlo ahora** (opciones):
- Hacer un push vacío a main: `git commit --allow-empty -m "chore: trigger Algolia reindex" && git push`
- O ejecutar el script manualmente desde local: `node src/lib/algoliasearch.js` (necesita las 3 vars server-side en el environment)

**Verificar**:
- En GitHub: ver el workflow correr verde en la pestaña Actions
- En Algolia: Indices → tu índice → **Records** → debería mostrar N registros
- Si los records no aparecen, revisar los logs del workflow de GitHub Actions — el error más común es typo en el nombre del secret

## 8. Verificar búsqueda en el sitio en vivo

1. Abrir el sitio deployado
2. Click en el botón de búsqueda (lupa en el header, tanto desktop como mobile)
3. Tipear algo en el input: ej. una palabra del título de un post
4. Deben aparecer resultados abajo del input como cards con título
5. Click en un resultado → debe ir al post (`/posts/<slug>/`)

Si no aparece nada, abrir DevTools → Console y buscar:
- `Failed to load Algolia search client` → env vars `PUBLIC_*` no llegan al cliente
- `Cannot read properties of undefined` → alguna de las vars client está vacía
- Sin error pero `results.length === 0` → el índice está vacío (volver a paso 7)
- `Network error` o 401/403 → key incorrecta o índice con permisos mal configurados

## 9. Post-setup (opcional)

- Configurar **Algolia Analytics** (Settings → Analytics) para ver queries populares
- Configurar **A/B testing** si querés experimentar con el ranking
- Configurar **recomendaciones** si querés "Related posts" en cada post

---

## Troubleshooting

### El workflow `algolia-sync` falla con "Invalid API key"
- El `ALGOLIA_WRITE_API_KEY` en GitHub Secrets tiene typo o es la search-only key por error
- Regenerar la admin key en Algolia dashboard y actualizar el secret

### El botón renderiza pero no devuelve nada
- Las `PUBLIC_ALGOLIA_*` no están configuradas en Netlify (ver paso 4)
- Después de agregarlas, trigger un nuevo deploy

### El sync corre pero el índice queda vacío
- Verificar que `src/content/posts/` tiene archivos `.md`
- Verificar que cada post tiene frontmatter `title` (necesario para `record.title`)
- Correr `node src/lib/algoliasearch.js` localmente con env vars correctas para ver el error específico

### "Cannot read 'objects' of undefined" en el sync
- `clearObjects` o `saveObjects` fallaron — revisar la respuesta de Algolia en la consola

---

## Costos

- **Plan Free**: 10,000 records + 50,000 search operations/mes. Más que suficiente para Plocos (~200 posts, <10k search/mes esperados)
- Si crece: **Plan Standard** $0.50/1000 records extra + $0.50/1000 searches
- **Plan Pro** desde $500/mes solo si querés SLA enterprise (raro para editorial sites)

---

## Errores específicos encontrados en este proyecto (lecciones)

Issues reales que aparecieron durante el setup inicial de Plocos con Algolia v5. Documentados para que no se repitan.

### 1. `dotenv.config()` no lee `.env.local` por default

**Síntoma**: `Error: appId is missing` al ejecutar `node src/lib/algoliasearch.js`, aunque las vars estuvieran en `.env.local`.

**Causa**: El script llamaba `dotenv.config()` sin argumentos. Por default, dotenv busca `.env`, no `.env.local`. La convención de Plocos es poner los secrets en `.env.local` (gitignored), no en `.env`.

**Fix** (`src/lib/algoliasearch.js`):
```js
import * as dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  // Plocos convention: secrets live in .env.local, defaults in .env.
  dotenv.config({ path: '.env.local' });
  dotenv.config({ path: '.env' });
}
```

Carga `.env.local` primero (sobrescribe) y `.env` después (defaults no-secret).

### 2. Vars duplicadas server vs client son obligatorias

**Síntoma**: El botón de búsqueda renderizaba pero no devolvía resultados. El sync server-side funcionaba bien.

**Causa**: Astro no expone vars sin prefijo `PUBLIC_` al bundle JS del cliente. El código cliente (`Search.vue`) lee `import.meta.env.PUBLIC_ALGOLIA_APP_ID`, no `ALGOLIA_APP_ID`.

**Fix**: configurar **ambas** copias de cada var en Netlify env vars:

| Var server-side | Var client-side |
|---|---|
| `ALGOLIA_APP_ID` | `PUBLIC_ALGOLIA_APP_ID` (mismo valor) |
| `ALGOLIA_INDEX_NAME` | `PUBLIC_ALGOLIA_INDEX_NAME` (mismo valor) |
| `ALGOLIA_WRITE_API_KEY` | (NO exponer NUNCA al cliente) |
| (no existe) | `PUBLIC_ALGOLIA_SEARCH_API_KEY` |

Si una de las `PUBLIC_*` falta, `import.meta.env.PUBLIC_ALGOLIA_*` es `undefined` en runtime del browser y la búsqueda falla silenciosamente.

### 3. Algolia v4 → v5: API breaking changes

**Síntoma**: `TypeError: algoliasearch is not a function` (después del fix de vars).

**Causa**: el proyecto tiene `algoliasearch@5.x` instalado pero el código cliente usaba la API de v4.

**Cambios de v4 → v5**:
```diff
- import algoliasearch from 'algoliasearch/lite'              // v4 default export
- const client = algoliasearch(APP_ID, API_KEY)
- const index = client.initIndex(INDEX_NAME)
- const { hits } = await index.search(query)                  // v4 path
+ import { liteClient } from 'algoliasearch/lite'             // v5 named export
+ const client = liteClient(APP_ID, API_KEY)
+ // v5 no tiene initIndex — el cliente se usa directo
+ const response = await client.search({
+   requests: [{ indexName: INDEX_NAME, query }],
+ })
+ const hits = response.results[0]?.hits ?? []
```

Versiones breaking relevantes de la v5:
- `algoliasearch` (full) y `liteClient` son **named exports**, no default
- `client.initIndex()` ya no existe — usar `client.search({ requests: [...] })` directo
- La respuesta tiene estructura `{ results: [{ hits, ... }] }`, no `{ hits }` directo
- Para usar solo la búsqueda, NO hay que inicializar un "index" — el cliente sabe el indexName por request

### 4. Vite cache puede servir bundle viejo con vars undefined

**Síntoma**: después de actualizar `.env.local` y reiniciar `pnpm dev`, las vars siguen apareciendo como `undefined` en el browser.

**Causa**: Vite cachea imports y a veces sirve el bundle viejo.

**Fix**:
```bash
Ctrl+C  # parar dev
Remove-Item -Recurse -Force node_modules/.vite, .astro
pnpm dev
```

### 5. El overlay rojo de Astro "Unhandled rejection" (Edge Functions / Deno)

**Síntoma**: cada vez que arranca `pnpm dev`, aparece un overlay rojo que dice "Could not establish a connection to the Netlify Edge Functions local development server".

**Causa**: el adapter `@astrojs/netlify` intenta conectar con Deno local para emular edge functions. Deno no está corriendo (y no hace falta para Plocos).

**Estado**: pre-existente, no relacionado con la búsqueda. Aparece en cada `astro dev` pero no afecta funcionalidad (las páginas siguen sirviéndose con `[200]`). Se puede ignorar hasta que se decida agregar Edge Functions reales.

### Debug flow usado (referencia futura)

Si la búsqueda no devuelve resultados en el futuro:

1. **Confirmar que el sync corrió verde**: `node src/lib/algoliasearch.js` debe loguear `Successfully indexed N posts to Algolia.`
2. **Verificar env vars del bundle del cliente** (DevTools console):
   ```js
   console.log(import.meta.env.PUBLIC_ALGOLIA_APP_ID)
   console.log(import.meta.env.PUBLIC_ALGOLIA_INDEX_NAME)
   console.log(import.meta.env.PUBLIC_ALGOLIA_SEARCH_API_KEY?.slice(0,8))
   ```
   Si alguno es `undefined` → problema de vars (volver a paso 2 de la sección principal).
3. **Verificar que el SDK se inicializa** (DevTools console → buscar errores):
   - `algoliasearch is not a function` → named export incorrecto (paso 3)
   - `initIndex is not a function` → usando v4 API en v5 (paso 3)
   - `Cannot read properties of undefined (reading 'appId')` → APP_ID undefined (paso 2)
4. **Verificar requests al backend** (DevTools Network → filtrar por `algolianet`):
   - Status 200 con `hits: [...]` → búsqueda funciona, problema es del lado del cliente (result rendering)
   - Status 200 con `hits: []` → el query no matchea con nada del índice (verificar contenido en dashboard)
   - Status 4xx → key o permisos mal
   - No request → cliente no se inicializó
