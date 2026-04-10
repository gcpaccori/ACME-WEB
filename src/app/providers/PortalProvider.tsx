import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { PortalContext } from '../../modules/auth/session/PortalContext';
import {
  resolvePortalAccess,
  resolvePortalPermissions,
  resolvePreferredScopeType,
} from '../../core/auth/portalAccess';
import { authService } from '../../core/services/authService';
import { PortalContextState, PortalScopeType } from '../../core/types';

const STORAGE_SCOPE_KEY = 'portalCurrentScopeType';
const STORAGE_MERCHANT_KEY = 'portalCurrentMerchantId';
const STORAGE_BRANCH_KEY = 'portalCurrentBranchId';

const initialState: PortalContextState = {
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
  isLoading: true,
  error: null,
};

export function PortalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PortalContextState>(initialState);
  const authReloadTimeoutRef = useRef<number | null>(null);

  const loadPortalContext = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    setState((current) => ({ ...current, isLoading: silent ? current.isLoading : true, error: null }));

    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      setState((current) => ({ ...current, isLoading: false, error: sessionError.message }));
      return;
    }

    if (!sessionData.session?.user) {
      setState({ ...initialState, isLoading: false });
      return;
    }

    const userId = sessionData.session.user.id;
    const portalResult = await authService.fetchPortalContext(userId);

    if (portalResult.error) {
      setState({ ...initialState, isLoading: false, error: portalResult.error.message });
      return;
    }

    const {
      profile,
      roleAssignments = [],
      businessAssignments = [],
      staffAssignment,
      merchant,
      currentMerchant,
      branches,
      currentBranch,
    } = portalResult;
    const storedMerchantId = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_MERCHANT_KEY) : null;
    const currentBusinessAssignment =
      businessAssignments.find((assignment) => assignment.merchant.id === storedMerchantId) ??
      businessAssignments[0] ??
      null;
    const resolvedMerchant = currentBusinessAssignment?.merchant ?? currentMerchant ?? merchant ?? null;
    const resolvedStaffAssignment = currentBusinessAssignment?.staffAssignment ?? staffAssignment ?? null;
    const resolvedBranches = currentBusinessAssignment?.branches ?? branches ?? [];

    const access = resolvePortalAccess({
      roleAssignments,
      profile: profile ?? null,
      staffAssignment: resolvedStaffAssignment,
      branches: resolvedBranches,
    });
    const storedScopeType =
      typeof window !== 'undefined' ? (window.localStorage.getItem(STORAGE_SCOPE_KEY) as PortalScopeType | null) : null;
    const preferredScopeType = resolvePreferredScopeType({
      availableScopeTypes: access.availableScopeTypes,
      preferredScopeType: storedScopeType,
    });
    const storedBranchId = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_BRANCH_KEY) : null;
    const resolvedCurrentBranch =
      resolvedBranches.find((branch) => branch.id === storedBranchId) ??
      currentBusinessAssignment?.branches.find((branch) => branch.id === currentBusinessAssignment.primaryBranchId) ??
      currentBranch ??
      resolvedBranches[0] ??
      null;
    const permissions = resolvePortalPermissions({
      currentScopeType: preferredScopeType,
      hasPlatformAccess: access.hasPlatformAccess,
      hasBusinessAccess: access.hasBusinessAccess,
      hasBranchAccess: access.hasBranchAccess,
      roleAssignments,
      profile: profile ?? null,
      staffAssignment: resolvedStaffAssignment,
    });

    setState({
      sessionUserId: userId,
      profile: profile ?? null,
      roleAssignments,
      businessAssignments,
      staffAssignment: resolvedStaffAssignment,
      merchant: resolvedMerchant,
      currentMerchant: resolvedMerchant,
      branches: resolvedBranches,
      currentBranch: resolvedCurrentBranch,
      availableScopeTypes: access.availableScopeTypes,
      currentScopeType: preferredScopeType,
      hasPlatformAccess: access.hasPlatformAccess,
      hasBusinessAccess: access.hasBusinessAccess,
      hasBranchAccess: access.hasBranchAccess,
      permissions,
      isLoading: false,
      error: null,
    });

    // Check for pending business registration
    const pendingData = localStorage.getItem('pendingBusinessRegistration');
    if (pendingData) {
      try {
        const formData = JSON.parse(pendingData);
        const { data: merchantData, error: mErr } = await supabase.from('merchants').insert([{ trade_name: formData.businessName }]).select().single();
        if (mErr) throw mErr;
        const { data: branchData, error: bErr } = await supabase.from('merchant_branches').insert([{ name: formData.branchName, merchant_id: merchantData.id, address_id: null, phone: formData.phone }]).select().single();
        if (bErr) throw bErr;
        const { error: pErr } = await supabase
          .from('profiles')
          .insert([{ user_id: userId, full_name: formData.ownerName, email: formData.email, phone: formData.phone }]);
        if (pErr) throw pErr;
        const { data: staffData, error: sErr } = await supabase.from('merchant_staff').insert([{ user_id: userId, merchant_id: merchantData.id, staff_role: 'owner', branch_id: null }]).select().single();
        if (sErr) throw sErr;
        if (!staffData?.id) throw new Error('No se pudo crear la asignación de staff.');
        const { error: sbErr } = await supabase.from('merchant_staff_branches').insert([{ branch_id: branchData.id, merchant_staff_id: staffData.id, is_primary: true }]);
        if (sbErr) throw sbErr;
        localStorage.removeItem('pendingBusinessRegistration');
        // Reload context to include new data
        await loadPortalContext({ silent: true });
      } catch (createErr: any) {
        console.error('Error creating business:', createErr);
        setState((current) => ({ ...current, error: 'Cuenta creada, pero error al configurar el negocio. Contacta soporte.' }));
      }
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authService.signIn(email, password);
    if (result.error) {
      return result;
    }

    await loadPortalContext({ silent: false });
    return result;
  }, [loadPortalContext]);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setState({ ...initialState, isLoading: false });
  }, []);

  const reloadPortalContext = useCallback(async () => {
    await loadPortalContext({ silent: false });
  }, [loadPortalContext]);

  const setCurrentScopeType = useCallback((scopeType: PortalScopeType) => {
    setState((current) => {
      if (!current.availableScopeTypes.includes(scopeType)) {
        return current;
      }
      const permissions = resolvePortalPermissions({
        currentScopeType: scopeType,
        hasPlatformAccess: current.hasPlatformAccess,
        hasBusinessAccess: current.hasBusinessAccess,
        hasBranchAccess: current.hasBranchAccess,
        roleAssignments: current.roleAssignments,
        profile: current.profile,
        staffAssignment: current.staffAssignment,
      });
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_SCOPE_KEY, scopeType);
      }
      return {
        ...current,
        currentScopeType: scopeType,
        permissions,
      };
    });
  }, []);

  const setCurrentMerchantId = useCallback((merchantId: string) => {
    setState((current) => {
      const nextAssignment = current.businessAssignments.find((assignment) => assignment.merchant.id === merchantId);
      if (!nextAssignment) {
        return current;
      }

      const access = resolvePortalAccess({
        roleAssignments: current.roleAssignments,
        profile: current.profile,
        staffAssignment: nextAssignment.staffAssignment,
        branches: nextAssignment.branches,
      });
      const preferredScopeType = resolvePreferredScopeType({
        availableScopeTypes: access.availableScopeTypes,
        preferredScopeType: current.currentScopeType,
      });
      const nextBranch =
        nextAssignment.branches.find((branch) => branch.id === current.currentBranch?.id) ??
        nextAssignment.branches.find((branch) => branch.id === nextAssignment.primaryBranchId) ??
        nextAssignment.branches[0] ??
        null;
      const permissions = resolvePortalPermissions({
        currentScopeType: preferredScopeType,
        hasPlatformAccess: access.hasPlatformAccess,
        hasBusinessAccess: access.hasBusinessAccess,
        hasBranchAccess: access.hasBranchAccess,
        roleAssignments: current.roleAssignments,
        profile: current.profile,
        staffAssignment: nextAssignment.staffAssignment,
      });

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_MERCHANT_KEY, merchantId);
        if (nextBranch?.id) {
          window.localStorage.setItem(STORAGE_BRANCH_KEY, nextBranch.id);
        } else {
          window.localStorage.removeItem(STORAGE_BRANCH_KEY);
        }
        if (preferredScopeType) {
          window.localStorage.setItem(STORAGE_SCOPE_KEY, preferredScopeType);
        }
      }

      return {
        ...current,
        staffAssignment: nextAssignment.staffAssignment,
        merchant: nextAssignment.merchant,
        currentMerchant: nextAssignment.merchant,
        branches: nextAssignment.branches,
        currentBranch: nextBranch,
        currentScopeType: preferredScopeType,
        hasPlatformAccess: access.hasPlatformAccess,
        hasBusinessAccess: access.hasBusinessAccess,
        hasBranchAccess: access.hasBranchAccess,
        availableScopeTypes: access.availableScopeTypes,
        permissions,
      };
    });
  }, []);

  const setCurrentBranchId = useCallback((branchId: string) => {
    setState((current) => {
      const nextBranch = current.branches.find((branch) => branch.id === branchId);
      if (!nextBranch) {
        return current;
      }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_BRANCH_KEY, branchId);
      }
      return {
        ...current,
        currentBranch: nextBranch,
      };
    });
  }, []);

  useEffect(() => {
    loadPortalContext({ silent: false });
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        if (authReloadTimeoutRef.current) {
          window.clearTimeout(authReloadTimeoutRef.current);
          authReloadTimeoutRef.current = null;
        }
        setState({ ...initialState, isLoading: false });
        return;
      }

      if (authReloadTimeoutRef.current) {
        window.clearTimeout(authReloadTimeoutRef.current);
      }

      authReloadTimeoutRef.current = window.setTimeout(() => {
        loadPortalContext({ silent: true });
      }, 350);
    });

    return () => {
      if (authReloadTimeoutRef.current) {
        window.clearTimeout(authReloadTimeoutRef.current);
        authReloadTimeoutRef.current = null;
      }
      listener.subscription?.unsubscribe();
    };
  }, [loadPortalContext]);

  const value = useMemo(
    () => ({ ...state, signIn, signOut, reloadPortalContext, setCurrentScopeType, setCurrentMerchantId, setCurrentBranchId }),
    [state, signIn, signOut, reloadPortalContext, setCurrentScopeType, setCurrentMerchantId, setCurrentBranchId]
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}
