# El Cerdo Cyborg

Web móvil para una liga Mister con tres ideas mezcladas: el ritual del cerdo, análisis de datos jornada a jornada y una clasificación general con estética cyber/neón.

## Intención del proyecto

Esta página no busca ser un dashboard serio y frío. La gracia está en que la liga tenga una narrativa propia: el cerdo dicta sentencia, elige dos tarjetas antes de cada jornada y luego se comprueba si acertó señalando a equipos que acabaron últimos o penúltimos. La parte de datos tiene que servir para picarse, descubrir patrones y dar contexto, pero sin matar el tono de broma interna.

El estilo visual deseado es futurista, oscuro y de neón, con azul cian para señales positivas y rosa/magenta para señales negativas o castigos. La experiencia principal debe estar pensada para móvil antes que para ordenador. En escritorio puede verse mejor y más amplia, pero nunca debe obligar a hacer zoom out en móvil.

## Estructura de la web

La web se divide en tres pestañas principales:

- `Cerdo`: imagen del cerdo cyborg, cuenta atrás, revelación de tarjetas, historial de tarjetas por jornada, víctimas favoritas y puntería del cerdo.
- `General`: clasificación general animada con carrera de barras y sistema de galardones acumulados por equipo.
- `Jornada`: clasificación de una jornada concreta y galardones otorgados en esa jornada.

La pestaña del cerdo debe conservar el componente emocional del proyecto: cuenta atrás, sentencia, tarjetas y easter egg. El easter egg se activa con cinco toques o clicks rápidos en el mismo punto de la pantalla, para que funcione en móvil y ordenador sin saltar al navegar.

## Datos del cerdo

El archivo `data/cerdo/history.json` guarda el histórico manual o automatizado de sentencias:

- `round`: jornada.
- `status`: `closed` o `in_progress`.
- `victims`: equipos que quedaron último y penúltimo cuando la jornada ya está cerrada.
- `cards`: las dos imágenes que seleccionó el cerdo para esa jornada.

La regla de acierto es simple: una tarjeta cuenta como acierto si representa a un equipo que termina último o penúltimo esa jornada. Las tarjetas deben coincidir siempre entre la visualización principal y el selector histórico. Para jornadas pasadas hay que guardar las cartas reales elegidas, no regenerarlas al vuelo.

Relación actual de tarjetas:

- `img/img1.jpg`: Peter LIM.
- `img/img2.jpg`: Rodando Nazário.
- `img/img3.jpg`: Alex Ballena.
- `img/img4.jpg`: Mikel Poyarzabal.
- `img/img5.jpg`: Heung Min Dad.
- `img/img6.jpg`: Don Manuel Ruíz de Lopera.
- `img/img7.jpeg`: Olivito.
- `img/rodri.jpg`: reserva, no usada ahora.

## Galardones

Los galardones sustituyen a varias visualizaciones clásicas de ganadores, farolillos y regularidad. La idea es que cada equipo tenga una matriz de iconos bloqueados/desbloqueados. Los buenos usan cian, los malos usan rosa. Si se repiten, muestran contador tipo `x3`.

Galardones deseados:

- Ganador de la jornada.
- Perdedor de la jornada.
- Más puntos por valor de equipo.
- Menos puntos por valor de equipo.
- Más goles.
- Más asistencias.
- Recibió roja.
- Más jugadores que no jugaron.
- Mayor dependencia de un jugador.
- Equipo más coral.
- Eligió al capitán adecuado.
- Peor alineador.
- Mejor director deportivo.
- Peor director deportivo.
- Mejor trader.
- Peor trader.
- No puntuó por estar en negativo, con icono de calavera.

Algunos sólo se pueden calcular con datos de puntos por equipo. Otros necesitan detalle por jugador, alineaciones, banquillo, eventos, capitán, valores históricos o saldo negativo. Si Mister no expone una parte, el scraper debe guardar primero todo lo visible y después derivar los galardones cuando existan datos suficientes.

## Automatización

Hay dos workflows en GitHub Actions:

- `.github/workflows/scrape-mister-market.yml`: se ejecuta a diario a las `07:10 UTC`, que normalmente son las `09:10` en España en horario de verano. Lee mercado, actualiza calendario y reconstruye datos.
- `.github/workflows/scrape-mister-weekly.yml`: se ejecuta los martes a las `08:30 UTC`, normalmente `10:30` en España en horario de verano. Lee feed, clasificación, equipo, búsqueda, jornadas, managers, alineaciones, banquillo, eventos y puntuaciones por proveedor desde los endpoints internos de Mister.

Ambos pueden lanzarse también a mano desde la pestaña `Actions` de GitHub con `Run workflow`.

Para que funcionen sin el ordenador encendido hacen falta secretos en GitHub:

- `MISTER_COMMUNITY_ID`: id de la comunidad Mister.
- `MISTER_STORAGE_STATE_BASE64`: sesión exportada de Mister en base64 compacto.
- Opcionalmente `MISTER_EMAIL` y `MISTER_PASSWORD`, sólo si se quiere intentar login con credenciales.

GitHub Actions hace el trabajo en servidores de GitHub. No hace falta que el ordenador esté encendido, ni que Codex o ChatGPT estén abiertos. Lo único que puede requerir intervención humana es que la sesión de Mister caduque; en ese caso hay que volver a exportar el storage state y actualizar el secreto.

## Qué hacer cada jornada

En condiciones normales, no hay que hacer nada. El martes, si la jornada ya está cerrada en Mister, GitHub Actions debería leer los nuevos datos, hacer commit automático en `data/` y GitHub Pages redeplegará la web.

Si una jornada queda incompleta por partidos aplazados, se debe mantener como `in_progress` y no sumarla a la general ni desbloquear galardones hasta que Mister la dé por cerrada. La web puede mostrar datos en vivo o provisionales, pero la clasificación histórica y los galardones sólo deben consolidarse con jornadas cerradas.

Conviene revisar de vez en cuando:

- Que el workflow semanal no esté fallando en GitHub.
- Que la sesión de Mister no haya caducado.
- Que `data/cerdo/history.json` guarde bien las tarjetas reales de cada jornada.
- Que la cabecera de la web muestre fechas distintas para versión web y datos, así se sabe si se actualizó código, datos o ambas cosas.

## Identidad de equipos

Mister permite que un equipo cambie de nombre durante la temporada. Para que eso no rompa las clasificaciones, gráficos, galardones, mercado ni aciertos del cerdo, la identidad real del equipo debe ser siempre el `managerId`, no el texto del nombre.

El archivo `data/mister/team-registry.json` guarda:

- `managerId`: clave estable.
- `currentName`: nombre visible actual.
- `initials`: iniciales visibles.
- `color`: color fijo de ese equipo en todos los gráficos.
- `aliases`: nombres antiguos o alternativos que deben resolverse al mismo equipo.

Cada vez que corre el builder semanal, compara los managers actuales de Mister con ese registro. Si detecta el mismo `managerId` con un nombre nuevo, actualiza `currentName` y conserva los nombres anteriores en `aliases`. Los datos antiguos que sólo tengan el nombre escrito, como snapshots de mercado, transferencias visibles o tarjetas históricas del cerdo, se deben resolver contra esos alias antes de agregarse.

## Scraping profundo

El scraper semanal genera `data/mister/latest/deep.json`. La metodología buena es híbrida: abre una sola página autenticada para leer el `X-Auth` que usa Mister y después hace peticiones limpias a los endpoints JSON internos, sin abrir ficha por ficha ni depender de clicks visuales.

Endpoints reales usados:

- `POST /ajax/sw/players`: catálogo paginado de jugadores, valores, propietarios y rachas.
- `POST /ajax/sw/gameweek`: jornadas, partidos, estado de jornada y jugadores destacados.
- `POST /ajax/sw/users`: equipo por manager y jornada, alineación, banquillo, capitán, multiplicador y valor de equipo.
- `POST /ajax/player-gameweek`: detalle jugador-jornada con Mixto, AS, Marca, Mundo Deportivo, Sofascore, Marca Stats, goles, asistencias, tarjetas, minutos y estadísticas.

Ese archivo guarda:

- IDs reales de jornada de Mister.
- Managers de la liga.
- Clasificaciones por jornada con valor de equipo.
- Vista de jornada completa con partidos, once ideal y jugadores de la liga.
- Alineaciones y banquillos por manager y jornada.
- Capitán elegido y multiplicador.
- Catálogo de todos los jugadores visibles en Mister.
- Puntos por jornada, goles, asistencias, tarjetas, minutos y eventos.
- Desglose de Mixto, AS, Marca, Mundo Deportivo, Sofascore y Marca Stats.

La web usa esos datos para permitir que las clasificaciones de `General` y `Jornada` cambien entre `Mixto`, `AS`, `Marca`, `Mundo Deportivo`, `Sofascore` y `Marca Stats`. Si falta un dato de proveedor en un jugador concreto, no se inventa: ese jugador queda fuera de esa suma alternativa hasta que Mister devuelva el detalle.

Las asistencias no aparecen como campo simple en la ficha, pero sí se recuperan del detalle estadístico `goalAssist`. Por criterio de liga, `Peor alineador` y `Mejor/peor director deportivo` no se otorgan para jornadas anteriores al corte configurado en `MISTER_LINEUP_AWARD_START_ROUND`, aunque Mister permita recuperar parte del banquillo histórico.

## Cómo replicarlo en otro proyecto

Si se quiere hacer algo parecido para Biwenger u otra liga fantasy, el orden recomendado es:

1. Leer todos los datos exportables o scrapeables de la plataforma.
2. Separar datos crudos, snapshots históricos y datos derivados para la web.
3. Diseñar primero la experiencia móvil.
4. Mantener una pestaña narrativa propia de la liga, no sólo gráficos.
5. Crear una clasificación general animada por jornadas.
6. Crear una vista por jornada con resultados y premios.
7. Automatizar capturas diarias para mercado/calendario y semanales para jornada cerrada.
8. Guardar histórico real de decisiones irrepetibles, como las tarjetas elegidas por el cerdo.
9. Usar GitHub Actions para que no dependa del ordenador local.
10. Dejar siempre visible la versión de web y la fecha de datos para diagnosticar cachés o despliegues.

La prioridad de diseño es que se sienta como una app de liga privada: rápida de mirar, con humor interno, visualmente reconocible y con suficiente análisis para que cada jornada tenga conversación.
