import { useState, useEffect } from 'react';
import { User, Mail, Calendar, Award, Target, TrendingUp, Edit, X, ArrowRight, Plus, Loader2, CheckCircle2, Trash2, AlertTriangle, Lock } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input'; 
import { API_BASE_URL } from '../../api/axiosClient';

export default function Profile() {
  const [profile, setProfile] = useState({
    name: 'Loading...',
    email: 'Đang tải...',
    joinDate: 'Đang tải...',
    avatar: 'U',
    avatarUrl: '' 
  });

  const [realStats, setRealStats] = useState({ hours: 0, tasks: 0, subjects: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [unlockedAchievements, setUnlockedAchievements] = useState({
    taskMaster: false,
    bookworm: false,
    earlyBird: false,
    sevenDayStreak: false
  });

  const [goals, setGoals] = useState(() => {
    const savedGoals = localStorage.getItem('userGoals');
    if (savedGoals) return JSON.parse(savedGoals);
    return [
      { id: 1, title: 'Study 30 hours this week', current: 0, target: 30, color: '#2563EB', isAuto: true, type: 'hours' },
      { id: 2, title: 'Complete 20 tasks', current: 0, target: 20, color: '#22C55E', isAuto: true, type: 'tasks' },
      { id: 3, title: 'Create 5 active subjects', current: 0, target: 5, color: '#7C3AED', isAuto: true, type: 'subjects' },
      { id: 4, title: 'Read 2 technical books', current: 0, target: 2, color: '#F59E0B', isAuto: false } 
    ];
  });

  useEffect(() => {
    localStorage.setItem('userGoals', JSON.stringify(goals));
  }, [goals]);

  const [showAllGoals, setShowAllGoals] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', target: '', color: '#2563EB' });
  const colors = ['#2563EB', '#7C3AED', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4'];

  const [deleteGoalModalOpen, setDeleteGoalModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState(null);

  const displayedGoals = showAllGoals ? goals : goals.slice(0, 3); 

  // --- HÀM TÍNH THỜI GIAN ĐÃ SỬA ĐỂ NHẬN TIMESTAMP DẠNG SỐ ---
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
    const loginUser = localStorage.getItem('user');
    const editedProfile = localStorage.getItem('userProfile');

    let dbUser = {};
    if (loginUser) dbUser = JSON.parse(loginUser);

    const realEmail = dbUser.email || 'Chưa cập nhật email';
    let formattedDate = 'Chưa có thông tin';
    if (dbUser.createdAt) {
      const date = new Date(dbUser.createdAt);
      formattedDate = date.toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        day: '2-digit', month: '2-digit', year: 'numeric'
      }).replace(' ', ' - '); 
    }

    const fullName = dbUser.fullName || 'User';
    const nameParts = fullName.trim().split(' ');
    let initials = 'U';
    if (nameParts.length >= 2) {
      initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    } else {
      initials = fullName.substring(0, 2).toUpperCase();
    }

    if (editedProfile) {
      const parsed = JSON.parse(editedProfile);
      setProfile({
        name: parsed.name, email: realEmail, joinDate: formattedDate, 
        avatar: parsed.avatar, avatarUrl: parsed.avatarUrl || ''
      });
    } else {
      setProfile({
        name: fullName, email: realEmail, joinDate: formattedDate,
        avatar: initials, avatarUrl: ''
      });
    }

    const fetchRealData = async () => {
      const token = localStorage.getItem('token');
      try {
        const [analyticsRes, tasksRes] = await Promise.all([
          fetch(`${API_BASE_URL}/analytics/overview`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/tasks/getTask`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        let activities = [];

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          const completedTasks = tasksData
            .filter(t => t.status === 'DONE')
            .map(t => ({
              id: `task-${t.id}`,
              text: `Completed task "${t.title}"`,
              timestamp: new Date(t.updatedAt).getTime(),
              color: '#22C55E' 
            }));
          activities = [...activities, ...completedTasks];
        }

        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          const stats = analyticsData.data.stats;
          const totalSubs = analyticsData.data.stats.totalSubjectsCount || 0;
          
          setRealStats({
            hours: stats.totalHours || 0,
            tasks: stats.completedTasksCount || 0,
            subjects: totalSubs || 0
          });

          if (analyticsData.data.achievements) {
            setUnlockedAchievements(analyticsData.data.achievements);
          }

          setGoals(prev => prev.map(g => {
            if (g.isAuto) {
              if (g.type === 'hours') return { ...g, current: Number(stats.totalHours) || 0 };
              if (g.type === 'tasks') return { ...g, current: stats.completedTasksCount || 0 };
              if (g.type === 'subjects') return { ...g, current: totalSubs || 0 };
            }
            return g;
          }));

          if (analyticsData.data.recentSessions) {
            const sessions = analyticsData.data.recentSessions.map(s => ({
              id: `pomodoro-${s.id}`,
              text: `Focused for ${s.duration} minutes`,
              timestamp: new Date(s.createdAt).getTime(),
              color: '#2563EB' 
            }));
            activities = [...activities, ...sessions];
          }
        }

        const localGoals = JSON.parse(localStorage.getItem('userGoals') || '[]');
        const customGoals = localGoals
          .filter(g => !g.isAuto) 
          .map(g => ({
            id: `goal-${g.id}`,
            text: `Set a new goal: "${g.title}"`,
            timestamp: g.id, 
            color: '#7C3AED'
          }));
        activities = [...activities, ...customGoals];

        activities.sort((a, b) => b.timestamp - a.timestamp);
        setRecentActivities(activities.slice(0, 4));

      } catch (error) {
        console.error("Lỗi lấy dữ liệu Profile:", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchRealData();
  }, []);

  const [isEditing, setIsEditing] = useState(false);
  const [isViewingImage, setIsViewingImage] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', avatar: '', avatarUrl: '' });

  const handleEditClick = () => {
    setEditForm({ name: profile.name, avatar: profile.avatar, avatarUrl: profile.avatarUrl });
    setIsEditing(true);
  };

  const handleSave = () => {
    const updated = { ...profile, name: editForm.name, avatar: editForm.avatar, avatarUrl: editForm.avatarUrl };
    setProfile(updated);
    setIsEditing(false);
    localStorage.setItem('userProfile', JSON.stringify(updated));
    window.dispatchEvent(new Event('profileUpdated'));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditForm({ ...editForm, avatarUrl: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.target) return; 
    const goalToAdd = {
      id: Date.now(), title: newGoal.title, current: 0, target: parseInt(newGoal.target), color: newGoal.color, isAuto: false 
    };
    setGoals([...goals, goalToAdd]);
    setIsGoalModalOpen(false);
    setNewGoal({ title: '', target: '', color: '#2563EB' }); 
  };

  const handleIncrementGoal = (goalId) => {
    setGoals(prev => prev.map(g => {
      if (g.id === goalId && g.current < g.target) return { ...g, current: g.current + 1 };
      return g;
    }));
  };

  const confirmDeleteGoal = () => {
    if (!goalToDelete) return;
    const updatedGoals = goals.filter(g => g.id !== goalToDelete.id);
    setGoals(updatedGoals);
    setDeleteGoalModalOpen(false);
    setGoalToDelete(null);
    if (updatedGoals.length <= 3) setShowAllGoals(false);
  };

  const achievementsList = [
    { id: 'sevenDayStreak', icon: '🎯', title: '7-Day Streak', description: 'Studied for 7 consecutive days', color: '#2563EB' },
    { id: 'earlyBird', icon: '⚡', title: 'Early Bird', description: 'Started studying before 8 AM', color: '#F59E0B' },
    { id: 'taskMaster', icon: '🏆', title: 'Task Master', description: 'Completed 100 tasks', color: '#22C55E' },
    { id: 'bookworm', icon: '📚', title: 'Bookworm', description: 'Logged 50+ study hours', color: '#7C3AED' },
  ];

  const stats = [
    { label: 'Total Study Hours', value: `${realStats.hours}h`, icon: TrendingUp, color: '#2563EB' },
    { label: 'Tasks Completed', value: `${realStats.tasks}`, icon: Target, color: '#22C55E' },
    { label: 'Active Subjects', value: `${realStats.subjects}`, icon: Award, color: '#F59E0B' },
  ];

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <h1 className="dark:text-white">Profile</h1>
        <button 
          onClick={handleEditClick}
          className="flex flex-row items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] text-[#475569] dark:text-[#CBD5E1] rounded-[8px] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
        >
          <Edit className="w-4 h-4 flex-shrink-0" />
          <span className="font-semibold text-[14px] leading-none">Edit Profile</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-6">
          <div className="flex flex-col items-center mb-6">
            <div 
              className={`w-24 h-24 bg-gradient-to-br from-[#2563EB] to-[#7C3AED] rounded-full flex items-center justify-center mb-4 overflow-hidden shadow-md transition-all ${profile.avatarUrl ? 'cursor-pointer hover:ring-4 hover:ring-[#2563EB]/30' : ''}`}
              onClick={() => { if (profile.avatarUrl) setIsViewingImage(true); }}
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[32px] font-bold text-white">{profile.avatar}</span>
              )}
            </div>
            <h2 className="text-center mb-1 dark:text-white">{profile.name}</h2>
          </div>

          <div className="space-y-3 pt-6 border-t border-[#E5E7EB] dark:border-[#334155]">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-[#6B7280] dark:text-[#94A3B8]" />
              <div>
                <p className="text-[12px] text-[#6B7280] dark:text-[#64748B]">Email</p>
                <p className="text-[14px] text-[#111827] dark:text-[#CBD5E1]">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#6B7280] dark:text-[#94A3B8]" />
              <div>
                <p className="text-[12px] text-[#6B7280] dark:text-[#64748B]">Member Since</p>
                <p className="text-[14px] text-[#111827] dark:text-[#CBD5E1]">{profile.joinDate}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-6 pt-6 border-t border-[#E5E7EB] dark:border-[#334155]">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-[8px] border border-transparent dark:border-[#334155]">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                    <span className="text-[14px] text-[#6B7280] dark:text-[#94A3B8]">{stat.label}</span>
                  </div>
                  <span className="text-[16px] font-semibold text-[#111827] dark:text-white">
                    {isLoadingData ? <Loader2 className="w-4 h-4 animate-spin text-[#94A3B8]" /> : stat.value}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="dark:text-white">Current Goals</h2>
              
              {goals.length > 3 && (
                <button 
                  onClick={() => setShowAllGoals(!showAllGoals)}
                  className="text-[14px] font-bold text-primary dark:text-[#60A5FA] hover:text-[#1d4ed8] dark:hover:text-[#93C5FD] flex items-center gap-1 transition-colors group cursor-pointer px-2 py-1 rounded-md hover:bg-[#EFF6FF] dark:hover:bg-[#1E293B]"
                >
                  {showAllGoals ? 'View Less' : 'View All'} 
                  <ArrowRight className={`w-4 h-4 transition-transform ${showAllGoals ? 'rotate-180' : 'group-hover:translate-x-1'}`} />
                </button>
              )}
            </div>

            <div className="space-y-5 animate-in fade-in duration-300">
              {displayedGoals.map((goal) => {
                const rawProgress = (goal.current / goal.target) * 100;
                const progress = rawProgress > 100 ? 100 : rawProgress; 
                return (
                  <div key={goal.id} className="group relative rounded-xl p-2 -mx-2 hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[16px] font-medium text-[#111827] dark:text-white">{goal.title}</h4>
                        <button
                          onClick={() => { setGoalToDelete(goal); setDeleteGoalModalOpen(true); }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-all cursor-pointer"
                          title="Delete Goal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <span className="text-[14px] font-semibold flex items-center gap-1.5" style={{ color: goal.color }}>
                        {goal.current}/{goal.target}
                        {!goal.isAuto && goal.current < goal.target && (
                          <button 
                            onClick={() => handleIncrementGoal(goal.id)}
                            className="ml-2 w-5 h-5 rounded-full flex items-center justify-center text-white opacity-80 hover:opacity-100 hover:scale-110 transition-all cursor-pointer shadow-sm"
                            style={{ backgroundColor: goal.color }}
                            title="Add progress"
                          >
                            <Plus size={12} strokeWidth={3.5} />
                          </button>
                        )}
                        {goal.current >= goal.target && (
                          <CheckCircle2 size={16} className="ml-1" />
                        )}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-[#E5E7EB] dark:bg-[#0F172A] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%`, backgroundColor: goal.color }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={() => setIsGoalModalOpen(true)}
              className="mt-6 w-full py-3.5 bg-[#F8FAFC] dark:bg-[#0F172A] border-2 border-dashed border-[#E5E7EB] dark:border-[#334155] text-primary dark:text-[#60A5FA] rounded-[12px] font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-[#EFF6FF] dark:hover:bg-[#1E293B] hover:border-primary dark:hover:border-[#60A5FA] transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              Add New Goal
            </button>
          </Card>

          <Card className="p-6">
            <h2 className="mb-6 dark:text-white">Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievementsList.map((achievement) => {
                const isUnlocked = unlockedAchievements[achievement.id]; 
                
                return (
                  <div 
                    key={achievement.id} 
                    className={`p-4 border-2 rounded-[12px] transition-all relative overflow-hidden bg-white dark:bg-[#1E293B] ${
                      isUnlocked 
                        ? 'shadow-md hover:-translate-y-0.5 cursor-pointer' 
                        : 'border-[#E5E7EB] dark:border-[#334155] opacity-60 grayscale cursor-not-allowed'
                    }`}
                    style={isUnlocked ? { borderColor: achievement.color } : {}}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className={`w-12 h-12 rounded-[12px] flex items-center justify-center text-2xl flex-shrink-0 ${isUnlocked ? 'dark:opacity-80' : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#94A3B8]'}`}
                        style={isUnlocked ? { backgroundColor: `${achievement.color}20` } : {}}
                      >
                        {isUnlocked ? achievement.icon : <Lock className="w-5 h-5" />}
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-6">
                        <h4 className={`text-[16px] font-semibold mb-1 ${isUnlocked ? 'text-[#111827] dark:text-white' : 'text-[#6B7280] dark:text-[#94A3B8]'}`}>
                          {achievement.title}
                        </h4>
                        <p className="text-[14px] text-[#6B7280] dark:text-[#94A3B8]">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isUnlocked 
                        ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' 
                        : 'bg-[#F1F5F9] text-[#94A3B8] dark:bg-[#334155] dark:text-[#64748B]'
                    }`}>
                      {isUnlocked ? 'Unlocked' : 'Locked'}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* --- GIAO DIỆN RECENT ACTIVITY ĐÃ NÂNG CẤP --- */}
          <Card className="p-6">
            <h2 className="mb-6 dark:text-white">Recent Activity</h2>
            {isLoadingData ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-[#94A3B8]" />
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((act) => (
                  <div key={act.id} className="flex gap-4 pb-4 border-b border-[#E5E7EB] dark:border-[#334155] last:border-0 last:pb-0 animate-in fade-in duration-500">
                    <div 
                      className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: act.color, boxShadow: `0 0 8px ${act.color}` }}
                    ></div>
                    <div className="flex-1">
                      <p className="text-[14px] text-[#111827] dark:text-[#E2E8F0] font-medium">{act.text}</p>
                      <p className="text-[12px] text-[#6B7280] dark:text-[#64748B] mt-1">{timeAgo(act.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-[#6B7280] dark:text-[#94A3B8] text-[14px]">
                No recent activity. Start completing some tasks!
              </div>
            )}
          </Card>
        </div>
      </div>

      {deleteGoalModalOpen && goalToDelete && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] border dark:border-[#334155] rounded-3xl p-8 w-full max-w-[440px] shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#FEF2F2] dark:bg-[#451a1a] rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
              </div>
              <h2 className="text-[24px] font-bold text-[#111827] dark:text-white mb-2">Delete Goal?</h2>
              <p className="text-[#6B7280] dark:text-[#94A3B8] text-[15px] leading-relaxed">
                Are you sure you want to remove the goal <span className="font-semibold text-gray-800 dark:text-gray-200">"{goalToDelete.title}"</span>? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex gap-3 mt-10">
              <button 
                onClick={() => setDeleteGoalModalOpen(false)}
                className="flex-1 px-6 py-3 bg-[#F8FAFC] dark:bg-[#0F172A] text-[#475569] dark:text-[#CBD5E1] font-bold rounded-xl border border-[#E5E7EB] dark:border-[#334155] hover:bg-[#F1F5F9] dark:hover:bg-[#1e293b] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteGoal}
                className="flex-1 px-6 py-3 bg-[#EF4444] text-white font-bold rounded-xl shadow-lg shadow-red-500/20 hover:bg-[#dc2626] hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] border dark:border-[#334155] rounded-[24px] p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsEditing(false)}
              className="absolute top-5 right-5 text-[#94a3b8] hover:text-[#ef4444] transition-colors cursor-pointer bg-[#f8fafc] dark:bg-[#0F172A] hover:bg-[#fee2e2] dark:hover:bg-red-500/20 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-[#111827] dark:text-white">Edit Profile</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-[14px] font-medium text-[#374151] dark:text-white mb-2">Profile Picture</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155] rounded-full flex items-center justify-center overflow-hidden shrink-0">
                    {editForm.avatarUrl ? (
                      <img src={editForm.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[20px] font-bold text-[#6B7280] dark:text-[#94A3B8]">{editForm.avatar || 'JD'}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="block w-full text-sm text-[#6B7280] dark:text-[#94A3B8] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#EFF6FF] dark:file:bg-[#1e3a8a]/40 file:text-primary dark:file:text-[#60A5FA] hover:file:bg-[#DBEAFE] dark:hover:file:bg-[#1e3a8a]/60 transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              <Input 
                label="Full Name" 
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Enter your full name"
              />
              <Input 
                label="Avatar Initials" 
                maxLength={2}
                value={editForm.avatar}
                onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value.toUpperCase() })}
                placeholder="e.g. TP"
              />
              <div className="pt-4 flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setIsEditing(false)} className="cursor-pointer px-6">
                  <span className="font-semibold">Cancel</span>
                </Button>
                <button 
                  onClick={handleSave}
                  className="flex flex-row items-center justify-center px-6 py-2.5 bg-primary text-white rounded-[10px] shadow-md transition-all hover:-translate-y-0.5 hover:bg-primary/90 cursor-pointer whitespace-nowrap"
                >
                  <span className="font-semibold text-[15px] leading-none">Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isGoalModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] border dark:border-[#334155] rounded-3xl p-8 w-full max-w-[450px] shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsGoalModalOpen(false)}
              className="absolute top-6 right-6 text-[#94a3b8] hover:text-[#ef4444] transition-colors cursor-pointer bg-[#f8fafc] dark:bg-[#0F172A] hover:bg-[#fee2e2] dark:hover:bg-red-500/20 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-6">
              <h2 className="text-[24px] font-bold text-[#0f172a] dark:text-white">Create New Goal</h2>
              <p className="text-[#64748b] dark:text-[#94A3B8] text-[14px] mt-1">Set a target to keep yourself motivated.</p>
            </div>
            
            <div className="space-y-6">
              <Input 
                label="Goal Title" 
                placeholder="e.g., Read 3 books this month" 
                value={newGoal.title}
                onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
              />
              
              <Input 
                label="Target Amount (Number)" 
                type="number" 
                placeholder="e.g., 3" 
                value={newGoal.target}
                onChange={(e) => setNewGoal({...newGoal, target: e.target.value})}
              />

              <div>
                <label className="block text-[14px] font-medium text-[#111827] dark:text-white mb-3">Goal Theme Color</label>
                <div className="flex gap-3 flex-wrap">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewGoal({...newGoal, color})}
                      className={`w-10 h-10 rounded-full transition-all cursor-pointer shadow-sm ${
                        newGoal.color === color ? 'ring-4 ring-offset-2 dark:ring-offset-[#1E293B] scale-110' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color, ringColor: `${color}50` }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#f1f5f9] dark:border-[#334155] flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setIsGoalModalOpen(false)} className="cursor-pointer px-6">
                  <span className="font-semibold">Cancel</span>
                </Button>
                <button 
                  onClick={handleAddGoal}
                  className="flex flex-row items-center justify-center gap-2 px-6 py-2.5 text-white rounded-[10px] shadow-md transition-all hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
                  style={{ backgroundColor: newGoal.color }}
                >
                  <Plus className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
                  <span className="font-semibold text-[15px] leading-none">Add Goal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isViewingImage && profile.avatarUrl && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setIsViewingImage(false)} 
        >
          <button
            onClick={() => setIsViewingImage(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all cursor-pointer z-50"
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={profile.avatarUrl} 
            alt="Full Avatar" 
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-in zoom-in duration-200 cursor-default"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
}
