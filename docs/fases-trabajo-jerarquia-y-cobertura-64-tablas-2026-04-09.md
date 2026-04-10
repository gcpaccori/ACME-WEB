# Fases de trabajo por jerarquia y cobertura de 64 tablas

## Fecha

- `9 de abril de 2026`

## Objetivo

Dividir el trabajo del admin en fases claras y dejar una regla no negociable:

- las `64` tablas de la base deben poder `verse` o `usarse` dentro de las vistas del admin
- eso no significa `64 CRUDs raiz`
- si significa `64 tablas expuestas` en la experiencia correcta

## Regla obligatoria de cobertura

Al terminar el admin:

1. ninguna de las `64` tablas puede quedar solo “en base”
2. toda tabla debe vivir en una vista util
3. toda tabla debe pertenecer a una capa clara:
   - `Plataforma`
   - `Negocio`
   - `Sucursal`
4. toda tabla debe tener una exposicion visual clara:
   - `vista raiz`
   - `tab`
   - `subtabla inline`
   - `modal`
   - `drawer`
   - `timeline`
   - `panel readonly`

## Regla de conteo

Las `64` tablas deben quedar repartidas asi:

### 1. Tablas con vista raiz o centro principal

Total esperado: `18`

- `merchants`
- `merchant_branches`
- `merchant_staff`
- `customers`
- `categories`
- `products`
- `orders`
- `drivers`
- `payment_methods`
- `payments`
- `promotions`
- `commission_rules`
- `merchant_settlements`
- `driver_settlements`
- `conversations`
- `notifications`
- `roles`
- `system_settings`

### 2. Tablas que deben verse o editarse integradas dentro de una ficha

Total esperado: `29`

- `profiles`
- `user_roles`
- `merchant_staff_branches`
- `addresses`
- `merchant_branch_status`
- `merchant_branch_hours`
- `merchant_branch_closures`
- `delivery_zones`
- `branch_delivery_zones`
- `product_branch_settings`
- `modifier_groups`
- `modifier_options`
- `product_modifier_groups`
- `customer_addresses`
- `customer_payment_methods`
- `order_delivery_details`
- `order_assignments`
- `order_cancellations`
- `order_incidents`
- `order_evidences`
- `payment_transactions`
- `refunds`
- `promotion_targets`
- `coupons`
- `cash_collections`
- `vehicles`
- `driver_documents`
- `driver_current_state`
- `driver_shifts`

### 3. Tablas que deben verse como detalle operacional o historico

Total esperado: `17`

- `carts`
- `cart_items`
- `cart_item_modifiers`
- `order_items`
- `order_item_modifiers`
- `order_status_history`
- `driver_locations`
- `vehicle_types`
- `coupon_redemptions`
- `merchant_settlement_items`
- `driver_settlement_items`
- `conversation_participants`
- `messages`
- `message_reads`
- `merchant_audit_logs`
- `analytics_events`
- `audit_logs`

## Resultado correcto

`18 + 29 + 17 = 64`

Ese es el criterio de producto.

No aceptamos como terminado un admin donde:

- una tabla exista en codigo pero no se vea
- una tabla exista en el registry pero sin vista util
- una tabla solo tenga CRUD tecnico y no experiencia de negocio

## Jerarquia final de usuarios

## Nivel 1. Plataforma

Perfiles:

- `super_admin`
- `admin`

Debe ver modulos de:

1. `Resumen plataforma`
2. `Comercios`
3. `Reparto`
4. `Pagos`
5. `Seguridad`
6. `Auditoria`
7. `Sistema`

Objetivo de esta capa:

- gobernar la plataforma completa
- ver todos los negocios
- ver toda la flota
- ver pagos y refunds
- manejar seguridad y configuracion global

## Nivel 2. Negocio

Perfiles:

- `owner`
- `manager`

Debe ver modulos de:

1. `Resumen negocio`
2. `Comercio`
3. `Sucursales`
4. `Personal`
5. `Clientes`
6. `Catalogo`
7. `Pedidos`
8. `Pagos y caja`
9. `Promociones`
10. `Liquidaciones`
11. `Mensajes`

Objetivo de esta capa:

- gobernar un comercio completo
- trabajar multi-sucursal
- ver el negocio como unidad

## Nivel 3. Sucursal

Perfiles:

- `cashier`
- `operator`
- `kitchen`
- `support`

Debe ver modulos de:

1. `Resumen sucursal`
2. `Turno`
3. `Pedidos`
4. `Estado del local`
5. `Menu operativo`
6. `Mensajes`

Objetivo de esta capa:

- operar el local
- no gobernar el negocio completo
- no tocar plataforma

## Fases de trabajo bien divididas

## Fase 0. Auditoria base y congelamiento

Estado actual:

- `Ejecutada`

Documento de cierre:

- `docs/fase-0-cierre-auditoria-y-congelamiento-2026-04-09.md`

Objetivo:

- congelar la expansion desordenada
- dejar una sola fuente de verdad

Entregables:

- auditoria de jerarquia
- inventario de vistas
- asignacion de las `64` tablas a una capa y exposicion visual

Regla de salida:

- cada tabla ya sabe si sera `raiz`, `integrada` o `readonly operacional`

## Fase 1. Sesion, alcance y cambio de capa

Estado actual:

- `Ejecutada`

Objetivo:

- que el usuario no entre a un admin plano

Entregables:

- `PortalContext` con scopes
- cambio de capa
- cambio de sucursal
- guard de acceso real

Tablas impactadas directamente:

- `profiles`
- `roles`
- `user_roles`
- `merchant_staff`
- `merchant_staff_branches`
- `merchants`
- `merchant_branches`

Cobertura acumulada:

- `7 / 64`

Estado esperado:

- `Plataforma`, `Negocio` y `Sucursal` existen de verdad

## Fase 2. Shell y jerarquia visual

Estado actual:

- `Ejecutada`

Objetivo:

- que el usuario entienda donde esta y que gobierna

Entregables:

- sidebar por capa
- menu filtrado
- dashboard por capa
- header con actor, comercio y sucursal

Tablas impactadas directamente:

- no agrega nuevas tablas de negocio
- usa las de `Fase 1` para construir experiencia

Cobertura acumulada:

- sigue en `7 / 64` directas
- pero ya prepara la visibilidad correcta de las `64`

## Fase 3. Plataforma

Estado actual:

- `Ejecutada`

Objetivo:

- construir el admin general real

Vistas que deben quedar:

1. `Resumen plataforma`
2. `Comercios`
3. `Detalle de comercio`
4. `Reparto`
5. `Pagos`
6. `Seguridad`
7. `Sistema`

Tablas que debe cubrir esta fase:

- `merchants`
- `merchant_branches`
- `merchant_branch_status`
- `merchant_branch_hours`
- `merchant_branch_closures`
- `merchant_staff`
- `merchant_staff_branches`
- `profiles`
- `roles`
- `user_roles`
- `drivers`
- `driver_documents`
- `driver_current_state`
- `driver_locations`
- `driver_shifts`
- `vehicles`
- `vehicle_types`
- `payment_methods`
- `payments`
- `payment_transactions`
- `refunds`
- `system_settings`
- `audit_logs`
- `analytics_events`
- `merchant_audit_logs`

Cobertura acumulada esperada al cierre:

- `25 / 64`

Nota:

- varias tablas quedan visibles desde plataforma aunque algunas tambien se usen en negocio

## Fase 4. Negocio base

Estado actual:

- `Ejecutada`

Objetivo:

- cerrar el owner del negocio como consola real

Vistas que deben quedar:

1. `Resumen negocio`
2. `Comercio`
3. `Sucursales`
4. `Detalle de sucursal`
5. `Personal`
6. `Clientes`
7. `Catalogo`

Tablas que debe cubrir esta fase:

- `addresses`
- `merchant_branch_status`
- `merchant_branch_hours`
- `merchant_branch_closures`
- `delivery_zones`
- `branch_delivery_zones`
- `customers`
- `customer_addresses`
- `customer_payment_methods`
- `carts`
- `cart_items`
- `cart_item_modifiers`
- `categories`
- `products`
- `product_branch_settings`
- `modifier_groups`
- `modifier_options`
- `product_modifier_groups`

Cobertura acumulada esperada al cierre:

- `43 / 64`

## Fase 5. Operacion de sucursal

Estado actual:

- `Ejecutada`

Objetivo:

- cerrar el modo operativo del local

Vistas que deben quedar:

1. `Resumen sucursal`
2. `Turno`
3. `Pedidos`
4. `Detalle de pedido`
5. `Estado del local`
6. `Menu operativo`
7. `Mensajes`

Tablas que debe cubrir esta fase:

- `orders`
- `order_items`
- `order_item_modifiers`
- `order_delivery_details`
- `order_status_history`
- `order_assignments`
- `order_cancellations`
- `order_incidents`
- `order_evidences`
- `conversations`
- `conversation_participants`
- `messages`
- `message_reads`
- `notifications`

Cobertura acumulada esperada al cierre:

- `57 / 64`

## Fase 6. Finanzas y caja

Estado actual:

- `Ejecutada`

Objetivo:

- cerrar el hueco economico

Vistas que deben quedar:

1. `Pagos`
2. `Refunds`
3. `Caja`
4. `Liquidaciones comercio`
5. `Liquidaciones reparto`

Tablas que debe cerrar esta fase:

- `cash_collections`
- `commission_rules`
- `merchant_settlements`
- `merchant_settlement_items`
- `driver_settlements`
- `driver_settlement_items`

Cobertura acumulada esperada al cierre:

- `63 / 64`

## Fase 7. Promociones y crecimiento

Estado actual:

- `Ejecutada`

Objetivo:

- cerrar la capa comercial

Vistas que deben quedar:

1. `Promociones`
2. `Detalle de promocion`
3. `Cupones`
4. `Uso real`

Tablas que debe cerrar esta fase:

- `promotions`
- `promotion_targets`
- `coupons`
- `coupon_redemptions`

Cobertura acumulada esperada al cierre:

- sigue en `63 / 64` si ya estaban visibles antes
- o sube a `64 / 64` si aun faltaba una exposicion real de cupones

## Fase 8. Seguridad y hardening final

Estado actual:

- `Ejecutada`

Objetivo:

- terminar la jerarquia por perfil
- evitar lecturas globales donde no tocan

Entregables:

- permisos por perfil
- `Seguridad` como modulo propio
- `roles` y `user_roles` fuera de `Personal`
- filtros fuertes en `drivers`, `orders`, `settlements`
- apagado o migracion de rutas legacy

Tablas revalidadas:

- `roles`
- `user_roles`
- `drivers`
- `driver_settlements`
- `orders`
- `system_settings`

Resultado aplicado:

- permisos por perfil en `Plataforma`, `Negocio` y `Sucursal`
- `Personal` deja de administrar seguridad visible
- `Seguridad` queda como modulo propio de plataforma
- el directorio de drivers en `Pedidos` ya no lee la flota global desde negocio
- `Liquidaciones` ya no expone repartidores ni cierres de reparto fuera del comercio activo

Regla de salida:

- ninguna tabla global editable desde negocio si no corresponde

## Fase 9. Migracion de settings

Estado actual:

- `Ejecutada en codigo`
- `SQL de migracion versionada`

Objetivo:

- separar configuracion global de configuracion del negocio

Entregables:

- crear `merchant_settings`
- migrar claves de negocio fuera de `system_settings`

Importante:

- `merchant_settings` no pertenece a las `64` tablas actuales
- es una tabla nueva para corregir arquitectura

Regla:

- esta fase no reemplaza la cobertura de `64 / 64`
- la mejora

Resultado aplicado:

- `merchant_settings` ya tiene servicio y vista util en `Comercio`
- `system_settings` deja de aceptar claves de negocio en la UI de plataforma
- `order_timeouts` deja de mostrarse como setting global y pasa a negocio
- la migracion SQL quedo versionada en `database/2026-04-10-phase-9-merchant-settings-migration.sql`

Nota operativa:

- si la base actual aun no tiene `merchant_settings`, la UI de negocio muestra el fallback heredado y bloquea edicion hasta aplicar la SQL

## Fase 10. Auditoria final 64 por 64

Estado actual:

- `Ejecutada`
- `No aprobada para cierre total`

Documento de auditoria:

- `docs/fase-10-auditoria-final-64x64-2026-04-10.md`

Objetivo:

- validar que las `64` tablas ya viven en vistas utiles

No se cierra el proyecto si falla alguna de estas reglas:

1. una tabla no tiene vista
2. una tabla esta en la capa equivocada
3. una tabla solo se usa en servicio pero no en UI
4. un perfil ve modulos que no le corresponden
5. una tabla global sigue editable desde negocio

Dictamen actual:

- `64 / 64` tablas originales ya viven en vistas utiles
- el cierre total sigue bloqueado por:
  - migracion real de `merchant_settings`
  - rutas legacy aun montadas

## Estado actual contra estas fases

## Ya bastante encaminado

- `Fase 1`
- `Fase 2`
- parte de `Fase 3`
- gran parte de `Fase 4`
- parte de `Fase 5`

## Pendiente o incompleto

- `Comercios` de plataforma
- `Pagos`
- `Seguridad`
- jerarquia por perfil operativo
- hardening final de lecturas globales
- migracion real de settings

## Regla final para seguir desarrollando

Desde este punto, toda tarea nueva debe responder:

1. `que perfil la usa`
2. `en que capa aparece`
3. `que tabla raiz toca`
4. `que tablas hijas integra`
5. `cual de las 64 queda visible gracias a esta vista`

Si no responde esas `5` preguntas, la tarea no entra a desarrollo.
