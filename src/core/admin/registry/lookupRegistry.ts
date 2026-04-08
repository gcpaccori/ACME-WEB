import { LookupSpec } from '../contracts';

export const adminLookups: LookupSpec[] = [
  {
    id: 'merchant-branches',
    label: 'Sucursales por comercio',
    sourceTable: 'merchant_branches',
    labelField: 'name',
    valueField: 'id',
    dependsOn: ['merchant_id'],
  },
  {
    id: 'merchant-categories',
    label: 'Categorias por comercio',
    sourceTable: 'categories',
    labelField: 'name',
    valueField: 'id',
    dependsOn: ['merchant_id'],
  },
  {
    id: 'merchant-modifier-groups',
    label: 'Grupos de modificadores por comercio',
    sourceTable: 'modifier_groups',
    labelField: 'name',
    valueField: 'id',
    dependsOn: ['merchant_id'],
  },
  {
    id: 'order-drivers',
    label: 'Drivers disponibles para asignacion',
    sourceTable: 'drivers',
    labelField: 'full_name',
    valueField: 'id',
    dependsOn: ['branch_id'],
  },
  {
    id: 'promotion-target-products',
    label: 'Productos elegibles para promociones',
    sourceTable: 'products',
    labelField: 'name',
    valueField: 'id',
    dependsOn: ['merchant_id'],
  },
];
