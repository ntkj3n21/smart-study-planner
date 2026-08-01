import { Plus, BookOpen, Clock, X, Loader2, Trash2, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useState, useEffect } from 'react';
import Input from '../components/Input';
import { API_BASE_URL } from '../../api/axiosClient';

export default function Subjects() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#2563EB');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [subjects, setSubjects] = useState([]); 
  const [loadingData, setLoadingData] = useState(true); 
  const [subjectName, setSubjectName] = useState('');
  const [targetHours, setTargetHours] = useState('');
  const [iconEmoji, setIconEmoji] = useState('📚');
  const [loadingAdd, setLoadingAdd] = useState(false); 
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const colors = ['#2563EB', '#7C3AED', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#EC4899'];

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000); 
  };

  const fetchSubjects = async () => {
    setLoadingData(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/subjects/getSubject`, { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await response.json();
      if (response.ok) setSubjects(result.data || []); 
    } catch (error) { console.error("Lỗi:", error); } finally { setLoadingData(false); }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const handleAddSubject = async () => {
    if (!subjectName.trim()) return showToast("Please enter a subject name!", "warning");
    const parsedTargetHours = Number.parseInt(targetHours, 10);
    if (!Number.isInteger(parsedTargetHours) || parsedTargetHours < 1 || parsedTargetHours > 168) {
      return showToast("Target must be between 1 and 168 hours per week", "warning");
    }
    const isDuplicate = subjects.some((sub) => sub.name.trim().toLowerCase() === subjectName.trim().toLowerCase());
    if (isDuplicate) return showToast(`Subject "${subjectName.trim()}" already exists!`, "error");
    
    setLoadingAdd(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_BASE_URL}/subjects/createSubject`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: subjectName.trim(), weeklyStudyHours: parsedTargetHours, colorCode: selectedColor, icon: iconEmoji })
      });

      if (response.ok) {
        setIsModalOpen(false); setSubjectName(''); setTargetHours(''); setIconEmoji('📚');
        fetchSubjects(); showToast("Subject added successfully!", "success");
      } else {
        const errorData = await response.json(); showToast(errorData.message || "Failed to add subject", "error");
      }
    } catch (error) { showToast("Server connection error", "error"); } finally { setLoadingAdd(false); }
  };

  const triggerDelete = (e, subject) => { e.stopPropagation(); setSubjectToDelete(subject); setIsDeleteModalOpen(true); };

  const confirmDeleteSubject = async () => {
    if (!subjectToDelete) return;
    setLoadingDelete(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/subjects/deleteSubject/${subjectToDelete.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        setIsDeleteModalOpen(false); setSubjectToDelete(null); fetchSubjects(); showToast("Subject deleted successfully!", "success");
      } else {
        const errorData = await response.json(); showToast(errorData.message || "Failed to delete subject", "error");
      }
    } catch (error) { showToast("Server connection error", "error"); } finally { setLoadingDelete(false); }
  };

  return (
    <div className="space-y-4 md:space-y-6 relative">
      
      {/* Toast thông báo ở giữa màn hình điện thoại */}
      {toast.show && (
        <div className={`fixed top-4 left-4 right-4 md:left-auto md:top-24 md:right-8 z-[200] flex items-center gap-3 px-4 py-3 md:px-5 md:py-4 rounded-[12px] shadow-2xl animate-in slide-in-from-top-4 md:slide-in-from-right-8 fade-in duration-300 ${
          toast.type === 'error' ? 'bg-red-500 text-white' : toast.type === 'warning' ? 'bg-amber-500 text-white' : 'bg-[#10B981] text-white'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={20} className="md:w-[22px] md:h-[22px]" /> : toast.type === 'warning' ? <AlertTriangle size={20} className="md:w-[22px] md:h-[22px]" /> : <CheckCircle2 size={20} className="md:w-[22px] md:h-[22px]" />}
          <span className="font-medium text-[13px] md:text-[14px] pr-2 flex-1">{toast.message}</span>
          <button onClick={() => setToast({ show: false, message: '', type: 'success' })} className="ml-auto opacity-70 hover:opacity-100 cursor-pointer"><X size={18} /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] md:text-[28px] dark:text-white font-bold">Subjects</h1>
          <p className="text-[14px] md:text-[16px] text-[#6B7280] dark:text-[#94A3B8] mt-1 md:mt-2">Manage your study subjects and track progress</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex flex-row items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-[8px] hover:bg-primary/90 shadow-sm hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
          <span className="font-semibold text-[14px] md:text-[15px] leading-none">Add Subject</span>
        </button>
      </div>

      {loadingData ? (
        <div className="flex flex-col items-center justify-center py-10 md:py-20">
          <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-primary animate-spin mb-4" />
          <p className="text-[14px] md:text-[16px] text-[#6B7280] dark:text-[#94A3B8]">Loading your subjects...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {subjects.map((subject) => (
            <Card key={subject.id} className="p-5 md:p-6 hover:shadow-xl transition-shadow cursor-pointer group relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-[10px] md:rounded-[12px] flex items-center justify-center text-xl md:text-2xl dark:opacity-80" style={{ backgroundColor: `${subject.colorCode || '#2563EB'}20` }}>
                  {subject.icon || '📚'}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={(e) => triggerDelete(e, subject)} className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10 md:opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100 dark:hover:bg-red-500/20 shadow-sm">
                    <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                  <div className="w-2 h-2 rounded-full group-hover:scale-150 transition-transform" style={{ backgroundColor: subject.colorCode || '#2563EB' }}></div>
                </div>
              </div>
              <h3 className="text-[18px] md:text-[20px] font-semibold text-[#111827] dark:text-white mb-3 md:mb-4">{subject.name}</h3>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] md:text-[14px] text-[#6B7280] dark:text-[#94A3B8]">Progress</span>
                  <span className="text-[13px] md:text-[14px] font-semibold" style={{ color: subject.colorCode || '#2563EB' }}>{subject.progress || 0}%</span>
                </div>
                <div className="w-full h-1.5 md:h-2 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${subject.progress || 0}%`, backgroundColor: subject.colorCode || '#2563EB' }}></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4 pt-4 border-t border-[#E5E7EB] dark:border-[#334155]">
                <div>
                  <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                    <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#6B7280] dark:text-[#94A3B8]" />
                    <span className="text-[11px] md:text-[12px] text-[#6B7280] dark:text-[#94A3B8]">Study Hours</span>
                  </div>
                  <p className="text-[14px] md:text-[16px] font-semibold text-[#111827] dark:text-white">{subject.weeklyStudyHours || 0}h</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                    <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#6B7280] dark:text-[#94A3B8]" />
                    <span className="text-[11px] md:text-[12px] text-[#6B7280] dark:text-[#94A3B8]">Tasks</span>
                  </div>
                  <p className="text-[14px] md:text-[16px] font-semibold text-[#111827] dark:text-white">{subject.totalTasks || 0}</p>
                </div>
              </div>
            </Card>
          ))}

          <Card onClick={() => setIsModalOpen(true)} className="p-5 md:p-6 border-2 border-dashed border-[#E5E7EB] dark:border-[#334155] hover:border-primary bg-transparent hover:bg-[#EFF6FF] dark:hover:bg-[#1e3a8a]/20 transition-all cursor-pointer flex items-center justify-center min-h-[240px] md:min-h-[280px]">
            <div className="text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-[#EFF6FF] dark:bg-[#1e3a8a]/40 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Plus className="w-6 h-6 md:w-8 md:h-8 text-primary dark:text-[#60A5FA]" />
              </div>
              <h3 className="text-[15px] md:text-[16px] font-medium text-[#111827] dark:text-white mb-1">Add New Subject</h3>
              <p className="text-[13px] md:text-[14px] text-[#6B7280] dark:text-[#94A3B8]">Start tracking a new subject</p>
            </div>
          </Card>
        </div>
      )}

      {/* --- POPUP XÁC NHẬN XÓA MÔN HỌC --- */}
      {isDeleteModalOpen && subjectToDelete && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] border dark:border-[#334155] rounded-[20px] md:rounded-3xl p-6 md:p-8 w-full max-w-[440px] shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-[#FEF2F2] dark:bg-[#451a1a] rounded-full flex items-center justify-center mb-4 md:mb-6">
                <AlertTriangle className="w-7 h-7 md:w-8 md:h-8 text-[#EF4444]" />
              </div>
              <h2 className="text-[20px] md:text-[24px] font-bold text-[#111827] dark:text-white mb-2">Delete Subject?</h2>
              <p className="text-[#6B7280] dark:text-[#94A3B8] text-[13px] md:text-[15px] leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-gray-800 dark:text-gray-200">"{subjectToDelete.name}"</span>? All related tasks might also be affected. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 mt-6 md:mt-10">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-2.5 md:px-6 md:py-3 bg-[#F8FAFC] dark:bg-[#0F172A] text-[#475569] dark:text-[#CBD5E1] font-bold rounded-[10px] md:rounded-xl border border-[#E5E7EB] dark:border-[#334155] hover:bg-[#F1F5F9] transition-all cursor-pointer text-[14px] md:text-[16px]">Cancel</button>
              <button onClick={confirmDeleteSubject} disabled={loadingDelete} className={`flex-1 flex justify-center items-center px-4 py-2.5 md:px-6 md:py-3 bg-[#EF4444] text-white font-bold rounded-[10px] md:rounded-xl shadow-lg hover:bg-[#dc2626] transition-all cursor-pointer text-[14px] md:text-[16px] ${loadingDelete ? 'opacity-50' : ''}`}>
                {loadingDelete ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- POPUP THÊM MỚI MÔN HỌC --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] border dark:border-[#334155] rounded-[20px] md:rounded-3xl p-6 md:p-8 w-full max-w-[450px] shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 md:top-6 md:right-6 text-[#94a3b8] hover:text-[#ef4444] transition-colors cursor-pointer bg-[#f8fafc] dark:bg-[#0F172A] p-2 rounded-full"><X className="w-4 h-4 md:w-5 md:h-5" /></button>
            <div className="mb-5 md:mb-6 pr-6">
              <h2 className="text-[20px] md:text-[24px] font-bold text-[#0f172a] dark:text-white">Add New Subject</h2>
              <p className="text-[#64748b] dark:text-[#94A3B8] text-[13px] md:text-[14px] mt-1">Expand your knowledge.</p>
            </div>
            <div className="space-y-4 md:space-y-6">
              <Input label="Subject Name" placeholder="e.g., Math" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <Input label="Target (h/week)" type="number" min="1" max="168" placeholder="10" value={targetHours} onChange={(e) => setTargetHours(e.target.value)} />
                <Input label="Icon (Emoji)" placeholder="⚛️" value={iconEmoji} onChange={(e) => setIconEmoji(e.target.value)} />
              </div>
              <div>
                <label className="block text-[13px] md:text-[14px] font-medium text-[#111827] dark:text-gray-200 mb-2 md:mb-3">Theme Color</label>
                <div className="flex gap-2.5 md:gap-3 flex-wrap">
                  {colors.map(color => (
                    <button key={color} onClick={() => setSelectedColor(color)} className={`w-7 h-7 md:w-8 md:h-8 rounded-full transition-all cursor-pointer shadow-sm ${selectedColor === color ? 'ring-2 ring-offset-2' : ''}`} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              <div className="pt-4 md:pt-5 border-t border-[#f1f5f9] dark:border-[#334155] flex justify-end gap-2 md:gap-3 mt-4 md:mt-6">
                <Button variant="outline" onClick={() => setIsModalOpen(false)} className="px-4 md:px-6 py-2 md:py-2.5 text-[14px] md:text-[15px]">Cancel</Button>
                <button onClick={handleAddSubject} disabled={loadingAdd} className={`flex flex-row items-center justify-center gap-2 px-4 py-2 md:px-6 md:py-2.5 text-white rounded-[8px] md:rounded-[10px] shadow-md transition-all cursor-pointer whitespace-nowrap text-[14px] md:text-[15px] font-semibold ${loadingAdd ? 'opacity-50' : ''}`} style={{ backgroundColor: selectedColor }}>
                  {loadingAdd ? 'Adding...' : 'Add Subject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
