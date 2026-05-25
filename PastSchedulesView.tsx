/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Schedule, ScheduleItem, Department } from '../types';
import { exportScheduleToExcel } from '../excelExport';
import ExportConfigModal from './ExportConfigModal';

import { 
  History, 
  Download, 
  Trash2, 
  Eye, 
  Sparkles, 
  Search,
  Hourglass,
  Archive,
  MenuSquare
} from 'lucide-react';

interface PastSchedulesViewProps {
  schedules: Schedule[];
  scheduleItems: ScheduleItem[];
  departments: Department[];
  onDeleteSchedule: (id: string) => void;
}

export default function PastSchedulesView({
  schedules,
  scheduleItems,
  departments,
  onDeleteSchedule
}: PastSchedulesViewProps) {
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedWeek, setSelectedWeek] = useState('');
  
  // Currently viewed schedule ID
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);


  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Filter schedule items or schedules
  const filteredSchedules = schedules.filter(s => {
    const matchesMonth = selectedMonth === 'all' || s.month === selectedMonth;
    const matchesWeek = !selectedWeek || s.weekNumber === Number(selectedWeek);
    return matchesMonth && matchesWeek;
  });

  // Items for currently examined schedule
  const activeItems = selectedScheduleId 
    ? scheduleItems.filter(item => {
        const matchesSchedule = item.scheduleId === selectedScheduleId;
        const matchesDept = selectedDept === 'all' || item.department === selectedDept;
        return matchesSchedule && matchesDept;
      })
    : [];

  const activeSchedule = schedules.find(s => s.id === selectedScheduleId);

  // Group active items by department
  const groupedActiveItems: { [dept: string]: ScheduleItem[] } = {};
  for (const item of activeItems) {
    if (!groupedActiveItems[item.department]) {
      groupedActiveItems[item.department] = [];
    }
    groupedActiveItems[item.department].push(item);
  }

  // Double check 2 months calculations format (shows warnings for users)
  const remainingDays = (createdAt: number) => {
    const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
    const expiryDate = createdAt + sixtyDaysMs;
    const diff = expiryDate - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl shadow-xs border border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-800 rounded-lg">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Rosters Archive</h2>
            <p className="text-xs text-slate-500">Historical schedules storage (Auto purged when folder is &gt; 2 months old)</p>
          </div>
        </div>
        
        {/* Retention info badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-lg text-amber-800 border border-amber-200 text-xs font-semibold">
          <Hourglass className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: '3s' }} />
          <span>Roster Retention: 2 Months Limit Enabled</span>
        </div>
      </div>

      {/* Grid: Left Filters, Right Items list */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Filter and List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Filter Archives</h3>
            
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Month</label>
              <select
                id="archive-filter-month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="all">All Months</option>
                {months.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Week Number</label>
              <select
                id="archive-filter-week"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg focus:outline-none bg-white font-medium"
              >
                <option value="">All Weeks</option>
                <option value="1">Week 1</option>
                <option value="2">Week 2</option>
                <option value="3">Week 3</option>
                <option value="4">Week 4</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-slate-100 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Archived Lists</h3>
            
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredSchedules.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No schedules match filters.</p>
              ) : (
                filteredSchedules.map(sched => (
                  <div
                    key={sched.id}
                    onClick={() => {
                      setSelectedScheduleId(sched.id);
                      setSelectedDept('all');
                    }}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition ${
                      selectedScheduleId === sched.id
                        ? 'bg-blue-900 border-blue-900 text-white' 
                        : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <b className="text-xs font-bold">Week {sched.weekNumber}</b>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        selectedScheduleId === sched.id ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {sched.shiftType}
                      </span>
                    </div>
                    <p className={`text-[10px] mt-0.5 ${selectedScheduleId === sched.id ? 'text-slate-300' : 'text-slate-500'}`}>
                      {sched.month} {sched.year}
                    </p>
                    <p className={`text-[9px] mt-1.5 font-mono ${selectedScheduleId === sched.id ? 'text-blue-300' : 'text-slate-400'}`}>
                      Purged in: {remainingDays(sched.createdAt)} Days
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Roster Inspector */}
        <div className="lg:col-span-3">
          {selectedScheduleId && activeSchedule ? (
            <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden space-y-5 p-5">
              {/* Inspection Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Roster Inspection • Week {activeSchedule.weekNumber} ({activeSchedule.month} {activeSchedule.year})
                  </h3>
                  <p className="text-xs font-mono text-slate-500">
                    Duty Period duration: {activeSchedule.startDate} to {activeSchedule.endDate}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    id="btn-archive-export"
                    onClick={() => setIsExportModalOpen(true)}
                    className="flex items-center gap-1.5 border border-slate-200 text-slate-700 font-semibold text-xs px-3 py-2 rounded-lg hover:bg-slate-50 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    Download Excel
                  </button>

                  <button
                    id="btn-archive-delete"
                    onClick={() => {
                      if (confirm('Are you sure you want to completely erase this historical roster? This cannot be undone.')) {
                        onDeleteSchedule(activeSchedule.id);
                        setSelectedScheduleId(null);
                      }
                    }}
                    className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-650 font-semibold text-xs px-3 py-2 rounded-lg transition"
                    title="Delete historical schedule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Roster
                  </button>
                </div>
              </div>

              {/* Inspector Content filters */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-400 select-none mr-1 flex items-center gap-1">
                  <MenuSquare className="w-3.5 h-3.5" /> Dept Filter:
                </span>
                <button
                  id="tab-dept-all"
                  onClick={() => setSelectedDept('all')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition ${
                    selectedDept === 'all' 
                      ? 'bg-blue-900 border-blue-900 text-white' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All Depts ({scheduleItems.filter(i => i.scheduleId === selectedScheduleId).length})
                </button>
                {departments.map(dept => {
                  const count = scheduleItems.filter(i => i.scheduleId === selectedScheduleId && i.department === dept.name).length;
                  return (
                    <button
                      key={dept.id}
                      id={`tab-dept-${dept.id}`}
                      onClick={() => setSelectedDept(dept.name)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition ${
                        selectedDept === dept.name 
                          ? 'bg-blue-900 border-blue-900 text-white' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {dept.name} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Roster list */}
              <div className="space-y-4">
                {Object.keys(groupedActiveItems).length === 0 ? (
                  <p className="text-sm text-slate-450 text-center py-10">No schedule items match the target filters.</p>
                ) : (
                  Object.entries(groupedActiveItems).map(([deptName, items]) => (
                    <div key={deptName} className="border border-slate-100 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-700">{deptName} ({items.length} Employees)</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="bg-white border-b border-slate-50 text-slate-400 uppercase font-semibold text-[9px] tracking-wider">
                              <th className="px-4 py-2">Employee Name</th>
                              <th className="px-4 py-2 text-center">Shift Code</th>
                              <th className="px-4 py-2">Shift Schedule Duration</th>
                              <th className="px-4 py-2 text-center">Duty Hours</th>
                              <th className="px-4 py-2">Off-Day</th>
                              <th className="px-4 py-2">Attendance Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 font-medium">
                            {items.map(it => {
                              const hasSplit = it.startTime2 || it.endTime2;
                              return (
                                <tr key={it.id} className="hover:bg-slate-50/50">
                                  <td className="px-4 py-3 text-slate-900 font-semibold">{it.employeeName}</td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="font-bold underline text-blue-900 font-mono text-xs">{it.shiftCode}</span>
                                  </td>
                                  <td className="px-4 py-3 font-mono text-slate-600">
                                    {it.startTime1} - {it.endTime1} {hasSplit ? ` / ${it.startTime2} - ${it.endTime2}` : ''}
                                  </td>
                                  <td className="px-4 py-3 text-center text-slate-800 font-bold">{it.hours} H</td>
                                  <td className="px-4 py-3 text-slate-600 font-medium">{it.dayOff}</td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                                      it.attendanceStatus === 'Present' 
                                        ? 'bg-emerald-50 text-emerald-800' 
                                        : (it.attendanceStatus === 'Absent' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800')
                                    }`}>
                                      {it.attendanceStatus}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-100 p-12 text-center text-slate-500 h-96 flex flex-col items-center justify-center">
              <Archive className="w-10 h-10 text-slate-350 mb-3" />
              <h3 className="text-sm font-semibold text-slate-900">Archive Viewer</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">Select an active historical schedule from the left pane list to inspect full employee logs, export sheet summaries, or make department checks.</p>
            </div>
          )}
        </div>
      </div>

      <ExportConfigModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirm={(options) => exportScheduleToExcel(activeSchedule!, scheduleItems.filter(i => i.scheduleId === selectedScheduleId), options)}
        schedule={activeSchedule}
      />
    </div>
  );
}

