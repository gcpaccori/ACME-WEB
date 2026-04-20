import { getEnabledAdminModules } from '../admin/registry/moduleRegistry';
import { AppRoutes } from '../constants/routes';
import { PortalPermissions, PortalScopeType } from '../types';
import { canAccessAdminModule } from './portalAccess';

interface PortalLandingParams {
  currentScopeType?: PortalScopeType | null;
  currentMerchant?: { id: string } | null;
  currentBranch?: { id: string } | null;
  permissions?: PortalPermissions | null;
}

export function resolvePortalLandingRoute(params?: PortalLandingParams | null) {
  const defaultRoute = AppRoutes.portal.admin.root;

  if (!params?.currentScopeType || !params.permissions) {
    return defaultRoute;
  }

  const enabledModules = getEnabledAdminModules({
    scopeType: params.currentScopeType,
    hasMerchant: !!params.currentMerchant,
    hasBranch: !!params.currentBranch,
  }).filter((module) => canAccessAdminModule(module.id, params.permissions!));

  return enabledModules[0]?.route ?? defaultRoute;
}
