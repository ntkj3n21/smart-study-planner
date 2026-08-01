export default function Input({ 
  label, 
  error,
  className = '', 
  ...props 
}) {
  return (
    <div className="space-y-2 w-full">
      {label && (
        <label className="block text-[14px] font-medium text-[#111827] dark:text-white transition-colors">
          {label}
        </label>
      )}
      <input
        className={`
          w-full 
          px-4 
          py-2.5 
          bg-white dark:bg-[#0F172A] 
          border 
          border-[#E5E7EB] dark:border-[#334155] 
          rounded-[8px] 
          text-[15px]
          text-[#111827] dark:text-white
          placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B]
          focus:outline-none 
          focus:ring-2 
          focus:ring-[#2563EB]/30 dark:focus:ring-[#2563EB]/50
          focus:border-primary dark:focus:border-primary
          disabled:bg-[#F8FAFC] dark:disabled:bg-[#1E293B]
          disabled:cursor-not-allowed
          transition-colors
          ${error ? '!border-[#EF4444] focus:!ring-[#EF4444]' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-[14px] text-[#EF4444]">{error}</p>
      )}
    </div>
  );
}