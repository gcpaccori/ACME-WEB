import { createContext } from 'react';
import { PortalContextState } from '../../../core/types';

export const PortalContext = createContext<PortalContextState & {
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  reloadPortalContext: () => Promise<void>;
}>({
  sessionUserId: null,
  profile: null,
  staffAssignment: null,
  merchant: null,
  branches: [],
  currentBranch: null,
  permissions: {
    canManageOrders: false,
    canManageMenu: false,
    canManageBranch: false,
    canViewStaff: false,
  },
  isLoading: false,
  error: null,
  signIn: async () => ({ error: new Error('PortalProvider no cargado') }),
  signOut: async () => {},
  reloadPortalContext: async () => {},
});
