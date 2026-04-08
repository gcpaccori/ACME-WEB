# Plan 1 - Portal de negocio web

## Objetivo

Convertir `ACME-WEB` en la consola operativa de comercios, sucursales, catalogo y pedidos.

Este plan toma como base el esquema real de Supabase y el estado actual del repo. La idea es dejar un portal donde el comercio pueda:

- administrar su negocio y sus sucursales
- mantener su catalogo
- operar pedidos en tiempo real
- asignar personal y repartidores
- revisar pagos, promociones y liquidaciones

## Enfoque actual

La prioridad actual es cerrar el `modo admin`.

Eso significa:

- terminar primero toda la capa administrativa web
- resolver el CRUD relacional de tablas y entidades raiz
- dejar navegacion contextual clara para el operador
- postergar la capa simple de cliente final para despues

La app cliente quedara para una segunda etapa con navegacion simple de:

- productos
- carrito
- perfil
- pedidos

## Estado actual del repo

Ya existe una base funcional del portal con rutas para:

- `dashboard`
- `orders`
- `menu`
- `categories`
- `products`
- `branch-status`
- `hours`
- `staff`

Hoy el frontend ya consume estas tablas:

- `profiles`
- `merchants`
- `merchant_branches`
- `merchant_staff`
- `merchant_staff_branches`
- `categories`
- `products`
- `product_branch_settings`
- `orders`
- `order_items`
- `order_status_history`
- `merchant_branch_status`
- `merchant_branch_hours`

## Ajustes obligatorios antes del CRUD completo

El codigo actual asume algunos nombres de columnas que no coinciden con el esquema real. Esto hay que corregir primero para evitar formularios y grids rotos.

- `products` usa `base_price` e `is_active`, no `price` ni `active`
- `product_branch_settings` usa `is_available`, `is_paused`, `pause_reason`, no `active` ni `paused`
- `merchant_branch_hours` usa `day_of_week`, no `weekday`
- `merchant_branches` guarda `address_id`; la direccion vive en `addresses`
- `order_status_history` usa `from_status`, `to_status`, `actor_user_id`, `actor_type`, `created_at`; no `status` ni `changed_at`
- `orders` no trae nombre de cliente ni direccion directa; esos datos deben venir cruzando con `customers`, `profiles`, `order_delivery_details` y `payment_methods`

## Tablas del plan

### Nucleo de acceso y roles

- `profiles`
- `roles`
- `user_roles`
- `merchant_staff`
- `merchant_staff_branches`

### Negocio y sucursales

- `merchants`
- `merchant_branches`
- `addresses`
- `merchant_branch_status`
- `merchant_branch_hours`
- `merchant_branch_closures`
- `delivery_zones`
- `branch_delivery_zones`

### Catalogo

- `categories`
- `products`
- `product_branch_settings`
- `modifier_groups`
- `modifier_options`
- `product_modifier_groups`

### Operacion de pedidos

- `orders`
- `order_items`
- `order_item_modifiers`
- `order_status_history`
- `order_delivery_details`
- `order_assignments`
- `order_cancellations`
- `order_evidences`
- `order_incidents`

### Pagos, promos y liquidaciones

- `payment_methods`
- `payments`
- `payment_transactions`
- `promotions`
- `promotion_targets`
- `coupons`
- `coupon_redemptions`
- `commission_rules`
- `merchant_settlements`
- `merchant_settlement_items`
- `refunds`
- `merchant_audit_logs`

## CRUD y acciones por modulo

### 1. Comercios y sucursales

- `merchants`
  - crear comercio
  - editar razon comercial, contacto, logo, tax id
  - activar o desactivar
- `merchant_branches`
  - crear sucursal
  - editar nombre, telefono, tiempo promedio, estado operativo
  - enlazar `address_id`
  - activar o desactivar recepcion de pedidos
- `addresses`
  - crear y editar direccion base de la sucursal
- `merchant_branch_status`
  - abrir, cerrar, pausar y reanudar sucursal
- `merchant_branch_hours`
  - CRUD de horarios por dia
- `merchant_branch_closures`
  - CRUD de cierres excepcionales
- `branch_delivery_zones`
  - asignar o quitar zonas de reparto por sucursal

### 2. Personal y permisos

- `merchant_staff`
  - alta de personal
  - cambio de rol
  - activacion y desactivacion
- `merchant_staff_branches`
  - asignar personal a una o varias sucursales
  - definir sucursal principal
- `roles` y `user_roles`
  - lectura y asignacion si se decide usar permisos mas finos

### 3. Catalogo

- `categories`
  - crear, editar, ordenar, activar, desactivar
- `products`
  - crear, editar, activar, desactivar
  - editar `sku`, `name`, `description`, `base_price`, `image_url`, `sort_order`
- `modifier_groups`
  - CRUD de grupos como tamano, extras, salsas
- `modifier_options`
  - CRUD de opciones por grupo
- `product_modifier_groups`
  - vincular grupos de modificadores a productos
- `product_branch_settings`
  - sobreescribir precio por sucursal
  - pausar producto por sucursal
  - controlar stock

### 4. Pedidos

- `orders`
  - listado con filtros
  - detalle completo
  - cambio de estado
  - cancelacion operativa
- `order_items`
  - lectura en detalle de pedido
- `order_item_modifiers`
  - lectura en detalle de pedido
- `order_status_history`
  - timeline de estados
  - registro de actor y nota
- `order_delivery_details`
  - datos de entrega y referencia
- `order_assignments`
  - asignar, reasignar o liberar repartidor
- `order_cancellations`
  - registrar motivo y monto de devolucion
- `order_incidents`
  - registrar incidencia operativa
- `order_evidences`
  - visualizar pruebas de entrega o incidencia

### 5. Pagos, promociones y cierre

- `payment_methods`
  - lectura y habilitacion por negocio
- `payments`
  - lectura y conciliacion
- `payment_transactions`
  - detalle tecnico por transaccion
- `promotions`
  - CRUD de promociones generales
- `promotion_targets`
  - asignar promos a comercios, sucursales, categorias o productos
- `coupons`
  - CRUD de cupones
- `coupon_redemptions`
  - lectura de uso de cupones
- `refunds`
  - registrar y seguir devoluciones
- `merchant_settlements`
  - lectura y exportacion de liquidaciones
- `merchant_settlement_items`
  - detalle de pedidos liquidados

## Vista de navegacion recomendada

La cinta de opciones del portal deberia pasar de la version actual a algo mas cercano a esto:

- `Resumen`
- `Comercio`
- `Sucursales`
- `Personal`
- `Catalogo`
- `Pedidos`
- `Reparto`
- `Pagos`
- `Promociones`
- `Liquidaciones`
- `Auditoria`
- `Configuracion`

## Fases ejecutables

### Fase 1 - Normalizacion de modelo y servicios

- [ ] corregir tipos en `src/core/types`
- [ ] corregir `authService`, `ordersService`, `menuService`, `branchService`, `staffService`
- [ ] incorporar joins reales con `addresses`, `order_delivery_details`, `payment_methods`
- [ ] dejar una capa `mappers` para no depender de nombres viejos

### Fase 2 - CRUD de comercio y sucursal

- [ ] crear modulo `portal/merchants`
- [ ] crear modulo `portal/branches`
- [ ] formulario de comercio
- [ ] formulario de sucursal
- [ ] formulario de direccion enlazado a `addresses`
- [ ] tabla de horarios
- [ ] tabla de cierres excepcionales
- [ ] selector de zonas de reparto

### Fase 3 - CRUD de personal y permisos

- [ ] alta de personal
- [ ] asignacion por sucursal
- [ ] rol operativo y estado activo
- [ ] filtros por rol y sucursal

### Fase 4 - CRUD de catalogo

- [ ] CRUD de categorias
- [ ] CRUD de productos
- [ ] CRUD de modificadores
- [ ] editor de settings por sucursal
- [ ] carga de imagen y ordenamiento visual

### Fase 5 - Operacion de pedidos

- [ ] listado con filtros por estado, fecha, sucursal y pago
- [ ] detalle con items, modificadores, direccion y timeline
- [ ] cambio de estado con reglas validas
- [ ] asignacion de repartidor
- [ ] registro de incidentes y cancelaciones

### Fase 6 - Finanzas y auditoria

- [ ] vista de pagos y transacciones
- [ ] CRUD de promociones y cupones
- [ ] panel de liquidaciones
- [ ] registro de auditoria por accion importante

## Criterio de cierre

El plan se considera listo cuando:

- el comercio puede crear y mantener sucursales con direccion real
- el catalogo soporta categorias, productos y modificadores
- los pedidos muestran cliente, entrega, pago, historial y asignacion
- existe control operativo de sucursal, horarios y personal
- las promociones y cupones se pueden administrar desde portal
- el portal ya no depende de columnas antiguas o nombres incorrectos

## Dependencias con otros planes

- este plan habilita la operacion de `orders`, `delivery_zones` y `commission_rules`
- este plan alimenta el surtido que consume la app cliente
- este plan define la configuracion operativa que necesita la app repartidor

## Cobertura total

La cobertura total de las `40` tablas del `Plan 1`, con modulo, pantalla, uso de negocio, tipo de CRUD y estrategia de guardado, queda documentada en:

- `docs/plan-01-full-table-coverage.md`
