import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Settings, X, Save, Loader2, Target, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react'; 
import Card from '../components/Card';
import Button from '../components/Button';
import { API_BASE_URL } from '../../api/axiosClient';

export default function Pomodoro() {
  const [durations, setDurations] = useState({ focus: 25, shortBreak: 5, longBreak: 15 });
  
  const modes = {
    focus: { duration: durations.focus * 60, label: 'Focus Time', color: '#2563EB' },
    shortBreak: { duration: durations.shortBreak * 60, label: 'Short Break', color: '#22C55E' },
    longBreak: { duration: durations.longBreak * 60, label: 'Long Break', color: '#7C3AED' },
  };

  // --- LẤY DỮ LIỆU TỪ BỘ NHỚ KHI VỪA MỞ TRANG ĐỂ ĐỒNG HỒ KHÔNG BỊ RESET ---
  const [mode, setMode] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('pomodoroTimer'));
    return saved?.mode || 'focus';
  });

  const [time, setTime] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('pomodoroTimer'));
    if (saved && saved.isRunning) {
      // Nếu lúc nãy đang chạy, tính toán số giây đã trôi qua kể từ lúc chuyển trang
      const elapsed = Math.floor((Date.now() - saved.lastTick) / 1000);
      const remaining = saved.time - elapsed;
      return remaining > 0 ? remaining : 0;
    }
    return saved?.time || (durations.focus * 60);
  });

  const [isRunning, setIsRunning] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('pomodoroTimer'));
    return saved?.isRunning || false;
  });

  const [selectedTaskId, setSelectedTaskId] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('pomodoroTimer'));
    return saved?.selectedTaskId || '';
  });

  const [showSettings, setShowSettings] = useState(false);
  const [tempDurations, setTempDurations] = useState(durations);
  
  const [sessions, setSessionsCompleted] = useState(() => {
    const savedData = localStorage.getItem('dailyPomodoro');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      if (parsed.date === new Date().toLocaleDateString()) return parsed.count;
    }
    return 0; 
  });

  useEffect(() => {
    localStorage.setItem('dailyPomodoro', JSON.stringify({
      count: sessions,
      date: new Date().toLocaleDateString()
    }));
  }, [sessions]);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [tasks, setTasks] = useState([]); 
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000); 
  };

  useEffect(() => {
    const fetchTasks = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`${API_BASE_URL}/tasks/getTask`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const activeTasks = data.filter(t => t.status !== 'DONE');
          setTasks(activeTasks);
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách task:", error);
      } finally {
        setLoadingTasks(false);
      }
    };
    fetchTasks();
  }, []);

  const saveStudySessionToDB = async (durationInMinutes) => {
    if (!selectedTaskId) return; 

    setIsSaving(true);
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/studySession/saveTime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          taskId: selectedTaskId,
          duration: durationInMinutes 
        })
      });

      if (!response.ok) showToast("Failed to save study session", "error");
      else showToast(`Awesome! ${durationInMinutes} mins saved to your task.`, "success");
    } catch (error) {
      showToast("Server connection error", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // --- LOGIC LƯU LẠI THỜI GIAN MỖI GIÂY ---
  useEffect(() => {
    let interval = null;
    
    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime(t => {
          const newTime = t - 1;
          // Lưu vào bộ nhớ ngầm để lỡ chuyển trang vẫn giữ nguyên
          localStorage.setItem('pomodoroTimer', JSON.stringify({
            isRunning: true, time: newTime, mode, selectedTaskId, lastTick: Date.now()
          }));
          return newTime;
        });
      }, 1000);
    } else if (isRunning && time <= 0) {
      setIsRunning(false); 
      if (mode === 'focus') {
        setSessionsCompleted(s => s + 1);
        saveStudySessionToDB(durations.focus); 
        if ((sessions + 1) % 4 === 0) handleModeChange('longBreak');
        else handleModeChange('shortBreak');
      } else {
        handleModeChange('focus');
      }
    }
    
    return () => clearInterval(interval);
  }, [isRunning, time, mode, sessions, durations.focus, selectedTaskId]); 

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const progress = ((modes[mode].duration - time) / modes[mode].duration) * 100;

  // --- HÀM HELPER: GỌI API ĐỔI TRẠNG THÁI TASK ---
  const updateTaskStatusAPI = async (status) => {
    if (!selectedTaskId) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/updateStatus/${selectedTaskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update task status");
      }
    } catch (error) {
      console.error(`Lỗi khi chuyển trạng thái sang ${status}`, error);
    }
  };

  // --- SỰ KIỆN KHI BẤM NÚT ---
  const handleStart = async () => {
    if (mode === 'focus' && !selectedTaskId) {
      return showToast("Please select a task to focus on before starting!", "warning");
    }
    
    setIsRunning(true);
    localStorage.setItem('pomodoroTimer', JSON.stringify({
      isRunning: true, time, mode, selectedTaskId, lastTick: Date.now()
    }));

    // Bấm Start -> Đẩy task sang In Progress
    if (mode === 'focus' && selectedTaskId) {
      updateTaskStatusAPI('IN_PROGRESS');
    }
  };
  
  const handlePause = () => {
    setIsRunning(false);
    localStorage.setItem('pomodoroTimer', JSON.stringify({
      isRunning: false, time, mode, selectedTaskId, lastTick: Date.now()
    }));

    // Bấm Pause -> Trả task về lại Todo
    if (mode === 'focus' && selectedTaskId) {
      updateTaskStatusAPI('TODO');
    }
  };

  const handleReset = () => { 
    setIsRunning(false); 
    setTime(modes[mode].duration); 
    localStorage.setItem('pomodoroTimer', JSON.stringify({
      isRunning: false, time: modes[mode].duration, mode, selectedTaskId, lastTick: Date.now()
    }));

    // Bấm Reset -> Trả task về lại Todo
    if (mode === 'focus' && selectedTaskId) {
      updateTaskStatusAPI('TODO');
    }
  };
  
  const handleModeChange = (newMode) => { 
    setMode(newMode); 
    setTime(modes[newMode].duration); 
    setIsRunning(false); 
    localStorage.setItem('pomodoroTimer', JSON.stringify({
      isRunning: false, time: modes[newMode].duration, mode: newMode, selectedTaskId, lastTick: Date.now()
    }));
  };
  
  const handleSaveSettings = () => { 
    setDurations(tempDurations); 
    setTime(tempDurations[mode] * 60); 
    setIsRunning(false); 
    setShowSettings(false); 
    showToast("Timer settings saved!", "success");
  };
  
  const handleOpenSettings = () => { 
    setTempDurations(durations); 
    setShowSettings(true); 
  };

  return (
    <div className="space-y-6 relative">
      
      {toast.show && (
        <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-[12px] shadow-2xl animate-in slide-in-from-right-8 fade-in duration-300 ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 
          toast.type === 'warning' ? 'bg-amber-500 text-white' : 
          'bg-[#10B981] text-white'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={22} /> : 
           toast.type === 'warning' ? <AlertTriangle size={22} /> : 
           <CheckCircle2 size={22} />}
          <span className="font-medium text-[14px] pr-2">{toast.message}</span>
          <button onClick={() => setToast({ show: false, message: '', type: 'success' })} className="ml-auto opacity-70 hover:opacity-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="dark:text-white">Pomodoro Timer</h1>
          <p className="text-[16px] text-[#6B7280] dark:text-[#94A3B8] mt-2">Stay focused and productive with the Pomodoro Technique</p>
        </div>
        <button 
          onClick={handleOpenSettings}
          className="flex flex-row items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] text-[#475569] dark:text-[#CBD5E1] rounded-[8px] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
        >
          <Settings className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
          <span className="font-semibold text-[15px] leading-none">Settings</span>
        </button>
      </div>

      {isSaving && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] px-4 py-2 rounded-full text-sm font-medium flex items-center shadow-sm animate-in slide-in-from-top-4 z-50">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Saving session to Dashboard...
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        <Card className="lg:col-span-2 p-8 relative overflow-hidden flex flex-col items-center">
          
          <div className="w-full max-w-md mb-8">
            <label className="block text-[14px] font-bold text-[#111827] dark:text-white mb-2 flex items-center justify-center gap-2">
              <Target className="w-4 h-4 text-primary" /> What are you working on?
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => {
                // ĐÃ SỬA Ở ĐÂY: Reset lại time khi đổi task mới
                const newTaskId = e.target.value;
                const resetTime = modes[mode].duration;
                
                setSelectedTaskId(newTaskId);
                setTime(resetTime);
                setIsRunning(false);
                
                localStorage.setItem('pomodoroTimer', JSON.stringify({ 
                  isRunning: false, 
                  time: resetTime, 
                  mode, 
                  selectedTaskId: newTaskId, 
                  lastTick: Date.now() 
                }));
              }}
              disabled={isRunning} 
              className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-[#0F172A] border-2 border-[#E5E7EB] dark:border-[#334155] rounded-[12px] text-[#111827] dark:text-white focus:outline-none focus:ring-0 focus:border-primary transition-colors cursor-pointer disabled:opacity-50"
            >
              <option value="" disabled>-- Select a task to focus on --</option>
              {loadingTasks ? (
                <option disabled>Loading tasks...</option>
              ) : (
                tasks.map(task => (
                  <option key={task.id} value={task.id}>
                    {task.title} {task.subject?.name ? `(${task.subject.name})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex justify-center gap-4 mb-8">
            {Object.entries(modes).map(([key, { label, color }]) => (
              <button
                key={key}
                onClick={() => handleModeChange(key)}
                className={`px-6 py-2 rounded-[8px] text-[16px] font-medium transition-all ${
                  mode === key ? 'text-white shadow-lg scale-105' : 'bg-[#F8FAFC] dark:bg-[#0F172A] text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#E5E7EB] dark:hover:bg-[#334155]'
                }`}
                style={mode === key ? { backgroundColor: color } : {}}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center mb-12">
            <div className="relative">
              <svg className="w-80 h-80 transform -rotate-90" viewBox="0 0 320 320">
                <circle cx="160" cy="160" r="140" stroke="currentColor" className="text-[#F8FAFC] dark:text-[#0F172A]" strokeWidth="12" fill="none" />
                <circle cx="160" cy="160" r="140" stroke={modes[mode].color} strokeWidth="12" fill="none" strokeDasharray={`${2 * Math.PI * 140}`} strokeDashoffset={`${2 * Math.PI * 140 * (1 - progress / 100)}`} strokeLinecap="round" className="transition-all duration-1000 ease-linear" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="text-[72px] font-bold text-[#111827] dark:text-white tabular-nums tracking-tight">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
                <div className="text-[20px] text-[#6B7280] dark:text-[#94A3B8] mt-1 font-medium">{modes[mode].label}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 w-full max-w-md">
            {!isRunning ? (
              <Button variant="primary" size="lg" onClick={handleStart} className="flex-1 hover:scale-105 transition-transform cursor-pointer" style={{ backgroundColor: modes[mode].color, borderColor: modes[mode].color }}>
                <Play className="w-6 h-6 mr-2 fill-current" /> Start
              </Button>
            ) : (
              <Button variant="warning" size="lg" onClick={handlePause} className="flex-1 hover:scale-105 transition-transform cursor-pointer" style={{ backgroundColor: '#F59E0B', borderColor: '#F59E0B', color: 'white' }}>
                <Pause className="w-6 h-6 mr-2 fill-current" /> Pause
              </Button>
            )}
            <Button 
              variant="outline" 
              size="lg" 
              onClick={handleReset} 
              className="px-8 cursor-pointer hover:bg-[#F8FAFC] dark:!bg-transparent dark:hover:!bg-[#334155] dark:!border-[#475569] dark:!text-white transition-colors"
            >
              <RotateCcw className="w-6 h-6" />
            </Button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-[16px] font-semibold text-[#111827] dark:text-white mb-4">Daily Goal</h3>
            <div className="text-center py-6">
              <div className="text-[56px] font-bold text-primary dark:text-[#60A5FA] mb-1 leading-none">{sessions}</div>
              <p className="text-[14px] text-[#6B7280] dark:text-[#94A3B8] font-medium">Completed Sessions</p>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`h-2.5 rounded-full transition-colors duration-500 ${i < sessions ? 'bg-primary dark:bg-[#3B82F6] shadow-sm' : 'bg-[#E2E8F0] dark:bg-[#334155]'}`}></div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-[16px] font-semibold text-[#111827] dark:text-white mb-4">How it Works</h3>
            <div className="space-y-5">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-[#EFF6FF] dark:bg-[#1e3a8a]/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[14px] font-bold text-primary dark:text-[#60A5FA]">1</span>
                </div>
                <div>
                  <p className="text-[14px] text-[#111827] dark:text-white font-semibold">Select a Task</p>
                  <p className="text-[13px] text-[#6B7280] dark:text-[#94A3B8] mt-0.5">Choose what to focus on</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-[#F0FDF4] dark:bg-[#14532d]/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[14px] font-bold text-[#22C55E] dark:text-[#4ade80]">2</span>
                </div>
                <div>
                  <p className="text-[14px] text-[#111827] dark:text-white font-semibold">Focus for 25 minutes</p>
                  <p className="text-[13px] text-[#6B7280] dark:text-[#94A3B8] mt-0.5">Time will be saved automatically</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-[#FAF5FF] dark:bg-[#5b21b6]/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[14px] font-bold text-[#7C3AED] dark:text-[#a78bfa]">3</span>
                </div>
                <div>
                  <p className="text-[14px] text-[#111827] dark:text-white font-semibold">Take a break</p>
                  <p className="text-[13px] text-[#6B7280] dark:text-[#94A3B8] mt-0.5">5 mins short, 15 mins long</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] dark:border dark:border-[#334155] rounded-3xl p-8 w-full max-w-[400px] shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 text-[#94a3b8] hover:text-[#ef4444] transition-colors cursor-pointer bg-[#f8fafc] dark:bg-[#0F172A] hover:bg-[#fee2e2] dark:hover:bg-red-500/20 p-2 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <div className="mb-6">
              <h2 className="text-[24px] font-bold text-[#0f172a] dark:text-white">Timer Settings</h2>
              <p className="text-[#64748b] dark:text-[#94A3B8] text-[14px] mt-1">Customize your Pomodoro intervals.</p>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-[14px] font-medium text-[#111827] dark:text-white mb-2 flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-primary"></div>Focus Time <span className="text-[#6B7280] dark:text-[#94A3B8] font-normal">(min)</span></label>
                <input type="number" min="1" value={tempDurations.focus} onChange={(e) => setTempDurations({...tempDurations, focus: Number(e.target.value)})} className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-primary transition-all text-[15px] font-semibold text-[#111827] dark:text-white" />
              </div>
              <div>
                <label className="block text-[14px] font-medium text-[#111827] dark:text-white mb-2 flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]"></div>Short Break <span className="text-[#6B7280] dark:text-[#94A3B8] font-normal">(min)</span></label>
                <input type="number" min="1" value={tempDurations.shortBreak} onChange={(e) => setTempDurations({...tempDurations, shortBreak: Number(e.target.value)})} className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E] transition-all text-[15px] font-semibold text-[#111827] dark:text-white" />
              </div>
              <div>
                <label className="block text-[14px] font-medium text-[#111827] dark:text-white mb-2 flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]"></div>Long Break <span className="text-[#6B7280] dark:text-[#94A3B8] font-normal">(min)</span></label>
                <input type="number" min="1" value={tempDurations.longBreak} onChange={(e) => setTempDurations({...tempDurations, longBreak: Number(e.target.value)})} className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all text-[15px] font-semibold text-[#111827] dark:text-white" />
              </div>
              <div className="pt-5 border-t border-[#f1f5f9] dark:border-[#334155] flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowSettings(false)} className="cursor-pointer px-5 dark:border-[#475569] dark:text-[#CBD5E1]">
                  <span className="font-semibold">Cancel</span>
                </Button>
                <button onClick={handleSaveSettings} className="flex flex-row items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-[10px] hover:opacity-90 shadow-md transition-all hover:-translate-y-0.5 cursor-pointer whitespace-nowrap">
                  <Save className="w-4 h-4 flex-shrink-0" />
                  <span className="font-semibold text-[15px] leading-none">Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
