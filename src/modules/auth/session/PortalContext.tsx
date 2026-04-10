import { createContext } from 'react';
import { PortalContextState, PortalScopeType } from '../../../core/types';

export const PortalContext = createContext<PortalContextState & {
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  reloadPortalContext: () => Promise<void>;
  setCurrentScopeType: (scopeType: PortalScopeType) => void;
  setCurrentMerchantId: (merchantId: string) => void;
  setCurrentBranchId: (branchId: string) => void;
}>({
  sessionUserId: null,
  profile: null,
  roleAssignments: [],
  businessAssignments: [],
  staffAssignment: null,
  merchant: null,
  currentMerchant: null,
  branches: [],
  currentBranch: null,
  availableScopeTypes: [],
  currentScopeType: null,
  hasPlatformAccess: false,
  hasBusinessAccess: false,
  hasBranchAccess: false,
  accessControl: null,
  isAccountActive: true,
  mustChangePassword: false,
  permissions: {
    canManageOrders: false,
    canManageMenu: false,
    canManageBranch: false,
    canViewStaff: false,
    canViewCustomers: false,
    canManagePayments: false,
    canManagePromotions: false,
    canManageSettlements: false,
    canManageMessages: false,
    canManageSecurity: false,
    canManageSystem: false,
    canManageDrivers: false,
    canAccessPlatform: false,
    canAccessBusiness: false,
    canAccessBranch: false,
  },
  isLoading: false,
  error: null,
  signIn: async () => ({ error: new Error('PortalProvider no cargado') }),
  signOut: async () => {},
  reloadPortalContext: async () => {},
  setCurrentScopeType: () => {},
  setCurrentMerchantId: () => {},
  setCurrentBranchId: () => {},
});
