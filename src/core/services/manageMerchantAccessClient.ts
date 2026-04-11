import { supabase } from '../../integrations/supabase/client';

const MANAGE_MERCHANT_ACCESS_FUNCTION = 'manage-merchant-access';
const MANAGE_MERCHANT_ACCESS_API_PATH = '/api/manage-merchant-access';

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error ?? 'No se pudo completar la operacion de acceso'));
}

async function invokeViaEdgeFunction<T>(body: Record<string, unknown>) {
  const result = await supabase.functions.invoke(MANAGE_MERCHANT_ACCESS_FUNCTION, { body });
  if (result.error) {
    return { data: null, error: normalizeError(result.error) };
  }

  const responseData = (result.data ?? null) as T | null;
  if (responseData && typeof responseData === 'object' && 'error' in (responseData as Record<string, unknown>)) {
    const responseError = (responseData as Record<string, unknown>).error;
    if (typeof responseError === 'string' && responseError.trim()) {
      return { data: null, error: new Error(responseError) };
    }
  }

  return { data: responseData, error: null };
}

export async function invokeManageMerchantAccess<T>(body: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    return invokeViaEdgeFunction<T>(body);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  try {
    const response = await fetch(MANAGE_MERCHANT_ACCESS_API_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const contentType = response.headers.get('content-type') ?? '';
    const parsedBody = contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : await response.text().catch(() => '');

    if (!response.ok) {
      const message =
        parsedBody && typeof parsedBody === 'object' && 'error' in (parsedBody as Record<string, unknown>)
          ? String((parsedBody as Record<string, unknown>).error ?? '')
          : typeof parsedBody === 'string'
            ? parsedBody
            : `Error ${response.status}`;

      return { data: null, error: new Error(message || `Error ${response.status}`) };
    }

    if (parsedBody && typeof parsedBody === 'object' && 'error' in (parsedBody as Record<string, unknown>)) {
      const apiError = String((parsedBody as Record<string, unknown>).error ?? '');
      if (apiError.trim()) {
        return { data: null, error: new Error(apiError) };
      }
    }

    return { data: (parsedBody ?? null) as T | null, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}
