# Fase 0 - Cierre de auditoria y congelamiento

## Fecha

- `9 de abril de 2026`

## Estado

- `Ejecutada`

## Objetivo de esta fase

Cerrar la base de trabajo antes de seguir desarrollando:

- una sola lectura de jerarquia
- un solo inventario de vistas
- una sola matriz `64/64`
- una sola regla de congelamiento

## Fuente de verdad desde ahora

Para seguir desarrollando el admin, los documentos maestros quedan asi:

1. [fases-trabajo-jerarquia-y-cobertura-64-tablas-2026-04-09.md](C:/Users/ptic252/Documents/GitHub/ACME-WEB/docs/fases-trabajo-jerarquia-y-cobertura-64-tablas-2026-04-09.md)
2. [auditoria-vistas-jerarquia-admin-2026-04-09.md](C:/Users/ptic252/Documents/GitHub/ACME-WEB/docs/auditoria-vistas-jerarquia-admin-2026-04-09.md)
3. [plan-intervencion-admin-plataforma-negocio-sucursal.md](C:/Users/ptic252/Documents/GitHub/ACME-WEB/docs/plan-intervencion-admin-plataforma-negocio-sucursal.md)
4. este documento

## Regla de congelamiento

Hasta que no se cierre la jerarquia completa, no se deben abrir trabajos nuevos fuera de este marco:

1. no crear modulos nuevos sin asignar `capa`, `perfil`, `tabla raiz` y `tablas hijas`
2. no crear CRUDs tabla por tabla
3. no dejar tablas visibles solo en servicios sin vista util
4. no exponer tablas globales desde negocio si la capa correcta es plataforma
5. no agregar rutas nuevas fuera de `Plataforma`, `Negocio` o `Sucursal`

## Inventario actual de vistas

Estado actual verificado:

- `25` rutas admin montadas
- `12` modulos habilitados en sidebar
- `1` modulo deshabilitado: `Pagos`
- `9` rutas legacy del portal operativo siguen montadas pero ocultas del sidebar

## Regla de cobertura de base de datos

La cobertura correcta del admin no es:

- `64 CRUDs sueltos`

La cobertura correcta del admin si es:

- `64/64` tablas visibles o usables en vistas utiles

Eso significa que cada tabla debe quedar marcada como:

1. `raiz`
2. `integrada`
3. `readonly operacional`

## Resultado de fase 0

La asignacion objetivo queda asi:

- `18` tablas `raiz`
- `29` tablas `integradas`
- `17` tablas `readonly operacional`

`18 + 29 + 17 = 64`

## Matriz 64 por 64

Formato usado:

- `tabla -> capa dueña -> exposicion objetivo -> estado actual`

## Identidad, gobierno y configuracion

- `profiles -> Compartida -> integrada -> Parcial`
- `roles -> Plataforma -> raiz -> Parcial`
- `user_roles -> Plataforma -> integrada -> Parcial`
- `system_settings -> Plataforma -> raiz -> Parcial`
- `audit_logs -> Plataforma -> readonly operacional -> Parcial`
- `analytics_events -> Plataforma -> readonly operacional -> Parcial`

## Comercios y estructura

- `merchants -> Compartida -> raiz -> Parcial`
- `merchant_branches -> Compartida -> raiz -> Parcial`
- `addresses -> Negocio -> integrada -> Adecuada`
- `merchant_branch_status -> Sucursal -> integrada -> Adecuada`
- `merchant_branch_hours -> Sucursal -> integrada -> Adecuada`
- `merchant_branch_closures -> Sucursal -> integrada -> Adecuada`
- `delivery_zones -> Negocio -> integrada -> Adecuada`
- `branch_delivery_zones -> Sucursal -> integrada -> Adecuada`
- `merchant_audit_logs -> Negocio -> readonly operacional -> Adecuada`
- `merchant_staff -> Compartida -> raiz -> Parcial`
- `merchant_staff_branches -> Negocio -> integrada -> Adecuada`

## Clientes y soporte

- `customers -> Compartida -> raiz -> Parcial`
- `customer_addresses -> Negocio -> integrada -> Adecuada`
- `customer_payment_methods -> Compartida -> integrada -> Parcial`
- `carts -> Negocio -> readonly operacional -> Adecuada`
- `cart_items -> Negocio -> readonly operacional -> Adecuada`
- `cart_item_modifiers -> Negocio -> readonly operacional -> Adecuada`

## Catalogo

- `categories -> Negocio -> raiz -> Adecuada`
- `products -> Negocio -> raiz -> Adecuada`
- `product_branch_settings -> Sucursal -> integrada -> Adecuada`
- `modifier_groups -> Negocio -> integrada -> Adecuada`
- `modifier_options -> Negocio -> integrada -> Adecuada`
- `product_modifier_groups -> Negocio -> integrada -> Adecuada`

## Pedidos y postventa

- `orders -> Compartida -> raiz -> Parcial`
- `order_items -> Negocio -> readonly operacional -> Adecuada`
- `order_item_modifiers -> Negocio -> readonly operacional -> Adecuada`
- `order_delivery_details -> Negocio -> integrada -> Adecuada`
- `order_status_history -> Negocio -> readonly operacional -> Adecuada`
- `order_assignments -> Compartida -> integrada -> Parcial`
- `order_cancellations -> Negocio -> integrada -> Adecuada`
- `order_incidents -> Negocio -> integrada -> Adecuada`
- `order_evidences -> Negocio -> integrada -> Adecuada`

## Pagos y caja

- `payment_methods -> Plataforma -> raiz -> Parcial`
- `payments -> Compartida -> raiz -> Parcial`
- `payment_transactions -> Compartida -> integrada -> Parcial`
- `refunds -> Compartida -> integrada -> Parcial`
- `cash_collections -> Compartida -> integrada -> Parcial`

## Reparto

- `drivers -> Plataforma -> raiz -> Parcial`
- `driver_documents -> Plataforma -> integrada -> Parcial`
- `vehicles -> Plataforma -> integrada -> Parcial`
- `vehicle_types -> Plataforma -> readonly operacional -> Parcial`
- `driver_shifts -> Plataforma -> integrada -> Parcial`
- `driver_current_state -> Plataforma -> integrada -> Parcial`
- `driver_locations -> Plataforma -> readonly operacional -> Parcial`

## Liquidaciones y comisiones

- `commission_rules -> Compartida -> raiz -> Parcial`
- `merchant_settlements -> Compartida -> raiz -> Parcial`
- `merchant_settlement_items -> Compartida -> readonly operacional -> Parcial`
- `driver_settlements -> Plataforma -> raiz -> Parcial`
- `driver_settlement_items -> Plataforma -> readonly operacional -> Parcial`

## Promociones

- `promotions -> Negocio -> raiz -> Adecuada`
- `promotion_targets -> Negocio -> integrada -> Adecuada`
- `coupons -> Negocio -> integrada -> Adecuada`
- `coupon_redemptions -> Negocio -> readonly operacional -> Adecuada`

## Mensajes y alertas

- `conversations -> Compartida -> raiz -> Adecuada`
- `conversation_participants -> Compartida -> readonly operacional -> Adecuada`
- `messages -> Compartida -> readonly operacional -> Adecuada`
- `message_reads -> Compartida -> readonly operacional -> Adecuada`
- `notifications -> Compartida -> raiz -> Adecuada`

## Lectura final de la matriz

### Ya bien encaminadas

Bloques `Adecuada`:

- sucursales
- catalogo
- promociones
- mensajes
- gran parte del detalle de pedido

### Aun parciales

Bloques `Parcial`:

- identidad y gobierno
- capa plataforma
- clientes globales
- pagos
- reparto
- liquidaciones

### Ninguna tabla queda sin clasificar

Resultado de fase 0:

- `64/64` tablas ya tienen capa dueña
- `64/64` tablas ya tienen exposicion objetivo
- `64/64` tablas ya tienen estado actual

## Checklist de salida de fase 0

- `Auditoria de jerarquia`: `Completa`
- `Inventario de vistas`: `Completo`
- `Asignacion 64/64 a capa y exposicion`: `Completa`
- `Regla raiz / integrada / readonly`: `Completa`
- `Congelamiento funcional`: `Definido`

## Que queda habilitado a partir de ahora

Ya se puede seguir desarrollando, pero solo si cada tarea nueva responde estas `5` preguntas:

1. `que perfil la usa`
2. `en que capa vive`
3. `cual es su tabla raiz`
4. `que tablas hijas integra`
5. `cual de las 64 queda visible o usable gracias a esa vista`

Si una tarea no responde esas `5`, no pasa de fase 0.
