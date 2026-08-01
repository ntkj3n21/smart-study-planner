import { useState, useEffect } from 'react';
import { Clock, CheckCircle, BookOpen, TrendingUp, Calendar as CalendarIcon, X, ArrowRight, Play, Loader2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router'; 
import Card from '../components/Card';
import Button from '../components/Button';
import { API_BASE_URL } from '../../api/axiosClient';

export default function Dashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Student');
  const [greeting, setGreeting] = useState('Good Morning');
  const [showSchedule, setShowSchedule] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [realTasks, setRealTasks] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]); 
  const [activeSubjectsCount, setActiveSubjectsCount] = useState(0);
  const [dashboardStats, setDashboardStats] = useState({
    studyHours: 0,
    tasksCompleted: 0,
    totalTasks: 0,
    weeklyProgress: 0
  });

  useEffect(() => {
    const loadUserName = () => {
      const editedProfile = localStorage.getItem('userProfile');
      const loginUser = localStorage.getItem('user');

      let fullName = 'Student';
      if (editedProfile) {
        fullName = JSON.parse(editedProfile).name;
      } else if (loginUser) {
        const dbUser = JSON.parse(loginUser);
        fullName = dbUser.fullName || 'Student';
      }
      setUserName(fullName);
    };

    loadUserName();
    window.addEventListener('profileUpdated', loadUserName);

    const currentHour = new Date().getHours();
    if (currentHour < 12) setGreeting('Good Morning');
    else if (currentHour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    return () => window.removeEventListener('profileUpdated', loadUserName);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        const [tasksRes, subjectsRes, weeklyRes, scheduleRes] = await Promise.all([
          fetch(`${API_BASE_URL}/tasks/getTask`, { headers }),
          fetch(`${API_BASE_URL}/subjects/getSubject`, { headers }),
          fetch(`${API_BASE_URL}/tasks/weekly-progress`, { headers }),
          fetch(`${API_BASE_URL}/schedule/today`, { headers }) 
        ]);

        let activeSubs = 0;
        let comp = 0, total = 0, prog = 0, hours = 0;

        if (subjectsRes.ok) {
          const subjectsData = await subjectsRes.json();
          activeSubs = subjectsData.data ? subjectsData.data.length : 0;
          setActiveSubjectsCount(activeSubs);
        }

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          const pendingTasks = (tasksData || [])
            .filter(t => t.status !== 'DONE')
            .slice(0, 4);
          setRealTasks(pendingTasks);
        }

        if (weeklyRes.ok) {
          const weeklyData = await weeklyRes.json();
          if (weeklyData.data) {
            comp = weeklyData.data.taskStats.completedTasks || 0;
            total = weeklyData.data.taskStats.totalTasks || 0;
            prog = weeklyData.data.taskStats.progressPercentage || 0;
            hours = Math.round((weeklyData.data.timeStats.completedMinutes / 60) * 10) / 10;
          }
        }

        if (scheduleRes.ok) {
          const scheduleData = await scheduleRes.json();
          setTodayClasses(scheduleData || []);
        }

        setDashboardStats({
          studyHours: hours,
          tasksCompleted: comp,
          totalTasks: total,
          weeklyProgress: prog
        });

      } catch (error) {
        console.error("Lỗi tải dữ liệu Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    { icon: Clock, label: 'Study Hours Today', value: `${dashboardStats.studyHours}h`, color: '#2563EB', bg: '#EFF6FF' },
    { icon: CheckCircle, label: 'Tasks This Week', value: `${dashboardStats.tasksCompleted}/${dashboardStats.totalTasks}`, color: '#22C55E', bg: '#F0FDF4' },
    { icon: BookOpen, label: 'Active Subjects', value: activeSubjectsCount.toString(), color: '#7C3AED', bg: '#FAF5FF' },
    { icon: TrendingUp, label: 'Weekly Progress', value: `${dashboardStats.weeklyProgress}%`, color: '#F59E0B', bg: '#FFFBEB' },
  ];

  const priorityColors = {
    HIGH: 'bg-[#EF4444] text-white',
    MEDIUM: 'bg-[#F59E0B] text-white',
    LOW: 'bg-[#22C55E] text-white',
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'No deadline';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatTo12Hour = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  const formatTimeRange = (timeRangeStr) => {
    if (!timeRangeStr) return '';
    const parts = timeRangeStr.split(' - ');
    if (parts.length !== 2) return timeRangeStr;
    return `${formatTo12Hour(parts[0])} - ${formatTo12Hour(parts[1])}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="w-10 h-10 md:w-12 md:h-12 text-primary animate-spin mb-4" />
        <p className="text-[#6B7280] dark:text-[#94A3B8] font-medium text-[14px] md:text-[16px]">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-8 relative">
      <Card className="p-5 md:p-8 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] border-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-white mb-1.5 md:mb-2 text-[20px] md:text-[24px] lg:text-[28px] font-bold leading-tight">{greeting}, {userName}! 👋</h1>
            <p className="text-white/90 text-[13px] md:text-[16px]">
              You have {realTasks.length} pending tasks to complete. Keep up the great work!
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowSchedule(true)}
            className="w-full sm:w-auto bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 cursor-pointer whitespace-nowrap text-[13px] md:text-[15px]"
          >
            View Schedule
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3 sm:gap-0">
                <div className="order-2 sm:order-1">
                  <p className="text-[12px] md:text-[14px] text-[#6B7280] dark:text-[#94A3B8] mb-1 md:mb-2 line-clamp-1">{stat.label}</p>
                  <h3 className="text-[24px] md:text-[32px] font-bold text-[#111827] dark:text-white leading-none">{stat.value}</h3>
                </div>
                <div 
                  className="order-1 sm:order-2 w-8 h-8 md:w-12 md:h-12 rounded-[8px] md:rounded-[12px] flex items-center justify-center dark:!bg-[#0F172A] transition-colors flex-shrink-0"
                  style={{ backgroundColor: stat.bg }}
                >
                  <Icon className="w-4 h-4 md:w-6 md:h-6" style={{ color: stat.color }} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="lg:col-span-2 p-4 md:p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-[16px] md:text-[18px] font-bold text-[#111827] dark:text-white">Upcoming Tasks</h2>
            <button 
              onClick={() => navigate('/tasks')}
              className="text-[12px] md:text-[14px] font-bold text-primary dark:text-[#3B82F6] hover:text-[#1d4ed8] dark:hover:text-[#60A5FA] flex items-center gap-1 transition-colors group cursor-pointer px-2 py-1 rounded-md hover:bg-[#EFF6FF] dark:hover:bg-[#0F172A]"
            >
              View All 
              <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <div className="space-y-3 flex-1 flex flex-col">
            {realTasks.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-6 md:p-8 text-center border-2 border-dashed border-[#E5E7EB] dark:border-[#334155] rounded-xl">
                 <p className="text-[#6B7280] dark:text-[#94A3B8] text-[13px] md:text-[15px]">You have no upcoming tasks. Enjoy your day!</p>
              </div>
            ) : (
              realTasks.map((task) => {
                const priorityKey = String(task.priority || 'MEDIUM').toUpperCase();
                return (
                  <div 
                    key={task.id}
                    onClick={() => navigate('/tasks')}
                    className="flex items-start sm:items-center gap-3 md:gap-4 p-3 md:p-4 bg-[#F8FAFC] dark:bg-[#0F172A] border border-transparent dark:border-[#334155] rounded-[8px] hover:bg-[#EFF6FF] dark:hover:bg-[#1E293B] transition-colors cursor-pointer flex-col sm:flex-row"
                  >
                    <div className="flex items-start gap-3 md:gap-4 w-full sm:w-auto sm:flex-1">
                      <div className="mt-1 flex-shrink-0">
                        <div className="w-4 h-4 md:w-5 md:h-5 border-[2px] border-primary rounded-[4px] hover:bg-primary transition-colors cursor-pointer"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] md:text-[16px] font-medium text-[#111827] dark:text-white mb-1 truncate pr-2">{task.title}</h4>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                          <span className="text-[12px] md:text-[14px] text-[#6B7280] dark:text-[#94A3B8] truncate">
                            {task.subject?.name || 'No Subject'}
                          </span>
                          <span className="text-[12px] md:text-[14px] text-[#6B7280] dark:text-[#94A3B8] flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                            {formatDateTime(task.deadline)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full sm:w-auto flex justify-end mt-2 sm:mt-0">
                      <span className={`px-2.5 py-0.5 md:px-3 md:py-1 rounded-[6px] text-[10px] md:text-[12px] font-medium ${priorityColors[priorityKey] || priorityColors.MEDIUM}`}>
                        {(task.priority || 'MEDIUM')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* CARD BÊN PHẢI: LỊCH HỌC HÔM NAY (CHỈ HIỂN THỊ THÔNG TIN) */}
        <Card className="p-4 md:p-6 flex flex-col h-full min-h-[250px] md:min-h-[300px]">
          <h2 className="mb-4 md:mb-6 text-[16px] md:text-[18px] font-bold text-[#111827] dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            Today's Class Schedule
          </h2>
          
          <div className="space-y-3 md:space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1 md:pr-2">
            {todayClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-70 py-6 md:py-8">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 dark:bg-[#0F172A] rounded-full flex items-center justify-center mb-2 md:mb-3">
                   <CalendarIcon className="w-5 h-5 md:w-6 md:h-6 text-[#6B7280] dark:text-[#94A3B8]" />
                </div>
                <p className="text-[13px] md:text-[14px] text-[#6B7280] dark:text-[#94A3B8]">
                  You have no classes today.<br/>Enjoy your free time!
                </p>
              </div>
            ) : (
              todayClasses.map((session) => (
                <div 
                  key={session.id} 
                  className="p-3 md:p-4 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl border border-transparent dark:border-[#334155]"
                >
                  <div className="flex items-center justify-between mb-1.5 md:mb-1">
                    <h4 className="text-[14px] md:text-[15px] font-bold text-[#111827] dark:text-white flex items-center gap-1.5 md:gap-2 truncate pr-2">
                      <div 
                        className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: session.color || '#2563EB' }}
                      ></div>
                      <span className="truncate">{session.subject}</span>
                    </h4>
                    <span 
                      className="text-[11px] md:text-[13px] font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-md bg-white dark:bg-[#1E293B] whitespace-nowrap flex-shrink-0"
                      style={{ color: session.color || '#2563EB', border: `1px solid ${session.color}30` }}
                    >
                      {session.duration}
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2 md:mt-3 pl-4 md:pl-5">
                    <p className="text-[12px] md:text-[13px] text-[#6B7280] dark:text-[#94A3B8] flex items-center gap-1 md:gap-1.5">
                      <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                      {formatTimeRange(session.time)}
                    </p>
                    {session.room && (
                      <p className="text-[12px] md:text-[13px] text-[#6B7280] dark:text-[#94A3B8] flex items-center gap-1 md:gap-1.5 truncate">
                        <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                        <span className="truncate">Room: {session.room}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* MODAL VIEW SCHEDULE (TIMELINE) */}
      {showSchedule && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-[24px] md:rounded-3xl p-5 sm:p-6 md:p-8 w-full max-w-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-hidden flex flex-col transition-colors border dark:border-[#334155]">
            
            <button
              onClick={() => setShowSchedule(false)}
              className="absolute top-4 right-4 md:top-6 md:right-6 text-[#94a3b8] hover:text-[#ef4444] transition-colors cursor-pointer bg-[#f8fafc] dark:bg-[#0F172A] hover:bg-[#fee2e2] dark:hover:bg-red-500/20 p-2 rounded-full z-10"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            
            <div className="mb-6 md:mb-8 pr-8">
              <h2 className="text-[20px] md:text-[24px] font-bold text-[#0f172a] dark:text-white">Today's Schedule</h2>
              <p className="text-[#64748b] dark:text-[#94A3B8] mt-1 flex items-center gap-1.5 md:gap-2 text-[13px] md:text-[15px]">
                <CalendarIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            
            <div className="overflow-y-auto pr-2 md:pr-4 pb-4 custom-scrollbar">
              <div className="relative border-l-2 border-[#e2e8f0] dark:border-[#334155] ml-3 md:ml-4 space-y-6 md:space-y-8 mt-2">
                
                {todayClasses.length === 0 ? (
                  <p className="text-[14px] md:text-[15px] text-[#64748b] dark:text-[#94A3B8] pl-6 md:pl-8 py-4 italic">
                    Your schedule is clear for today! Take a break or catch up on some tasks.
                  </p>
                ) : (
                  todayClasses.map((item, index) => {
                    const color = item.color || '#2563EB';
                    const startTimeRaw = item.time.split(' - ')[0];
                    
                    return (
                      <div key={index} className="relative pl-6 md:pl-8">
                        <div 
                          className="absolute -left-[9px] md:-left-[11px] top-1 w-4 h-4 md:w-5 md:h-5 rounded-full border-[3px] md:border-[4px] border-white dark:border-[#1E293B] shadow-sm"
                          style={{ backgroundColor: color }}
                        ></div>
                        
                        <span className="text-[13px] md:text-[14px] font-bold text-[#475569] dark:text-[#CBD5E1] mb-2 block">
                          {formatTo12Hour(startTimeRaw)}
                        </span>
                        
                        <div 
                          className="p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer dark:!bg-[#0F172A] dark:!border-[#334155]"
                          style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}
                        >
                          <div className="flex flex-col sm:flex-row justify-start sm:justify-between items-start sm:items-center mb-1 gap-1 sm:gap-0">
                            <h4 className="text-[15px] md:text-[16px] font-bold" style={{ color: color }}>{item.subject}</h4>
                            <span 
                              className="px-2 py-0.5 md:py-1 rounded-md text-[10px] md:text-[12px] font-semibold dark:!bg-[#1E293B] dark:text-white w-fit"
                              style={{ backgroundColor: `${color}20`, color: color }}
                            >
                              Class
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2">
                            <p className="text-[12px] md:text-[14px] flex items-center gap-1" style={{ color: `${color}90` }}>
                              <Clock className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                              {item.duration}
                            </p>
                            {item.room && (
                              <p className="text-[12px] md:text-[14px] flex items-center gap-1 truncate" style={{ color: `${color}90` }}>
                                <span className="hidden sm:inline">|</span>
                                <MapPin className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                                <span className="truncate">Room: {item.room}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                
                <div className="relative pl-6 md:pl-8 pt-2 md:pt-4">
                  <div className="absolute -left-[7px] md:-left-[9px] top-[14px] md:top-5 w-3 h-3 md:w-4 md:h-4 rounded-full border-[2px] md:border-[3px] border-white dark:border-[#1E293B] bg-[#cbd5e1] dark:bg-[#475569]"></div>
                  <span className="text-[13px] md:text-[14px] font-bold text-[#94a3b8] dark:text-[#64748B] italic">End of day</span>
                </div>
                
              </div>
            </div>

            <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-[#f1f5f9] dark:border-[#334155] flex justify-end">
              <Button 
                onClick={() => setShowSchedule(false)} 
                style={{ backgroundColor: '#2563EB', color: 'white' }}
                className="w-full sm:w-auto cursor-pointer hover:opacity-90 transition-opacity py-2.5 md:py-3 text-[14px] md:text-[15px]"
              >
                Awesome, Got it!
              </Button>
            </div>
            
          </div>
        </div>
      )}
      
    </div>
  );
}
