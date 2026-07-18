import { Loader2 } from 'lucide-react';

export const Badge = ({ children, color = 'gray' }) => {
  const map = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700',
    teal: 'bg-teal-100 text-teal-700',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${map[color] || map.gray}`}>{children}</span>;
};

export const Button = ({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button', className = '' }) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-sm' };
  const variants = {
    primary: 'bg-brand hover:bg-brand-dark text-white disabled:opacity-50',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50',
    danger: 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 disabled:opacity-50',
    ghost: 'hover:bg-gray-100 text-gray-600 disabled:opacity-50',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`pressable ${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

export const Input = ({ label, onChange, ...props }) => (
  <div className="space-y-1">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <input className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-sm bg-white" onChange={onChange} {...props} />
  </div>
);

export const Select = ({ label, children, value, onChange, options, ...props }) => {
  const handleChange = (e) => {
    if (typeof onChange === 'function') {
      onChange(e);
    }
  };
  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-sm bg-white"
        value={value ?? ''}
        onChange={handleChange}
        {...props}
      >
        {options?.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
        {children}
      </select>
    </div>
  );
};

export const Textarea = ({ label, onChange, className = '', textareaClassName = '', ...props }) => (
  <div className={`space-y-1 ${className}`}>
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <textarea className={`w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-sm bg-white ${textareaClassName}`} onChange={onChange} {...props} />
  </div>
);

export const Modal = ({ open, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="pressable absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="pressable p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="text-brand-teal w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export const ConfirmDialog = ({ open, onClose, onConfirm, title, message, loading }) => (
  <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
    <p className="text-gray-600 text-sm mb-6">{message}</p>
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button variant="danger" onClick={onConfirm} disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
      </Button>
    </div>
  </Modal>
);

export const EmptyState = ({ icon: Icon, title, subtitle, message, action, onAction }) => (
  <div className="text-center py-16">
    {Icon && (
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
    )}
    <h3 className="text-lg font-semibold text-gray-900 mb-1">{title || message || 'No data found'}</h3>
    <p className="text-sm text-gray-500">{subtitle || ''}</p>
    {action && onAction && (
      <button
        onClick={onAction}
        className="pressable mt-4 px-5 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-medium rounded-xl transition-colors"
      >
        {action}
      </button>
    )}
  </div>
);

export const SkeletonRow = ({ cols, count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, rowIndex) => (
      <tr key={rowIndex}>
        {Array.from({ length: cols || 5 }).map((_, colIndex) => (
          <td key={colIndex} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
        ))}
      </tr>
    ))}
  </>
);
