# Modo admin - logica actualizada y blueprint de implementacion

## Objetivo

Definir con precision como debe construirse el `modo admin` del portal web para este negocio de delivery.

Documento de ejecucion complementario:

- `docs/plan-maestro-implementacion-admin-experiencia.md`

La meta no es solo tener CRUDs por tabla. La meta es tener una consola administrativa donde el usuario siempre entienda:

- donde esta parado
- sobre que comercio o sucursal esta trabajando
- si esta viendo, creando o editando
- si hay cambios pendientes de guardar
- que relaciones se estan autocompletando

## Para quien sera este admin

El `modo admin` esta pensado para usuarios operativos, no para cliente final.

### 1. Super admin

Puede ver y administrar:

- todos los comercios
- todas las sucursales
- repartidores
- pagos
- promociones
- auditoria
- configuracion global

### 2. Owner de comercio

Puede administrar:

- su comercio
- sus sucursales
- su personal
- su catalogo
- sus pedidos
- sus promociones
- sus liquidaciones

### 3. Manager de sucursal

Puede administrar:

- una o varias sucursales asignadas
- estado operativo
- horarios
- productos y stock por sucursal
- pedidos y asignaciones operativas

### 4. Operador de pedidos

Puede administrar:

- bandeja de pedidos
- cambios de estado
- incidencias
- asignaciones de repartidor

### 5. Operador financiero

Puede revisar:

- pagos
- transacciones
- refunds
- liquidaciones

## Principio rector del admin

Ningun CRUD debe sentirse ciego.

Cada page administrativa debe mostrar contexto visible y relaciones ya resueltas. El usuario no deberia trabajar con:

- ids sueltos
- tablas aisladas
- formularios vacios sin referencias
- cambios sin trazabilidad

En vez de eso, cada page debe cargar y mostrar:

- `breadcrumb`
- `barra de contexto`
- `estado de pagina`
- `relaciones ya hidratadas`
- `acciones segun rol`

## Regla de interfaz para todos los CRUD

Cada pantalla de admin debe tener 5 capas visuales fijas.

### 1. Titulo de pagina

Ejemplo:

- `Sucursal Huancayo Centro`
- `Producto: 1/4 Pollo + Papas`
- `Pedido #13`

### 2. Breadcrumb o barra de direccion

Debe indicar exactamente en que lugar logico esta el usuario.

Ejemplos:

- `Admin / Comercios / Polleria Wanka Express / Sucursales / Sucursal Huancayo Centro`
- `Admin / Catalogo / Polleria Wanka Express / Productos / 1/4 Pollo + Papas`
- `Admin / Pedidos / Sucursal Huancayo Centro / Pedido #13`
- `Admin / Reparto / Drivers / Juan Perez`

### 3. Barra de contexto

Debajo del breadcrumb debe existir una barra compacta con chips o bloques de contexto.

Campos recomendados:

- `Rol actual`
- `Comercio actual`
- `Sucursal actual`
- `Entidad actual`
- `Modo`
- `Estado`

Ejemplo:

- `Rol: Owner`
- `Comercio: Polleria Wanka Express`
- `Sucursal: Huancayo Centro`
- `Entidad: Producto`
- `Modo: Edicion`
- `Estado: Cambios sin guardar`

### 4. Acciones primarias

En la parte superior derecha:

- `Guardar`
- `Guardar y salir`
- `Cancelar`
- `Desactivar`
- `Eliminar` si aplica

### 5. Cuerpo relacional

El cuerpo debe estar dividido en secciones de negocio, no de base de datos.

Ejemplo para sucursal:

- `Datos base`
- `Direccion`
- `Estado operativo`
- `Horarios`
- `Zonas de entrega`
- `Auditoria`

## Estados de pagina obligatorios

Cada CRUD debe reflejar explicitamente el estado de trabajo del usuario.

### Modo de pagina

- `consulta`
- `creacion`
- `edicion`
- `solo lectura`

### Estado de persistencia

- `sin cambios`
- `cambios pendientes`
- `guardando`
- `guardado`
- `error`

### Estado de entidad

- `activa`
- `inactiva`
- `pausada`
- `bloqueada`
- `archivada` si aplica

## Reglas de automatizacion relacional

Para este admin, automatizar significa que el sistema rellena y relaciona por el usuario todo lo que se pueda.

### Lo que debe autotraerse

- nombre del comercio actual
- sucursal actual
- direccion relacionada
- horarios relacionados
- estado operativo relacionado
- categoria relacionada
- modificadores relacionados
- cliente relacionado
- repartidor relacionado
- metodo de pago relacionado

### Lo que debe autocompletarse al guardar

- `merchant_id` desde contexto
- `branch_id` desde contexto
- `updated_by_user_id` desde sesion
- `created_at` y `updated_at` desde DB
- estados por defecto
- relaciones pivote necesarias

### Lo que no debe escribir manualmente el usuario

- `uuid`
- foreign keys sin selector visual
- campos snapshot tecnicos
- ids internos de relacion

## Entidades raiz del modo admin

El admin debe construirse por entidad raiz, no por tabla.

### 1. Comercio

Agrupa:

- `merchants`
- `addresses`
- `merchant_audit_logs`

Pantallas:

- `lista`
- `detalle`
- `edicion`

### 2. Sucursal

Agrupa:

- `merchant_branches`
- `addresses`
- `merchant_branch_status`
- `merchant_branch_hours`
- `merchant_branch_closures`
- `branch_delivery_zones`

Pantallas:

- `lista`
- `detalle`
- `edicion`

### 3. Personal

Agrupa:

- `profiles`
- `merchant_staff`
- `merchant_staff_branches`
- `roles`
- `user_roles`

Pantallas:

- `lista`
- `alta`
- `detalle`
- `asignaciones`

### 4. Producto

Agrupa:

- `categories`
- `products`
- `modifier_groups`
- `modifier_options`
- `product_modifier_groups`
- `product_branch_settings`

Pantallas:

- `categorias`
- `productos`
- `ficha producto`
- `modificadores`
- `disponibilidad por sucursal`

### 5. Pedido

Agrupa:

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

Pantallas:

- `bandeja`
- `detalle`
- `timeline`
- `incidencias`
- `asignacion`

### 6. Repartidor

Agrupa:

- `drivers`
- `driver_documents`
- `vehicles`
- `driver_current_state`
- `driver_shifts`
- `driver_locations`
- `cash_collections`

Pantallas:

- `lista`
- `detalle`
- `documentos`
- `vehiculo`
- `tracking`
- `liquidacion`

## Navegacion admin propuesta

La sidebar debe evolucionar a esta estructura:

- `Resumen`
- `Comercios`
- `Sucursales`
- `Personal`
- `Catalogo`
- `Pedidos`
- `Reparto`
- `Pagos`
- `Promociones`
- `Liquidaciones`
- `Mensajes`
- `Sistema`

## Rutas funcionales recomendadas

La ruta tambien debe comunicar contexto.

### Comercio

- `/portal/admin/comercios`
- `/portal/admin/comercios/:merchantId`
- `/portal/admin/comercios/:merchantId/editar`

### Sucursales

- `/portal/admin/comercios/:merchantId/sucursales`
- `/portal/admin/comercios/:merchantId/sucursales/nueva`
- `/portal/admin/comercios/:merchantId/sucursales/:branchId`
- `/portal/admin/comercios/:merchantId/sucursales/:branchId/editar`
- `/portal/admin/comercios/:merchantId/sucursales/:branchId/horarios`
- `/portal/admin/comercios/:merchantId/sucursales/:branchId/zonas`

### Personal

- `/portal/admin/comercios/:merchantId/personal`
- `/portal/admin/comercios/:merchantId/personal/nuevo`
- `/portal/admin/comercios/:merchantId/personal/:staffId`
- `/portal/admin/comercios/:merchantId/personal/:staffId/asignaciones`

### Catalogo

- `/portal/admin/comercios/:merchantId/catalogo/categorias`
- `/portal/admin/comercios/:merchantId/catalogo/productos`
- `/portal/admin/comercios/:merchantId/catalogo/productos/nuevo`
- `/portal/admin/comercios/:merchantId/catalogo/productos/:productId`
- `/portal/admin/comercios/:merchantId/catalogo/productos/:productId/editar`
- `/portal/admin/comercios/:merchantId/catalogo/modificadores`

### Pedidos

- `/portal/admin/sucursales/:branchId/pedidos`
- `/portal/admin/sucursales/:branchId/pedidos/:orderId`
- `/portal/admin/sucursales/:branchId/pedidos/:orderId/incidencias`
- `/portal/admin/sucursales/:branchId/pedidos/:orderId/asignacion`

### Reparto

- `/portal/admin/reparto/drivers`
- `/portal/admin/reparto/drivers/:driverId`
- `/portal/admin/reparto/drivers/:driverId/documentos`
- `/portal/admin/reparto/drivers/:driverId/vehiculo`

### Pagos

- `/portal/admin/pagos`
- `/portal/admin/pagos/:paymentId`
- `/portal/admin/refunds`

### Sistema

- `/portal/admin/sistema/roles`
- `/portal/admin/sistema/auditoria`
- `/portal/admin/sistema/configuracion`

## Estructura de carpetas recomendada

Para que el codigo sea mantenible y la navegacion sea trazable, propongo esta estructura:

```text
src/
  app/
    layouts/
    router/
  components/
    crud/
      BreadcrumbsBar.tsx
      ContextBar.tsx
      EntityHeader.tsx
      FormStatusBar.tsx
      RelationSelect.tsx
      InlineChildTable.tsx
      SaveActions.tsx
  core/
    crud/
      resourceRegistry.ts
      routeContext.ts
      saveHandlers.ts
      queryBuilders.ts
      pageModes.ts
    services/
    types/
  modules/
    portal/
      admin/
        commerce/
          pages/
          resources/
          components/
        branches/
          pages/
          resources/
          components/
        staff/
          pages/
          resources/
          components/
        catalog/
          pages/
          resources/
          components/
        orders/
          pages/
          resources/
          components/
        delivery/
          pages/
          resources/
          components/
        payments/
          pages/
          resources/
          components/
        system/
          pages/
          resources/
          components/
```

## Componentes base obligatorios

### `BreadcrumbsBar`

Responsabilidad:

- leer ruta actual
- mostrar jerarquia logica
- permitir volver a niveles superiores

### `ContextBar`

Responsabilidad:

- mostrar `merchant`, `branch`, `entity`, `mode`, `status`

### `EntityHeader`

Responsabilidad:

- titulo
- subtitulo
- acciones primarias

### `FormStatusBar`

Responsabilidad:

- mostrar si hay cambios pendientes
- mostrar ultimo guardado
- mostrar errores

### `RelationSelect`

Responsabilidad:

- reemplazar selects ciegos por selectores con datos humanos
- soportar busqueda
- mostrar etiquetas utiles

### `InlineChildTable`

Responsabilidad:

- editar hijos relacionales dentro de una ficha principal
- ejemplo: horarios, zonas, opciones de modificador

## Patron de cada pantalla admin

Cada pantalla admin debe seguir este esqueleto:

1. `BreadcrumbsBar`
2. `ContextBar`
3. `EntityHeader`
4. `Resumen de relacion actual`
5. `Formulario o tabla principal`
6. `Bloques hijos relacionales`
7. `FormStatusBar`

## Estrategia de guardado

### Guardado simple

Usar `insert` o `update` directo cuando se toca una sola tabla.

Ejemplos:

- `categories`
- `payment_methods`
- `coupons`

### Guardado relacional

Usar handler compuesto cuando una pantalla toca varias tablas relacionadas.

Ejemplos:

- sucursal completa
- personal con asignaciones
- producto con modificadores

### Guardado transaccional

Usar `rpc()` para operaciones que deban ser atomicas.

Ejemplos:

- crear comercio completo
- upsert de sucursal con direccion y horarios
- upsert de producto con settings por sucursal
- cambio de estado de pedido con historial
- asignacion de driver

## Regla de confirmacion visual para cambios

El usuario admin siempre debe saber si esta modificando algo o no.

Por eso toda page editable debe tener:

- badge `Modo: Consulta` o `Modo: Edicion`
- badge `Estado: Sin cambios` o `Estado: Cambios pendientes`
- aviso de salida con confirmacion si hay cambios sin guardar
- boton `Guardar` deshabilitado si no hay cambios

## Orden de implementacion aprobado internamente

La logica actual queda asi:

### Etapa 1 - Base tecnica admin

- normalizar tipos
- crear capa CRUD reutilizable
- crear breadcrumb y context bar
- crear estados de formulario

### Etapa 2 - Comercio y sucursales

- CRUD de `merchants`
- CRUD relacional de `merchant_branches`
- direccion
- horarios
- zonas
- estado operativo

### Etapa 3 - Personal y catalogo

- personal
- roles
- categorias
- productos
- modificadores
- settings por sucursal

### Etapa 4 - Pedidos y reparto

- bandeja
- detalle
- timeline
- asignacion
- incidencias
- evidencias

### Etapa 5 - Pagos, promociones y sistema

- pagos
- refunds
- promociones
- liquidaciones
- auditoria
- configuracion

## Que queda fuera por ahora

Todavia no es prioridad:

- app cliente final
- browsing simple de productos para cliente
- carrito
- perfil de cliente

Eso va despues de cerrar el `modo admin`.

## Punto de confirmacion

Si este blueprint se confirma, el siguiente paso ya no es seguir analizando. El siguiente paso es implementar:

- base CRUD admin reutilizable
- nueva navegacion admin
- breadcrumb y context bar
- fase 1 y fase 2 del plan web

## Documento de cobertura total

La cobertura completa de las `40` tablas del `Plan 1`, con uso de negocio y estrategia de CRUD, se encuentra en:

- `docs/plan-01-full-table-coverage.md`
