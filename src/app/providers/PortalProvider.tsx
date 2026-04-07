import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { PortalContext } from '../../modules/auth/session/PortalContext';
import { authService } from '../../core/services/authService';
import { PortalContextState } from '../../core/types';

const initialState: PortalContextState = {
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
  isLoading: true,
  error: null,
};

export function PortalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PortalContextState>(initialState);

  const loadPortalContext = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true, error: null }));

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

    const { profile, staffAssignment, merchant, branches, currentBranch } = portalResult;
    const permissions = {
      canManageOrders: !!staffAssignment,
      canManageMenu: !!staffAssignment,
      canManageBranch: !!staffAssignment,
      canViewStaff: !!staffAssignment,
    };

    setState({
      sessionUserId: userId,
      profile,
      staffAssignment,
      merchant,
      branches,
      currentBranch,
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
        await loadPortalContext();
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

    await loadPortalContext();
    return result;
  }, [loadPortalContext]);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setState({ ...initialState, isLoading: false });
  }, []);

  useEffect(() => {
    loadPortalContext();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadPortalContext();
    });

    return () => {
      listener.subscription?.unsubscribe();
    };
  }, [loadPortalContext]);

  const value = useMemo(
    () => ({ ...state, signIn, signOut, reloadPortalContext: loadPortalContext }),
    [state, signIn, signOut, loadPortalContext]
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}
