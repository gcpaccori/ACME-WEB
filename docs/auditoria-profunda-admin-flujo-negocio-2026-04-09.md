# Auditoria Profunda Admin - Flujo de negocio, capas y visibilidad real

## Fecha

- `9 de abril de 2026`

## Objetivo

Validar si el `admin web` actual realmente sirve al negocio como consola operativa y de control, no solo como implementacion tecnica de CRUD relacional.

La pregunta auditada fue esta:

- si la experiencia actual deja claro el negocio
- si el administrador entiende donde esta y sobre que capa opera
- si existe separacion real entre `dueno del sistema` y `dueno del negocio`
- si siguen quedando tablas o capacidades importantes ocultas
- si la vista actual ya soporta el flujo real del negocio

## Metodologia

Esta auditoria se hizo sobre el codigo real del portal y sobre su shell administrativo actual.

Se revisaron:

- layout y shell admin
- rutas reales
- `PortalContext` y contexto de sesion
- permisos y acceso
- registry de modulos
- visibilidad de tablas por modulo
- scoping de datos en servicios
- experiencia de negocio por rol

No es una auditoria de screenshot o pixel-perfect.

Es una auditoria visual-funcional basada en:

- estructura de pantallas
- contexto visible
- jerarquia de navegacion
- capas de operacion
- alcance real de datos

## Veredicto ejecutivo

## Dictamen corto

No.

Hoy el admin **no esta listo para decir que "sirve al negocio completo"** aunque tenga mucho trabajo tecnico avanzado.

Lo que si existe hoy:

- un armazon reusable bueno
- vistas relacionales utiles
- varias fichas compuestas bien encaminadas
- una cobertura tecnica alta del esquema

Lo que todavia **no** existe de forma suficiente:

- separacion real entre `dueno del sistema` y `dueno del negocio`
- navegacion jerarquica de negocio clara
- control de scope visual entre `plataforma`, `comercio` y `sucursal`
- tablero diario que exprese la operacion real
- un `centro de pagos y caja` visible
- un `centro de seguridad y permisos` visible
- proteccion consistente contra lecturas globales en modulos que deberian estar acotados

En resumen:

- **tecnicamente** el admin esta bastante mas avanzado que antes
- **visualmente y a nivel negocio** todavia se siente como una consola tecnica de modulos, no como un sistema mundial de administracion para delivery

## Hallazgos prioritarios

## 1. Critico - No existe separacion real de capas admin

Hoy solo existe una capa practica:

- `usuario con merchant_staff`

El portal no tiene una capa distinta para:

- `dueno del sistema`
- `dueno del negocio`
- `operador de sucursal`

Evidencia:

- el `PrivateRoute` solo deja entrar si existe `staffAssignment`, o sea si el usuario esta asignado a un negocio, en [PrivateRoute.tsx](../src/modules/auth/guards/PrivateRoute.tsx)
- el `PortalProvider` crea permisos booleanos identicos segun exista o no `staffAssignment`, no segun rol real, en [PortalProvider.tsx](../src/app/providers/PortalProvider.tsx)
- `authService.fetchPortalContext` toma una sola asignacion de `merchant_staff` y construye un unico contexto de comercio, en [authService.ts](../src/core/services/authService.ts)

Consecuencia de negocio:

- un `super_admin` de plataforma que no sea `merchant_staff` ni siquiera tiene entrada natural al admin
- un `owner` de negocio ve el mismo shell base que deberia ver alguien operativo
- no hay un corte claro de que es `plataforma`, que es `negocio`, y que es `sucursal`

Dictamen:

- esta es la deuda mas importante

## 2. Critico - El shell no expresa jerarquia de negocio ni contexto de alcance

El layout actual muestra:

- nombre del comercio
- sucursal actual
- lista plana de modulos
- titulo generico `Portal admin`

Pero no muestra una jerarquia real de trabajo como:

- `Plataforma / Comercios / Comercio X / Sucursal Y / Pedidos`
- `Sistema / Seguridad / Roles`
- `Negocio / Caja / Cobros`

Evidencia:

- el sidebar solo lista los modulos habilitados del registry, sin filtro por capa ni por rol, en [PortalLayout.tsx](../src/app/layouts/PortalLayout.tsx)
- las rutas admin actuales viven todas bajo `/portal/admin/...` como un arbol plano, en [routes.ts](../src/core/constants/routes.ts)

Consecuencia de negocio:

- el usuario no siente que esta entrando a una consola mundial
- no hay diferencia entre operar la plataforma y operar un comercio
- el orden del trabajo diario no nace del negocio, nace del menu

Dictamen:

- el shell actual es suficiente como base tecnica
- no es suficiente como shell mundial de negocio

## 3. Critico - La sucursal actual queda fija y no existe selector real de alcance

Hoy `currentBranch` se resuelve automaticamente con la sucursal primaria o la primera disponible.

Pero no existe:

- selector de sucursal visible
- persistencia de sucursal elegida por el usuario
- cambio de alcance desde el shell

Evidencia:

- `currentBranch` se calcula una vez en `authService.fetchPortalContext`, en [authService.ts](../src/core/services/authService.ts)
- el `PortalContext` no expone un `setCurrentBranch`, solo `reloadPortalContext`, en [PortalProvider.tsx](../src/app/providers/PortalProvider.tsx)
- `OrdersAdminPage` depende solo de `portal.currentBranch?.id`, en [OrdersAdminPage.tsx](../src/modules/portal/admin/orders/OrdersAdminPage.tsx)

Consecuencia de negocio:

- el `dueno del negocio` no puede moverse fluidamente entre sucursales
- la vista de pedidos no sirve como centro multi-sucursal
- el dashboard no se siente como tablero de negocio sino como tablero atado al local que salio primero

Dictamen:

- para una operacion real con varias sucursales, esto hoy no alcanza

## 4. Alta - Hay modulos con lectura global o semiglobal donde deberia haber scope controlado

### Reparto

`adminDriversService` hoy trabaja sobre:

- todos los `drivers`
- todos los `profiles`
- todos los `vehicle_types`
- todos los los `order_assignments`
- todos los `cash_collections`

sin acotarlo al comercio actual.

Evidencia:

- `fetchAssignableProfiles` lee todos los perfiles de plataforma, en [adminDriversService.ts](../src/core/services/adminDriversService.ts)
- `fetchDrivers` lee todos los drivers y luego cruza estados, vehiculos, asignaciones y caja, en [adminDriversService.ts](../src/core/services/adminDriversService.ts)

### Pedidos

La bandeja de pedidos si esta acotada por `branch_id`, pero la ficha de pedido arma el directorio de drivers con `fetchDriverDirectory()` sin scope de comercio.

Evidencia:

- `fetchDriverDirectory()` lee todos los drivers y vehiculos, en [adminOrdersService.ts](../src/core/services/adminOrdersService.ts)

### Liquidaciones

El modulo de liquidaciones trae:

- `driver_settlements` globales
- lookup de drivers global

y luego filtra reglas por relevancia, pero no resuelve realmente la pertenencia del repartidor al comercio.

Evidencia:

- `fetchSettlementLookups` lee todos los drivers y todos los profiles, en [adminSettlementsService.ts](../src/core/services/adminSettlementsService.ts)
- `fetchSettlementsOverview` trae todos los `driver_settlements`, en [adminSettlementsService.ts](../src/core/services/adminSettlementsService.ts)

Consecuencia de negocio:

- riesgo de mezclar datos de plataforma en vistas que deberian ser del negocio
- un owner de negocio podria terminar viendo repartidores o liquidaciones ajenas
- el admin hoy no tiene una frontera fuerte de alcance

Dictamen:

- esto es funcionalmente peligroso

## 5. Alta - El modulo Sistema no es realmente una consola de sistema, pero si toca configuracion global

El modulo `Sistema` hoy aparece dentro del mismo shell del negocio y permite editar `system_settings`, que es una tabla global de plataforma.

Evidencia:

- la page exige `merchantId`, o sea entra como si fuera modulo del negocio, en [SystemAdminPage.tsx](../src/modules/portal/admin/system/SystemAdminPage.tsx)
- `fetchSystemOverview` trae `system_settings` completos, sin scope por negocio, en [adminSystemService.ts](../src/core/services/adminSystemService.ts)
- `saveSetting` crea o edita `system_settings` globales, en [adminSystemService.ts](../src/core/services/adminSystemService.ts)
- el registry de `system` solo expone `system_settings`, `audit_logs`, `merchant_audit_logs` y `analytics_events`, y deja fuera `roles` y `user_roles`, en [moduleRegistry.ts](../src/core/admin/registry/moduleRegistry.ts)

Consecuencia de negocio:

- un usuario de negocio podria tocar configuracion global de plataforma
- el `dueno del sistema` no tiene su consola propia
- el `dueno del negocio` ve algo llamado `Sistema` que mezcla cosas globales y cosas propias

Dictamen:

- el modulo `Sistema` esta conceptualmente mal ubicado

## 6. Alta - Falta un centro visible de Pagos y Caja

El negocio de delivery necesita un centro visible para:

- pagos
- transacciones
- refund
- caja
- conciliacion

Pero hoy el modulo `Pagos` sigue deshabilitado.

Evidencia:

- `adminModules` tiene `payments` con `enabled: false` y `route: ''`, en [moduleRegistry.ts](../src/core/admin/registry/moduleRegistry.ts)
- no existe ruta admin publica para pagos en [routes.ts](../src/core/constants/routes.ts)

Consecuencia de negocio:

- la informacion financiera queda dispersa entre pedido, cliente y driver
- no existe un frente financiero claro para owner o administrador
- el negocio no siente cerrada la capa de caja

Dictamen:

- es una ausencia importante de experiencia, no solo de routing

## 7. Media alta - Roles y permisos siguen escondidos dentro de Personal

`roles` y `user_roles` no tienen centro propio de seguridad.

Hoy viven subordinados a `Personal`, y en `Sistema` ni siquiera aparecen.

Evidencia:

- `roles` y `user_roles` se trabajan en [StaffAdminPage.tsx](../src/modules/portal/admin/staff/StaffAdminPage.tsx)
- `system` no los incluye en el registry, en [moduleRegistry.ts](../src/core/admin/registry/moduleRegistry.ts)

Consecuencia de negocio:

- seguridad y permisos no se perciben como una capa de gobierno
- la administracion de accesos se siente operativa, no institucional
- dificulta construir una verdadera vista de `dueno del sistema`

Dictamen:

- a nivel negocio mundial, seguridad debe ser modulo propio

## 8. Media - El dashboard no expresa el negocio diario

El dashboard actual es un listado de modulos, no una consola diaria.

Evidencia:

- `AdminDashboardPage` muestra el registry y el estado de los modulos, en [AdminDashboardPage.tsx](../src/modules/portal/admin/dashboard/AdminDashboardPage.tsx)

Consecuencia de negocio:

- el usuario entra al admin y no ve:
  - pedidos en curso
  - locales abiertos/cerrados
  - drivers online
  - pagos con problemas
  - incidencias
  - mensajes sin leer
  - liquidaciones pendientes
- no existe una entrada natural por operacion diaria

Dictamen:

- es un dashboard tecnico, no un dashboard de negocio

## Lo que si esta bien encaminado

Para no mezclar todo en negativo, esto si esta bien:

- existe `breadcrumb` y `context bar` en la mayoria de pages
- las fichas compuestas de `Pedidos`, `Clientes`, `Promociones`, `Drivers` y `Sucursales` ya trabajan varias tablas juntas
- el approach de `tabla hija en tab/modal/drawer` es correcto
- el framework reusable del admin es una buena base para corregir la experiencia

O sea:

- la direccion tecnica no esta mal
- la arquitectura base tampoco
- el problema actual es de `capas`, `scope`, `gobierno visual` y `orden de experiencia`

## Auditoria por perfil de negocio

## Perfil 1 - Dueno del sistema

Lo que deberia poder hacer:

- ver todos los comercios
- entrar a cualquier comercio
- ver todos los drivers de plataforma
- ver pagos globales
- ver auditoria global
- ver analytics global
- administrar `roles`, `user_roles` y `system_settings`
- no depender de ser `merchant_staff`

Lo que hoy puede hacer:

- en la practica, solo entrar si tiene un `merchant_staff`
- ver un shell pensado como negocio
- tocar `system_settings` globales desde el contexto de un comercio

Dictamen:

- el perfil `dueno del sistema` **no existe realmente** en la app actual

## Perfil 2 - Dueno del negocio

Lo que deberia poder hacer:

- alternar sucursales
- ver pedidos de todo su negocio o por sucursal
- ver caja y pagos
- ver promociones
- ver clientes
- ver personal
- ver mensajes
- ver liquidaciones propias

Lo que hoy puede hacer:

- operar varias fichas buenas
- editar comercio
- editar sucursales
- editar menu
- gestionar personal
- revisar pedidos por una sucursal actual
- revisar promociones
- revisar mensajes

Lo que todavia le falta:

- centro financiero claro
- cambio de sucursal real
- tablero diario del negocio
- fronteras firmes entre datos propios y globales

Dictamen:

- el perfil `dueno del negocio` existe a medias

## Perfil 3 - Operador de sucursal

Lo que deberia poder hacer:

- entrar directo a su local
- ver solo pedidos de su local
- ver solo personal y menu relevante
- no ver sistema ni liquidaciones globales

Lo que hoy pasa:

- comparte el mismo shell base del owner
- el menu no se filtra por permisos reales
- la app no expresa `modo sucursal`

Dictamen:

- el perfil `operador de sucursal` no esta modelado visualmente

## Como deberia verse la arquitectura de capas

La app ya no debe pensarse como un solo admin.

Debe pensarse como `3 capas`.

## Capa A - Admin de plataforma

Actor:

- `super_admin`
- `admin`

Objetivo:

- gobernar la plataforma

Modulos:

- `Plataforma`
- `Comercios`
- `Drivers globales`
- `Pagos globales`
- `Auditoria global`
- `Analytics`
- `Seguridad`
- `Configuracion`

Tablas clave:

- `merchants`
- `merchant_branches`
- `drivers`
- `payments`
- `payment_transactions`
- `refunds`
- `audit_logs`
- `analytics_events`
- `roles`
- `user_roles`
- `system_settings`

## Capa B - Admin de negocio

Actor:

- `owner`
- `manager`

Objetivo:

- operar un comercio completo

Modulos:

- `Resumen del negocio`
- `Sucursales`
- `Personal`
- `Clientes`
- `Catalogo`
- `Pedidos`
- `Pagos y caja`
- `Promociones`
- `Mensajes`
- `Liquidaciones`

Tablas clave:

- `merchant_branches`
- `merchant_staff`
- `customers`
- `products`
- `orders`
- `payments`
- `cash_collections`
- `promotions`
- `merchant_settlements`
- `merchant_audit_logs`

## Capa C - Operacion de sucursal

Actor:

- `cashier`
- `operator`
- `kitchen`
- `support`

Objetivo:

- operar el turno del local

Modulos:

- `Tablero del turno`
- `Pedidos`
- `Estado del local`
- `Menu operativo`
- `Incidencias`
- `Mensajes`

Tablas clave:

- `orders`
- `order_status_history`
- `order_assignments`
- `merchant_branch_status`
- `product_branch_settings`
- `conversations`
- `notifications`

## Como deberia verse el shell correcto

La app debe mostrar siempre 3 niveles visibles:

1. `Capa actual`
2. `Entidad actual`
3. `Alcance actual`

Ejemplo correcto para owner:

- `Negocio`
- `Polleria Wanka Express`
- `Todas las sucursales`

Ejemplo correcto para operador:

- `Sucursal`
- `Sucursal Huancayo Centro`
- `Turno actual`

Ejemplo correcto para super admin:

- `Plataforma`
- `Todos los comercios`
- `Vista global`

## Evaluacion del admin actual contra el negocio

## Lo que hoy ya sirve

- configuracion del comercio
- configuracion de sucursales
- gestion del catalogo
- parte importante de personal
- ficha operativa de pedido
- ficha de cliente
- ficha de promociones
- ficha de repartidor

## Lo que hoy sirve con riesgo o confusion

- reparto
- liquidaciones
- sistema

Motivo:

- scope mezclado o demasiado global

## Lo que hoy todavia no sirve de forma clara

- gobierno de plataforma
- seguridad como centro propio
- pagos y caja como frente principal
- tablero diario del negocio
- operacion multi-sucursal real

## Conclusiones

## Conclusiones duras

1. El admin actual **no debe presentarse como "ya listo para negocio completo"**.
2. La implementacion tecnica existe, pero la experiencia todavia no traduce correctamente el negocio.
3. La ausencia de capas admin distintas es hoy el problema mayor.
4. El shell actual es demasiado plano para un negocio con plataforma, comercios y sucursales.
5. Hay modulos donde el scope de datos todavia no esta suficientemente blindado.

## Conclusiones rescatables

1. La base reusable si sirve.
2. Las vistas compuestas tambien sirven.
3. No hay que rehacer todo.
4. Hay que reordenar el admin por `capas de gobierno` y `alcance`.

## Actualizacion recomendada antes de seguir implementando mas modulos

El siguiente tramo correcto ya no es "agregar otra page".

Es esta actualizacion estructural:

1. Crear `3 capas visibles de admin`
   - `plataforma`
   - `negocio`
   - `sucursal`
2. Separar permisos reales por rol
   - no por simple existencia de `staffAssignment`
3. Agregar selector de alcance
   - comercio
   - sucursal
4. Mover `roles`, `user_roles` y `system_settings` a una capa de plataforma
5. Crear `Pagos y caja` como modulo raiz visible
6. Filtrar `drivers`, `driver_settlements` y directorios operativos por alcance correcto
7. Rehacer el dashboard como `tablero de negocio`

## Decisiones de negocio que esta auditoria recomienda cerrar

1. Confirmar que existirán dos admins distintos:
   - `admin de plataforma`
   - `admin de negocio`
2. Confirmar si el owner debe ver:
   - todas sus sucursales juntas
   - o una sucursal por vez con selector
3. Confirmar si reparto es:
   - global de plataforma
   - o por comercio
4. Confirmar si `system_settings` sera:
   - solo plataforma
   - o si habra tambien `merchant_settings` en otra tabla o capa

## Dictamen final

Hoy el admin esta en esta situacion:

- **arquitectura tecnica:** buena base
- **CRUD relacional:** bien encaminado
- **experiencia de negocio:** incompleta
- **capas de gobierno:** insuficientes
- **claridad visual del negocio:** insuficiente

Por eso, la respuesta correcta a:

- `esto ya le sirve al negocio?`

es:

- `todavia no del todo`

Y la razon no es falta de tablas o falta de forms.

La razon es que **todavia no esta correctamente expresado quien administra que, desde que capa, con que alcance y con que visibilidad**.
