import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  BookOpen, 
  Timer, 
  BarChart3, 
  User, 
  Settings 
} from 'lucide-react';
import { useLocation, Link } from 'react-router';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: Calendar, label: 'Calendar', path: '/calendar' },
  { icon: BookOpen, label: 'Subjects', path: '/subjects' },
  { icon: Timer, label: 'Pomodoro', path: '/pomodoro' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const location = useLocation();
  
  return (
    <aside className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#1E293B] border-t border-[#E5E7EB] dark:border-[#334155] md:top-16 md:bottom-0 md:w-64 md:border-t-0 md:border-r transition-colors duration-300 pb-safe">
      
      {/* Container cuộn ngang trên điện thoại, xếp dọc trên máy tính. Đã ẩn thanh cuộn cho đẹp */}
      <nav className="flex flex-row md:flex-col h-full p-2 md:p-4 md:space-y-1 overflow-x-auto md:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 flex-shrink-0 px-3 py-2 md:px-4 md:py-3 rounded-[12px] md:rounded-[8px] transition-all min-w-[76px] md:min-w-0 ${
                isActive 
                  ? 'bg-primary text-white shadow-[0_4px_12px_rgba(37,99,235,0.2)]' 
                  : 'text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] hover:text-[#111827] dark:hover:text-white' 
              }`}
            >
              <Icon className="w-5 h-5 md:w-5 md:h-5" />
              {/* Trên điện thoại chữ nhỏ lại (10px), lên máy tính chữ to ra (16px) */}
              <span className="text-[10px] md:text-[16px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}