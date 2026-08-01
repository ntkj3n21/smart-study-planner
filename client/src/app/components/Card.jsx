export default function Card({ children, className = '', ...props }) {
  return (
    <div 
      className={`bg-white dark:bg-[#1E293B] rounded-[12px] border border-[#E5E7EB] dark:border-[#334155] shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-colors duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}