# Auditoria Admin - 64 tablas y uso real de negocio

## Fecha de auditoria

- `8 de abril de 2026`

## Documento complementario

La bajada de esta auditoria a arquitectura y fases de implementacion esta en:

- `docs/plan-maestro-implementacion-admin-experiencia.md`

## Inventario verificado

Se verifico el esquema real de Supabase y hoy existen `64` tablas publicas:

- `addresses`
- `analytics_events`
- `audit_logs`
- `branch_delivery_zones`
- `cart_item_modifiers`
- `cart_items`
- `carts`
- `cash_collections`
- `categories`
- `commission_rules`
- `conversation_participants`
- `conversations`
- `coupon_redemptions`
- `coupons`
- `customer_addresses`
- `customer_payment_methods`
- `customers`
- `delivery_zones`
- `driver_current_state`
- `driver_documents`
- `driver_locations`
- `driver_settlement_items`
- `driver_settlements`
- `driver_shifts`
- `drivers`
- `merchant_audit_logs`
- `merchant_branch_closures`
- `merchant_branch_hours`
- `merchant_branch_status`
- `merchant_branches`
- `merchant_settlement_items`
- `merchant_settlements`
- `merchant_staff`
- `merchant_staff_branches`
- `merchants`
- `message_reads`
- `messages`
- `modifier_groups`
- `modifier_options`
- `notifications`
- `order_assignments`
- `order_cancellations`
- `order_delivery_details`
- `order_evidences`
- `order_incidents`
- `order_item_modifiers`
- `order_items`
- `order_status_history`
- `orders`
- `payment_methods`
- `payment_transactions`
- `payments`
- `product_branch_settings`
- `product_modifier_groups`
- `products`
- `profiles`
- `promotion_targets`
- `promotions`
- `refunds`
- `roles`
- `system_settings`
- `user_roles`
- `vehicle_types`
- `vehicles`

## Dictamen funcional

El admin web **no debe** tener `64` CRUDs sueltos ni `64` rutas principales.

El modelo correcto para este negocio es:

- `12 a 13 vistas raiz`
- `tabs y subpaneles relacionales`
- `modales o drawers para detalles puntuales`
- `tablas de soporte visibles dentro de una ficha principal`
- `tablas tecnicas o de log en modo solo lectura`

La regla no es "si una tabla no tiene ruta, esta oculta".

La regla correcta es:

- una tabla esta **bien usada** si el administrador puede verla o editarla en el contexto correcto de negocio
- una tabla esta **mal usada** si existe en la base pero no aparece en ninguna experiencia util

Por eso, en una app admin bien hecha:

- `addresses` no vive como menu propio
- `order_item_modifiers` no vive como CRUD propio
- `payment_transactions` no vive como CRUD propio
- `message_reads` no vive como CRUD propio

Pero esas tablas **si deben verse** dentro de la ficha correcta.

## Regla de exposicion UI

Cada tabla del negocio debe caer en una de estas capas:

### 1. Vista raiz

Se usa para entidades que el negocio administra directamente.

Ejemplos:

- `merchants`
- `merchant_branches`
- `customers`
- `merchant_staff`
- `products`
- `orders`
- `drivers`
- `payments`
- `promotions`
- `commission_rules`

### 2. Tab o subpanel de una vista raiz

Se usa para tablas hijas importantes que merecen un bloque propio en la ficha principal.

Ejemplos:

- `merchant_branch_hours`
- `merchant_branch_closures`
- `product_branch_settings`
- `order_status_history`
- `order_assignments`
- `driver_shifts`
- `merchant_settlement_items`

### 3. Modal o drawer

Se usa para detalles cortos, precisos o muy contextuales.

Ejemplos:

- `addresses`
- `merchant_staff_branches`
- `modifier_options`
- `promotion_targets`
- `customer_payment_methods`
- `payment_transactions`
- `order_cancellations`
- `order_evidences`

### 4. Solo lectura integrada

Se usa para tablas operativas o tecnicas que el admin necesita consultar, pero no editar libremente.

Ejemplos:

- `order_item_modifiers`
- `cart_item_modifiers`
- `message_reads`
- `analytics_events`
- `audit_logs`
- `driver_locations`

### 5. Automatica o backend-driven

Se usa para tablas cuyo origen natural es un proceso, trigger, checkout, app cliente o app repartidor.

El admin puede verlas, auditarlas o disparar acciones controladas, pero no deberia "inventarlas" a mano.

Ejemplos:

- `payments`
- `payment_transactions`
- `refunds`
- `order_status_history`
- `coupon_redemptions`
- `merchant_audit_logs`
- `driver_settlements`

## Como deberia verse la app admin mundial

La app admin correcta para este negocio deberia colapsar las `64` tablas en estos modulos raiz:

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

## Vistas compuestas clave

Estas son las vistas que, a nivel negocio, realmente justifican la base de datos.

### Vista `Ficha de comercio`

Capas:

- `merchants`
- `merchant_branches`
- `merchant_staff`
- `merchant_audit_logs`
- `analytics_events`

Uso:

- configurar identidad del negocio
- ver resumen de locales
- revisar equipo principal
- revisar cambios recientes

### Vista `Ficha de sucursal`

Capas:

- `merchant_branches`
- `addresses`
- `merchant_branch_status`
- `merchant_branch_hours`
- `merchant_branch_closures`
- `delivery_zones`
- `branch_delivery_zones`
- `product_branch_settings`

Uso:

- abrir o cerrar local
- definir horarios
- registrar cierres especiales
- definir cobertura de reparto
- controlar disponibilidad por local

### Vista `Ficha de personal`

Capas:

- `profiles`
- `merchant_staff`
- `merchant_staff_branches`
- `roles`
- `user_roles`

Uso:

- activar o desactivar personal
- asignar locales
- definir permisos
- distinguir owner, manager, operador y soporte

### Vista `Ficha de cliente`

Capas:

- `profiles`
- `customers`
- `customer_addresses`
- `addresses`
- `customer_payment_methods`
- `carts`
- `cart_items`
- `cart_item_modifiers`
- `orders`
- `coupon_redemptions`
- `conversations`

Uso:

- soporte al cliente
- revisar carritos abandonados
- entender habitos de compra
- atender reclamos o casos de pago

### Vista `Ficha de producto`

Capas:

- `products`
- `categories`
- `product_branch_settings`
- `modifier_groups`
- `modifier_options`
- `product_modifier_groups`
- `promotion_targets`

Uso:

- editar menu
- pausar producto por sucursal
- controlar modificadores
- validar que una promo afecta al producto correcto

### Vista `Ficha de pedido`

Capas:

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
- `conversations`
- `messages`

Uso:

- operar el pedido de punta a punta
- ver items y personalizaciones
- asignar o reasignar repartidor
- registrar incidencia o cancelacion
- revisar pago y devolucion
- hablar con cliente o repartidor desde el caso

### Vista `Ficha de repartidor`

Capas:

- `profiles`
- `drivers`
- `driver_documents`
- `vehicles`
- `vehicle_types`
- `driver_shifts`
- `driver_current_state`
- `driver_locations`
- `order_assignments`
- `cash_collections`
- `driver_settlements`
- `driver_settlement_items`

Uso:

- validar onboarding
- revisar disponibilidad
- seguir ubicacion
- ver pedidos asignados
- controlar efectivo y liquidaciones

### Vista `Ficha de pago`

Capas:

- `payments`
- `payment_transactions`
- `refunds`
- `payment_methods`
- `orders`
- `customers`

Uso:

- revisar estado de cobro
- ver respuesta del gateway
- ejecutar o auditar devoluciones
- entender relacion pago-pedido-cliente

### Vista `Ficha de promocion`

Capas:

- `promotions`
- `promotion_targets`
- `coupons`
- `coupon_redemptions`
- `categories`
- `products`
- `merchant_branches`

Uso:

- definir descuento
- decidir a que aplica
- manejar cupones
- auditar uso real de la campaña

### Vista `Liquidacion`

Capas:

- `commission_rules`
- `merchant_settlements`
- `merchant_settlement_items`
- `driver_settlements`
- `driver_settlement_items`
- `cash_collections`

Uso:

- calcular comisiones
- liquidar comercios
- liquidar repartidores
- cuadrar efectivo y comisiones

### Vista `Mensajes`

Capas:

- `conversations`
- `conversation_participants`
- `messages`
- `message_reads`
- `notifications`

Uso:

- soporte
- chat de pedido
- alertas internas
- seguimiento de lectura

### Vista `Sistema`

Capas:

- `roles`
- `user_roles`
- `system_settings`
- `audit_logs`
- `merchant_audit_logs`
- `analytics_events`

Uso:

- permisos
- configuracion global
- auditoria
- metricas de plataforma

## Matriz funcional por modulo

### 1. Resumen

- `analytics_events`: solo lectura; tarjetas, graficas y embudos.
- `orders`: lectura agregada; volumen, estados y tiempos.
- `payments`: lectura agregada; ventas, fallos, devoluciones.
- `merchant_branch_status`: lectura rapida; sucursales abiertas o pausadas.
- `driver_current_state`: lectura rapida; repartidores online u offline.
- `notifications`: feed de alertas accionables.
- `audit_logs`: lectura de eventos sensibles.

### 2. Comercio

- `merchants`: vista raiz; `R/U` para datos del negocio.
- `merchant_branches`: subresumen; acceso a locales.
- `merchant_staff`: subresumen; acceso a responsables.
- `merchant_audit_logs`: panel de auditoria del comercio; solo lectura.

### 3. Sucursales

- `merchant_branches`: vista raiz; `R/C/U`.
- `addresses`: modal de direccion; `R/C/U`.
- `merchant_branch_status`: panel operativo; `R/U`.
- `merchant_branch_hours`: tab `Horarios`; `R/C/U/D`.
- `merchant_branch_closures`: tab `Cierres`; `R/C/U/D`.
- `delivery_zones`: catalogo compartido dentro del modulo; `R/C/U/D`.
- `branch_delivery_zones`: grid de cobertura por sucursal; `R/C/U/D`.
- `product_branch_settings`: panel contextual para disponibilidad por local; `R/U`.

### 4. Personal y accesos

- `profiles`: ficha base del usuario; `R/U`.
- `merchant_staff`: vista raiz; `R/C/U`.
- `merchant_staff_branches`: modal o grid de asignacion; `R/C/U/D`.
- `roles`: catalogo de roles; `R/C/U/D`.
- `user_roles`: asignacion de permisos; `R/C/U/D`.

### 5. Clientes

- `profiles`: encabezado del cliente.
- `customers`: vista raiz; `R/U` y notas de soporte.
- `customer_addresses`: subtabla; `R/C/U/D`.
- `addresses`: modal de direccion ligada al cliente.
- `customer_payment_methods`: drawer; `R/U/D` segun politica.
- `carts`: tab `Carritos`; `R` y recuperacion asistida.
- `cart_items`: subtabla dentro del carrito; `R`.
- `cart_item_modifiers`: detalle expandible del item; `R`.
- `coupon_redemptions`: historial en cliente; `R`.
- `orders`: resumen de compras; `R`.

### 6. Catalogo

- `categories`: vista raiz; `R/C/U`.
- `products`: vista raiz; `R/C/U`.
- `product_branch_settings`: subgrid dentro del producto; `R/C/U`.
- `modifier_groups`: submodulo o tab fuerte; `R/C/U/D`.
- `modifier_options`: subtabla del grupo; `R/C/U/D`.
- `product_modifier_groups`: checklist o dual list dentro del producto; `R/C/U/D`.
- `promotion_targets`: lectura cruzada desde producto o categoria; `R`.

### 7. Pedidos

- `orders`: vista raiz; `R/U`.
- `order_items`: subtabla principal; `R`.
- `order_item_modifiers`: detalle expandible; `R`.
- `order_delivery_details`: panel de entrega; `R`.
- `order_status_history`: timeline; `R`, `C` por accion controlada.
- `order_assignments`: panel de asignacion; `R/C/U`.
- `order_cancellations`: modal o bloque de cancelacion; `R/C`.
- `order_incidents`: bloque de incidencias; `R/C/U`.
- `order_evidences`: galeria o adjuntos; `R/C`.
- `payments`: panel financiero del pedido; `R/U`.
- `payment_transactions`: drawer tecnico; `R`.
- `refunds`: bloque de devoluciones; `R/C/U`.
- `conversations`: acceso al chat del caso; `R/C`.
- `messages`: hilo del caso; `R/C`.

### 8. Reparto

- `drivers`: vista raiz; `R/C/U`.
- `profiles`: encabezado del repartidor.
- `driver_documents`: tab `Documentos`; `R/C/U`.
- `vehicles`: tab `Vehiculo`; `R/C/U`.
- `vehicle_types`: catalogo lookup; `R/C/U`.
- `driver_shifts`: tab `Turnos`; `R/C/U`.
- `driver_current_state`: tablero en vivo; `R/U`.
- `driver_locations`: mapa y tracking; `R`.
- `order_assignments`: lista de asignaciones; `R/C/U`.
- `cash_collections`: panel de efectivo; `R/C/U`.
- `order_evidences`: evidencia de entrega; `R`.
- `order_incidents`: incidencias de reparto; `R/C/U`.

### 9. Pagos y caja

- `payment_methods`: vista raiz de catalogo; `R/C/U`.
- `payments`: vista raiz operativa; `R/U`.
- `payment_transactions`: modal tecnico; `R`.
- `refunds`: submodulo fuerte; `R/C/U`.
- `cash_collections`: bloque operativo de efectivo; `R/C/U`.

### 10. Promociones

- `promotions`: vista raiz; `R/C/U`.
- `promotion_targets`: modal o subtabla; `R/C/U/D`.
- `coupons`: tab `Cupones`; `R/C/U`.
- `coupon_redemptions`: tab `Uso real`; `R`.
- `categories`: selector de segmentacion.
- `products`: selector de segmentacion.
- `merchant_branches`: selector de segmentacion.

### 11. Liquidaciones

- `commission_rules`: vista raiz; `R/C/U`.
- `merchant_settlements`: vista raiz de liquidaciones a negocio; `R`.
- `merchant_settlement_items`: detalle de liquidacion; `R`.
- `driver_settlements`: vista raiz de liquidaciones a repartidor; `R`.
- `driver_settlement_items`: detalle de liquidacion; `R`.
- `cash_collections`: cruce de caja y efectivo; `R`.

### 12. Mensajes

- `conversations`: vista raiz de conversaciones; `R/C/U`.
- `conversation_participants`: drawer de participantes; `R/C/U`.
- `messages`: hilo; `R/C`.
- `message_reads`: indicadores de lectura; `R`.
- `notifications`: bandeja y centro de alertas; `R/U`.

### 13. Sistema

- `roles`: vista raiz; `R/C/U/D`.
- `user_roles`: subtabla de permisos; `R/C/U/D`.
- `system_settings`: vista raiz; `R/C/U`.
- `audit_logs`: auditoria global; `R`.
- `merchant_audit_logs`: auditoria del negocio; `R`.
- `analytics_events`: metrica cruda; `R`.

## Las tablas que no deben quedar "ocultas"

Estas tablas no necesitan ruta propia, pero si o si deben aparecer visibles en una ficha o modal:

- `addresses`
- `merchant_staff_branches`
- `merchant_branch_status`
- `merchant_branch_hours`
- `merchant_branch_closures`
- `branch_delivery_zones`
- `modifier_options`
- `product_branch_settings`
- `product_modifier_groups`
- `order_items`
- `order_item_modifiers`
- `order_delivery_details`
- `order_status_history`
- `order_assignments`
- `order_cancellations`
- `order_incidents`
- `order_evidences`
- `payment_transactions`
- `promotion_targets`
- `customer_addresses`
- `customer_payment_methods`
- `cart_items`
- `cart_item_modifiers`
- `conversation_participants`
- `message_reads`
- `merchant_settlement_items`
- `driver_settlement_items`

## Lo que significa "CRUD bien usado" a nivel negocio

Un CRUD relacional esta bien usado cuando:

- el admin entiende donde esta
- entiende sobre que entidad esta actuando
- no necesita tipear ids
- ve el contexto antes de guardar
- la relacion hija aparece donde el negocio la espera
- los detalles tecnicos se muestran sin romper la experiencia

Ejemplos correctos:

- editar `branch_delivery_zones` desde la ficha de sucursal
- editar `modifier_options` dentro del grupo de modificadores
- ver `order_item_modifiers` debajo del item del pedido
- ver `payment_transactions` dentro del drawer de pago
- ver `merchant_settlement_items` dentro del detalle de liquidacion

Ejemplos incorrectos:

- tener `order_item_modifiers` como menu suelto
- tener `addresses` como CRUD general sin contexto
- ocultar `order_cancellations` y que solo exista en base
- que `promotion_targets` solo exista en la tabla y no en la promo

## Veredicto sobre el mapeo actual

El enfoque actual del proyecto va bien en una cosa:

- el `CRUD relacional y contextual` es la direccion correcta

Pero a nivel negocio, el admin todavia esta sesgado a:

- `comercio`
- `sucursales`
- `catalogo`
- `parte del personal`
- `parte de pedidos`

Todavia falta llevar el admin al mapa de negocio completo para que las `64` tablas esten realmente expuestas de forma util.

La conclusion correcta es esta:

- **no** se deben crear `64` CRUDs aislados
- **si** se deben exponer practicamente las `64` tablas en la experiencia admin
- muchas deben vivir como `tab`, `subtabla`, `drawer`, `timeline` o `modal`
- si una tabla no aparece en ninguna ficha util, entonces sigue estando "oculta" aunque exista en base

## Proximo criterio de implementacion

Para que el admin sea funcionalmente coherente con el negocio, el siguiente orden correcto es:

1. `Pedidos` completo
   - `order_item_modifiers`
   - `order_assignments`
   - `order_cancellations`
   - `order_incidents`
   - `order_evidences`
   - `payments`
   - `payment_transactions`
   - `refunds`
2. `Clientes`
   - `customers`
   - `customer_addresses`
   - `customer_payment_methods`
   - `carts`
   - `cart_items`
   - `cart_item_modifiers`
3. `Pagos y caja`
   - `payment_methods`
   - `cash_collections`
4. `Promociones`
   - `promotions`
   - `promotion_targets`
   - `coupons`
   - `coupon_redemptions`
5. `Reparto`
   - `drivers`
   - `driver_documents`
   - `driver_current_state`
   - `driver_locations`
   - `driver_shifts`
   - `vehicles`
   - `vehicle_types`
6. `Sistema y liquidaciones`
   - `roles`
   - `user_roles`
   - `system_settings`
   - `merchant_audit_logs`
   - `audit_logs`
   - `analytics_events`
   - `commission_rules`
   - `merchant_settlements`
   - `merchant_settlement_items`
   - `driver_settlements`
   - `driver_settlement_items`
