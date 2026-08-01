import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Loader2, Trash2, AlertCircle, CheckCircle2, AlertTriangle, Palette } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { API_BASE_URL } from '../../api/axiosClient';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [view, setView] = useState('week'); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [schedules, setSchedules] = useState([]); 

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' }); 
  const [confirmDialog, setConfirmDialog] = useState({ show: false, scheduleId: null });

  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDays, setSelectedDays] = useState([]); 
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [room, setRoom] = useState('');
  const [recurrence, setRecurrence] = useState('EVERY_WEEK');
  const [selectedColor, setSelectedColor] = useState('#2563EB'); 

  const PRESET_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

  const weekDays = [
    { id: 1, label: 'Mon', full: 'Monday' }, { id: 2, label: 'Tue', full: 'Tuesday' },
    { id: 3, label: 'Wed', full: 'Wednesday' }, { id: 4, label: 'Thu', full: 'Thursday' },
    { id: 5, label: 'Fri', full: 'Friday' }, { id: 6, label: 'Sat', full: 'Saturday' }, { id: 0, label: 'Sun', full: 'Sunday' }
  ];

  const hours = Array.from({ length: 23 }, (_, i) => i + 1); 
  const HOUR_HEIGHT = 60; 
  const TOP_OFFSET = 30;  
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNamesShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; 
  const dayNamesFull = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000); 
  };

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      const [subRes, schRes] = await Promise.all([
        fetch(`${API_BASE_URL}/subjects/getSubject`, { headers }),
        fetch(`${API_BASE_URL}/schedule/all`, { headers })
      ]);
      if (subRes.ok) { const subData = await subRes.json(); setSubjects(subData.data || []); }
      if (schRes.ok) { const schData = await schRes.json(); setSchedules(schData || []); }
    } catch (error) {
      showToast("Lỗi kết nối máy chủ!", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleDay = (dayId) => setSelectedDays(prev => prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]);
  const handleDeleteClick = (id, e) => { e.stopPropagation(); setConfirmDialog({ show: true, scheduleId: id }); };

  const executeDelete = async () => {
    if (!confirmDialog.show || !confirmDialog.scheduleId) return;
    const id = confirmDialog.scheduleId;
    setConfirmDialog({ show: false, scheduleId: null }); 
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/schedule/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        setSchedules(schedules.filter(sch => sch.id !== id));
        showToast("Đã xóa lịch học thành công!", "success");
      } else {
        const err = await response.json(); showToast(err.message || "Không thể xóa lịch học!", "error");
      }
    } catch (error) { showToast("Đã xảy ra lỗi khi xóa!", "error"); }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (confirmDialog.show && event.key === 'Enter') executeDelete();
      if (confirmDialog.show && event.key === 'Escape') setConfirmDialog({ show: false, scheduleId: null });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmDialog]); 

  const timeToMinutesFrom1AM = (timeString) => {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return (hours * 60) + minutes - 60; 
  };

  const checkOverlap = () => {
    const newStartMins = timeToMinutesFrom1AM(startTime);
    let newEndMins = timeToMinutesFrom1AM(endTime);
    if (!endTime || newEndMins <= newStartMins) newEndMins = newStartMins + 60; 

    for (const day of selectedDays) {
      const classesOnDay = schedules.filter(sch => sch.dayOfWeek === day);
      for (const cls of classesOnDay) {
        const existStartMins = timeToMinutesFrom1AM(cls.startTime);
        let existEndMins = timeToMinutesFrom1AM(cls.endTime);
        if (!cls.endTime || existEndMins <= existStartMins) existEndMins = existStartMins + 60;
        if (newStartMins < existEndMins && newEndMins > existStartMins) {
          const dayName = weekDays.find(w => w.id === day)?.label || 'Ngày này';
          return { isOverlap: true, message: `Trùng giờ môn "${cls.subject?.name || 'Class'}" vào ${dayName} (${cls.startTime} - ${cls.endTime || '?'}).` };
        }
      }
    }
    return { isOverlap: false };
  };

  const handleSubmit = async () => {
    if (!selectedSubject || selectedDays.length === 0 || !startTime || !endTime) {
      return showToast("Vui lòng chọn môn học, ngày, giờ bắt đầu và giờ kết thúc.", "warning");
    }
    if (startTime >= endTime) {
      return showToast("Giờ kết thúc phải sau giờ bắt đầu.", "warning");
    }
    const overlapCheck = checkOverlap();
    if (overlapCheck.isOverlap) return showToast(overlapCheck.message, "warning");

    setSaving(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/schedule/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ subjectId: selectedSubject, daysOfWeek: selectedDays, startTime, endTime, room, recurrence, color: selectedColor })
      });
      if (response.ok) {
        setIsModalOpen(false); setSelectedSubject(''); setSelectedDays([]); setStartTime(''); setEndTime(''); setRoom(''); setRecurrence('EVERY_WEEK'); setSelectedColor('#2563EB'); 
        fetchData(); showToast("Tạo lịch học mới thành công!", "success");
      } else {
        const err = await response.json(); showToast(err.message || "Tạo lịch học thất bại!", "error");
      }
    } catch (error) { showToast("Lỗi máy chủ khi tạo lịch!", "error"); } finally { setSaving(false); }
  };

  const handleSubjectChange = (e) => {
    const subId = e.target.value; setSelectedSubject(subId);
    const foundSub = subjects.find(s => s.id === subId);
    if (foundSub && foundSub.colorCode) setSelectedColor(foundSub.colorCode);
  };

  const changeDate = (amount) => {
    const newDate = new Date(currentDate);
    if (view === 'day') newDate.setDate(newDate.getDate() + amount);
    if (view === 'week') newDate.setDate(newDate.getDate() + (amount * 7));
    if (view === 'month') newDate.setMonth(newDate.getMonth() + amount);
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  const getDaysInWeek = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay(); 
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); 
    startOfWeek.setDate(diff);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek); d.setDate(d.getDate() + i); days.push(d);
    }
    return days;
  };

  const getHeaderDateText = () => {
    if (view === 'day') {
      const jsDay = currentDate.getDay(); const adjustedDayIndex = jsDay === 0 ? 6 : jsDay - 1; 
      return `${currentDate.getDate().toString().padStart(2, '0')} ${monthNames[currentDate.getMonth()].substring(0, 3)}, ${dayNamesFull[adjustedDayIndex]}, ${currentDate.getFullYear()}`;
    }
    if (view === 'week') {
      const weekDays = getDaysInWeek(); const firstDay = weekDays[0]; const lastDay = weekDays[6];
      const startMonth = monthNames[firstDay.getMonth()].substring(0, 3); const endMonth = monthNames[lastDay.getMonth()].substring(0, 3);
      if (firstDay.getMonth() === lastDay.getMonth()) return `${firstDay.getDate().toString().padStart(2, '0')} - ${lastDay.getDate().toString().padStart(2, '0')} ${startMonth}, ${currentDate.getFullYear()}`;
      else return `${firstDay.getDate().toString().padStart(2, '0')} ${startMonth} - ${lastDay.getDate().toString().padStart(2, '0')} ${endMonth}, ${currentDate.getFullYear()}`;
    }
    if (view === 'month') return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  const formatHour = (hour) => { const ampm = hour >= 12 ? 'PM' : 'AM'; const h = hour % 12 || 12; return `${h} ${ampm}`; };
  const isSameDay = (d1, d2) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  const getMonthGrid = () => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 
    const grid = [];
    for (let i = 0; i < startOffset; i++) grid.push(null);
    for (let i = 1; i <= daysInMonth; i++) grid.push(i);
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  };

  const renderScheduleBlock = (schedule) => {
    const startMins = timeToMinutesFrom1AM(schedule.startTime);
    let endMins = timeToMinutesFrom1AM(schedule.endTime);
    if (!schedule.endTime || endMins <= startMins) endMins = startMins + 60; 

    const topPosition = startMins + TOP_OFFSET; 
    let blockHeight = endMins - startMins;
    if (blockHeight < 30) blockHeight = 30;
    if (isNaN(topPosition) || topPosition < TOP_OFFSET) return null;
    const color = schedule.color || schedule.subject?.colorCode || '#2563EB';

    return (
      <div 
        key={schedule.id}
        className="absolute left-1 right-1 rounded-[6px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex flex-col p-1.5 transition-all hover:shadow-md cursor-pointer group z-40 overflow-hidden"
        style={{
          top: `${topPosition}px`, height: `${blockHeight}px`, backgroundColor: `${color}1A`, 
          borderLeft: `4px solid ${color}`, borderTop: `1px solid ${color}30`, borderRight: `1px solid ${color}30`, borderBottom: `1px solid ${color}30`,
        }}
      >
        <div className="flex justify-between items-start w-full">
          <div className="text-[11px] font-bold text-[#111827] dark:text-white truncate pr-2">{schedule.subject?.name || 'Class'}</div>
          <button onClick={(e) => handleDeleteClick(schedule.id, e)} className="hidden group-hover:flex items-center justify-center w-5 h-5 bg-white dark:bg-[#1E293B] rounded-[4px] hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors z-50" style={{ border: `1px solid ${color}40` }} title="Xóa môn học này">
            <Trash2 size={12} strokeWidth={2.5} />
          </button>
          <div className="text-[8px] font-bold px-1 py-0.5 rounded-[4px] bg-white dark:bg-[#1E293B] text-gray-500 uppercase tracking-wider block group-hover:hidden" style={{ border: `1px solid ${color}40` }}>Class</div>
        </div>
        {blockHeight > 45 && (
          <>
            <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-medium truncate mt-0.5">{schedule.startTime} {schedule.endTime ? `- ${schedule.endTime}` : ''}</div>
            {schedule.room && (<div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] truncate mt-auto">{schedule.room}</div>)}
          </>
        )}
      </div>
    );
  };

  const scrollContainerRef = useRef(null);
  useEffect(() => {
    if (scrollContainerRef.current && (view === 'day' || view === 'week')) {
      scrollContainerRef.current.scrollTop = 7 * HOUR_HEIGHT; 
    }
  }, [view]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-[#6B7280]">Loading your schedule...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 relative h-[calc(100vh-100px)] flex flex-col">
      {/* HEADER LỊCH */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-[10px] p-1 shadow-sm w-full sm:w-auto justify-between">
          <button onClick={() => changeDate(-1)} className="p-1.5 rounded-[6px] hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-colors text-[#6B7280] dark:text-[#94A3B8] cursor-pointer">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-[13px] md:text-[15px] font-bold text-[#111827] dark:text-white px-2 md:px-5 text-center min-w-[150px] md:min-w-[200px]">
            {getHeaderDateText()}
          </span>
          <button onClick={() => changeDate(1)} className="p-1.5 rounded-[6px] hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-colors text-[#6B7280] dark:text-[#94A3B8] cursor-pointer">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto justify-between">
          <div className="flex bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-[10px] p-1 shadow-sm w-full sm:w-auto">
            {['Day', 'Week', 'Month'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v.toLowerCase())}
                className={`flex-1 sm:flex-none px-3 py-1.5 md:px-5 md:py-2 text-[12px] md:text-[14px] font-bold rounded-[8px] transition-all cursor-pointer ${
                  view === v.toLowerCase() ? 'bg-primary text-white shadow-md' : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A]'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button 
            onClick={goToToday}
            className="px-4 py-1.5 md:px-6 md:py-2.5 bg-white dark:bg-[#1E293B] border-2 border-[#E5E7EB] dark:border-[#334155] hover:border-primary text-[#475569] dark:text-[#CBD5E1] font-bold text-[12px] md:text-[14px] rounded-[10px] hover:text-primary transition-colors shadow-sm cursor-pointer"
          >
            Today
          </button>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] shadow-sm rounded-xl relative">
        
        {/* --- VIEW: DAY / WEEK --- */}
        {(view === 'day' || view === 'week') && (
          // THÊM OVERFLOW-X-AUTO ĐỂ VUỐT NGANG TRÊN ĐIỆN THOẠI
          <div className="flex flex-col h-full bg-white dark:bg-[#1E293B] overflow-x-auto custom-scrollbar">
            {/* Ép chiều rộng tối thiểu 700px trên mobile để không bị bóp méo cột */}
            <div className={`flex flex-col h-full ${view === 'week' ? 'min-w-[700px] lg:min-w-0' : ''}`}>
              <div className="flex border-b border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] z-30 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                <div className="w-[50px] md:w-[60px] flex-shrink-0 border-r border-[#E5E7EB] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A]"></div> 
                <div className={`flex-1 grid ${view === 'week' ? 'grid-cols-7' : 'grid-cols-1'}`}>
                  {(view === 'week' ? getDaysInWeek() : [currentDate]).map((date, i) => (
                    <div key={i} className="flex flex-col items-center justify-center py-2 md:py-3 border-r last:border-r-0 border-[#E5E7EB] dark:border-[#334155]">
                      <span className={`text-[10px] md:text-[12px] font-bold mb-1 uppercase ${isSameDay(date, new Date()) ? 'text-primary' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
                        {view === 'week' ? dayNamesShort[i] : dayNamesFull[date.getDay() === 0 ? 6 : date.getDay() - 1]}
                      </span>
                      <div className={`w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full text-[13px] md:text-[15px] font-bold ${
                        isSameDay(date, new Date()) ? 'bg-primary text-white shadow-sm' : 'text-[#111827] dark:text-white'
                      }`}>
                        {date.getDate()}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="w-[10px] md:w-[15px] bg-[#F8FAFC] dark:bg-[#0F172A]"></div>
              </div>

              <div className="flex-1 overflow-y-scroll custom-scrollbar relative" ref={scrollContainerRef}>
                <div className="flex relative" style={{ height: `${hours.length * HOUR_HEIGHT + TOP_OFFSET + 40}px` }}> 
                  <div className="w-[50px] md:w-[60px] flex-shrink-0 border-r border-[#E5E7EB] dark:border-[#334155] relative bg-white dark:bg-[#1E293B] z-20">
                    {hours.map((hour, i) => (
                      <div 
                        key={`time-${i}`} 
                        className="absolute right-2 text-[10px] md:text-[11px] font-bold text-[#94A3B8] dark:text-[#64748B] -translate-y-1/2 bg-white dark:bg-[#1E293B]"
                        style={{ top: `${i * HOUR_HEIGHT + TOP_OFFSET}px` }}
                      >
                        {formatHour(hour)}
                      </div>
                    ))}
                  </div>

                  <div className={`flex-1 grid ${view === 'week' ? 'grid-cols-7' : 'grid-cols-1'} relative h-full w-full`}>
                    <div className="absolute inset-0 pointer-events-none z-0">
                      {hours.map((_, i) => (
                        <div key={`line-${i}`} className="absolute w-full border-t border-[#F1F5F9] dark:border-[#334155]/40" style={{ top: `${i * HOUR_HEIGHT + TOP_OFFSET}px` }}></div>
                      ))}
                    </div>

                    {Array.from({ length: view === 'week' ? 7 : 1 }).map((_, colIndex) => {
                      const targetDate = view === 'week' ? getDaysInWeek()[colIndex] : currentDate;
                      const currentColumnDayId = targetDate.getDay();
                      const colSchedules = schedules.filter(sch => {
                        if (sch.dayOfWeek !== currentColumnDayId) return false;
                        const weekNum = getWeekNumber(targetDate);
                        if (sch.recurrence === 'EVEN_WEEKS' && weekNum % 2 !== 0) return false;
                        if (sch.recurrence === 'ODD_WEEKS' && weekNum % 2 === 0) return false;
                        return true;
                      });

                      return (
                        <div key={`col-${colIndex}`} className="border-r last:border-r-0 border-[#E5E7EB] dark:border-[#334155] relative h-full w-full hover:bg-[#F8FAFC]/50 dark:hover:bg-[#0F172A]/50 transition-colors z-10">
                          {colSchedules.map(schedule => renderScheduleBlock(schedule))}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: MONTH --- */}
        {view === 'month' && (
          <div className="flex flex-col h-full bg-[#F8FAFC] dark:bg-[#0F172A] overflow-x-auto custom-scrollbar">
            <div className="min-w-[700px] lg:min-w-0 flex flex-col h-full">
              <div className="grid grid-cols-7 border-b border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B]">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                  <div key={i} className="text-center py-2 md:py-3 text-[10px] md:text-[12px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="flex-1 grid grid-cols-7 grid-rows-5 auto-rows-fr">
                {getMonthGrid().map((day, i) => {
                  const targetDate = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null;
                  const actualDayId = targetDate ? targetDate.getDay() : null;

                  const daySchedules = !targetDate ? [] : schedules.filter(sch => {
                    if (sch.dayOfWeek !== actualDayId) return false;
                    const weekNum = getWeekNumber(targetDate);
                    if (sch.recurrence === 'EVEN_WEEKS' && weekNum % 2 !== 0) return false;
                    if (sch.recurrence === 'ODD_WEEKS' && weekNum % 2 === 0) return false;
                    return true;
                  });

                  return (
                    <div key={i} className={`border-b border-r border-[#E5E7EB] dark:border-[#334155] p-1 md:p-2 hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/50 transition-colors cursor-pointer min-h-[100px] md:min-h-[120px] ${!day ? 'bg-[#F1F5F9] dark:bg-[#0F172A]/80' : 'bg-white dark:bg-[#1E293B]'}`}>
                      {day && (
                        <div className="flex flex-col h-full">
                          <div className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-[12px] md:text-[13px] font-bold mb-1 md:mb-2 ${
                            isSameDay(targetDate, new Date()) ? 'bg-primary text-white shadow-sm' : 'text-[#475569] dark:text-[#CBD5E1]'
                          }`}>
                            {day}
                          </div>
                          
                          <div className="flex flex-col gap-1 mt-1 overflow-hidden">
                            {daySchedules.map(sch => (
                              <div key={sch.id} className="text-[9px] md:text-[10px] font-semibold text-[#111827] dark:text-white px-1 md:px-1.5 py-0.5 md:py-1 rounded truncate border-l-4 flex justify-between items-center group" style={{ backgroundColor: `${sch.color || sch.subject?.colorCode || '#2563EB'}20`, borderColor: sch.color || sch.subject?.colorCode || '#2563EB' }}>
                                <span className="truncate">{sch.startTime} - {sch.subject?.name}</span>
                                <button onClick={(e) => handleDeleteClick(sch.id, e)} className="hidden group-hover:block text-red-500 hover:text-red-700 ml-1 flex-shrink-0">
                                  <X size={10} strokeWidth={3} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </Card>

      <button onClick={() => setIsModalOpen(true)} className="fixed bottom-24 md:bottom-10 right-6 md:right-10 z-[100] flex items-center justify-center gap-2 px-5 py-3 md:px-6 md:py-3.5 bg-primary hover:bg-primary/90 text-white rounded-full shadow-[0_8px_30px_rgba(37,99,235,0.3)] hover:-translate-y-1 transition-all cursor-pointer">
        <Plus className="w-5 h-5" strokeWidth={3} />
        <span className="font-bold text-[14px] md:text-[15px] hidden sm:block">Add New Class</span>
      </button>

      {toast.show && (
        <div className={`fixed top-4 left-4 right-4 md:left-auto md:top-24 md:right-8 z-[200] flex items-center gap-3 px-5 py-4 rounded-[12px] shadow-2xl animate-in slide-in-from-top-4 md:slide-in-from-right-8 fade-in duration-300 ${toast.type === 'error' ? 'bg-red-500 text-white' : toast.type === 'warning' ? 'bg-amber-500 text-white' : 'bg-[#10B981] text-white'}`}>
          {toast.type === 'error' ? <AlertCircle size={22} /> : toast.type === 'warning' ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}
          <span className="font-medium text-[13px] md:text-[14px] pr-2">{toast.message}</span>
          <button onClick={() => setToast({ show: false, message: '', type: 'success' })} className="ml-auto opacity-70 hover:opacity-100 cursor-pointer"><X size={18} /></button>
        </div>
      )}

      {confirmDialog.show && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E293B] border-t-[6px] border-t-red-500 rounded-2xl p-5 md:p-6 w-full max-w-[400px] shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center mt-2 mb-4">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 mb-4 ring-4 ring-red-50 dark:ring-red-500/5">
                <Trash2 size={24} strokeWidth={2} />
              </div>
              <h3 className="text-[18px] md:text-[20px] font-extrabold text-[#111827] dark:text-white mb-2">Xóa lịch học này?</h3>
              <p className="text-[13px] md:text-[14px] text-[#6B7280] dark:text-[#94A3B8] leading-relaxed px-2">Hành động này sẽ xóa vĩnh viễn lịch học khỏi hệ thống và không thể khôi phục lại. Bạn có chắc chắn không?</p>
            </div>
            <div className="flex gap-3 mt-6 md:mt-8">
              <button onClick={() => setConfirmDialog({ show: false, scheduleId: null })} className="flex-1 py-2.5 bg-[#F1F5F9] dark:bg-[#334155] text-[#475569] dark:text-white font-semibold rounded-[10px] transition-colors cursor-pointer">Hủy</button>
              <button onClick={executeDelete} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-[10px] shadow-lg transition-all cursor-pointer">Xóa Lịch</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-6 md:p-8 w-full max-w-[550px] shadow-2xl relative animate-in fade-in zoom-in max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 md:top-6 md:right-6 text-[#94a3b8] hover:text-[#ef4444] bg-[#f8fafc] dark:bg-[#0F172A] p-2 rounded-full"><X className="w-5 h-5" /></button>
            <div className="mb-5 md:mb-6 pr-8">
              <h2 className="text-[20px] md:text-[24px] font-bold text-[#0f172a] dark:text-white">Add Schedule</h2>
              <p className="text-[#64748b] dark:text-[#94A3B8] text-[13px] md:text-[14px] mt-1">Set up your weekly classes.</p>
            </div>
            <div className="space-y-4 md:space-y-5">
              <div className="space-y-2">
                <label className="block text-[13px] md:text-[14px] font-medium text-[#111827] dark:text-white">Subject *</label>
                <select value={selectedSubject} onChange={handleSubjectChange} className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155] rounded-[10px] text-[14px] md:text-[15px] text-[#111827] dark:text-white focus:ring-primary cursor-pointer">
                  <option value="">-- Select Subject --</option>
                  {subjects.map(sub => (<option key={sub.id} value={sub.id}>{sub.icon} {sub.name}</option>))}
                </select>
              </div>
              <div className="space-y-2 mt-4">
                <label className="block text-[13px] md:text-[14px] font-medium text-[#111827] dark:text-white flex items-center gap-1.5"><Palette className="w-4 h-4 text-[#64748B]" /> Label Color</label>
                <div className="flex flex-wrap gap-2.5 items-center">
                  {PRESET_COLORS.map(c => (<button key={c} onClick={() => setSelectedColor(c)} className={`w-6 h-6 md:w-7 md:h-7 rounded-full transition-all cursor-pointer ${selectedColor === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : ''}`} style={{ backgroundColor: c }} />))}
                  <div className="relative w-6 h-6 md:w-7 md:h-7 rounded-full overflow-hidden border border-gray-300 ml-1"><input type="color" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer"/></div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[13px] md:text-[14px] font-medium text-[#111827] dark:text-white">Days of Week *</label>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {weekDays.map(day => {
                    const isSelected = selectedDays.includes(day.id);
                    return (<button key={day.id} onClick={() => toggleDay(day.id)} className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[12px] md:text-[13px] font-medium border ${isSelected ? 'text-white shadow-sm' : 'bg-white dark:bg-[#0F172A] text-[#6B7280]'}`} style={isSelected ? { backgroundColor: selectedColor, borderColor: selectedColor } : {}}>{day.label}</button>)
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <Input label="Start Time *" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                <Input label="End Time *" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <Input label="Room / Location" placeholder="e.g., A-102" value={room} onChange={(e) => setRoom(e.target.value)} />
                <div className="space-y-2">
                  <label className="block text-[13px] md:text-[14px] font-medium text-[#111827] dark:text-white">Recurrence</label>
                  <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155] rounded-[10px] text-[14px] md:text-[15px] text-[#111827] dark:text-white focus:ring-primary cursor-pointer">
                    <option value="EVERY_WEEK">Every Week (Fixed)</option>
                    <option value="EVEN_WEEKS">Even Weeks Only</option>
                    <option value="ODD_WEEKS">Odd Weeks Only</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 md:pt-5 border-t border-[#f1f5f9] dark:border-[#334155] flex justify-end gap-2 md:gap-3 mt-4 md:mt-6">
                <Button variant="outline" onClick={() => setIsModalOpen(false)} className="px-4 md:px-6">Cancel</Button>
                <button onClick={handleSubmit} disabled={saving} className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-2.5 text-white font-semibold rounded-[10px] shadow-md transition-all ${saving ? 'opacity-50' : ''}`} style={{ backgroundColor: selectedColor }}>
                  {saving ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Plus className="w-4 h-4 md:w-5 md:h-5" />} Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
