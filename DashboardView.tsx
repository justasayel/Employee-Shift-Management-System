/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Employee, Shift, Schedule, ScheduleItem, Department } from '../types';
import { exportScheduleToExcel } from '../excelExport';
import ExportConfigModal from './ExportConfigModal';
import { useState } from 'react';

import { 
  Users, 
  UserCheck, 
  UserX, 
  Calendar, 
  Clock, 
  FileSpreadsheet, 
  AlertTriangle,
  PlayCircle,
  HelpCircle,
  TrendingUp,
  Clock3,
  CheckCircle2
} from 'lucide-react';

interface DashboardViewProps {
  employees: Employee[];
  shifts: Shift[];
  departments: Department[];
  schedules: Schedule[];
  scheduleItems: ScheduleItem[];
  onNavigate: (tab: string) => void;
}

export default function DashboardView({
  employees,
  shifts,
  departments,
  schedules,
  scheduleItems,
  onNavigate
}: DashboardViewProps) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [activeExportSchedule, setActiveExportSchedule] = useState<Schedule | null>(null);
  const [activeExportItems, setActiveExportItems] = useState<ScheduleItem[]>([]);

  // 1. Basic Counts

  const totalEmployees = employees.length;
  const availableCount = employees.filter(e => e.isAvailable).length;
  const unavailableCount = employees.filter(e => !e.isAvailable).length;
  const schedulesCount = schedules.length;

  // Let's get the most recent schedule to calculate attendance today
  const sortedSchedules = [...schedules].sort((a, b) => b.createdAt - a.createdAt);
  const activeSchedule = sortedSchedules[0];

  const activeWeekItems = activeSchedule 
    ? scheduleItems.filter(item => item.scheduleId === activeSchedule.id)
    : [];
  
  const presentTodayCount = activeWeekItems.filter(i => i.attendanceStatus === 'Present').length;
  const attendancePercentage = activeWeekItems.length > 0 
    ? Math.round((presentTodayCount / activeWeekItems.length) * 100)
    : 100;

  // 2. Alert logic for available employees not in the active schedule
  const getMissingAvailableEmployeesForActiveRoster = () => {
    if (!activeSchedule) return [];
    
    // Find all active employees who are available
    const available = employees.filter(e => e.isAvailable);
    const scheduledIds = new Set(activeWeekItems.map(item => item.employeeId));
    
    return available.filter(emp => !scheduledIds.has(emp.id));
  };

  const missingEmployees = getMissingAvailableEmployeesForActiveRoster();

  return (
    <div className="space-y-6">
      {/* Bento Stats Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Box 1: Total Employees */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 select-none">Staff Roster Size</span>
            <Users className="w-4 h-4 text-blue-900" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">{totalEmployees}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Total registered staff</p>
          </div>
        </div>

        {/* Box 2: Available Employees */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 select-none">Active Staff</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-emerald-800">{availableCount}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Allocated in rules engine</p>
          </div>
        </div>

        {/* Box 3: Unavailable Employees */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between border-l-4 border-l-slate-400">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 select-none">Unavailable Staff</span>
            <UserX className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-500">{unavailableCount}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Temporarily excluded</p>
          </div>
        </div>

        {/* Box 4: Generated Schedules */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 select-none">Total Rosters</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">{schedulesCount}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Schedules in buffer</p>
          </div>
        </div>

        {/* Box 5: Active Attendance Ratio */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between border-l-4 border-l-teal-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-teal-600 select-none">Roster Compliance</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-teal-800">{attendancePercentage}%</h3>
            <p className="text-[10px] text-slate-500 mt-1">Present ratio in Week {activeSchedule?.weekNumber || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Alert center and Recent schedules list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Missing Available Staff and Recent Rosters summaries */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Missing Employee Alert widget strictly styled in RED */}
          {activeSchedule && missingEmployees.length > 0 && (
            <div className="bg-red-50 border border-red-200 p-5 rounded-xl text-red-950 shadow-xs">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-650 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-red-900">Coverage Advisory: Displaced Employees Detected</h4>
                  <p className="text-xs text-red-700 mt-1">
                    The following available employees are NOT assigned to any working shift in the active Week {activeSchedule.weekNumber} schedule:
                  </p>
                  
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {missingEmployees.map(emp => (
                      <span 
                        key={emp.id} 
                        className="inline-flex items-center px-2 py-1 rounded bg-red-150 border border-red-250 text-[10px] font-bold text-red-900"
                      >
                        {emp.name} ({emp.department})
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      id="btn-navigate-to-planner-alert"
                      onClick={() => onNavigate('planner')}
                      className="text-xs font-semibold bg-red-900 hover:bg-slate-900 text-white px-3 py-1.5 rounded transition shadow-xs"
                    >
                      Fix Allocation Conflict
                    </button>
                    <button
                      id="btn-navigate-to-employees"
                      onClick={() => onNavigate('employees')}
                      className="text-xs font-semibold text-red-800 hover:underline px-2 py-1.5 transition"
                    >
                      Update Employee Availability
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Checklist Area: Recent Generated Rosters */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
              <span>Active Schedules Dashboard</span>
              <span className="text-xs text-slate-400 font-medium">Recent items lists</span>
            </h3>

            {schedules.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No rosters have been generated yet. Go to Schedule Planner to generate your first roster.
              </div>
            ) : (
              <div className="space-y-3">
                {sortedSchedules.slice(0, 4).map(sched => {
                  const items = scheduleItems.filter(i => i.scheduleId === sched.id);
                  const missingCount = employees.filter(e => e.isAvailable && !items.some(i => i.employeeId === e.id)).length;
                  
                  return (
                    <div 
                      key={sched.id} 
                      className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-800">Week {sched.weekNumber} Plan</span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-indigo-50 text-indigo-800">
                            {sched.shiftType} standard
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Timeline: {sched.startDate} to {sched.endDate} • {items.length} employees scheduled
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {missingCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] bg-red-50 text-red-700 font-bold border border-red-200">
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                            Missing Staff
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Complete
                          </span>
                        )}
                        
                        {/* Download sheet */}
                        <button
                          id={`btn-dash-export-xls-${sched.id}`}
                          onClick={() => {
                            setActiveExportSchedule(sched);
                            setActiveExportItems(items);
                            setIsExportModalOpen(true);
                          }}
                          className="p-1 px-3.5 bg-white border border-slate-200 font-semibold text-xs rounded-lg hover:bg-slate-50 hover:text-blue-900 text-slate-800 transition shadow-xs flex items-center gap-1"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Export</span>
                        </button>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Actions & Upcoming Shifting rules checklist */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white shadow-xs border border-slate-100 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Operations</h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                id="btn-dash-goto-schedule"
                onClick={() => onNavigate('planner')}
                className="w-full text-left p-3 rounded-lg border border-slate-150 hover:bg-slate-50 hover:border-slate-200 transition group flex items-center justify-between"
              >
                <div>
                  <b className="text-slate-800 text-xs block">Generate New Roster</b>
                  <span className="text-[10px] text-slate-400">Build weekly rotating plans</span>
                </div>
                <PlayCircle className="w-4 h-4 text-blue-900 opacity-60 group-hover:opacity-100 transition" />
              </button>

              <button
                id="btn-dash-goto-attendance"
                onClick={() => onNavigate('attendance')}
                className="w-full text-left p-3 rounded-lg border border-slate-150 hover:bg-slate-50 hover:border-slate-200 transition group flex items-center justify-between"
              >
                <div>
                  <b className="text-slate-800 text-xs block">Logs Daily Attendance</b>
                  <span className="text-[10px] text-slate-400">Mark absent/present logs</span>
                </div>
                <PlayCircle className="w-4 h-4 text-emerald-600 opacity-60 group-hover:opacity-100 transition" />
              </button>

              <button
                id="btn-dash-goto-employees"
                onClick={() => onNavigate('employees')}
                className="w-full text-left p-3 rounded-lg border border-slate-150 hover:bg-slate-50 hover:border-slate-200 transition group flex items-center justify-between"
              >
                <div>
                  <b className="text-slate-800 text-xs block">Shift Allocation</b>
                  <span className="text-[10px] text-slate-400">Verify staff availability</span>
                </div>
                <PlayCircle className="w-4 h-4 text-indigo-600 opacity-60 group-hover:opacity-100 transition" />
              </button>
            </div>
          </div>

          {/* Quick Shifts Timetable Overview */}
          <div className="bg-white border border-slate-100 shadow-xs rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Shifts Reference</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {shifts.slice(0, 5).map(sh => (
                <div key={sh.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-xs text-blue-900">{sh.code}</span>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">{sh.shiftType} Shift</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] text-slate-600 font-semibold">{sh.startTime1} - {sh.endTime1}</span>
                    <span className="text-[9px] text-slate-400 font-bold block">{sh.hours} Working Hours</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <ExportConfigModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirm={(options) => exportScheduleToExcel(activeExportSchedule!, activeExportItems, options)}
        schedule={activeExportSchedule}
      />
    </div>
  );
}

