# Fase 10 - Auditoria final 64 por 64

## Fecha

- `10 de abril de 2026`

## Alcance auditado

- shell admin
- jerarquia por capa
- visibilidad por perfil
- registry de modulos y entidades
- rutas reales montadas
- tablas originales del esquema publico
- mejora arquitectonica adicional `merchant_settings`

## Metodo usado

La auditoria se corrio sobre el codigo real y no sobre el plan.

Se validaron estas fuentes:

- `src/core/admin/registry/moduleRegistry.ts`
- `src/app/router/index.tsx`
- `src/core/auth/portalAccess.ts`
- `src/app/layouts/PortalLayout.tsx`
- `src/core/services/adminSystemService.ts`
- `src/core/services/adminMerchantSettingsService.ts`
- `src/modules/portal/admin/commerce/CommercePage.tsx`

## Conteo final

- tablas originales del esquema: `64`
- tabla correctiva nueva: `merchant_settings`
- tablas expuestas en el registry actual: `65`
- cobertura de tablas originales visibles en la experiencia admin: `64 / 64`

Conclusión de cobertura:

- las `64` tablas originales ya tienen exposicion util en la app
- el registry ya refleja `64 / 64`
- la arquitectura nueva agrega `merchant_settings` como correccion fuera del conteo original

## Regla 1. Una tabla no tiene vista

Resultado:

- `PASA`

Verificacion:

- el registry expone `65` tablas unicas
- quitando `merchant_settings`, quedan exactamente `64`
- eso cubre la totalidad del esquema original

Resumen por tipo de exposicion:

- tablas raiz: resueltas por modulos como `Comercios`, `Sucursales`, `Clientes`, `Pedidos`, `Reparto`, `Pagos`, `Promociones`, `Liquidaciones`, `Mensajes`, `Seguridad`, `Sistema`
- tablas integradas: tabs, drawers, subtablas y formularios relacionales
- tablas operacionales readonly: timelines, paneles de tracking, historiales e items

## Regla 2. Una tabla esta en la capa equivocada

Resultado:

- `NO PASA`

Bloqueador principal:

- `system_settings` ya se comporta como plataforma en UI, pero la base actual todavia conserva la clave `order_timeouts`, que ya fue clasificada como setting de negocio

Estado real:

- en codigo, `order_timeouts` ya no se muestra como setting global
- en negocio, se expone por fallback como si viniera de `merchant_settings`
- pero la SQL de migracion todavia no se aplico en la base remota

Impacto:

- la capa visual esta corregida
- la capa fisica de datos aun no esta totalmente corregida

Dictamen:

- la regla de capa correcta todavia no puede considerarse cerrada al `100%`

## Regla 3. Una tabla solo se usa en servicio pero no en UI

Resultado:

- `PASA`

Verificacion:

- las tablas del esquema original aparecen en fichas, listas, tabs, timelines, drawers o paneles readonly
- no se detecto ninguna tabla original que hoy viva solo en servicio y siga invisible en la experiencia admin

Nota:

- `merchant_settings` no entra en esta regla porque no pertenece al conteo original de `64`; aun asi ya tiene vista en `Comercio`

## Regla 4. Un perfil ve modulos que no le corresponden

Resultado:

- `NO PASA`

Bloqueador principal:

- el shell nuevo filtra bien los modulos por permiso
- pero las rutas legacy siguen montadas fuera del arbol `admin/*`

Rutas legacy aun presentes:

- `/portal/dashboard`
- `/portal/orders`
- `/portal/orders/:id`
- `/portal/menu`
- `/portal/categories`
- `/portal/products`
- `/portal/branch-status`
- `/portal/hours`
- `/portal/staff`

Problema:

- no forman parte del modelo jerarquico nuevo
- no pasan por el filtro de modulos del shell admin
- pueden seguir entrando por URL directa mientras el usuario tenga sesion administrativa valida

Impacto:

- la separacion por perfil ya existe en el shell
- pero todavia no es un cierre total del sistema

## Regla 5. Una tabla global sigue editable desde negocio

Resultado:

- `PASA`, con una salvedad operativa

Lo que ya quedo bien:

- `system_settings` no es editable desde negocio
- `roles` y `user_roles` quedaron en `Seguridad` de plataforma
- `payment_methods` solo se edita en `Pagos` de plataforma
- `drivers` globales ya no se exponen libremente en negocio

Salvedad:

- sigue pendiente aplicar la migracion fisica para que `order_timeouts` salga de la tabla global
- eso afecta la pureza de capa de la data, no la posibilidad de edicion desde negocio

## Dictamen final de la Fase 10

Resultado global:

- `Ejecutada`
- `No aprobada para cierre total`

Estado de salida:

- cobertura UI de tablas originales: `APROBADA`
- jerarquia final por perfil: `PARCIAL`
- gobierno final de settings: `PARCIAL`
- cierre formal del proyecto: `NO APROBADO`

## Lo que si esta cerrado

- `64 / 64` tablas originales ya tienen vista util
- el admin ya no depende de CRUDs ciegos por tabla
- plataforma, negocio y sucursal ya existen como capas reales
- seguridad ya no vive mezclada dentro de `Personal`
- negocio ya no puede editar tablas globales sensibles desde el flujo normal

## Lo que bloquea el cierre del proyecto

### 1. Aplicar la migracion real de `merchant_settings`

Pendiente:

- ejecutar `database/2026-04-10-phase-9-merchant-settings-migration.sql`

Objetivo:

- crear `merchant_settings`
- copiar `order_timeouts` por comercio
- eliminar `order_timeouts` de `system_settings`

### 2. Apagar o redirigir las rutas legacy

Pendiente:

- desmontar o redirigir las rutas legacy del portal antiguo

Objetivo:

- que ningun perfil pueda saltarse la jerarquia nueva por URL directa

## Decision recomendada

No declarar el admin como `cerrado`.

Si declarar esto:

- `la cobertura 64 por 64 ya esta lograda en UI`
- `la arquitectura final esta casi cerrada`
- `faltan 2 tareas de hardening para el cierre formal`

## Siguiente paso correcto

1. aplicar la migracion SQL de `merchant_settings` en la base real
2. apagar o redirigir todas las rutas legacy
3. rerun de esta auditoria

Con esas `2` correcciones, la Fase 10 si deberia quedar lista para aprobacion final.
