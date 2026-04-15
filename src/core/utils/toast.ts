/**
 * Portal toast notifications using Sileo.
 * Sileo expects an object { title, description } for each toast.
 *
 * Usage:
 *   toast.success('Guardado correctamente')
 *   toast.error('No se pudo conectar')
 *   toast.success('Título', 'Descripción opcional')
 *   toast.promise(myPromise, { loading: 'Guardando...', success: 'Listo', error: 'Error' })
 */
import { sileo } from 'sileo';

type ToastArg = string | { title: string; description?: string };

function normalize(arg: ToastArg, desc?: string) {
  if (typeof arg === 'string') return { title: arg, description: desc };
  return arg;
}

export const toast = {
  success: (msg: ToastArg, desc?: string) =>
    sileo.success(normalize(msg, desc)),

  error: (msg: ToastArg, desc?: string) =>
    sileo.error(normalize(msg, desc)),

  info: (msg: ToastArg, desc?: string) =>
    sileo.info(normalize(msg, desc)),

  warning: (msg: ToastArg, desc?: string) =>
    sileo.warning(normalize(msg, desc)),

  promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    opts: {
      loading: ToastArg;
      success: ToastArg | ((data: T) => { title: string; description?: string });
      error: ToastArg | ((err: unknown) => { title: string; description?: string });
    }
  ) =>
    sileo.promise(promise, {
      loading: normalize(opts.loading),
      success:
        typeof opts.success === 'function'
          ? opts.success
          : normalize(opts.success),
      error:
        typeof opts.error === 'function'
          ? opts.error
          : normalize(opts.error),
    }),
};
