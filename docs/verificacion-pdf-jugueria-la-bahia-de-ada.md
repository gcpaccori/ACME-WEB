# Verificacion de PDF - Jugueria La Bahia de Ada

## Archivo revisado

- `data/JUGUERIA LA BAHIA DE ADA 7.30 AM - 9.30 PM.pdf`

## Resultado

- El PDF tiene `4` paginas.
- La pagina `1` es portada.
- Las paginas `2`, `3` y `4` contienen la carta.
- El PDF no trae texto seleccionable; es una carta escaneada en imagen.
- El negocio todavia no existe en la tabla `merchants` al momento de esta revision.

## Recortes generados

Carpeta:

- `data/pdf-crops/jugueria-la-bahia-de-ada/`

Recortes principales:

- `page2-jugos.png`
- `page2-bebidas-calientes-cafes-infusiones.png`
- `page2-extractos-wide.png`
- `page3-panes.png`
- `page3-sandwich-wide.png`
- `page3-hamburguesas.png`
- `page3-postres.png`
- `page4-frappe.png`
- `page4-batidos.png`
- `page4-desayuno-ejecutivo.png`
- `page4-desayuno-americano.png`
- `page4-desayuno-continental.png`

## Verificacion manual

- Se pudieron transcribir `76` productos verificables.
- Se creo el archivo `data/menu-import/jugueria-la-bahia-de-ada.json` con el contenido estructurado.
- La seccion `Extractos` no se cargo al JSON porque el precio no aparece en el escaneo.
- `Ensalada de Fruta` muestra rango `S/ 6.00 - 10.00`; en el JSON se dejo `6.00` y se anoto la observacion.
- En `Sandwich` la linea `Queso, huevo, pollo` se trato como descripcion de `Sandwich Mixto`.

## Pendientes

- Confirmar los precios de `Extractos`.
- Confirmar si `Ensalada de Fruta` debe manejarse como dos presentaciones.
- Crear el comercio en `merchants` antes de importar este menu a la base.
