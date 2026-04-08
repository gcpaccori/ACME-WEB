# Plan 1 - cobertura total de tablas y uso de negocio

## Objetivo

Cubrir las `40` tablas del `Plan 1` para la app web admin y dejar claro:

- donde vive cada tabla dentro del admin
- para que sirve en el negocio
- como debe verse en UI
- si se usa como lectura, escritura o ambas
- si su guardado debe ser directo o relacional

Esta matriz sirve como contrato funcional para terminar el admin sin dejar tablas huérfanas.

## Regla general de uso

En esta web no se trabaja tabla por tabla.

Se trabaja por `entidad raiz`:

- `Comercio`
- `Sucursal`
- `Personal`
- `Catalogo`
- `Pedido`
- `Pagos`
- `Promociones`
- `Liquidaciones`
- `Sistema`

Cada entidad raiz consume una o varias tablas y las presenta como una sola experiencia de negocio.

## Tipos de operación

- `R`: lectura
- `C`: crear
- `U`: actualizar
- `D`: eliminar o baja logica

## Tipos de guardado

- `directo`: una sola tabla
- `relacional`: varias tablas relacionadas desde una misma page
- `rpc`: operacion atomica o con reglas de negocio

## Cobertura total de tablas

### 1. Nucleo de acceso y roles

#### `profiles`

- modulo: `Personal` y `Sistema`
- pantalla principal: `Ficha de usuario`
- uso de negocio:
  - mostrar nombre, correo, telefono y avatar del usuario
  - identificar al owner, manager, operador o staff
- operaciones:
  - `R`, `U`
- guardado:
  - `directo`
- automatizacion relacional:
  - se cruza con `merchant_staff`, `customers`, `drivers`, `user_roles`

#### `roles`

- modulo: `Sistema`
- pantalla principal: `Catalogo de roles`
- uso de negocio:
  - definir roles disponibles para el admin o para futuros flujos
- operaciones:
  - `R`, `C`, `U`, `D`
- guardado:
  - `directo`
- automatizacion relacional:
  - selector humano en asignacion de permisos

#### `user_roles`

- modulo: `Sistema`
- pantalla principal: `Permisos de usuario`
- uso de negocio:
  - asignar roles a usuarios concretos
- operaciones:
  - `R`, `C`, `U`, `D`
- guardado:
  - `relacional`
- automatizacion relacional:
  - elegir `profile` y `role` por nombre, no por id

#### `merchant_staff`

- modulo: `Personal`
- pantalla principal: `Listado de personal` y `Ficha de personal`
- uso de negocio:
  - representar al personal operativo del comercio
- operaciones:
  - `R`, `C`, `U`
- guardado:
  - `relacional`
- automatizacion relacional:
  - se hidrata con `profiles` y sucursales asignadas

#### `merchant_staff_branches`

- modulo: `Personal`
- pantalla principal: `Asignacion de sucursales`
- uso de negocio:
  - definir en que sucursales trabaja cada persona
  - marcar sucursal principal
- operaciones:
  - `R`, `C`, `U`, `D`
- guardado:
  - `relacional`
- automatizacion relacional:
  - checkboxes o selector multiple de sucursales

### 2. Negocio y sucursales

#### `merchants`

- modulo: `Comercio`
- pantalla principal: `Ficha de comercio`
- uso de negocio:
  - datos base del negocio
  - razon social, contacto, logo, estado
- operaciones:
  - `R`, `U`
- guardado:
  - `directo`
- automatizacion relacional:
  - el comercio actual viene del contexto de sesion

#### `merchant_branches`

- modulo: `Sucursales`
- pantalla principal: `Listado y editor de sucursal`
- uso de negocio:
  - mantener locales fisicos
  - telefono, estado, tiempo de preparacion
- operaciones:
  - `R`, `C`, `U`
- guardado:
  - `relacional`
- automatizacion relacional:
  - relacion con `addresses`, `merchant_branch_status`, `merchant_branch_hours`, `branch_delivery_zones`

#### `addresses`

- modulo: `Comercio` y `Sucursales`
- pantalla principal: `Direccion`
- uso de negocio:
  - direccion real de sucursal o sede
- operaciones:
  - `R`, `C`, `U`
- guardado:
  - `relacional`
- automatizacion relacional:
  - se guarda desde la ficha de sucursal, no como CRUD aislado

#### `merchant_branch_status`

- modulo: `Sucursales`
- pantalla principal: `Estado operativo`
- uso de negocio:
  - abrir, cerrar, pausar y permitir o no pedidos
- operaciones:
  - `R`, `U`
- guardado:
  - `relacional`
- automatizacion relacional:
  - hereda `branch_id` desde la ficha de sucursal

#### `merchant_branch_hours`

- modulo: `Sucursales`
- pantalla principal: `Horarios`
- uso de negocio:
  - programacion semanal del local
- operaciones:
  - `R`, `C`, `U`
- guardado:
  - `relacional`
- automatizacion relacional:
  - matriz de 7 dias autogenerada

#### `merchant_branch_closures`

- modulo: `Sucursales`
- pantalla principal: `Cierres especiales`
- uso de negocio:
  - feriados, mantenimientos, cierres temporales
- operaciones:
  - `R`, `C`, `U`, `D`
- guardado:
  - `relacional`
- automatizacion relacional:
  - toma `branch_id` y `created_by_user_id` desde contexto

#### `delivery_zones`

- modulo: `Sucursales`
- pantalla principal: `Zonas de reparto`
- uso de negocio:
  - definir zonas validas de entrega
  - base fee, tiempo estimado, pedido minimo
- operaciones:
  - `R`, `C`, `U`, `D`
- guardado:
  - `directo`
- automatizacion relacional:
  - representacion amigable por nombre y politicas de uso

#### `branch_delivery_zones`

- modulo: `Sucursales`
- pantalla principal: `Zonas por sucursal`
- uso de negocio:
  - activar o desactivar zonas para una sucursal puntual
  - sobreescribir tarifa
- operaciones:
  - `R`, `C`, `U`, `D`
- guardado:
  - `relacional`
- automatizacion relacional:
  - selector de zonas disponibles y fee override

### 3. Catalogo

#### `categories`

- modulo: `Catalogo`
- pantalla principal: `Categorias`
- uso de negocio:
  - agrupar productos del menu
- operaciones:
  - `R`, `C`, `U`
- guardado:
  - `directo`
- automatizacion relacional:
  - `merchant_id` desde contexto

#### `products`

- modulo: `Catalogo`
- pantalla principal: `Productos`
- uso de negocio:
  - productos vendibles del negocio
- operaciones:
  - `R`, `C`, `U`
- guardado:
  - `relacional`
- automatizacion relacional:
  - categoria por selector
  - configuracion por sucursal anidada

#### `product_branch_settings`

- modulo: `Catalogo`
- pantalla principal: `Disponibilidad por sucursal`
- uso de negocio:
  - disponibilidad, pausa, stock y precio override por local
- operaciones:
  - `R`, `C`, `U`
- guardado:
  - `relacional`
- automatizacion relacional:
  - se edita dentro de la ficha del producto

#### `modifier_groups`

- modulo: `Catalogo`
- pantalla principal: `Grupos de modificadores`
- uso de negocio:
  - extras, tamanos, salsas, toppings
- operaciones:
  - `R`, `C`, `U`, `D`
- guardado:
  - `directo`
- automatizacion relacional:
  - `merchant_id` desde contexto

#### `modifier_options`

- modulo: `Catalogo`
- pantalla principal: `Opciones de modificador`
- uso de negocio:
  - opciones dentro de cada grupo
- operaciones:
  - `R`, `C`, `U`, `D`
- guardado:
  - `relacional`
- automatizacion relacional:
  - selector de grupo

#### `product_modifier_groups`

- modulo: `Catalogo`
- pantalla principal: `Asignacion producto-modificador`
- uso de negocio:
  - decir que modificadores pertenecen a que producto
- operaciones:
  - `R`, `C`, `U`, `D`
- guardado:
  - `relacional`
- automatizacion relacional:
  - checklists o dual list dentro de ficha producto

### 4. Operacion de pedidos

#### `orders`

- modulo: `Pedidos`
- pantalla principal: `Bandeja de pedidos` y `Detalle de pedido`
- uso de negocio:
  - pedido maestro con montos, estado, branch, cliente y pago
- operaciones:
  - `R`, `U`
- guardado:
  - `rpc` para transiciones criticas
- automatizacion relacional:
  - carga cliente, direccion, metodo de pago, historial, items

#### `order_items`

- modulo: `Pedidos`
- pantalla principal: `Detalle de pedido`
- uso de negocio:
  - lineas del pedido
- operaciones:
  - `R`
- guardado:
  - no editable normalmente
- automatizacion relacional:
  - se muestra anidado en pedido

#### `order_item_modifiers`

- modulo: `Pedidos`
- pantalla principal: `Detalle de item`
- uso de negocio:
  - modificadores elegidos en cada item
- operaciones:
  - `R`
- guardado:
  - no editable normalmente
- automatizacion relacional:
  - anidado debajo de item

#### `order_status_history`

- modulo: `Pedidos`
- pantalla principal: `Timeline`
- uso de negocio:
  - trazabilidad de estados del pedido
- operaciones:
  - `R`, `C`
- guardado:
  - `rpc` en cambios de estado
- automatizacion relacional:
  - actor y timestamp autocompletados

#### `order_delivery_details`

- modulo: `Pedidos`
- pantalla principal: `Entrega`
- uso de negocio:
  - direccion, referencia, receptor, telefono
- operaciones:
  - `R`
- guardado:
  - lectura de snapshot
- automatizacion relacional:
  - siempre embebido en pedido

#### `order_assignments`

- modulo: `Pedidos` y `Reparto`
- pantalla principal: `Asignacion de driver`
- uso de negocio:
  - asignar, reasignar, aceptar, rechazar o completar reparto
- operaciones:
  - `R`, `C`, `U`
- guardado:
  - `rpc`
- automatizacion relacional:
  - selector de driver disponible

#### `order_cancellations`

- modulo: `Pedidos`
- pantalla principal: `Cancelaciones`
- uso de negocio:
  - registrar quien cancelo, motivo y devolucion
- operaciones:
  - `R`, `C`
- guardado:
  - `rpc`
- automatizacion relacional:
  - actor y orden actual desde contexto

#### `order_evidences`

- modulo: `Pedidos` y `Reparto`
- pantalla principal: `Evidencias`
- uso de negocio:
  - fotos, archivos o notas de prueba
- operaciones:
  - `R`, `C`
- guardado:
  - `relacional`
- automatizacion relacional:
  - orden actual y driver actual si existe

#### `order_incidents`

- modulo: `Pedidos` y `Reparto`
- pantalla principal: `Incidencias`
- uso de negocio:
  - problemas de ruta, cliente ausente, pedido dañado
- operaciones:
  - `R`, `C`, `U`
- guardado:
  - `relacional`
- automatizacion relacional:
  - orden actual y driver actual si aplica

### 5. Pagos, promociones y liquidaciones

#### `payment_methods`

- modulo: `Pagos`
- pantalla principal: `Medios de pago`
- uso de negocio:
  - catalogo de metodos habilitados
- operaciones:
  - `R`, `C`, `U`
- guardado:
  - `directo`
- automatizacion relacional:
  - codigo humano y estado

#### `payments`

- modulo: `Pagos`
- pantalla principal: `Operaciones`
- uso de negocio:
  - pago por pedido y su estado
- operaciones:
  - `R`, `U`
- guardado:
  - `rpc` o flujo controlado
- automatizacion relacional:
  - cruza pedido, cliente y metodo de pago

#### `payment_transactions`

- modulo: `Pagos`
- pantalla principal: `Transacciones`
- uso de negocio:
  - log tecnico del proveedor
- operaciones:
  - `R`
- guardado:
  - normalmente backend o integracion
- automatizacion relacional:
  - solo lectura dentro del pago

#### `promotions`

- modulo: `Promociones`
- pantalla principal: `Promociones`
- uso de negocio:
  - descuentos generales o por reglas
- operaciones:
  - `R`, `C`, `U`
- guardado:
  - `directo`
- automatizacion relacional:
  - estado, vigencia y limites

#### `promotion_targets`

- modulo: `Promociones`
- pantalla principal: `Segmentacion`
- uso de negocio:
  - aplicar una promo a producto, categoria, sucursal o comercio
- operaciones:
  - `R`, `C`, `U`, `D`
- guardado:
  - `relacional`
- automatizacion relacional:
  - target type + target id resuelto por selector humano

#### `coupons`

- modulo: `Promociones`
- pantalla principal: `Cupones`
- uso de negocio:
  - cupones concretos asociados a promociones
- operaciones:
  - `R`, `C`, `U`
- guardado:
  - `directo`
- automatizacion relacional:
  - promo asociada por selector

#### `coupon_redemptions`

- modulo: `Promociones`
- pantalla principal: `Historial de uso`
- uso de negocio:
  - ver redenciones por cliente y pedido
- operaciones:
  - `R`
- guardado:
  - backend o checkout
- automatizacion relacional:
  - embebido en reporte de cupon

#### `commission_rules`

- modulo: `Liquidaciones`
- pantalla principal: `Reglas de comision`
- uso de negocio:
  - definir comision para comercio, driver o tipo de operacion
- operaciones:
  - `R`, `C`, `U`
- guardado:
  - `directo`
- automatizacion relacional:
  - scope y vigencia por selector

#### `merchant_settlements`

- modulo: `Liquidaciones`
- pantalla principal: `Liquidaciones de comercio`
- uso de negocio:
  - resumen de periodos liquidados al comercio
- operaciones:
  - `R`
- guardado:
  - backend o proceso batch
- automatizacion relacional:
  - filtros por comercio, periodo y estado

#### `merchant_settlement_items`

- modulo: `Liquidaciones`
- pantalla principal: `Detalle de liquidacion`
- uso de negocio:
  - detalle de pedidos incluidos en la liquidacion
- operaciones:
  - `R`
- guardado:
  - backend o proceso batch
- automatizacion relacional:
  - embebido en settlement

#### `refunds`

- modulo: `Pagos`
- pantalla principal: `Refunds`
- uso de negocio:
  - devoluciones por cancelaciones, errores o reclamos
- operaciones:
  - `R`, `C`, `U`
- guardado:
  - `rpc`
- automatizacion relacional:
  - pedido y pago actual desde contexto

#### `merchant_audit_logs`

- modulo: `Auditoria`
- pantalla principal: `Auditoria de negocio`
- uso de negocio:
  - trazabilidad de acciones del comercio y sucursal
- operaciones:
  - `R`
- guardado:
  - idealmente automatico desde backend o trigger
- automatizacion relacional:
  - filtros por entidad, usuario y sucursal

## Agrupacion final por modulos admin

### Modulo `Comercio`

- `merchants`
- `addresses`
- `merchant_audit_logs`

### Modulo `Sucursales`

- `merchant_branches`
- `addresses`
- `merchant_branch_status`
- `merchant_branch_hours`
- `merchant_branch_closures`
- `delivery_zones`
- `branch_delivery_zones`

### Modulo `Personal`

- `profiles`
- `merchant_staff`
- `merchant_staff_branches`
- `roles`
- `user_roles`

### Modulo `Catalogo`

- `categories`
- `products`
- `product_branch_settings`
- `modifier_groups`
- `modifier_options`
- `product_modifier_groups`

### Modulo `Pedidos`

- `orders`
- `order_items`
- `order_item_modifiers`
- `order_status_history`
- `order_delivery_details`
- `order_assignments`
- `order_cancellations`
- `order_evidences`
- `order_incidents`

### Modulo `Pagos`

- `payment_methods`
- `payments`
- `payment_transactions`
- `refunds`

### Modulo `Promociones`

- `promotions`
- `promotion_targets`
- `coupons`
- `coupon_redemptions`

### Modulo `Liquidaciones`

- `commission_rules`
- `merchant_settlements`
- `merchant_settlement_items`

### Modulo `Auditoria`

- `merchant_audit_logs`

## Prioridad correcta para cerrar cobertura real

Para llevar el admin de cobertura parcial a cobertura completa, el orden correcto por negocio es:

1. `merchant_branch_closures`, `delivery_zones`, `branch_delivery_zones`
2. `modifier_groups`, `modifier_options`, `product_modifier_groups`
3. `order_item_modifiers`, `order_assignments`, `order_cancellations`, `order_evidences`, `order_incidents`
4. `payments`, `payment_transactions`, `refunds`
5. `promotions`, `promotion_targets`, `coupons`, `coupon_redemptions`
6. `roles`, `user_roles`, `merchant_audit_logs`
7. `commission_rules`, `merchant_settlements`, `merchant_settlement_items`

## Criterio de cobertura total

La app web admin puede considerarse con cobertura total del `Plan 1` cuando las `40` tablas cumplan esto:

- tienen modulo asignado
- tienen pantalla definida
- tienen uso de negocio claro
- tienen estrategia de guardado definida
- no requieren ids manuales para operar
- las relaciones criticas se resuelven por contexto o selectores humanos
