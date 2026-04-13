Scripts utilitarios del proyecto.

- `seed-empty-admin-tables.mjs`: llena las tablas vacias del admin con un escenario demo coherente para desarrollo.
- `import-business-menus.mjs`: importa menus reales por lotes desde archivos `JSON` hacia `categories`, `products` y `product_branch_settings`. Soporta `--dry-run`, `--file` y `--dir`.
  - `npm run menus:import`: importa todos los archivos de `data/menu-import/`.
  - `npm run menus:dry-run`: valida en modo seco.
  - `node scripts/import-business-menus.mjs --dry-run --file data/menu-import/mi-negocio.json`: valida un archivo puntual.
