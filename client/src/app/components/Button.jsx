export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '', 
  ...props 
}) {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/90 shadow-[0_4px_12px_rgba(37,99,235,0.15)]',
    secondary: 'bg-[#7C3AED] text-white hover:bg-[#6d28d9] shadow-[0_4px_12px_rgba(124,58,237,0.15)]',
    success: 'bg-[#22C55E] text-white hover:bg-[#16a34a] shadow-[0_4px_12px_rgba(34,197,94,0.15)]',
    warning: 'bg-[#F59E0B] text-white hover:bg-[#d97706] shadow-[0_4px_12px_rgba(245,158,11,0.15)]',
    error: 'bg-[#EF4444] text-white hover:bg-[#dc2626] shadow-[0_4px_12px_rgba(239,68,68,0.15)]',
    outline: 'bg-white dark:bg-transparent border-2 border-[#E5E7EB] dark:border-[#475569] text-[#111827] dark:text-[#CBD5E1] hover:bg-[#F8FAFC] dark:hover:bg-[#334155]',
    ghost: 'bg-transparent text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] hover:text-[#111827] dark:hover:text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-[14px]',
    md: 'px-4 py-2 text-[16px]',
    lg: 'px-6 py-3 text-[16px]',
  };

  return (
    <button
      className={`
        ${variants[variant]} 
        ${sizes[size]}
        rounded-[8px] 
        font-medium 
        transition-all 
        disabled:opacity-50 
        disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}