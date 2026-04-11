import { PortalScopeType } from '../types';

export type AdminModuleId =
  | 'overview'
  | 'turn'
  | 'businesses'
  | 'commerce'
  | 'branches'
  | 'people'
  | 'customers'
  | 'catalog'
  | 'orders'
  | 'local_status'
  | 'operational_menu'
  | 'drivers'
  | 'payments'
  | 'promotions'
  | 'settlements'
  | 'messages'
  | 'security'
  | 'platform_users'
  | 'system';

export type AdminExposureMode =
  | 'page'
  | 'tab'
  | 'inline_grid'
  | 'modal'
  | 'drawer'
  | 'timeline'
  | 'gallery'
  | 'readonly_panel';

export type SaveStrategyKind = 'direct' | 'relational_nested' | 'action_controlled' | 'rpc' | 'readonly_backend';

export interface AdminModuleSpec {
  id: AdminModuleId;
  label: string;
  description: string;
  route: string;
  icon?: string;
  entityRootIds: string[];
  enabled: boolean;
  scopeVisibility: PortalScopeType[];
  requiresMerchant?: boolean;
  requiresBranch?: boolean;
}

export interface ChildRelationSpec {
  table: string;
  label: string;
  exposure: AdminExposureMode;
  editable: boolean;
  saveStrategy: SaveStrategyKind;
}

export interface EntityRootSpec {
  id: string;
  moduleId: AdminModuleId;
  label: string;
  singularLabel: string;
  description: string;
  ownerTables: string[];
  childRelations: ChildRelationSpec[];
  listRoute?: string;
  detailRoute?: string;
}

export interface LookupSpec {
  id: string;
  label: string;
  sourceTable: string;
  labelField: string;
  valueField: string;
  dependsOn?: string[];
}

export interface ActionSpec {
  id: string;
  label: string;
  kind: 'navigate' | 'modal' | 'mutation';
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
}
