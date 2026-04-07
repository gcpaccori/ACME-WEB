# Mapa de aplicaciones, tablas y pestanas

## Objetivo

Dejar documentada la logica de agrupacion del esquema para este negocio de delivery, separando:

- que tablas pertenecen a cada aplicacion
- que tablas son compartidas entre aplicaciones
- como deberia verse la navegacion por pestanas
- cual es el mapa exacto `tabla -> modulo -> pantalla -> accion`

Este documento toma como base el esquema real detectado en Supabase y complementa los planes:

- `docs/plan-01-portal-negocio-web.md`
- `docs/plan-02-app-cliente.md`
- `docs/plan-03-app-repartidor.md`

## Principio de agrupacion

En este modelo no todas las tablas pertenecen a una sola app. Hay tres tipos:

- tablas propias de una aplicacion
- tablas compartidas entre dos o tres aplicaciones
- tablas de soporte transversal o backoffice

Por eso la agrupacion correcta no es "una tabla solo vive en una app", sino:

- `owner principal`: la app donde se administra
- `consumidor secundario`: la app donde se consulta o actualiza operativamente

## Agrupacion por aplicacion

### 1. Portal negocio web

Owner principal de estas tablas:

- `merchants`
- `merchant_branches`
- `addresses`
- `merchant_branch_status`
- `merchant_branch_hours`
- `merchant_branch_closures`
- `merchant_staff`
- `merchant_staff_branches`
- `categories`
- `products`
- `product_branch_settings`
- `modifier_groups`
- `modifier_options`
- `product_modifier_groups`
- `promotions`
- `promotion_targets`
- `coupons`
- `delivery_zones`
- `branch_delivery_zones`
- `payment_methods`
- `commission_rules`
- `merchant_settlements`
- `merchant_settlement_items`
- `merchant_audit_logs`

Consume o actualiza operativamente estas tablas compartidas:

- `profiles`
- `roles`
- `user_roles`
- `orders`
- `order_items`
- `order_item_modifiers`
- `order_status_history`
- `order_assignments`
- `order_delivery_details`
- `order_cancellations`
- `order_incidents`
- `order_evidences`
- `payments`
- `payment_transactions`
- `refunds`
- `drivers`
- `driver_current_state`
- `conversations`
- `conversation_participants`
- `messages`
- `message_reads`
- `notifications`
- `audit_logs`
- `analytics_events`
- `system_settings`

### 2. App cliente

Owner principal de estas tablas:

- `customers`
- `customer_addresses`
- `customer_payment_methods`
- `carts`
- `cart_items`
- `cart_item_modifiers`
- `coupon_redemptions`

Consume o dispara cambios sobre tablas compartidas:

- `profiles`
- `addresses`
- `merchants`
- `merchant_branches`
- `merchant_branch_status`
- `merchant_branch_hours`
- `categories`
- `products`
- `product_branch_settings`
- `modifier_groups`
- `modifier_options`
- `product_modifier_groups`
- `delivery_zones`
- `branch_delivery_zones`
- `promotions`
- `promotion_targets`
- `coupons`
- `orders`
- `order_items`
- `order_item_modifiers`
- `order_delivery_details`
- `order_status_history`
- `payments`
- `payment_transactions`
- `payment_methods`
- `conversations`
- `conversation_participants`
- `messages`
- `message_reads`
- `notifications`

### 3. App repartidor

Owner principal de estas tablas:

- `drivers`
- `driver_documents`
- `vehicles`
- `vehicle_types`
- `driver_shifts`
- `driver_current_state`
- `driver_locations`
- `driver_settlements`
- `driver_settlement_items`
- `cash_collections`

Consume o actualiza operativamente estas tablas compartidas:

- `profiles`
- `orders`
- `order_assignments`
- `order_delivery_details`
- `order_status_history`
- `order_evidences`
- `order_incidents`
- `payments`
- `delivery_zones`
- `branch_delivery_zones`
- `commission_rules`
- `conversations`
- `conversation_participants`
- `messages`
- `message_reads`
- `notifications`

### 4. Backoffice o transversal

Estas tablas no son de una sola app y conviene administrarlas desde una consola master o desde el portal web con permisos altos:

- `profiles`
- `roles`
- `user_roles`
- `notifications`
- `conversations`
- `conversation_participants`
- `messages`
- `message_reads`
- `audit_logs`
- `analytics_events`
- `system_settings`
- `payments`
- `payment_transactions`
- `refunds`

## Agrupacion por pestanas del portal web

Si esta web termina siendo la consola maestra, la cinta de opciones recomendada es esta:

### Pestana `Resumen`

Tablas:

- `orders`
- `merchant_branch_status`
- `driver_current_state`
- `payments`
- `analytics_events`

### Pestana `Comercio`

Tablas:

- `merchants`
- `addresses`
- `merchant_audit_logs`

### Pestana `Sucursales`

Tablas:

- `merchant_branches`
- `addresses`
- `merchant_branch_status`
- `merchant_branch_hours`
- `merchant_branch_closures`
- `delivery_zones`
- `branch_delivery_zones`

### Pestana `Personal`

Tablas:

- `profiles`
- `merchant_staff`
- `merchant_staff_branches`
- `roles`
- `user_roles`

### Pestana `Catalogo`

Tablas:

- `categories`
- `products`
- `product_branch_settings`
- `modifier_groups`
- `modifier_options`
- `product_modifier_groups`

### Pestana `Pedidos`

Tablas:

- `orders`
- `order_items`
- `order_item_modifiers`
- `order_status_history`
- `order_delivery_details`
- `order_assignments`
- `order_cancellations`
- `order_incidents`
- `order_evidences`

### Pestana `Reparto`

Tablas:

- `drivers`
- `driver_current_state`
- `driver_locations`
- `driver_shifts`
- `vehicles`
- `vehicle_types`
- `order_assignments`
- `cash_collections`

### Pestana `Pagos`

Tablas:

- `payment_methods`
- `payments`
- `payment_transactions`
- `refunds`
- `cash_collections`

### Pestana `Promociones`

Tablas:

- `promotions`
- `promotion_targets`
- `coupons`
- `coupon_redemptions`

### Pestana `Liquidaciones`

Tablas:

- `commission_rules`
- `merchant_settlements`
- `merchant_settlement_items`
- `driver_settlements`
- `driver_settlement_items`

### Pestana `Mensajes`

Tablas:

- `conversations`
- `conversation_participants`
- `messages`
- `message_reads`
- `notifications`

### Pestana `Sistema`

Tablas:

- `system_settings`
- `audit_logs`
- `merchant_audit_logs`
- `analytics_events`
- `roles`
- `user_roles`

## Mapas exactos del portal web

### Mapa 1 - `tabla -> modulo -> pantalla -> acciones`

- `merchants -> comercio -> ficha de comercio -> create, read, update, activar, desactivar`
- `addresses -> comercio/sucursales -> formulario de direccion -> create, read, update`
- `merchant_branches -> sucursales -> listado y ficha de sucursal -> create, read, update, activar, desactivar`
- `merchant_branch_status -> sucursales -> panel operativo -> read, update`
- `merchant_branch_hours -> sucursales -> horarios -> create, read, update, delete`
- `merchant_branch_closures -> sucursales -> cierres especiales -> create, read, update, delete`
- `delivery_zones -> sucursales -> zonas -> create, read, update, delete`
- `branch_delivery_zones -> sucursales -> zonas por sucursal -> create, read, update, delete`
- `merchant_staff -> personal -> listado de personal -> create, read, update, activar, desactivar`
- `merchant_staff_branches -> personal -> asignacion de sucursales -> create, read, update, delete`
- `profiles -> personal/clientes/repartidores -> ficha de usuario -> read, update`
- `roles -> sistema -> catalogo de roles -> create, read, update, delete`
- `user_roles -> sistema -> permisos de usuario -> create, read, update, delete`
- `categories -> catalogo -> categorias -> create, read, update, activar, desactivar`
- `products -> catalogo -> productos -> create, read, update, activar, desactivar`
- `product_branch_settings -> catalogo -> disponibilidad por sucursal -> create, read, update`
- `modifier_groups -> catalogo -> grupos de modificadores -> create, read, update, activar, desactivar`
- `modifier_options -> catalogo -> opciones de modificador -> create, read, update, activar, desactivar`
- `product_modifier_groups -> catalogo -> asignacion producto-modificador -> create, read, update, delete`
- `orders -> pedidos -> listado y detalle -> read, update estado, cancelar`
- `order_items -> pedidos -> detalle de pedido -> read`
- `order_item_modifiers -> pedidos -> detalle de item -> read`
- `order_status_history -> pedidos -> timeline -> create, read`
- `order_delivery_details -> pedidos -> entrega -> read, update si negocio lo permite`
- `order_assignments -> reparto/pedidos -> asignacion -> create, read, update`
- `order_cancellations -> pedidos -> cancelaciones -> create, read`
- `order_incidents -> pedidos/reparto -> incidencias -> create, read, update`
- `order_evidences -> pedidos/reparto -> evidencias -> create, read`
- `drivers -> reparto -> padron de repartidores -> create, read, update, activar, desactivar`
- `driver_current_state -> reparto -> estado en linea -> read, update`
- `driver_locations -> reparto -> tracking -> read`
- `driver_documents -> reparto -> documentos -> read, update`
- `driver_shifts -> reparto -> turnos -> read`
- `vehicles -> reparto -> vehiculos -> read, update`
- `vehicle_types -> reparto -> tipos de vehiculo -> read`
- `payment_methods -> pagos -> medios de pago -> create, read, update, activar, desactivar`
- `payments -> pagos -> operaciones -> read, update estado`
- `payment_transactions -> pagos -> trazas de transaccion -> read`
- `refunds -> pagos -> devoluciones -> create, read, update`
- `promotions -> promociones -> promociones -> create, read, update, activar, desactivar`
- `promotion_targets -> promociones -> objetivos -> create, read, update, delete`
- `coupons -> promociones -> cupones -> create, read, update, activar, desactivar`
- `coupon_redemptions -> promociones -> uso de cupones -> read`
- `commission_rules -> liquidaciones -> reglas -> create, read, update, activar, desactivar`
- `merchant_settlements -> liquidaciones -> liquidaciones de comercio -> read`
- `merchant_settlement_items -> liquidaciones -> detalle de liquidacion comercio -> read`
- `driver_settlements -> liquidaciones -> liquidaciones de repartidor -> read`
- `driver_settlement_items -> liquidaciones -> detalle de liquidacion repartidor -> read`
- `cash_collections -> pagos/reparto -> efectivo -> create, read, update`
- `conversations -> mensajes -> conversaciones -> create, read, update`
- `conversation_participants -> mensajes -> participantes -> create, read, update`
- `messages -> mensajes -> chat -> create, read`
- `message_reads -> mensajes -> leidos -> create, read`
- `notifications -> mensajes/sistema -> centro de notificaciones -> create, read, update`
- `audit_logs -> sistema -> auditoria global -> read`
- `merchant_audit_logs -> sistema/comercio -> auditoria de negocio -> read`
- `analytics_events -> resumen/sistema -> eventos -> read`
- `system_settings -> sistema -> configuracion global -> create, read, update`

### Mapa 2 - `modulo -> pantallas`

#### Modulo `Comercio`

- `lista de comercios`
- `ficha de comercio`
- `direccion fiscal o principal`

#### Modulo `Sucursales`

- `lista de sucursales`
- `ficha de sucursal`
- `horarios`
- `cierres especiales`
- `estado operativo`
- `zonas de entrega`

#### Modulo `Personal`

- `lista de usuarios`
- `ficha de personal`
- `roles y permisos`
- `asignacion por sucursal`

#### Modulo `Catalogo`

- `categorias`
- `productos`
- `modificadores`
- `precios por sucursal`
- `stock y pausa`

#### Modulo `Pedidos`

- `bandeja de pedidos`
- `detalle de pedido`
- `timeline`
- `entrega`
- `cancelaciones`
- `incidencias`
- `evidencias`

#### Modulo `Reparto`

- `lista de repartidores`
- `estado en linea`
- `tracking`
- `asignaciones`
- `vehiculos`
- `documentos`

#### Modulo `Pagos`

- `medios de pago`
- `operaciones`
- `transacciones`
- `refunds`
- `efectivo`

#### Modulo `Promociones`

- `promociones`
- `cupones`
- `segmentacion de promociones`
- `historial de redenciones`

#### Modulo `Liquidaciones`

- `reglas de comision`
- `liquidaciones comercio`
- `liquidaciones repartidor`

#### Modulo `Mensajes`

- `conversaciones`
- `chat por pedido`
- `notificaciones`

#### Modulo `Sistema`

- `ajustes globales`
- `auditoria`
- `metricas`
- `roles`

## Mapas exactos de la app cliente

### Mapa `tabla -> modulo -> pantalla -> acciones`

- `profiles -> cuenta -> perfil -> read, update`
- `customers -> cuenta -> perfil cliente -> create bootstrap, read`
- `addresses -> direcciones -> formulario -> create, read, update`
- `customer_addresses -> direcciones -> libreta -> create, read, update, delete`
- `customer_payment_methods -> pagos -> billetera -> create, read, update, delete`
- `payment_methods -> checkout -> selector de pago -> read`
- `merchants -> marketplace -> listado de comercios -> read`
- `merchant_branches -> marketplace -> detalle de comercio -> read`
- `merchant_branch_status -> marketplace -> disponibilidad -> read`
- `merchant_branch_hours -> marketplace -> horarios -> read`
- `categories -> marketplace -> categorias -> read`
- `products -> marketplace -> menu -> read`
- `product_branch_settings -> marketplace -> disponibilidad por sucursal -> read`
- `modifier_groups -> marketplace -> configurador de producto -> read`
- `modifier_options -> marketplace -> configurador de producto -> read`
- `product_modifier_groups -> marketplace -> configurador de producto -> read`
- `delivery_zones -> checkout -> cobertura -> read`
- `branch_delivery_zones -> checkout -> cobertura por sucursal -> read`
- `carts -> carrito -> carrito activo -> create, read, update`
- `cart_items -> carrito -> items -> create, read, update, delete`
- `cart_item_modifiers -> carrito -> modificadores del item -> create, read, update, delete`
- `promotions -> checkout -> descuentos -> read`
- `promotion_targets -> checkout -> reglas de aplicacion -> read`
- `coupons -> checkout -> cupon -> read, validar`
- `coupon_redemptions -> checkout -> redencion -> create, read`
- `orders -> pedidos -> checkout e historial -> create, read, cancelar si aplica`
- `order_items -> pedidos -> detalle -> read`
- `order_item_modifiers -> pedidos -> detalle -> read`
- `order_delivery_details -> pedidos -> entrega -> create snapshot, read`
- `order_status_history -> pedidos -> seguimiento -> read`
- `payments -> pagos -> estado de pago -> create, read`
- `payment_transactions -> pagos -> trazabilidad -> read`
- `conversations -> soporte -> conversacion -> create, read`
- `conversation_participants -> soporte -> participantes -> create, read`
- `messages -> soporte -> chat -> create, read`
- `message_reads -> soporte -> vistos -> create, read`
- `notifications -> cuenta -> centro de notificaciones -> read, update`

## Mapas exactos de la app repartidor

### Mapa `tabla -> modulo -> pantalla -> acciones`

- `profiles -> cuenta -> perfil -> read, update`
- `drivers -> onboarding -> ficha de repartidor -> create, read, update`
- `driver_documents -> onboarding -> documentos -> create, read, update`
- `vehicles -> onboarding -> vehiculo -> create, read, update`
- `vehicle_types -> onboarding -> tipo de vehiculo -> read`
- `driver_shifts -> operacion -> turnos -> create, read, update`
- `driver_current_state -> operacion -> online/offline -> read, update`
- `driver_locations -> operacion -> tracking -> create, read`
- `orders -> operacion -> pedido asignado -> read`
- `order_assignments -> operacion -> oferta y asignacion -> read, update`
- `order_delivery_details -> operacion -> direccion de entrega -> read`
- `order_status_history -> operacion -> hitos -> create, read`
- `order_evidences -> operacion -> evidencia -> create, read`
- `order_incidents -> operacion -> incidencias -> create, read, update`
- `cash_collections -> operacion -> efectivo -> create, read, update`
- `delivery_zones -> operacion -> zona -> read`
- `branch_delivery_zones -> operacion -> zona por sucursal -> read`
- `conversations -> comunicacion -> conversacion -> create, read`
- `conversation_participants -> comunicacion -> participantes -> create, read`
- `messages -> comunicacion -> chat -> create, read`
- `message_reads -> comunicacion -> vistos -> create, read`
- `notifications -> comunicacion -> alertas -> read, update`
- `commission_rules -> ganancias -> reglas -> read`
- `driver_settlements -> ganancias -> liquidaciones -> read`
- `driver_settlement_items -> ganancias -> detalle de liquidacion -> read`
- `payments -> ganancias -> pedidos cobrados -> read`

## Entidades raiz recomendadas para CRUD cruzado

Si se construye una consola maestra, el CRUD no deberia abrir primero por tabla sino por entidad raiz:

- `Usuario`
  - junta `profiles`, `roles`, `user_roles`, `customers`, `drivers`, `merchant_staff`
- `Comercio`
  - junta `merchants`, `merchant_branches`, `merchant_staff`, `categories`, `products`, `promotions`
- `Sucursal`
  - junta `merchant_branches`, `addresses`, `merchant_branch_status`, `merchant_branch_hours`, `branch_delivery_zones`, `product_branch_settings`
- `Producto`
  - junta `products`, `categories`, `modifier_groups`, `modifier_options`, `product_modifier_groups`, `product_branch_settings`
- `Pedido`
  - junta `orders`, `order_items`, `order_item_modifiers`, `order_delivery_details`, `order_status_history`, `payments`, `order_assignments`, `order_incidents`
- `Repartidor`
  - junta `drivers`, `driver_documents`, `vehicles`, `driver_current_state`, `driver_shifts`, `driver_locations`, `driver_settlements`

## Orden recomendado para desarrollo

1. Normalizar servicios y tipos del portal web segun el esquema real.
2. Cerrar CRUD de comercio, sucursales, personal y catalogo.
3. Completar el flujo operativo de pedidos y asignacion.
4. Construir la app cliente con marketplace, carrito y checkout.
5. Construir la app repartidor con online, tracking y evidencia.
6. Cerrar pagos, promociones, liquidaciones, mensajeria y auditoria.

## Conclusion

La web actual es la mejor candidata para ser la consola maestra porque ya toca el eje `comercio -> sucursal -> catalogo -> pedido`.

La app cliente debe ser dueña de la experiencia de compra.

La app repartidor debe ser dueña de la operacion de entrega.

Las tablas compartidas deben modelarse con claridad para evitar que dos apps compitan por el mismo dato sin reglas de ownership.
