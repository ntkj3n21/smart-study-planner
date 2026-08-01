import { useState, useRef, useEffect } from 'react';
import { Plus, Search, Filter, X, Calendar as CalendarIcon, Check, Loader2, Trash2, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { API_BASE_URL } from '../../api/axiosClient';

export default function Tasks() {
  const [activeTab, setActiveTab] = useState('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all'); 
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const [rawTasks, setRawTasks] = useState([]); 
  const [subjectsList, setSubjectsList] = useState([]); 
  const [loadingData, setLoadingData] = useState(true);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskSubjectId, setNewTaskSubjectId] = useState(''); 
  const [loadingAdd, setLoadingAdd] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const tabs = [
    { id: 'list', label: 'List View' },
    { id: 'board', label: 'Board View' },
    { id: 'matrix', label: 'Matrix View' },
  ];
  
  const filterRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) setIsFilterOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const priorityColors = { HIGH: 'border-l-[#EF4444]', MEDIUM: 'border-l-[#F59E0B]', LOW: 'border-l-[#22C55E]' };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000); 
  };

  const fetchData = async () => {
    setLoadingData(true);
    const token = localStorage.getItem('token');
    try {
      const [tasksRes, subjectsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/tasks/getTask`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/subjects/getSubject`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const tasksData = await tasksRes.json();
      const subjectsData = await subjectsRes.json();
      if (tasksRes.ok) setRawTasks(tasksData || []);
      if (subjectsRes.ok) setSubjectsList(subjectsData.data || []); 
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return showToast("Task title is required", "warning");
    
    setLoadingAdd(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/createTask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: newTaskTitle.trim(), description: newTaskDesc.trim(), deadline: newTaskDeadline || null, subjectId: newTaskSubjectId || null 
        })
      });

      if (response.ok) {
        setIsModalOpen(false); setNewTaskTitle(''); setNewTaskDesc(''); setNewTaskDeadline(''); setNewTaskSubjectId('');
        fetchData(); showToast("Task created successfully!", "success");
      } else {
        const errorData = await response.json(); showToast(errorData.message || "Failed to create task", "error");
      }
    } catch (error) { showToast("Server connection error", "error"); } finally { setLoadingAdd(false); }
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    setLoadingDelete(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/deleteTask/${taskToDelete.id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setDeleteModalOpen(false); setTaskToDelete(null); fetchData(); showToast("Task deleted!", "success");
      } else {
        const errorData = await response.json(); showToast(errorData.message || "Failed to delete task", "error");
      }
    } catch (error) { showToast("Server connection error", "error"); } finally { setLoadingDelete(false); }
  };

  const triggerDelete = (task, e) => { e.stopPropagation(); setTaskToDelete(task); setDeleteModalOpen(true); };

  const handleToggleStatus = async (task, e) => {
    e.stopPropagation(); 
    const token = localStorage.getItem('token');
    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/updateStatus/${task.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) fetchData();
      else { const errorData = await response.json(); showToast(errorData.message || "Error updating status", "error"); }
    } catch (error) { console.error("Lỗi:", error); }
  };

  const getFilteredTasks = () => {
    let result = { todo: [], inProgress: [], completed: [] };
    const filtered = rawTasks.filter(task => {
      const priorityString = String(task.priority || 'MEDIUM').toUpperCase();
      const matchPriority = filterPriority === 'all' || priorityString === filterPriority;
      const taskTitle = String(task.title || '').toLocaleLowerCase();
      const matchSearch = taskTitle.includes(searchQuery.trim().toLocaleLowerCase());
      return matchPriority && matchSearch;
    });
    result.todo = filtered.filter(t => t.status === 'TODO' || !t.status);
    result.inProgress = filtered.filter(t => t.status === 'IN_PROGRESS');
    result.completed = filtered.filter(t => t.status === 'DONE');
    return result;
  };
  
  const filteredTasks = getFilteredTasks();

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    return new Date(dateString).toLocaleDateString('en-GB'); 
  };

  const renderListView = () => (
    <div className="space-y-4">
      {Object.entries(filteredTasks).map(([status, taskList]) => (
        <div key={status}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-[15px] md:text-[16px] font-semibold text-[#111827] dark:text-white capitalize">
              {status === 'inProgress' ? 'In Progress' : status}
            </h3>
            <span className="px-2 py-0.5 bg-[#F8FAFC] dark:bg-[#1E293B] rounded-full text-[12px] font-MEDIUM text-[#6B7280] dark:text-[#94A3B8]">
              {taskList.length}
            </span>
          </div>
          {taskList.length === 0 ? (
            <div className="p-4 bg-white dark:bg-[#1E293B] border border-dashed border-[#E5E7EB] dark:border-[#334155] rounded-xl text-center text-[#6B7280] dark:text-[#94A3B8] text-[13px] md:text-[14px]">
              No tasks found in this section.
            </div>
          ) : (
            <div className="space-y-3">
              {taskList.map((task) => {
                const pColor = priorityColors[task.priority] || priorityColors.MEDIUM;
                return (
                  <Card key={task.id} className={`p-3 md:p-4 border-l-4 ${pColor} hover:shadow-lg transition-shadow cursor-pointer group relative overfLOW-hidden`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                      <div className="flex items-start sm:items-center gap-3 md:gap-4">
                        <div onClick={(e) => handleToggleStatus(task, e)} className={`mt-0.5 sm:mt-0 w-5 h-5 border-2 rounded-[4px] flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 ${status === 'completed' ? 'bg-[#22C55E] border-[#22C55E]' : 'border-primary hover:bg-[#EFF6FF] dark:hover:bg-[#1e3a8a]'}`}>
                          {status === 'completed' && <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" strokeWidth={3} />}
                        </div>
                        <div>
                          <h4 className={`text-[14px] md:text-[16px] font-MEDIUM pr-6 sm:pr-0 ${status === 'completed' ? 'text-[#94A3B8] line-through' : 'text-[#111827] dark:text-white'}`}>{task.title}</h4>
                          <p className="text-[12px] md:text-[14px] text-[#6B7280] dark:text-[#94A3B8]">
                            {task.subject?.name || task.description || 'No subject'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-3 md:gap-4 w-full sm:w-auto pl-8 sm:pl-0 border-t border-[#E5E7EB] dark:border-[#334155] sm:border-0 pt-2 sm:pt-0 mt-1 sm:mt-0">
                        <span className="text-[12px] md:text-[14px] text-[#6B7280] dark:text-[#94A3B8] whitespace-nowrap">Due: {formatDate(task.deadline)}</span>
                        <div className="flex items-center gap-2 md:gap-4">
                          <span className={`px-2.5 py-1 rounded-[6px] text-[10px] md:text-[12px] font-MEDIUM whitespace-nowrap ${
                            task.priority === 'HIGH' ? 'bg-[#EF4444] text-white' : 
                            task.priority === 'LOW' ? 'bg-[#22C55E] text-white' : 'bg-[#F59E0B] text-white'
                          }`}>
                            {(task.priority || 'MEDIUM')}
                          </span>
                          <button onClick={(e) => triggerDelete(task, e)} className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:bg-red-100 dark:hover:bg-red-500/20" title="Delete Task">
                            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderBoardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {Object.entries(filteredTasks).map(([status, taskList]) => (
        <div key={status}>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-[15px] md:text-[16px] font-semibold text-[#111827] dark:text-white capitalize">
              {status === 'inProgress' ? 'In Progress' : status}
            </h3>
            <span className="px-2 py-0.5 md:py-1 bg-[#F8FAFC] dark:bg-[#1E293B] rounded-[6px] text-[12px] md:text-[14px] font-MEDIUM text-[#6B7280] dark:text-[#94A3B8]">{taskList.length}</span>
          </div>
          <div className="space-y-3">
            {taskList.map((task) => (
              <Card key={task.id} className={`p-3 md:p-4 cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-transparent hover:border-primary group relative ${status === 'completed' ? 'opacity-60' : ''}`}>
                <button onClick={(e) => triggerDelete(task, e)} className="absolute top-2 right-2 md:top-3 md:right-3 w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full bg-white dark:bg-[#1E293B] text-red-500 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-red-50 dark:hover:bg-red-500/20 shadow-sm border border-red-100 dark:border-red-500/30">
                  <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                </button>
                <h4 className={`text-[14px] md:text-[16px] font-MEDIUM mb-1.5 md:mb-2 pr-6 md:pr-8 ${status === 'completed' ? 'text-[#94A3B8] line-through' : 'text-[#111827] dark:text-white'}`}>{task.title}</h4>
                <p className="text-[12px] md:text-[14px] text-[#6B7280] dark:text-[#94A3B8] mb-2.5 md:mb-3 line-clamp-2">{task.subject?.name || task.description || 'No description'}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] md:text-[12px] text-[#6B7280] dark:text-[#94A3B8] flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" /> {formatDate(task.deadline)}
                  </span>
                  <span className={`px-2 py-0.5 md:py-1 rounded-[6px] text-[10px] md:text-[12px] font-MEDIUM ${
                    task.priority === 'HIGH' ? 'bg-[#FEE2E2] dark:bg-[#7f1d1d] text-[#EF4444] dark:text-[#fca5a5]' : 
                    task.priority === 'LOW' ? 'bg-[#DCFCE7] dark:bg-[#14532d] text-[#22C55E] dark:text-[#86efac]' : 
                    'bg-[#FEF3C7] dark:bg-[#78350f] text-[#F59E0B] dark:text-[#fcd34d]'
                  }`}>{(task.priority || 'MEDIUM')}</span>
                </div>
              </Card>
            ))}
            {taskList.length === 0 && (
              <div className="p-4 bg-[#F8FAFC] dark:bg-[#1E293B] border border-dashed border-[#E5E7EB] dark:border-[#334155] rounded-xl text-center text-[#6B7280] dark:text-[#94A3B8] text-[13px] md:text-[14px]">No tasks</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderMatrixView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      <Card className="p-4 md:p-6">
        <h3 className="text-[15px] md:text-[16px] font-semibold text-[#111827] dark:text-white mb-3 md:mb-4">Urgent & Important (HIGH)</h3>
        <div className="space-y-2 md:space-y-3 min-h-[150px] md:min-h-[300px] content-start">
          {filteredTasks.todo.filter(t => t.priority === 'HIGH').map(task => (
            <div key={task.id} className="p-2.5 md:p-3 bg-[#FEE2E2] dark:bg-[#7f1d1d]/30 border border-[#FECACA] dark:border-[#7f1d1d] rounded-[8px] hover:shadow-sm transition-shadow cursor-pointer group flex justify-between items-center">
              <p className="text-[13px] md:text-[14px] font-MEDIUM text-[#111827] dark:text-white truncate pr-2">{task.title}</p>
              <button onClick={(e) => triggerDelete(task, e)} className="text-red-400 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 flex-shrink-0"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-4 md:p-6">
        <h3 className="text-[15px] md:text-[16px] font-semibold text-[#111827] dark:text-white mb-3 md:mb-4">Not Urgent but Important (MEDIUM)</h3>
        <div className="space-y-2 md:space-y-3 min-h-[150px] md:min-h-[300px] content-start">
          {filteredTasks.todo.filter(t => t.priority === 'MEDIUM' || !t.priority).map(task => (
            <div key={task.id} className="p-2.5 md:p-3 bg-[#FEF3C7] dark:bg-[#78350f]/30 border border-[#FDE68A] dark:border-[#78350f] rounded-[8px] hover:shadow-sm transition-shadow cursor-pointer group flex justify-between items-center">
              <p className="text-[13px] md:text-[14px] font-MEDIUM text-[#111827] dark:text-white truncate pr-2">{task.title}</p>
              <button onClick={(e) => triggerDelete(task, e)} className="text-red-400 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 flex-shrink-0"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-4 md:p-6">
        <h3 className="text-[15px] md:text-[16px] font-semibold text-[#111827] dark:text-white mb-3 md:mb-4">Urgent but Not Important (LOW)</h3>
        <div className="space-y-2 md:space-y-3 min-h-[150px] md:min-h-[300px] content-start">
           {filteredTasks.todo.filter(t => t.priority === 'LOW').map(task => (
            <div key={task.id} className="p-2.5 md:p-3 bg-[#DCFCE7] dark:bg-[#14532d]/30 border border-[#BBF7D0] dark:border-[#14532d] rounded-[8px] hover:shadow-sm transition-shadow cursor-pointer group flex justify-between items-center">
              <p className="text-[13px] md:text-[14px] font-MEDIUM text-[#111827] dark:text-white truncate pr-2">{task.title}</p>
              <button onClick={(e) => triggerDelete(task, e)} className="text-red-400 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 flex-shrink-0"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-4 md:p-6">
        <h3 className="text-[15px] md:text-[16px] font-semibold text-[#111827] dark:text-white mb-3 md:mb-4">Completed</h3>
        <div className="space-y-2 md:space-y-3 min-h-[150px] md:min-h-[300px] content-start">
          {filteredTasks.completed.map(task => (
            <div key={task.id} className="p-2.5 md:p-3 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-[8px] hover:shadow-sm transition-shadow cursor-pointer group flex justify-between items-center">
              <p className="text-[13px] md:text-[14px] font-MEDIUM text-[#94A3B8] line-through truncate pr-2">{task.title}</p>
              <button onClick={(e) => triggerDelete(task, e)} className="text-red-400 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 flex-shrink-0"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6 relative">
      
      {toast.show && (
        <div className={`fixed top-4 left-4 right-4 md:left-auto md:top-24 md:right-8 z-[200] flex items-center gap-3 px-4 py-3 md:px-5 md:py-4 rounded-[12px] shadow-2xl animate-in slide-in-from-top-4 md:slide-in-from-right-8 fade-in duration-300 ${
          toast.type === 'error' ? 'bg-red-500 text-white' : toast.type === 'warning' ? 'bg-amber-500 text-white' : 'bg-[#10B981] text-white'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : toast.type === 'warning' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
          <span className="font-MEDIUM text-[13px] md:text-[14px] pr-2 flex-1">{toast.message}</span>
          <button onClick={() => setToast({ show: false, message: '', type: 'success' })} className="ml-auto opacity-70 hover:opacity-100"><X size={18} /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-[24px] md:text-[28px] font-bold dark:text-white">Tasks</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex flex-row items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-[8px] hover:bg-primary/90 shadow-sm transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" strokeWidth={2.5} />
          <span className="font-semibold text-[14px] md:text-[15px] leading-none">Add Task</span>
        </button>
      </div>

      <Card className="p-3 md:p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-[#94A3B8] group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 md:pl-12 pr-4 py-2 md:py-2.5 w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155] rounded-[10px] focus:ring-primary text-[14px] md:text-[15px] text-[#111827] dark:text-white"
              />
            </div>
          </div>
          <div className="relative" ref={filterRef}>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`w-full sm:w-auto flex items-center justify-center px-4 md:px-5 py-2 md:py-2.5 rounded-[10px] font-semibold text-[13px] md:text-[14px] transition-all border ${filterPriority !== 'all' ? 'bg-[#EFF6FF] dark:bg-[#1e3a8a]/30 border-[#BFDBFE] dark:border-[#1e3a8a] text-primary dark:text-[#60A5FA]' : 'bg-white dark:bg-[#1E293B] border-[#E5E7EB] dark:border-[#334155] text-[#475569] dark:text-[#CBD5E1]'}`}
            >
              <Filter className="w-4 h-4 md:w-4 md:h-4 mr-2" /> Filter 
              {filterPriority !== 'all' && <span className="ml-2 w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full bg-primary text-white text-[10px] md:text-[11px]">1</span>}
            </button>
            {isFilterOpen && (
              <div className="absolute right-0 left-0 sm:left-auto mt-2 w-full sm:w-56 bg-white dark:bg-[#1E293B] rounded-xl shadow-xl border border-[#E5E7EB] dark:border-[#334155] z-20 py-2 animate-in fade-in">
                <div className="px-4 py-2 text-[10px] md:text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Filter by Priority</div>
                <div className="flex flex-col">
                  {['all', 'HIGH', 'MEDIUM', 'LOW'].map(level => {
                    const isSelected = filterPriority === level;
                    return (
                      <button key={level} onClick={() => { setFilterPriority(level); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2 md:py-2.5 text-[13px] md:text-[14px] flex items-center justify-between ${isSelected ? 'bg-[#EFF6FF] dark:bg-[#1e3a8a]/30 text-primary font-semibold' : 'text-[#475569] dark:text-[#CBD5E1]'}`}>
                        <div className="flex items-center gap-2">
                          {level !== 'all' && <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full" style={{ backgroundColor: level === 'HIGH' ? '#EF4444' : level === 'MEDIUM' ? '#F59E0B' : '#22C55E' }}></div>}
                          <span className="capitalize">{level === 'all' ? 'Show All' : level}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs có cuộn ngang */}
      <div className="flex gap-1 md:gap-2 border-b border-[#E5E7EB] dark:border-[#334155] overfLOW-x-auto custom-scrollbar whitespace-nowrap pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 md:px-6 py-2 md:py-3 text-[14px] md:text-[16px] font-MEDIUM transition-colors border-b-2 ${activeTab === tab.id ? 'text-primary dark:text-[#60A5FA] border-primary dark:border-[#60A5FA]' : 'text-[#6B7280] dark:text-[#94A3B8] border-transparent hover:text-[#111827] dark:hover:text-white'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loadingData ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-primary animate-spin mb-4" />
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          {activeTab === 'list' && renderListView()}
          {activeTab === 'board' && renderBoardView()}
          {activeTab === 'matrix' && renderMatrixView()}
        </div>
      )}

      {deleteModalOpen && taskToDelete && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] border dark:border-[#334155] rounded-3xl p-6 md:p-8 w-full max-w-[440px] shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-4 md:mb-6"><AlertTriangle className="w-7 h-7 md:w-8 md:h-8 text-red-500" /></div>
              <h2 className="text-[20px] md:text-[24px] font-bold dark:text-white mb-2">Delete Task?</h2>
              <p className="text-[13px] md:text-[15px] text-[#6B7280] dark:text-[#94A3B8]">Are you sure you want to delete "{taskToDelete.title}"?</p>
            </div>
            <div className="flex gap-3 mt-8 md:mt-10">
              <button onClick={() => setDeleteModalOpen(false)} className="flex-1 py-2.5 md:py-3 bg-[#F8FAFC] dark:bg-[#0F172A] text-[#475569] dark:text-[#CBD5E1] font-bold rounded-xl text-[14px] md:text-[16px]">Cancel</button>
              <button onClick={confirmDeleteTask} disabled={loadingDelete} className="flex-1 py-2.5 md:py-3 bg-red-500 text-white font-bold rounded-xl text-[14px] md:text-[16px]">{loadingDelete ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-[20px] md:rounded-3xl p-6 md:p-8 w-full max-w-[500px] shadow-2xl relative animate-in fade-in zoom-in max-h-[90vh] overfLOW-y-auto custom-scrollbar">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 md:top-6 md:right-6 bg-gray-50 dark:bg-[#0F172A] text-gray-500 p-2 rounded-full"><X className="w-4 h-4 md:w-5 md:h-5" /></button>
            <div className="mb-5 md:mb-6 pr-8">
              <h2 className="text-[20px] md:text-[24px] font-bold dark:text-white">Create New Task</h2>
              <p className="text-[#64748b] dark:text-[#94A3B8] text-[13px] md:text-[14px]">Plan your next move carefully.</p>
            </div>
            <div className="space-y-4 md:space-y-5">
              <Input label="Task Title" placeholder="What needs to be done?" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <label className="block text-[13px] md:text-[14px] font-MEDIUM dark:text-white">Subject (Optional)</label>
                  <select value={newTaskSubjectId} onChange={(e) => setNewTaskSubjectId(e.target.value)} className="w-full px-3 py-2 md:px-4 md:py-2.5 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155] rounded-[8px] text-[14px] md:text-[15px] dark:text-white focus:ring-primary cursor-pointer">
                    <option value="">-- Select Subject --</option>
                    {subjectsList.map(sub => (<option key={sub.id} value={sub.id}>{sub.icon} {sub.name}</option>))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[13px] md:text-[14px] font-MEDIUM dark:text-white">Due Date</label>
                  <input type="datetime-local" value={newTaskDeadline} onChange={(e) => setNewTaskDeadline(e.target.value)} className="w-full px-3 py-2 md:px-4 md:py-2.5 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155] rounded-[8px] text-[14px] md:text-[15px] dark:text-white focus:ring-primary dark:[color-scheme:dark]" />
                </div>
              </div>
              <Input label="Description" placeholder="Additional details..." value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} />
              <div className="pt-4 md:pt-5 border-t border-[#f1f5f9] dark:border-[#334155] flex justify-end gap-2 md:gap-3 mt-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)} className="px-4 md:px-6 py-2 md:py-2.5 text-[14px] md:text-[15px]">Cancel</Button>
                <button onClick={handleCreateTask} disabled={loadingAdd} className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-2.5 bg-primary text-white rounded-[8px] md:rounded-[10px] text-[14px] md:text-[15px] font-semibold transition-all shadow-md">
                  {loadingAdd ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin"/> : <Plus className="w-4 h-4 md:w-5 md:h-5"/>} Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
