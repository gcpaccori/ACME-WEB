# Plan de Intervencion - Admin de plataforma, admin de negocio y operacion de sucursal

## Fecha

- `9 de abril de 2026`

## Objetivo

Corregir el admin para que deje de ser una sola consola plana y pase a operar como un sistema real de delivery con `3 capas`:

1. `Admin de plataforma`
2. `Admin de negocio`
3. `Operacion de sucursal`

Y hacerlo sin perder el trabajo ya hecho de:

- `CRUD relacional`
- `fichas compuestas`
- `framework reusable`
- `cobertura de tablas`

La meta no es rehacer todo.

La meta es:

- reordenar
- blindar scope
- hacer visible la capa correcta
- usar todas las tablas en la capa correcta

## Diagnostico base

Hoy el problema principal **no** es que falten tablas.

El problema principal es este:

- la app actual mezcla `plataforma`, `negocio` y `sucursal` dentro del mismo shell
- varias tablas globales se estan administrando desde contexto de negocio
- no existe una vista real para el `admin general`
- no existe selector de alcance fuerte
- no existe una capa financiera visible

## Decisiones de arquitectura

## 1. Capas definitivas

### Capa A - Admin de plataforma

Actor:

- `super_admin`
- `admin`

Responsabilidad:

- administrar la plataforma completa
- crear y supervisar negocios
- ver todos los comercios
- ver repartidores globales
- gobernar pagos, auditoria, analytics y configuracion global

### Capa B - Admin de negocio

Actor:

- `owner`
- `manager`

Responsabilidad:

- administrar un comercio
- administrar varias sucursales del mismo comercio
- administrar personal, catalogo, clientes, pedidos, promos y liquidaciones propias

### Capa C - Operacion de sucursal

Actor:

- `cashier`
- `operator`
- `kitchen`
- `support`

Responsabilidad:

- operar pedidos de una sucursal
- ver estado del local
- usar menu operativo
- atender incidencias y mensajes

## 2. Regla de oro

Toda tabla debe responder 3 preguntas:

1. `quien la gobierna`
2. `quien la usa`
3. `en que contexto visual aparece`

Si no responde bien esas 3, la tabla esta mal usada aunque ya tenga CRUD.

## 3. Regla de acceso

No se debe seguir usando esta logica:

- `si tiene merchant_staff entra`

Se debe pasar a esta:

- `si tiene user_roles admin/super_admin -> puede entrar a plataforma`
- `si tiene merchant_staff -> puede entrar a negocio`
- `si tiene merchant_staff + branches -> puede entrar a sucursal`
- `si tiene ambas capas -> puede cambiar de capa`

## 4. Regla de shell

El shell nuevo debe mostrar siempre:

- `capa actual`
- `alcance actual`
- `entidad actual`

Ejemplo:

- `Plataforma / Comercios / Polleria Wanka Express`
- `Negocio / Polleria Wanka Express / Todas las sucursales`
- `Sucursal / Huancayo Centro / Operacion del turno`

## Intervencion sobre base de datos

## Cambios obligatorios

### 1. Mantener `system_settings` como tabla solo de plataforma

Decision:

- `system_settings` deja de ser editable desde admin de negocio

Uso correcto:

- solo `admin general`

### 2. Crear `merchant_settings`

Motivo:

- hoy faltan settings propios del negocio
- no deben seguir metiendose en `system_settings`

Propuesta:

```sql
create table public.merchant_settings (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  key text not null,
  description text null,
  value_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (merchant_id, key)
);
```

### 3. Crear `branch_settings` solo si el negocio lo necesita

No es obligatorio en esta primera correccion.

Solo aplica si terminamos guardando por sucursal cosas como:

- impuestos locales
- tiempos por defecto
- reglas operativas
- limites de radios

### 4. No crear `platform_admins`

No hace falta una tabla nueva.

Debe resolverse con las tablas existentes:

- `roles`
- `user_roles`
- `profiles.default_role`

### 5. No crear tablas nuevas para cambiar de sucursal

Esto debe resolverse en UI y contexto de sesion, no en DB.

## Cambios condicionales

### 6. Evaluar `driver_merchants` solo si la flota sera propia de cada negocio

Si la logica real del producto es:

- la plataforma maneja una flota global

entonces **no** se crea esta tabla.

Si la logica real cambia a:

- cada negocio tiene repartidores propios

entonces si habra que introducir una relacion tipo:

- `driver_merchants`

Por ahora la recomendacion es:

- `no crearla`

## Cambios de seguridad recomendados

### 7. Global tables no deben seguir editandose solo desde cliente anon

Para la capa de plataforma, las mutaciones sensibles deben pasar por:

- `RPC`
- `Edge Functions`
- o un backend intermedio

Esto aplica sobre todo a:

- `system_settings`
- `roles`
- `user_roles`
- `payments`
- `refunds`
- `audit_logs`

## Plan de intervencion por fases

## Fase 0 - Congelamiento funcional

Objetivo:

- no seguir agregando modulos sin corregir capas

Acciones:

- congelar nuevas pages fuera del plan
- tomar este documento como backlog maestro
- auditar nuevamente despues de cada fase

## Fase 1 - Sesion, roles y capa actual

Objetivo:

- separar `plataforma`, `negocio` y `sucursal`

Cambios:

- extender `PortalContext`
- resolver `user_roles` al iniciar sesion
- crear `availableScopes`
- crear `currentScopeType`
- crear `currentMerchant`
- crear `currentBranch`
- permitir cambio de capa si el usuario tiene varias

Resultado esperado:

- el usuario ya no entra a un solo admin
- entra a una capa clara

## Fase 2 - Shell admin nuevo

Objetivo:

- cambiar el shell visual

Cambios:

- layout por capas
- selector de alcance
- menu filtrado por rol
- header con:
  - capa
  - comercio
  - sucursal
  - modo
- dashboard segun capa

Resultado esperado:

- el usuario entiende visualmente quien es y que gobierna

## Fase 3 - Plataforma

Objetivo:

- construir la capa del `admin general`

Modulos:

- `Resumen plataforma`
- `Comercios`
- `Drivers`
- `Pagos`
- `Seguridad`
- `Auditoria`
- `Configuracion`

Tablas prioridad:

- `merchants`
- `merchant_branches`
- `drivers`
- `driver_documents`
- `vehicles`
- `vehicle_types`
- `payments`
- `payment_transactions`
- `refunds`
- `roles`
- `user_roles`
- `system_settings`
- `audit_logs`
- `analytics_events`

## Fase 4 - Negocio

Objetivo:

- dejar limpio el admin del owner

Modulos:

- `Resumen negocio`
- `Sucursales`
- `Personal`
- `Clientes`
- `Catalogo`
- `Pedidos`
- `Pagos y caja`
- `Promociones`
- `Liquidaciones`
- `Mensajes`

Cambios:

- quitar de negocio lo que es solo plataforma
- dejar al owner sobre tablas de su comercio
- habilitar vista multi-sucursal

## Fase 5 - Sucursal

Objetivo:

- crear el modo operativo del local

Modulos:

- `Turno`
- `Pedidos`
- `Estado del local`
- `Menu operativo`
- `Mensajes`

Cambios:

- filtrar por `currentBranch`
- quitar modulos no operativos
- dejar tablero de cola y accion rapida

## Fase 6 - Finanzas y caja

Objetivo:

- cerrar el hueco financiero

Modulos:

- `Pagos`
- `Refunds`
- `Caja`
- `Liquidaciones`

Cambios:

- habilitar `payments` como modulo raiz
- dejar `payment_methods` visible como catalogo
- mover `cash_collections` a una vista compartida con reparto/finanzas

## Fase 7 - Seguridad y gobierno

Objetivo:

- sacar seguridad de dentro de `Personal`

Modulos:

- `Roles`
- `Permisos`
- `Configuracion global`
- `Auditoria`

Cambios:

- `roles` y `user_roles` dejan de vivir solo dentro de `Staff`
- `system_settings` deja de estar en negocio

## Fase 8 - Hardening de scope

Objetivo:

- eliminar lecturas globales peligrosas en negocio

Cambios:

- `drivers` del negocio deben venir filtrados por pedidos del negocio o quedar solo en plataforma
- `driver_settlements` del negocio deben venir filtrados por items/pedidos del negocio
- directorios operativos de pedido no deben traer toda la plataforma

## Fase 9 - Migracion de settings

Objetivo:

- separar configuracion global de configuracion del negocio

Cambios:

- crear `merchant_settings`
- mover claves de negocio desde `system_settings`
- dejar `system_settings` solo para plataforma

## Fase 10 - Auditoria final

Objetivo:

- validar que cada tabla ya vive en su capa correcta

Entregado solo si:

- cada tabla tiene capa dueña
- cada tabla tiene vista util
- no hay tablas globales editables desde negocio
- el admin general ya existe

## Matriz total de tablas

Escala usada:

- `Adecuada`: ya esta bien usada en la capa correcta o casi correcta
- `Parcial`: existe y aporta, pero esta incompleta o mal ubicada
- `Fatal`: hoy esta en la capa equivocada, con riesgo funcional o de gobierno

## Identidad, gobierno y configuracion

- `profiles` -> `Compartida`
  - Estado actual: `Parcial`
  - Motivo: sirve como identidad base, pero no existe gobierno claro por capa
  - Intervencion: resolverla desde sesion multicapa y centros de seguridad/plataforma

- `roles` -> `Plataforma`
  - Estado actual: `Fatal`
  - Motivo: vive escondida dentro de `Personal`
  - Intervencion: mover a `Seguridad` en plataforma

- `user_roles` -> `Plataforma`
  - Estado actual: `Fatal`
  - Motivo: gobierna acceso, pero hoy no es una consola propia
  - Intervencion: modulo raiz de permisos

- `system_settings` -> `Plataforma`
  - Estado actual: `Fatal`
  - Motivo: se edita desde contexto de negocio
  - Intervencion: dejarla solo para `admin general`

- `audit_logs` -> `Plataforma`
  - Estado actual: `Fatal`
  - Motivo: auditoria global no debe depender del comercio actual
  - Intervencion: mover a capa plataforma y dejar subset en negocio si se requiere

- `analytics_events` -> `Plataforma`
  - Estado actual: `Parcial`
  - Motivo: hoy se usa como lectura cruzada, pero no existe consola global
  - Intervencion: dashboard de plataforma + subset por negocio

## Comercios y estructura

- `merchants` -> `Compartida`
  - Estado actual: `Parcial`
  - Motivo: el negocio puede editar el suyo, pero el admin general no tiene modulo fuerte de todos los negocios
  - Intervencion: crear `Comercios` en plataforma y mantener `Ficha de comercio` en negocio

- `merchant_settings` -> `Negocio`
  - Estado actual: `Fatal`
  - Motivo: no existe y hoy parte de esa configuracion termina en `system_settings`
  - Intervencion: crear tabla nueva

- `merchant_branches` -> `Compartida`
  - Estado actual: `Parcial`
  - Motivo: negocio bien encaminado; plataforma sin vista global real
  - Intervencion: lista global en plataforma y gestion operativa en negocio

- `addresses` -> `Negocio`
  - Estado actual: `Adecuada`
  - Motivo: ya vive en cliente y sucursal como detalle contextual
  - Intervencion: mantener

- `merchant_branch_status` -> `Sucursal`
  - Estado actual: `Adecuada`
  - Motivo: bien ubicada en ficha de sucursal
  - Intervencion: sumar vista rapida en tablero de sucursal

- `merchant_branch_hours` -> `Sucursal`
  - Estado actual: `Adecuada`
  - Motivo: bien ubicada
  - Intervencion: mantener

- `merchant_branch_closures` -> `Sucursal`
  - Estado actual: `Adecuada`
  - Motivo: bien ubicada
  - Intervencion: mantener

- `delivery_zones` -> `Negocio`
  - Estado actual: `Adecuada`
  - Motivo: bien usada en cobertura
  - Intervencion: mantener

- `branch_delivery_zones` -> `Sucursal`
  - Estado actual: `Adecuada`
  - Motivo: bien usada en ficha de sucursal
  - Intervencion: mantener

- `merchant_audit_logs` -> `Negocio`
  - Estado actual: `Adecuada`
  - Motivo: es la auditoria propia del negocio
  - Intervencion: agregar tablero de cambios recientes

## Personal y accesos internos

- `merchant_staff` -> `Compartida`
  - Estado actual: `Parcial`
  - Motivo: el owner lo usa bien, pero plataforma no tiene centro de supervision de negocios y responsables
  - Intervencion: vista global de responsables en plataforma y gestion operativa en negocio

- `merchant_staff_branches` -> `Negocio`
  - Estado actual: `Adecuada`
  - Motivo: bien ubicada en asignaciones
  - Intervencion: mantener

## Clientes y soporte

- `customers` -> `Compartida`
  - Estado actual: `Parcial`
  - Motivo: negocio ya tiene ficha, pero plataforma no tiene soporte global de cliente
  - Intervencion: lista global de clientes para soporte general y ficha filtrada por negocio

- `customer_addresses` -> `Negocio`
  - Estado actual: `Adecuada`
  - Motivo: visible en ficha de cliente
  - Intervencion: mantener

- `customer_payment_methods` -> `Compartida`
  - Estado actual: `Parcial`
  - Motivo: hoy se pueden editar tokens y referencias demasiado libremente
  - Intervencion: pasar a modo `soporte/controlado`, no CRUD libre

- `carts` -> `Negocio`
  - Estado actual: `Adecuada`
  - Motivo: utiles como lectura de soporte
  - Intervencion: mantener como lectura

- `cart_items` -> `Negocio`
  - Estado actual: `Adecuada`
  - Motivo: bien usados como detalle de carrito
  - Intervencion: mantener

- `cart_item_modifiers` -> `Negocio`
  - Estado actual: `Adecuada`
  - Motivo: bien usados como detalle
  - Intervencion: mantener

## Catalogo

- `categories` -> `Negocio`
  - Estado actual: `Adecuada`
  - Motivo: ya tiene gestion clara
  - Intervencion: mantener

- `products` -> `Negocio`
  - Estado actual: `Adecuada`
  - Motivo: ficha compuesta correcta
  - Intervencion: mantener

- `product_branch_settings` -> `Sucursal`
  - Estado actual: `Adecuada`
  - Motivo: bien usada dentro de producto
  - Intervencion: sumar vista operativa por sucursal

- `modifier_groups` -> `Negocio`
  - Estado actual: `Adecuada`
  - Motivo: bien usado
  - Intervencion: mantener

- `modifier_options` -> `Negocio`
  - Estado actual: `Adecuada`
  - Motivo: bien usada
  - Intervencion: mantener

- `product_modifier_groups` -> `Negocio`
  - Estado actual: `Adecuada`
  - Motivo: bien usada dentro de producto
  - Intervencion: mantener

## Pedidos y postventa

- `orders` -> `Compartida`
  - Estado actual: `Parcial`
  - Motivo: la ficha es buena, pero la bandeja esta amarrada a una sola sucursal actual
  - Intervencion: cola por sucursal y cola consolidada por negocio/plataforma

- `order_items` -> `Negocio`
  - Estado actual: `Adecuada`
  - Motivo: visible en ficha de pedido
  - Intervencion: mantener

- `order_item_modifiers` -> `Negocio`
  - Estado actual: `Adecuada`
  - Motivo: visible como detalle de item
  - Intervencion: mantener

- `order_delivery_details` -> `Negocio`
  - Estado actual: `Adecuada`
  - Motivo: visible en ficha
  - Intervencion: mantener

- `order_status_history` -> `Negocio`
  - Estado actual: `Adecuada`
  - Motivo: timeline correcto
  - Intervencion: mantener

- `order_assignments` -> `Compartida`
  - Estado actual: `Parcial`
  - Motivo: funcional, pero usa directorios de reparto demasiado globales
  - Intervencion: assignment filtrado por alcance correcto

- `order_cancellations` -> `Negocio`
  - Estado actual: `Adecuada`
  - Motivo: accion controlada correcta
  - Intervencion: mantener

- `order_incidents` -> `Negocio`
  - Estado actual: `Adecuada`
  - Motivo: bien ubicadas
  - Intervencion: mantener

- `order_evidences` -> `Negocio`
  - Estado actual: `Adecuada`
  - Motivo: bien ubicadas
  - Intervencion: mejorar galeria, no estructura

## Pagos y caja

- `payment_methods` -> `Plataforma`
  - Estado actual: `Parcial`
  - Motivo: solo lookup, sin centro visible
  - Intervencion: modulo `Pagos y caja`, catalogo administrable por plataforma

- `payments` -> `Compartida`
  - Estado actual: `Parcial`
  - Motivo: visibles en pedido, pero sin modulo financiero raiz
  - Intervencion: activar modulo `Pagos`

- `payment_transactions` -> `Compartida`
  - Estado actual: `Parcial`
  - Motivo: como detalle estan bien, pero falta centro de monitoreo
  - Intervencion: drawer en pedido + lista global de fallos/casos

- `refunds` -> `Compartida`
  - Estado actual: `Parcial`
  - Motivo: existen en pedido, pero sin cola financiera
  - Intervencion: submodulo de refunds

- `cash_collections` -> `Compartida`
  - Estado actual: `Parcial`
  - Motivo: hoy viven solo dentro de reparto; falta capa de caja
  - Intervencion: moverlas tambien a `Pagos y caja`

## Reparto

- `drivers` -> `Plataforma`
  - Estado actual: `Fatal`
  - Motivo: estan gobernados como si fueran de negocio, pero operan globalmente
  - Intervencion: modulo principal de plataforma, lectura filtrada en negocio

- `driver_documents` -> `Plataforma`
  - Estado actual: `Fatal`
  - Motivo: onboarding global en capa equivocada
  - Intervencion: mover a reparto plataforma

- `vehicles` -> `Plataforma`
  - Estado actual: `Fatal`
  - Motivo: parte del gobierno del repartidor global
  - Intervencion: mover a plataforma

- `vehicle_types` -> `Plataforma`
  - Estado actual: `Parcial`
  - Motivo: solo lookup
  - Intervencion: catalogo en plataforma

- `driver_shifts` -> `Plataforma`
  - Estado actual: `Fatal`
  - Motivo: opera sobre flota global
  - Intervencion: tablero de turnos en plataforma

- `driver_current_state` -> `Plataforma`
  - Estado actual: `Fatal`
  - Motivo: estado en vivo global expuesto desde negocio
  - Intervencion: centro de tracking en plataforma y resumen filtrado en negocio

- `driver_locations` -> `Plataforma`
  - Estado actual: `Fatal`
  - Motivo: tracking global en capa equivocada
  - Intervencion: mapa global plataforma + lectura contextual por pedido

- `driver_settlements` -> `Plataforma`
  - Estado actual: `Fatal`
  - Motivo: liquidacion de repartidor sin frontera clara de negocio
  - Intervencion: liquidaciones de reparto en plataforma; negocio ve solo impacto en pedidos propios

- `driver_settlement_items` -> `Plataforma`
  - Estado actual: `Fatal`
  - Motivo: mismo problema de capa
  - Intervencion: detalle solo en plataforma

## Promociones

- `promotions` -> `Negocio`
  - Estado actual: `Adecuada`
  - Motivo: bien administrada por comercio
  - Intervencion: mantener

- `promotion_targets` -> `Negocio`
  - Estado actual: `Adecuada`
  - Motivo: bien integrada en ficha de promo
  - Intervencion: mantener

- `coupons` -> `Negocio`
  - Estado actual: `Adecuada`
  - Motivo: bien integrada
  - Intervencion: mantener

- `coupon_redemptions` -> `Negocio`
  - Estado actual: `Adecuada`
  - Motivo: visible como uso real
  - Intervencion: mantener

## Liquidaciones y comisiones

- `commission_rules` -> `Compartida`
  - Estado actual: `Parcial`
  - Motivo: utiles, pero mezclan alcance del negocio con drivers globales
  - Intervencion: dividir visualmente reglas de negocio y reglas de reparto/plataforma

- `merchant_settlements` -> `Compartida`
  - Estado actual: `Parcial`
  - Motivo: negocio las ve bien, plataforma no tiene vista financiera global
  - Intervencion: negocio conserva ficha, plataforma gana centro consolidado

- `merchant_settlement_items` -> `Compartida`
  - Estado actual: `Parcial`
  - Motivo: detalle correcto, pero falta oversight global
  - Intervencion: mantener en negocio y sumar vista global de settlement

## Mensajes y soporte

- `conversations` -> `Compartida`
  - Estado actual: `Adecuada`
  - Motivo: modulo util y relacional
  - Intervencion: sumar cola global en plataforma para soporte

- `conversation_participants` -> `Compartida`
  - Estado actual: `Adecuada`
  - Motivo: bien integrada
  - Intervencion: mantener

- `messages` -> `Compartida`
  - Estado actual: `Adecuada`
  - Motivo: bien integrada
  - Intervencion: mantener

- `message_reads` -> `Compartida`
  - Estado actual: `Adecuada`
  - Motivo: visible como detalle tecnico correcto
  - Intervencion: mantener

- `notifications` -> `Compartida`
  - Estado actual: `Adecuada`
  - Motivo: ya aparece en modulo de mensajes
  - Intervencion: sumar centro de alertas del shell

## Resumen de severidad

### Tablas `Fatal`

- `roles`
- `user_roles`
- `system_settings`
- `audit_logs`
- `drivers`
- `driver_documents`
- `vehicles`
- `driver_shifts`
- `driver_current_state`
- `driver_locations`
- `driver_settlements`
- `driver_settlement_items`
- `merchant_settings` `porque aun no existe`

### Tablas `Parcial`

- `profiles`
- `analytics_events`
- `merchants`
- `merchant_branches`
- `merchant_staff`
- `customers`
- `customer_payment_methods`
- `orders`
- `order_assignments`
- `payment_methods`
- `payments`
- `payment_transactions`
- `refunds`
- `cash_collections`
- `commission_rules`
- `merchant_settlements`
- `merchant_settlement_items`
- `vehicle_types`

### Tablas `Adecuada`

- `addresses`
- `branch_delivery_zones`
- `cart_item_modifiers`
- `cart_items`
- `carts`
- `categories`
- `conversation_participants`
- `conversations`
- `coupon_redemptions`
- `coupons`
- `customer_addresses`
- `delivery_zones`
- `merchant_audit_logs`
- `merchant_branch_closures`
- `merchant_branch_hours`
- `merchant_branch_status`
- `merchant_staff_branches`
- `message_reads`
- `messages`
- `modifier_groups`
- `modifier_options`
- `notifications`
- `order_cancellations`
- `order_delivery_details`
- `order_evidences`
- `order_incidents`
- `order_item_modifiers`
- `order_items`
- `order_status_history`
- `product_branch_settings`
- `product_modifier_groups`
- `products`
- `promotion_targets`
- `promotions`

## Resultado esperado al terminar el plan

Cuando este plan se complete, la app debe verse asi:

### Para el admin general

- entra a `Plataforma`
- ve todos los negocios
- puede entrar a un negocio
- ve pagos globales
- ve seguridad y configuracion
- ve reparto global

### Para el owner del negocio

- entra a `Negocio`
- ve su comercio
- puede alternar `Todas las sucursales` y `Sucursal X`
- ve pedidos, clientes, personal, promos, caja y liquidaciones propias

### Para el operador de sucursal

- entra a `Sucursal`
- ve solo el turno operativo del local
- no ve capas de gobierno ni sistema

## Orden recomendado de ejecucion real

1. `Fase 1` sesion y capas
2. `Fase 2` shell y selector de alcance
3. `Fase 3` plataforma
4. `Fase 6` pagos y caja
5. `Fase 7` seguridad y gobierno
6. `Fase 8` hardening de scope
7. `Fase 9` `merchant_settings`
8. `Fase 4` y `Fase 5` ajuste fino negocio/sucursal
9. auditoria final tabla por tabla

## Decision final que propone este plan

La app debe dejar de pensarse como:

- `un solo admin para todo`

Y debe pasar a pensarse como:

- `plataforma`
- `negocio`
- `sucursal`

Ese es el cambio que realmente destraba el negocio.
