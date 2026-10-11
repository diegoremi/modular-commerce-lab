# Modular Commerce Lab

Laboratorio de Angular y Nx para practicar límites entre capas, formularios reactivos,
búsquedas con RxJS y pruebas unitarias y E2E. La página inicial muestra ocho productos
y permite buscar por nombre o categoría.

## Ejecutar la aplicación

Instala las dependencias con la versión de pnpm indicada en `package.json`:

```sh
pnpm install --frozen-lockfile
pnpm exec nx serve modular-commerce-lab
```

Abre http://localhost:4200. Para generar la aplicación de producción:

```sh
pnpm exec nx build modular-commerce-lab
```

## Arquitectura

| Proyecto                   | Ubicación                           | Responsabilidad                                                                                         |
| -------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `modular-commerce-lab`     | `apps/modular-commerce-lab`         | Componer features y UI en la aplicación.                                                                |
| `feature-product-list`     | `libs/catalog/feature-product-list` | Buscador, estados y presentación de productos en su propio template.                                    |
| `data-access`              | `libs/catalog/data-access`          | `ProductService`, catálogo simulado y filtrado.                                                         |
| `catalog-models`           | `libs/catalog/models`               | Contrato `Product`, sin dependencias de Angular. Alias público: `@modular-commerce-lab/catalog/models`. |
| `ui`                       | `libs/shared/ui`                    | Componentes visuales compartidos.                                                                       |
| `util`                     | `libs/shared/util`                  | Utilidades compartidas.                                                                                 |
| `modular-commerce-lab-e2e` | `apps/modular-commerce-lab-e2e`     | Pruebas de navegador con Playwright.                                                                    |

Las etiquetas `scope:*` delimitan los dominios y `type:*` delimitan las capas.
`eslint.config.mjs` aplica ambas restricciones mediante `@nx/enforce-module-boundaries`:

- La app (`scope:app`, `type:app`) importa features y UI de catálogo o compartidas;
  no accede directamente a data-access, modelos o utilidades.
- Catálogo puede depender de catálogo y shared. Shared depende solamente de shared.
- Features pueden importar data-access, UI, utilidades y modelos.
- Data-access puede importar data-access, utilidades y modelos.
- UI puede importar UI, utilidades y modelos, respetando también su scope.
- Utilidades dependen de utilidades; modelos dependen de modelos.

Los imports entre proyectos usan los alias de `tsconfig.base.json` y los `index.ts`
públicos. Para inspeccionar el grafo:

```sh
pnpm exec nx graph
```

## Decisiones de búsqueda

`FeatureProductList` usa un `FormControl` no nullable. Normaliza el término con
`trim()` y minúsculas, y `distinctUntilChanged()` evita repetir términos equivalentes.
El servicio busca coincidencias parciales en nombre o categoría; un término vacío
recupera el catálogo completo.

**Cancelamos al cambiar el término, antes de esperar el debounce.** El `switchMap`
exterior recibe cada término normalizado y cancela tanto la consulta anterior como
su espera pendiente. Dentro, `timer(300)` implementa el debounce de 300 ms; otro
`switchMap` inicia la consulta cuando termina la espera. Usar `debounceTime(300)`
antes del `switchMap` de consulta permitiría que una respuesta anterior se mostrara
mientras se escribe el siguiente término. Los cambios de espacios o mayúsculas que
no alteran el término normalizado no cancelan ni repiten consultas.

La primera consulta comienza inmediatamente, sin debounce. `ProductService`
simula una respuesta asíncrona de **500 ms** con un observable frío basado en
`timer`. Desuscribirse cancela el temporizador: no se emite ni se filtra una
respuesta cancelada. Es una simulación local; todavía no existe una API HTTP.
Una búsqueda nueva tarda aproximadamente 800 ms entre debounce y respuesta.

El template distingue espera de escritura, carga, resultados, vacío y error.
Al cambiar el término se retiran los resultados anteriores para no presentarlos
como resultados de la nueva búsqueda. `catchError` queda dentro de la consulta,
para que un error no cierre el flujo y otra búsqueda pueda recuperarse.
`AsyncPipe` administra la suscripción y su limpieza al destruir el componente.
Los precios usan `CurrencyPipe` con USD provisionalmente; el modelo aún no define moneda.

## Validación

```sh
# Lint de todos los proyectos con target lint
pnpm exec nx run-many -t lint

# Contratos de catálogo, sin emitir archivos
pnpm exec nx typecheck catalog-models

# Pruebas unitarias de librerías y aplicación, sin modo watch
pnpm exec nx run-many -t test --watch=false

# Compilación de producción y validación de templates Angular
pnpm exec nx build modular-commerce-lab

# Tipos de la configuración y pruebas E2E
pnpm exec tsc -p apps/modular-commerce-lab-e2e/tsconfig.json --noEmit
```

Las librerías Angular usan Vitest con Analog; `util` usa Vitest en Node. La app
usa Vitest mediante `@angular/build:unit-test`. No hay configuración de Jest.

Los tests del feature sustituyen `ProductService` mediante `TestBed.providers`.
Temporizadores controlados y observables pendientes comprueban el debounce,
la deduplicación, los estados, la recuperación de errores y la limpieza de suscripciones.
El caso de concurrencia verifica que una respuesta anterior llegada **durante los
300 ms de espera del siguiente término** no aparezca en el template.
Los tests del servicio comprueban filtrado, emisión diferida y cancelación real del timer.

## Pruebas E2E

Instala los navegadores al instalar o actualizar Playwright:

```sh
pnpm exec playwright install chromium firefox webkit
```

Nx inicia el servidor de desarrollo como dependencia. Para Chromium:

```sh
pnpm exec nx run modular-commerce-lab-e2e:e2e -- --project=chromium
```

Para WebKit, cambia a `--project=webkit`. El separador `--` pasa el selector a
Playwright. Para los tres navegadores:

```sh
pnpm exec nx e2e modular-commerce-lab-e2e
```

Las pruebas usan locators con reintentos para verificar título y catálogo, buscar
por nombre y categoría, mostrar el estado vacío y recuperar los ocho productos
al limpiar el campo. No usan esperas de tiempo fijo.

La configuración ESM carga los módulos CommonJS de Nx con `createRequire`, evitando
el fallo de acceso a `require.cache` del cargador de Playwright.
En macOS 27, Firefox puede fallar con `Could not find profile folder`
([incidencia de Playwright](https://github.com/microsoft/playwright/issues/42768)).
Chromium y WebKit pueden ejecutarse por separado; el problema de Firefox no se
oculta eliminándolo de la configuración.
