# Auditoria de vistas por jerarquia de usuario - admin

## Fecha

- `9 de abril de 2026`

## Objetivo

Dejar una base clara para continuar el desarrollo del admin sin adivinar:

- que niveles de usuario existen hoy en la app
- que capas reales reconoce el codigo
- cuantas pestañas o vistas tiene acceso cada perfil actualmente
- que trabajo de tu compañero esta bien integrado
- que falta para que la experiencia represente de verdad al negocio

Documento complementario para ejecucion por fases:

- `docs/fases-trabajo-jerarquia-y-cobertura-64-tablas-2026-04-09.md`
- `docs/fase-0-cierre-auditoria-y-congelamiento-2026-04-09.md`

## Fuente real de esta auditoria

Se reviso el codigo actual en:

- `src/app/providers/PortalProvider.tsx`
- `src/core/auth/portalAccess.ts`
- `src/core/admin/registry/moduleRegistry.ts`
- `src/app/layouts/PortalLayout.tsx`
- `src/app/router/index.tsx`
- `src/modules/auth/guards/PrivateRoute.tsx`
- `src/modules/portal/admin/dashboard/AdminDashboardPage.tsx`
- `src/modules/portal/admin/system/SystemAdminPage.tsx`
- `src/core/services/adminDriversService.ts`
- `src/core/services/adminSettlementsService.ts`
- `src/core/services/adminOrdersService.ts`

## Resumen ejecutivo

Hoy el admin ya no esta plano como antes, pero **todavia no esta jerarquizado por perfil**.

Lo que el codigo entiende hoy es esto:

1. `Plataforma`
2. `Negocio`
3. `Sucursal`

Pero **no** entiende todavia bien esto:

1. `owner` contra `manager`
2. `cashier` contra `operator`
3. `kitchen` contra `support`
4. `seguridad` como modulo propio
5. `pagos` como modulo visible
6. `comercios de plataforma` como centro del admin general

## Estado actual del shell

## Lo que si existe

- selector de capa en sidebar
- selector de sucursal operativa
- menu filtrado por `scope`
- resumen real por `scope`
- `system_settings` ya bloqueado para plataforma
- acceso al portal ya no depende solo de `merchant_staff`

## Lo que no existe todavia

- filtro de modulos por `perfil operativo`
- modulo `Pagos`
- modulo `Seguridad`
- modulo `Comercios` de plataforma
- hardening final de lecturas globales en `drivers`, `settlements` y directorio de drivers de `orders`

## Inventario actual de vistas

## Vistas admin montadas en router

Hoy hay `25` rutas admin montadas:

1. `/portal/admin`
2. `/portal/admin/commerce`
3. `/portal/admin/branches`
4. `/portal/admin/branches/new`
5. `/portal/admin/branches/:branchId`
6. `/portal/admin/catalog/categories`
7. `/portal/admin/catalog/modifiers`
8. `/portal/admin/catalog/products`
9. `/portal/admin/catalog/products/new`
10. `/portal/admin/catalog/products/:productId`
11. `/portal/admin/staff`
12. `/portal/admin/customers`
13. `/portal/admin/customers/:customerId`
14. `/portal/admin/drivers`
15. `/portal/admin/drivers/:driverId`
16. `/portal/admin/promotions`
17. `/portal/admin/promotions/:promotionId`
18. `/portal/admin/messages`
19. `/portal/admin/messages/:conversationId`
20. `/portal/admin/settlements`
21. `/portal/admin/settlements/merchant/:settlementId`
22. `/portal/admin/settlements/driver/:settlementId`
23. `/portal/admin/system`
24. `/portal/admin/orders`
25. `/portal/admin/orders/:orderId`

## Pestañas del sidebar hoy

El registry tiene `13` modulos lógicos:

- `12` habilitados
- `1` deshabilitado

Habilitados:

1. `Resumen`
2. `Comercio`
3. `Sucursales`
4. `Personal`
5. `Clientes`
6. `Catalogo`
7. `Pedidos`
8. `Reparto`
9. `Promociones`
10. `Liquidaciones`
11. `Mensajes`
12. `Sistema`

Deshabilitado:

1. `Pagos`

## Rutas legacy todavia montadas y ocultas

Todavia existen `9` rutas antiguas del portal operativo fuera del admin visible:

1. `/portal/dashboard`
2. `/portal/orders`
3. `/portal/orders/:id`
4. `/portal/menu`
5. `/portal/categories`
6. `/portal/products`
7. `/portal/branch-status`
8. `/portal/hours`
9. `/portal/staff`

Estas rutas **no salen en el sidebar nuevo**, pero siguen montadas en el router.  
Veredicto: `Parcial`. No rompen el admin, pero generan deuda y vistas ocultas.

## Jerarquia real que hoy reconoce el codigo

## Regla actual de entrada

El codigo concede acceso asi:

- `super_admin` o `admin` en `user_roles` o `profiles.default_role` -> `Plataforma`
- `merchant_staff` -> `Negocio`
- `merchant_staff` + al menos una sucursal relacionada -> `Sucursal`

## Problema actual

Dentro de la capa negocio, el sistema **no diferencia** bien estos perfiles:

- `owner`
- `manager`
- `cashier`
- `operator`
- `kitchen`
- `support`

Todos ellos entran practicamente con la misma huella de modulos si tienen `merchant_staff`.

## Matriz por nivel de usuario

## 1. Admin general de plataforma

Perfiles:

- `super_admin`
- `admin`

Como entra hoy:

- por `user_roles` o `profiles.default_role`

Capas disponibles:

- `Plataforma`
- si ademas tiene `merchant_staff`, tambien `Negocio` y `Sucursal`

Pestañas visibles hoy en `Plataforma`:

1. `Resumen`
2. `Reparto`
3. `Sistema`

Conteo actual:

- `3` pestañas visibles
- `4` rutas admin utilizables en esta capa

Vistas que realmente ve:

- resumen global
- listado/detalle de repartidores
- sistema global

Veredicto:

- `Parcial`

Motivo:

- ya existe capa plataforma visible
- pero todavia faltan `Comercios`, `Pagos` y `Seguridad`
- o sea, el admin general ya entra, pero todavia no gobierna toda la plataforma

## 2. Admin general + dueño de negocio

Perfiles:

- `super_admin`
- `admin`

Condicion:

- ademas tiene `merchant_staff`

Capas disponibles:

- `Plataforma`
- `Negocio`
- `Sucursal`

Conteo actual por capa:

- `Plataforma`: `3` pestañas, `4` rutas
- `Negocio`: `10` pestañas, `22` rutas
- `Sucursal`: `3` pestañas, `5` rutas

Conteo unico total disponible para ese usuario:

- `12` modulos habilitados
- `25` rutas admin montadas

Veredicto:

- `Parcial`

Motivo:

- ya puede cambiar de capa
- pero la capa plataforma sigue incompleta
- y el sistema todavia no baja permisos finos por perfil

## 3. Owner del negocio

Perfil esperado:

- `owner`

Como entra hoy:

- por `merchant_staff`

Capas disponibles hoy:

- `Negocio`
- `Sucursal`

Pestañas visibles hoy en `Negocio`:

1. `Resumen`
2. `Comercio`
3. `Sucursales`
4. `Personal`
5. `Clientes`
6. `Catalogo`
7. `Pedidos`
8. `Promociones`
9. `Liquidaciones`
10. `Mensajes`

Pestañas visibles hoy en `Sucursal`:

1. `Resumen`
2. `Pedidos`
3. `Mensajes`

Conteo actual:

- `10` pestañas en negocio
- `3` pestañas en sucursal
- `22` rutas admin utilizables

Veredicto:

- `Parcial`

Motivo:

- para un owner esta bastante cerca de lo correcto
- pero faltan `Pagos y caja`
- sigue tocando `user_roles` desde `Personal`
- y no existe todavia `merchant_settings`

## 4. Manager del negocio

Perfil esperado:

- `manager`

Como entra hoy:

- exactamente igual que `owner`

Capas disponibles hoy:

- `Negocio`
- `Sucursal`

Conteo actual:

- `10` pestañas en negocio
- `3` pestañas en sucursal
- `22` rutas admin utilizables

Veredicto:

- `Parcial tirando a fatal`

Motivo:

- el sistema no lo diferencia del owner
- hoy ve practicamente todo el negocio
- para negocio real deberia tener menos gobierno sobre seguridad, configuracion y estructura

## 5. Operacion de sucursal

Perfiles esperados:

- `cashier`
- `operator`
- `kitchen`
- `support`

Como entran hoy:

- por `merchant_staff`

Capas disponibles hoy:

- `Negocio`
- `Sucursal`

Conteo actual:

- `10` pestañas en negocio
- `3` pestañas en sucursal
- `22` rutas admin utilizables

Veredicto:

- `Fatal`

Motivo:

- estos perfiles deberian vivir casi solo en `Sucursal`
- hoy pueden ver todo lo del negocio igual que owner y manager
- eso significa que la jerarquia funcional todavia no esta bien cerrada

## 6. Staff sin sucursal asignada

Perfil posible:

- cualquier `merchant_staff` sin relacion en `merchant_staff_branches`

Capas disponibles hoy:

- solo `Negocio`

Pestañas visibles hoy:

1. `Resumen`
2. `Comercio`
3. `Sucursales`
4. `Personal`
5. `Clientes`
6. `Catalogo`
7. `Promociones`
8. `Liquidaciones`
9. `Mensajes`

Conteo actual:

- `9` pestañas
- `20` rutas admin utilizables

Veredicto:

- `Parcial`

Motivo:

- la app evita mostrar `Pedidos` sin sucursal
- pero sigue sin distinguir si ese staff deberia tener alcance de negocio completo

## Lo que si hizo bien tu compañero y si esta integrado

Estas piezas si quedaron integradas correctamente:

1. `Shell responsive`
   - sidebar y topbar modernos
   - buena base visual para seguir

2. `Piel visual del admin`
   - CSS del admin mas consistente
   - ya sirve como base de estilo

3. `Silent session refresh`
   - mejora real para no botar al usuario

4. `Dashboard moderno`
   - la base visual sirvio
   - ya se adapto a resumen por capa

Veredicto sobre el trabajo de tu compañero:

- `Bien integrado visualmente`
- `Incompleto funcionalmente`

## Lo que no esta correctamente integrado todavia

## 1. No hay seguridad por perfil operativo

Problema:

- `owner`, `manager`, `cashier`, `operator`, `kitchen` y `support` no reciben menus distintos

Impacto:

- la jerarquia visual existe por capa
- pero no por responsabilidad real

Estado:

- `Fatal`

## 2. `Pagos` sigue apagado

Problema:

- el modulo existe en el registry, pero esta en `enabled: false`

Impacto:

- falta una de las piezas mas importantes para negocio

Estado:

- `Fatal`

## 3. `Seguridad` sigue mezclada dentro de `Personal`

Problema:

- `roles` y `user_roles` siguen viviendose desde `Staff`

Impacto:

- seguridad institucional sigue sin consola propia

Estado:

- `Fatal`

## 4. Falta `Comercios` para plataforma

Problema:

- un admin general no tiene vista maestra de todos los negocios

Impacto:

- plataforma existe como capa, pero no como centro de gobierno de negocios

Estado:

- `Fatal`

## 5. Siguen existiendo rutas legacy ocultas

Problema:

- el router todavia monta rutas antiguas del portal

Impacto:

- no todo lo visible coincide con lo realmente accesible

Estado:

- `Parcial`

## 6. Scope duro aun pendiente en algunos servicios

Hallazgos confirmados:

- `adminDriversService` sigue leyendo `drivers` globales
- `adminSettlementsService` sigue leyendo `drivers` y `driver_settlements` globales
- `adminOrdersService` sigue armando directorio de drivers global

Impacto:

- hoy esta mejor porque esos modulos ya no se muestran donde no toca
- pero el hardening total de backend cliente todavia no esta cerrado

Estado:

- `Parcial`

## Lectura final: si hoy sigues desarrollando, que debes asumir

Debes asumir esto como verdad operativa:

1. La separacion por `capa` ya existe y ya sirve como base.
2. La separacion por `perfil` todavia no existe realmente.
3. El trabajo visual de tu compañero si sirve y si se conserva.
4. La siguiente fase correcta ya no es hacer mas CRUD suelto.
5. La siguiente fase correcta es terminar la jerarquia funcional.

## Backlog exacto para continuar

Orden recomendado:

1. Crear `matriz de permisos por perfil`
   - `owner`
   - `manager`
   - `cashier`
   - `operator`
   - `kitchen`
   - `support`

2. Aplicar filtro de modulos por perfil
   - no solo por `scope`

3. Crear modulo `Comercios` en `Plataforma`

4. Crear modulo `Seguridad`
   - `roles`
   - `user_roles`
   - despues moverlos fuera de `Personal`

5. Crear modulo `Pagos`

6. Cerrar hardening de servicios globales
   - `drivers`
   - `orders` driver directory
   - `settlements`

7. Apagar o migrar las `9` rutas legacy

## Veredicto final

Hoy el admin esta asi:

- `bien encaminado por capa`
- `bien integrado visualmente`
- `todavia mal jerarquizado por perfil`
- `todavia incompleto para plataforma`

Si seguimos desarrollando desde aqui, el foco correcto es:

- `jerarquia por perfil`
- `plataforma completa`
- `pagos`
- `seguridad`

No el CRUD suelto.
