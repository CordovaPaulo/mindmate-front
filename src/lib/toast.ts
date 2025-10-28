import { toast, ToastOptions } from 'react-toastify';

const base: ToastOptions = { position: 'bottom-right', autoClose: 2500, theme: 'colored' };

export const notify = {
  success: (msg: string, opts?: ToastOptions) => toast.success(msg, { ...base, ...opts }),
  error: (msg: string, opts?: ToastOptions) => toast.error(msg, { ...base, ...opts }),
  info: (msg: string, opts?: ToastOptions) => toast.info(msg, { ...base, ...opts }),
  warn: (msg: string, opts?: ToastOptions) => toast.warn(msg, { ...base, ...opts }),
  // Optional: wrap promises
  promise: <T>(p: Promise<T>, msgs: { pending: string; success: string; error: string }, opts?: ToastOptions) =>
    toast.promise(p, { pending: msgs.pending, success: msgs.success, error: msgs.error }, { ...base, ...opts }),
};

export default notify;