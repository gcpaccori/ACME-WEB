# Plan 2 - App cliente

## Objetivo

Construir la experiencia de compra del cliente final sobre la misma base de datos. El cliente debe poder:

- registrarse e iniciar sesion
- guardar direcciones y metodos de pago
- explorar comercios y catalogos
- armar carrito con modificadores
- pagar y seguir el pedido
- conversar con soporte o con el flujo del pedido

## Tablas del plan

### Identidad y perfil

- `profiles`
- `customers`
- `roles`
- `user_roles`

### Direcciones y pagos

- `addresses`
- `customer_addresses`
- `customer_payment_methods`
- `payment_methods`

### Descubrimiento y compra

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

### Carrito y checkout

- `carts`
- `cart_items`
- `cart_item_modifiers`
- `coupons`
- `coupon_redemptions`
- `promotions`
- `promotion_targets`

### Pedido y seguimiento

- `orders`
- `order_items`
- `order_item_modifiers`
- `order_delivery_details`
- `order_status_history`
- `payments`
- `payment_transactions`
- `conversations`
- `conversation_participants`
- `messages`
- `message_reads`
- `notifications`

## CRUD y acciones por modulo

### 1. Cuenta y perfil

- `profiles`
  - editar nombre, telefono, avatar
- `customers`
  - bootstrap automatico al primer login
  - lectura de rating promedio y datos base

### 2. Libreta de direcciones

- `addresses`
  - crear direccion
  - editar direccion
  - eliminar direccion logica si se decide por estado
- `customer_addresses`
  - vincular direccion al cliente
  - marcar como default
  - asignar etiqueta como casa, trabajo, otro

### 3. Metodos de pago

- `customer_payment_methods`
  - agregar metodo
  - cambiar alias
  - marcar como default
  - desactivar o eliminar
- `payment_methods`
  - solo lectura para mostrar medios habilitados

### 4. Marketplace

- `merchants`
  - lectura de comercios disponibles
- `merchant_branches`
  - lectura de sucursales segun zona
- `merchant_branch_status`
  - lectura para mostrar si acepta pedidos
- `categories`, `products`
  - lectura y filtros por categoria, precio, disponibilidad
- `modifier_groups`, `modifier_options`, `product_modifier_groups`
  - lectura para configurar producto antes de agregar al carrito

### 5. Carrito

- `carts`
  - crear carrito activo
  - recalcular totales
- `cart_items`
  - agregar item
  - editar cantidad
  - quitar item
- `cart_item_modifiers`
  - agregar o quitar modificadores por item
- `coupons`
  - validar codigo
- `coupon_redemptions`
  - registrar uso al confirmar pedido

### 6. Checkout y pedido

- `orders`
  - crear pedido
  - listar historial
  - cancelar si la regla de negocio lo permite
- `order_items`
  - persistir snapshot de compra
- `order_item_modifiers`
  - persistir modificadores elegidos
- `order_delivery_details`
  - guardar snapshot de entrega
- `payments`
  - crear solicitud de pago
- `payment_transactions`
  - leer estado de transaccion

### 7. Seguimiento y comunicacion

- `order_status_history`
  - lectura de timeline
- `conversations`
  - abrir conversacion por pedido
- `messages`
  - enviar y recibir mensajes
- `message_reads`
  - marcar como leido
- `notifications`
  - centro de notificaciones del cliente

## Pantallas recomendadas

- `auth/login`
- `auth/register`
- `home`
- `merchant-list`
- `merchant-detail`
- `product-detail`
- `cart`
- `checkout`
- `order-success`
- `orders`
- `order-detail`
- `addresses`
- `payment-methods`
- `profile`
- `notifications`
- `support-chat`

## Fases ejecutables

### Fase 1 - Identidad y bootstrap de cliente

- [ ] login y registro
- [ ] bootstrap de `profiles` y `customers`
- [ ] contexto de sesion del cliente

### Fase 2 - Direcciones y zona de reparto

- [ ] CRUD de `addresses`
- [ ] CRUD de `customer_addresses`
- [ ] selector de direccion default
- [ ] validacion de cobertura con `delivery_zones` y `branch_delivery_zones`

### Fase 3 - Marketplace y menu

- [ ] listado de comercios
- [ ] detalle de sucursal
- [ ] categorias y productos
- [ ] configurador de producto con modificadores
- [ ] disponibilidad por sucursal usando `product_branch_settings`

### Fase 4 - Carrito y checkout

- [ ] carrito persistente
- [ ] cupones y promociones
- [ ] calculo de subtotal, delivery, service fee, total
- [ ] creacion de pedido y detalle de entrega
- [ ] integracion de pago y estados de transaccion

### Fase 5 - Seguimiento post compra

- [ ] timeline de pedido
- [ ] detalle del pedido con items y direccion
- [ ] chat por pedido
- [ ] centro de notificaciones
- [ ] cancelacion si aplica

### Fase 6 - Perfil y recurrencia

- [ ] CRUD de metodos de pago guardados
- [ ] editar perfil
- [ ] reordenar desde historial
- [ ] direccion preferida y ultimo checkout

## Reglas de negocio sugeridas

- no permitir checkout si la sucursal esta cerrada o no acepta pedidos
- no permitir items pausados o sin stock
- congelar snapshots en `order_items` y `order_delivery_details` al confirmar pedido
- registrar todo cambio relevante del pedido en `order_status_history`
- separar claramente pago solicitado, autorizado, capturado y fallido

## Criterio de cierre

El plan se considera listo cuando:

- el cliente puede registrarse y mantener direcciones
- puede ver comercios y productos reales con modificadores
- puede armar carrito y confirmar pedido
- puede pagar y seguir estados
- puede revisar historial y conversar sobre su pedido

## Dependencias con otros planes

- depende del portal de negocio para catalogo, horarios y zonas
- alimenta el flujo operativo de `orders` que usa el portal
- activa el trabajo de `order_assignments` para la app repartidor
