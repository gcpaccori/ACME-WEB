# Carga de menus por lote

Este flujo sirve para cargar contenido real de varios negocios sin hacerlo producto por producto desde la UI.

## Alcance actual

El importador carga:

- `categories`
- `products`
- `product_branch_settings`

Por ahora el foco es subir menus reales con categorias, nombres y precios. Los modificadores (`extras`, `salsas`, `adiciones`) se pueden cargar despues en una segunda pasada si los PDFs los traen claros.

## Estructura esperada

Los archivos viven en `data/menu-import/` y cada archivo representa un negocio.

Ejemplo base:

```json
{
  "merchant": {
    "trade_name": "Polleria Wanka Express"
  },
  "defaults": {
    "apply_to_all_branches": true,
    "is_available": true,
    "is_paused": false
  },
  "categories": [
    {
      "name": "Combos",
      "products": [
        {
          "name": "1/4 Pollo + Papas",
          "base_price": 22.9,
          "description": "Porcion clasica",
          "sku": "PWE-001"
        }
      ]
    }
  ]
}
```

## Ejecucion

Validar sin escribir en la base:

```bash
npm run menus:dry-run
```

Importar un archivo puntual:

```bash
node scripts/import-business-menus.mjs --file data/menu-import/mi-negocio.json
```

Validar un archivo puntual:

```bash
node scripts/import-business-menus.mjs --dry-run --file data/menu-import/mi-negocio.json
```

Importar todos los archivos del directorio:

```bash
npm run menus:import
```

## Flujo recomendado con PDFs

1. Juntar todos los PDFs por negocio.
   Puedes dejarlos en `data/menu-pdfs/`.
2. Convertir cada carta a un archivo `JSON` siguiendo la plantilla del ejemplo.
3. Correr `--dry-run`.
4. Revisar el resumen de categorias, productos y settings.
5. Ejecutar la importacion real.
6. Verificar en marketplace y panel admin.

## Notas practicas

- El negocio se resuelve por `id` o por `trade_name`.
- Las categorias se buscan por nombre dentro del negocio.
- Los productos se buscan primero por `sku` y luego por `categoria + nombre`.
- Si un producto no trae `branch_settings`, el script puede aplicarlo a todas las sucursales del negocio usando `defaults`.
- El script no elimina datos existentes; solo crea o actualiza.
