# Plan 3 - App repartidor

## Objetivo

Construir la app operativa del repartidor para aceptar pedidos, moverse en linea, registrar evidencia y cerrar entregas con trazabilidad.

El repartidor debe poder:

- completar alta y validacion
- administrar vehiculo y documentos
- iniciar turno y ponerse online
- aceptar o rechazar pedidos
- navegar el flujo de recojo y entrega
- registrar evidencia, incidencias y cobros en efectivo
- revisar ganancias y liquidaciones

## Tablas del plan

### Identidad y validacion

- `profiles`
- `drivers`
- `driver_documents`
- `roles`
- `user_roles`

### Vehiculos y disponibilidad

- `vehicles`
- `vehicle_types`
- `driver_shifts`
- `driver_current_state`
- `driver_locations`

### Operacion de reparto

- `orders`
- `order_assignments`
- `order_delivery_details`
- `order_status_history`
- `order_evidences`
- `order_incidents`
- `cash_collections`
- `delivery_zones`
- `branch_delivery_zones`

### Mensajeria y alertas

- `conversations`
- `conversation_participants`
- `messages`
- `message_reads`
- `notifications`

### Ganancias y cierre

- `commission_rules`
- `driver_settlements`
- `driver_settlement_items`
- `payments`

## CRUD y acciones por modulo

### 1. Perfil del repartidor

- `profiles`
  - editar datos base
- `drivers`
  - alta operativa
  - editar documento, licencia, estado y verificacion
- `driver_documents`
  - cargar documento
  - editar metadata
  - reenviar si fue observado

### 2. Vehiculo y turno

- `vehicles`
  - crear vehiculo
  - editar placa, marca, modelo, color
  - activar o desactivar
- `vehicle_types`
  - solo lectura
- `driver_shifts`
  - iniciar turno
  - cerrar turno
  - ver historial
- `driver_current_state`
  - cambiar online y offline
  - cambiar estado operativo

### 3. Flujo de pedido asignado

- `order_assignments`
  - aceptar pedido
  - rechazar pedido
  - marcar recogido
  - marcar completado
- `orders`
  - lectura del pedido asignado
- `order_delivery_details`
  - lectura de direccion y contacto
- `order_status_history`
  - registrar hitos del reparto

### 4. Evidencia y seguridad operativa

- `order_evidences`
  - subir foto o archivo de entrega
  - agregar nota
- `order_incidents`
  - registrar incidente
  - actualizar estado de resolucion
- `driver_locations`
  - insercion periodica de ubicacion
- `cash_collections`
  - registrar cobro en efectivo
  - marcar conciliado

### 5. Comunicacion y alertas

- `conversations`
  - lectura o creacion segun pedido
- `messages`
  - enviar mensajes
- `message_reads`
  - marcar leidos
- `notifications`
  - alertas de nuevo pedido, cambio de ruta, incidencia o cierre

### 6. Ganancias

- `driver_settlements`
  - lectura de liquidaciones
- `driver_settlement_items`
  - detalle por pedido
- `commission_rules`
  - solo lectura para explicar calculo

## Pantallas recomendadas

- `auth/login`
- `driver-onboarding`
- `documents`
- `vehicle`
- `shift`
- `home-online`
- `assignment-offer`
- `active-delivery`
- `delivery-proof`
- `incident-report`
- `earnings`
- `settlements`
- `notifications`
- `chat`
- `profile`

## Fases ejecutables

### Fase 1 - Alta y validacion

- [ ] login y bootstrap de `profiles`
- [ ] alta de `drivers`
- [ ] CRUD de `driver_documents`
- [ ] pantalla de estado de verificacion

### Fase 2 - Vehiculo y turno

- [ ] CRUD de `vehicles`
- [ ] selector de `vehicle_types`
- [ ] inicio y cierre de `driver_shifts`
- [ ] cambio de online y offline en `driver_current_state`

### Fase 3 - Cola de asignaciones

- [ ] bandeja de pedidos disponibles
- [ ] aceptar o rechazar desde `order_assignments`
- [ ] reglas para evitar doble asignacion
- [ ] notificaciones push o en tiempo real

### Fase 4 - Reparto activo

- [ ] vista de pedido asignado
- [ ] tracking de ubicacion con `driver_locations`
- [ ] cambios de estado pickup, on route, delivered
- [ ] integracion de evidencia de entrega

### Fase 5 - Incidencias y efectivo

- [ ] reporte de incidentes
- [ ] registro de cobro en efectivo
- [ ] conciliacion basica con portal

### Fase 6 - Ganancias y cierre

- [ ] resumen diario
- [ ] liquidaciones por periodo
- [ ] detalle de cada item liquidado
- [ ] vista de reglas de comision

## Reglas de negocio sugeridas

- no mostrar pedidos si el driver no esta verificado
- no asignar pedidos fuera de zona activa
- no permitir marcar entregado sin evidencia cuando el pedido lo requiera
- registrar ubicacion solo durante turno o pedido activo
- diferenciar rechazo, no respuesta y abandono de pedido en `order_assignments`
- conciliar cobros en efectivo antes de cerrar liquidaciones

## Criterio de cierre

El plan se considera listo cuando:

- el repartidor puede validarse y activar su vehiculo
- puede iniciar turno y ponerse online
- puede aceptar pedidos y completar una entrega real
- puede subir evidencia y reportar incidentes
- puede revisar ganancias y liquidaciones

## Dependencias con otros planes

- depende del portal para configuracion de zonas, comisiones y operacion
- depende de la app cliente para generar `orders`
- retroalimenta al portal con estados, evidencias, cobros e incidencias
