# Plan Maestro de Implementacion Admin

## Objetivo

Convertir la auditoria funcional y el mapa de tablas en un plan real de implementacion para un `admin web`:

- centrado en experiencia de negocio
- con `reutilizacion extrema`
- con `CRUD relacional contextual`
- con codigo limpio
- sin caer en `64 CRUDs aislados`

Este plan define **como** se construye el admin, no solo **que** deberia existir.

Documentos base:

- `docs/auditoria-admin-64-tablas-negocio.md`
- `docs/admin-mode-blueprint.md`
- `docs/plan-01-full-table-coverage.md`
- `docs/mapa-aplicaciones-tablas-pestanas.md`

## Tesis principal

La aplicacion admin no debe modelarse como:

- `ruta -> tabla -> formulario`

Debe modelarse como:

- `experiencia -> entidad raiz -> vista compuesta -> acciones relacionales`

La unidad principal de construccion no es la tabla.

La unidad principal de construccion es la `vista de negocio`.

Eso significa:

- una vista puede usar `1`, `5` o `15` tablas
- una tabla puede aparecer en `lista`, `tab`, `modal`, `drawer`, `timeline` o `solo lectura`
- el CRUD existe, pero gira alrededor de la experiencia

## Resultado esperado

Al final del plan, la app admin debe resolver las `64` tablas de la base en `13` modulos raiz:

1. `Resumen`
2. `Comercio`
3. `Sucursales`
4. `Personal y accesos`
5. `Clientes`
6. `Catalogo`
7. `Pedidos`
8. `Reparto`
9. `Pagos y caja`
10. `Promociones`
11. `Liquidaciones`
12. `Mensajes`
13. `Sistema`

## Principios rectores

### 1. No CRUD ciego

Nunca se editan foreign keys a mano.

Siempre se usa:

- contexto de sesion
- selectores humanos
- tabs hijos
- modales contextuales
- acciones guiadas

### 2. Toda tabla visible en la experiencia correcta

Ninguna tabla importante debe quedar solo en base.

Si no tiene vista propia, debe aparecer en:

- tab
- subtabla
- modal
- timeline
- drawer
- galeria
- panel de auditoria

### 3. Una sola forma de hacer las cosas

No se repite logica por modulo.

Debe haber una unica base para:

- cargar listas
- cargar detalles
- cargar lookups
- guardar formularios
- sincronizar tablas hijas
- ejecutar acciones criticas
- manejar modo, dirty state y breadcrumb

### 4. El codigo se organiza por experiencia y por contratos

No se organiza por tabla suelta.

Se organiza por:

- `shell admin`
- `componentes base`
- `registry de recursos`
- `servicios relacionales`
- `vistas compuestas`

### 5. La complejidad va hacia el framework interno, no hacia cada page

Cada pantalla concreta debe ser corta.

La complejidad se absorbe en:

- metadata
- helpers
- hooks
- motores de lista y detalle
- sincronizadores relacionales

## Arquitectura objetivo

## Capa 1 - Shell admin

Responsabilidad:

- layout
- menu
- auth context
- merchant context
- branch context
- permisos
- breadcrumbs
- barra de contexto
- estado de pagina

Archivos objetivo:

- `src/app/layouts/PortalLayout.tsx`
- `src/app/providers/*`
- `src/core/admin/shell/*`

## Capa 2 - UI base reusable

Responsabilidad:

- bloques visuales
- formularios base
- tablas
- tabs
- modales
- drawers
- timeline
- status pills
- action bars

Archivos objetivo:

- `src/components/admin/AdminScaffold.tsx`
- `src/components/admin/AdminFields.tsx`
- `src/components/admin/AdminDataTable.tsx`
- `src/components/admin/AdminTabs.tsx`
- `src/components/admin/AdminModalForm.tsx`
- `src/components/admin/AdminDrawer.tsx`
- `src/components/admin/AdminTimeline.tsx`
- `src/components/admin/AdminKeyValue.tsx`
- `src/components/admin/AdminEntityHeader.tsx`
- `src/components/admin/AdminSectionGrid.tsx`

## Capa 3 - Contratos y registry

Responsabilidad:

- decir como se comporta cada entidad raiz
- definir que vistas existen
- definir que tablas usa cada vista
- definir que hijos viven inline o en modal
- definir acciones disponibles

Archivos objetivo:

- `src/core/admin/registry/resourceRegistry.ts`
- `src/core/admin/registry/viewRegistry.ts`
- `src/core/admin/registry/lookupRegistry.ts`
- `src/core/admin/contracts.ts`

Tipos centrales:

- `AdminModuleSpec`
- `EntityRootSpec`
- `DetailViewSpec`
- `ChildRelationSpec`
- `ActionSpec`
- `LookupSpec`
- `SaveStrategy`

## Capa 4 - Datos y sincronizacion

Responsabilidad:

- armar queries relacionales
- hidratar detalles
- resolver lookups
- guardar tablas raiz
- sincronizar tablas hijas
- ejecutar RPC cuando aplique

Archivos objetivo:

- `src/core/services/adminService.ts`
- `src/core/admin/data/listQueries.ts`
- `src/core/admin/data/detailQueries.ts`
- `src/core/admin/data/lookupQueries.ts`
- `src/core/admin/data/saveStrategies.ts`
- `src/core/admin/data/actionHandlers.ts`
- `src/core/admin/data/syncChildren.ts`

## Capa 5 - Vistas compuestas

Responsabilidad:

- declarar una experiencia concreta usando el framework interno
- casi sin logica repetida

Archivos objetivo:

- `src/modules/portal/admin/*`

Regla:

- la page concreta solo compone secciones
- no reimplementa flujos basicos

## Clasificacion de tablas para implementacion

Cada tabla debe pertenecer a una categoria. Esa categoria define su UX y su estrategia CRUD.

### A. Tabla raiz

Tiene lista propia o modulo propio.

Ejemplos:

- `merchant_branches`
- `products`
- `orders`
- `drivers`
- `payments`
- `promotions`

UX:

- listado
- filtros
- detalle
- acciones principales

### B. Tabla hija administrable

Se edita dentro de la ficha de la raiz.

Ejemplos:

- `merchant_branch_hours`
- `merchant_branch_closures`
- `product_branch_settings`
- `merchant_staff_branches`
- `promotion_targets`

UX:

- tab
- inline table
- modal

### C. Tabla snapshot o detalle de lectura

Normalmente no se edita.

Ejemplos:

- `order_delivery_details`
- `order_item_modifiers`
- `cart_item_modifiers`
- `payment_transactions`

UX:

- panel de solo lectura
- drawer
- expand row

### D. Tabla de accion controlada

No se expone como CRUD libre.

Ejemplos:

- `order_assignments`
- `order_cancellations`
- `refunds`
- `order_status_history`

UX:

- action modal
- wizard corto
- boton contextual

### E. Tabla de log o auditoria

No se crea manualmente salvo casos muy puntuales.

Ejemplos:

- `audit_logs`
- `merchant_audit_logs`
- `analytics_events`
- `message_reads`

UX:

- timeline
- tabla filtrable
- panel de lectura

## Patrones de vista

Estas son las unicas formas validas de construir vistas admin.

### Patron 1 - Lista + detalle

Para:

- `Clientes`
- `Personal`
- `Drivers`
- `Pagos`
- `Promociones`

Componentes:

- `AdminEntityList`
- `AdminEntityDetailShell`
- `AdminActionBar`

### Patron 2 - Lista + editor completo

Para:

- `Sucursales`
- `Productos`

Componentes:

- `AdminEntityList`
- `AdminEntityEditorPage`
- `AdminSectionCard`

### Patron 3 - Ficha con tabs

Para:

- `Pedido`
- `Driver`
- `Cliente`
- `Liquidacion`

Tabs tipicos:

- `Resumen`
- `Detalle`
- `Historial`
- `Pagos`
- `Auditoria`

### Patron 4 - Modal contextual

Para:

- `addresses`
- `promotion_targets`
- `modifier_options`
- `order_cancellations`
- `refunds`

### Patron 5 - Drawer tecnico

Para:

- `payment_transactions`
- `audit_logs`
- `analytics_events`
- `message_reads`

### Patron 6 - Timeline

Para:

- `order_status_history`
- `merchant_audit_logs`
- `audit_logs`

### Patron 7 - Galeria o adjuntos

Para:

- `order_evidences`
- `driver_documents`

## Contratos reutilizables

Todo el framework interno debe girar sobre estos contratos.

## 1. `EntityRootSpec`

Describe una entidad raiz completa.

Debe decir:

- id del modulo
- ruta base
- icono o label
- tabla raiz
- query de lista
- query de detalle
- tabs
- acciones
- lookups necesarios

## 2. `ChildRelationSpec`

Describe una tabla hija.

Debe decir:

- tabla hija
- modo de exposicion
- si es editable
- si es inline o modal
- clave padre
- estrategia de sync

Valores posibles de exposicion:

- `inline_grid`
- `tab_section`
- `modal_form`
- `drawer_readonly`
- `timeline`
- `gallery`

## 3. `SaveStrategy`

Debe estandarizar solo estas variantes:

- `direct`
- `relational_nested`
- `action_controlled`
- `rpc`
- `readonly_backend`

## 4. `LookupSpec`

Resuelve relaciones visibles:

- `label`
- `value`
- `filter`
- `depends_on`

Ejemplos:

- productos por comercio
- sucursales por comercio
- drivers activos por sucursal o zona
- promociones por vigencia

## 5. `ActionSpec`

Para acciones de negocio:

- cambiar estado
- cancelar pedido
- asignar repartidor
- registrar incidencia
- ejecutar refund

## Framework CRUD UX-first

El framework interno debe proveer estos componentes funcionales:

### `AdminModulePage`

Contenedor de modulo.

Incluye:

- breadcrumb
- context bar
- title
- actions
- content

### `AdminEntityList`

Lista reusable con:

- filtros
- columnas
- estados
- acciones por fila
- search
- empty state

### `AdminEntityDetail`

Ficha reusable con:

- header de entidad
- tabs
- bloques
- side actions

### `AdminInlineRelationTable`

Para hijas editables inline.

Casos:

- horarios
- opciones
- targets
- items de liquidacion

### `AdminRelationModal`

Para hija puntual.

Casos:

- direccion
- cancelacion
- refund
- asignacion

### `AdminReadOnlyPanel`

Para snapshots y logs.

Casos:

- detalle de entrega
- transacciones
- leidos
- analytics

### `AdminActionDialog`

Para acciones controladas:

- cambiar estado
- cancelar
- reasignar
- devolver

## Reglas tecnicas de limpieza

### 1. Ninguna page consulta Supabase directamente

Toda lectura o escritura pasa por:

- `adminService`
- helpers especializados
- strategies

### 2. Ninguna page arma selects relacionales repetidos

Los `select(...)` anidados viven en:

- `detailQueries.ts`
- `listQueries.ts`

### 3. Ninguna page sincroniza relaciones complejas a mano

La sincronizacion vive en:

- `syncChildren.ts`

Ejemplos:

- comparar ids existentes
- borrar faltantes
- insertar nuevos
- actualizar existentes

### 4. Ningun modal rehace su propio estado base

Debe existir un helper comun:

- `createEmptyForm`
- `normalizeForm`
- `serializeDirtyState`

### 5. El dirty state es uniforme

Todas las vistas usan la misma estrategia:

- snapshot inicial
- comparacion normalizada
- indicador visual estandar

### 6. Los errores y mensajes son consistentes

Debe haber mensajes uniformes para:

- guardado
- eliminacion
- acciones criticas
- errores de red
- errores de validacion

### 7. Las acciones criticas no editan tablas libres

Se ejecutan por:

- `rpc`
- `actionHandlers`
- mutaciones controladas

## Estructura de carpetas objetivo

```text
src/
  app/
    layouts/
    router/
    providers/
  components/
    admin/
      AdminScaffold.tsx
      AdminFields.tsx
      AdminDataTable.tsx
      AdminTabs.tsx
      AdminModalForm.tsx
      AdminDrawer.tsx
      AdminTimeline.tsx
      AdminEntityHeader.tsx
      AdminInlineRelationTable.tsx
      AdminActionDialog.tsx
  core/
    admin/
      contracts.ts
      registry/
        moduleRegistry.ts
        entityRegistry.ts
        lookupRegistry.ts
      data/
        listQueries.ts
        detailQueries.ts
        lookupQueries.ts
        saveStrategies.ts
        syncChildren.ts
        actionHandlers.ts
      utils/
        dirtyState.ts
        normalize.ts
        visibilityRules.ts
    services/
      adminService.ts
  modules/
    portal/
      admin/
        dashboard/
        commerce/
        branches/
        staff/
        customers/
        catalog/
        orders/
        drivers/
        payments/
        promotions/
        settlements/
        messages/
        system/
```

## Orden de implementacion maestro

## Fase 0 - Base estable

Objetivo:

- consolidar el shell admin y el contrato reusable

Entregables:

- menu final por experiencia
- registry base
- `AdminDataTable`
- `AdminTabs`
- `AdminModalForm`
- `AdminActionDialog`
- `syncChildren`

Done:

- ninguna nueva page se construye fuera del framework

## Fase 1 - Comercio, sucursales y catalogo

Objetivo:

- terminar el bloque de configuracion del negocio

Tablas:

- `merchants`
- `merchant_branches`
- `addresses`
- `merchant_branch_status`
- `merchant_branch_hours`
- `merchant_branch_closures`
- `delivery_zones`
- `branch_delivery_zones`
- `categories`
- `products`
- `product_branch_settings`
- `modifier_groups`
- `modifier_options`
- `product_modifier_groups`

Resultado:

- negocio configurable de punta a punta

## Fase 2 - Personal y accesos

Objetivo:

- cerrar operacion de usuarios internos

Tablas:

- `profiles`
- `merchant_staff`
- `merchant_staff_branches`
- `roles`
- `user_roles`

Resultado:

- alta, asignacion y permisos internos resueltos

## Fase 3 - Pedidos completo

Objetivo:

- convertir la ficha de pedido en el centro operativo real

Tablas:

- `orders`
- `order_items`
- `order_item_modifiers`
- `order_delivery_details`
- `order_status_history`
- `order_assignments`
- `order_cancellations`
- `order_incidents`
- `order_evidences`
- `payments`
- `payment_transactions`
- `refunds`

Resultado:

- pedido operable de punta a punta desde una sola ficha

## Fase 4 - Clientes

Objetivo:

- soporte, relacion comercial y lectura operativa del cliente

Tablas:

- `customers`
- `customer_addresses`
- `customer_payment_methods`
- `carts`
- `cart_items`
- `cart_item_modifiers`
- `coupon_redemptions`

Resultado:

- ficha de cliente completa

## Fase 5 - Reparto

Objetivo:

- control operativo de repartidores y entregas

Tablas:

- `drivers`
- `driver_documents`
- `vehicles`
- `vehicle_types`
- `driver_shifts`
- `driver_current_state`
- `driver_locations`
- `cash_collections`
- `driver_settlements`
- `driver_settlement_items`

Resultado:

- ficha de driver y tablero operativo

## Fase 6 - Promociones

Objetivo:

- control comercial completo

Tablas:

- `promotions`
- `promotion_targets`
- `coupons`
- `coupon_redemptions`

Resultado:

- campañas trazables y segmentadas

## Fase 7 - Liquidaciones

Objetivo:

- cerrar reglas y settlement

Tablas:

- `commission_rules`
- `merchant_settlements`
- `merchant_settlement_items`
- `driver_settlements`
- `driver_settlement_items`

Resultado:

- finanzas de negocio y reparto visibles

## Fase 8 - Mensajes y sistema

Objetivo:

- soporte, auditoria y configuracion global

Tablas:

- `conversations`
- `conversation_participants`
- `messages`
- `message_reads`
- `notifications`
- `audit_logs`
- `merchant_audit_logs`
- `analytics_events`
- `system_settings`

Resultado:

- operacion y control transversal cerrados

## Vista reina: la ficha de pedido

En este negocio, la vista mas importante del admin es `Pedido`.

Debe quedar asi:

- `Resumen`
  - `orders`
  - `customers`
  - `payments`
- `Items`
  - `order_items`
  - `order_item_modifiers`
- `Entrega`
  - `order_delivery_details`
- `Estado`
  - `order_status_history`
- `Asignacion`
  - `order_assignments`
- `Incidencias`
  - `order_incidents`
- `Evidencias`
  - `order_evidences`
- `Cancelacion`
  - `order_cancellations`
- `Pago`
  - `payments`
  - `payment_transactions`
  - `refunds`
- `Mensajes`
  - `conversations`
  - `messages`

Si esta ficha no existe, el admin nunca va a sentirse realmente operativo.

## Reglas para decidir vista propia vs modal

Una tabla merece vista propia si cumple al menos una:

- el negocio la busca por nombre
- necesita filtros dedicados
- tiene mas de una accion importante
- se consulta por lotes
- tiene valor operativo por si sola

Una tabla debe ser modal o drawer si:

- solo se entiende desde otra entidad
- su ciclo de vida depende del padre
- el usuario no la busca sola
- editarla fuera de contexto seria peligroso

## Definicion de terminado por modulo

Un modulo se considera terminado solo si:

- todas sus tablas aparecen visibles en la experiencia correcta
- las tablas hijas no estan ocultas
- no existen inputs de uuid
- toda relacion importante se resuelve visualmente
- la navegacion indica contexto
- hay acciones controladas para operaciones criticas
- la ficha principal puede operarse de punta a punta

## Definicion de terminado del admin

El admin esta terminado cuando:

- las `64` tablas estan expuestas correctamente
- no hay CRUDs tabla-a-tabla fuera de contexto
- cada entidad raiz tiene su vista compuesta
- los detalles tecnicos viven en modal, drawer o timeline
- las operaciones criticas usan handlers controlados
- la experiencia admin se siente como un sistema de negocio, no como un generador de formularios

## Siguiente accion recomendada

Sobre este plan, el siguiente tramo correcto de implementacion es:

1. cerrar `Fase 0`
2. terminar `Fase 2` de `Personal y accesos`
3. entrar directo a `Fase 3` de `Pedidos completo`

Ese orden equilibra:

- arquitectura
- seguridad
- operacion real
