import { Bell, Search, CheckCircle2, Clock, AlertCircle, Trophy } from 'lucide-react';
import { Link, useNavigate } from "react-router"; 
import { LogOut } from "lucide-react";
import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../api/axiosClient';

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); 
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  const timeAgo = (timestamp) => {
    const now = new Date().getTime();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);
    
    if (diffInSeconds < 60) return `Just now`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hrs ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    return `${diffInDays} days ago`;
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const [tasksRes, analyticsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/tasks/getTask`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/analytics/overview`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        let allNotis = [];
        const now = new Date();

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          const completedTasks = tasksData
            .filter(t => t.status === 'DONE')
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 3)
            .map(t => ({
              id: `task-done-${t.id}`, type: 'success', title: 'Task Completed!',
              desc: `You have successfully completed "${t.title}".`,
              timestamp: new Date(t.updatedAt).getTime(), time: timeAgo(new Date(t.updatedAt).getTime()),
              icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-500/20'
            }));
          allNotis = [...allNotis, ...completedTasks];

          const upcomingTasks = tasksData
            .filter(t => t.status !== 'DONE' && t.deadline) 
            .filter(t => {
              const taskDate = new Date(t.deadline);
              const taskDateString = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;
              const today = new Date();
              const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
              const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
              const tomorrowString = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
              return taskDateString === todayString || taskDateString === tomorrowString;
            })
            .slice(0, 2)
            .map(t => ({
              id: `task-urgent-${t.id}`, type: 'urgent', title: 'Deadline Approaching!',
              desc: `"${t.title}" is due soon. Hurry up!`,
              timestamp: now.getTime() + 1000, time: 'Action required',
              icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-500/20'
            }));
          allNotis = [...allNotis, ...upcomingTasks];
        }

        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          if (analyticsData.data.recentSessions) {
            const sessions = analyticsData.data.recentSessions.slice(0, 2).map(s => ({
              id: `pomodoro-${s.id}`, type: 'info', title: 'Pomodoro Completed',
              desc: `You focused for ${s.duration} minutes. Great job!`,
              timestamp: new Date(s.createdAt).getTime(), time: timeAgo(new Date(s.createdAt).getTime()),
              icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/20'
            }));
            allNotis = [...allNotis, ...sessions];
          }

          const ach = analyticsData.data.achievements;
          if (ach) {
            if (ach.sevenDayStreak) {
              allNotis.push({
                id: 'ach-streak', type: 'award', title: 'Achievement Unlocked!', desc: 'You hit a 7-Day Study Streak! 🎯',
                timestamp: now.getTime() - 1000, time: 'Just now', icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-500/20'
              });
            }
            if (ach.taskMaster) {
              allNotis.push({
                id: 'ach-master', type: 'award', title: 'Achievement Unlocked!', desc: 'Task Master! You completed 100 tasks! 🏆',
                timestamp: now.getTime() - 2000, time: 'Just now', icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-500/20'
              });
            }
          }
        }

        allNotis.sort((a, b) => b.timestamp - a.timestamp);
        const finalNotifications = allNotis.slice(0, 6);
        setNotifications(finalNotifications);
        setUnreadCount(finalNotifications.length); 

      } catch (error) {
        console.error("Lỗi lấy thông báo:", error);
      }
    };

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 60000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 md:p-2.5 text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] rounded-[8px] transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5 md:w-6 md:h-6" />
        
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 md:top-1.5 md:right-1.5 w-4 h-4 bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-[#1E293B] animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        // ĐÃ FIX: Trên Mobile dùng "fixed left-4 right-4 top-[70px]", trên PC dùng "absolute"
        <div className="fixed left-4 right-4 top-[70px] sm:absolute sm:left-auto sm:-right-4 sm:top-[50px] w-auto sm:w-80 md:w-96 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] shadow-2xl rounded-[16px] overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] dark:border-[#334155]">
            <h3 className="font-bold text-[#111827] dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => setUnreadCount(0)} 
                className="text-[12px] font-medium text-primary hover:underline cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
            {notifications.length > 0 ? (
              notifications.map((note) => {
                const Icon = note.icon;
                return (
                  <div key={note.id} className="flex items-start gap-3 p-4 border-b border-[#F8FAFC] dark:border-[#334155]/50 hover:bg-[#F8FAFC] dark:hover:bg-[#334155]/30 transition-colors cursor-pointer last:border-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${note.bg}`}>
                      <Icon className={`w-5 h-5 ${note.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[#111827] dark:text-white mb-0.5 truncate">{note.title}</p>
                      <p className="text-[13px] text-[#6B7280] dark:text-[#94A3B8] line-clamp-2">{note.desc}</p>
                      <p className="text-[11px] font-medium text-[#94A3B8] dark:text-[#64748B] mt-1.5">{note.time}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center flex flex-col items-center">
                <Bell className="w-12 h-12 text-[#E5E7EB] dark:text-[#334155] mb-2" />
                <p className="text-[#6B7280] dark:text-[#94A3B8] text-[14px] font-medium">No new notifications</p>
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-[#E5E7EB] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A]/50 text-center">
            <button className="text-[13px] font-semibold text-primary hover:underline cursor-pointer">
              View all activity
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    name: 'Loading...',
    avatar: '...',
    avatarUrl: ''
  });

  useEffect(() => {
    const loadUserData = () => {
      const editedProfile = localStorage.getItem('userProfile');
      const loginUser = localStorage.getItem('user');

      if (editedProfile) {
        const parsed = JSON.parse(editedProfile);
        setUserData({ name: parsed.name, avatar: parsed.avatar, avatarUrl: parsed.avatarUrl || '' });
      } else if (loginUser) {
        const parsedDB = JSON.parse(loginUser);
        const fullName = parsedDB.fullName || 'User';
        
        const nameParts = fullName.trim().split(' ');
        let initials = 'U';
        if (nameParts.length >= 2) {
          initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
        } else {
          initials = fullName.substring(0, 2).toUpperCase();
        }

        setUserData({ name: fullName, avatar: initials, avatarUrl: '' });
      }
    };

    loadUserData(); 
    window.addEventListener('profileUpdated', loadUserData);
    return () => window.removeEventListener('profileUpdated', loadUserData);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userProfile"); 
    navigate("/login");
  };

  return (
    <nav className="h-16 bg-white dark:bg-[#1E293B] border-b border-[#E5E7EB] dark:border-[#334155] flex items-center justify-between px-4 md:px-8 fixed top-0 left-0 right-0 z-50 transition-colors duration-300">
      <div className="flex items-center gap-2 md:gap-6">
        <h1 className="text-[16px] sm:text-[18px] md:text-[20px] font-semibold text-[#111827] dark:text-white transition-colors truncate max-w-[140px] sm:max-w-none">
          Smart Study Planner
        </h1>
      </div>
      
      <div className="flex items-center gap-1 md:gap-2">
        
        <NotificationBell />
        
        <div className="flex items-center gap-0 ml-1 md:ml-2"> 
          <Link 
            to="/profile" 
            className="flex items-center gap-2 py-1.5 px-1.5 md:px-2 hover:bg-[#F8FAFC] dark:hover:bg-[#334155] rounded-[8px] transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 md:w-8 md:h-8 bg-primary rounded-full flex items-center justify-center overflow-hidden">
              {userData.avatarUrl ? (
                <img src={userData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[12px] md:text-[14px] font-medium text-white">{userData.avatar}</span>
              )}
            </div>
            <span className="hidden sm:block text-[14px] font-medium text-[#111827] dark:text-white pr-1 transition-colors truncate max-w-[80px] md:max-w-[150px]">
              {userData.name}
            </span>
          </Link>

          <button 
            onClick={handleLogout}
            className="p-2 text-[#EF4444] hover:bg-[#FEF2F2] dark:hover:bg-[#EF4444]/10 rounded-[8px] transition-colors cursor-pointer ml-1"
            title="Logout"
          >
            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          
        </div>
      </div>
    </nav>
  );
}
