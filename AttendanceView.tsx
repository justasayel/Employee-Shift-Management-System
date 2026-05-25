/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Schedule, ScheduleItem, Department } from '../types';
import { 
  ClipboardCheck, 
  Check, 
  X, 
  Clock, 
  FileText, 
  CalendarDays,
  UserCheck2,
  AlertTriangle
} from 'lucide-react';

interface AttendanceViewProps {
  schedules: Schedule[];
  scheduleItems: ScheduleItem[];
  departments: Department[];
  onUpdateAttendanceStatus: (itemId: string, status: 'Present' | 'Absent' | 'Late' | 'Excused') => void;
}

export default function AttendanceView({
  schedules,
  scheduleItems,
  departments,
  onUpdateAttendanceStatus
}: AttendanceViewProps) {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(schedules[0]?.id || '');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');

  const activeSchedule = schedules.find(s => s.id === selectedScheduleId);
  const activeItems = scheduleItems.filter(item => {
    const matchesSchedule = item.scheduleId === selectedScheduleId;
    const matchesDept = selectedDeptFilter === 'all' || item.department === selectedDeptFilter;
    return matchesSchedule && matchesDept;
  });

  // Calculate quick metrics for selected active roster
  const scheduleAllItems = scheduleItems.filter(item => item.scheduleId === selectedScheduleId);
  const totalEmployees = scheduleAllItems.length;
  const presentCount = scheduleAllItems.filter(i => i.attendanceStatus === 'Present').length;
  const absentCount = scheduleAllItems.filter(i => i.attendanceStatus === 'Absent').length;
  const lateCount = scheduleAllItems.filter(i => i.attendanceStatus === 'Late').length;
  const excusedCount = scheduleAllItems.filter(i => i.attendanceStatus === 'Excused').length;

  const presentPercentage = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;

  // Group active items by department
  const groupedItems: { [dept: string]: ScheduleItem[] } = {};
  for (const item of activeItems) {
    if (!groupedItems[item.department]) {
      groupedItems[item.department] = [];
    }
    groupedItems[item.department].push(item);
  }

  return (
    <div className="space-y-6">
      {/* Top Banner and Quick Selection */}
      <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-900 rounded-lg">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Attendance Register</h2>
            <p className="text-xs text-slate-500">Track and log employee attendance per weekly roster</p>
          </div>
        </div>

        {/* Schedule Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 select-none mr-1 flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" /> Select Week:
          </span>
          <select
            id="attendance-schedule-select"
            value={selectedScheduleId}
            onChange={(e) => setSelectedScheduleId(e.target.value)}
            className="text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium text-slate-700 focus:outline-none"
          >
            {schedules.length === 0 ? (
              <option value="">No Schedules Available</option>
            ) : (
              schedules.map(s => (
                <option key={s.id} value={s.id}>
                  Week {s.weekNumber} ({s.month} {s.year})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {schedules.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center text-slate-500">
          <AlertTriangle className="w-12 h-12 text-slate-350 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900 mb-1">No Active Schedules Loaded</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">Please visit the "Generate Schedule" page to construct a roster. Once generated, the attendance register sheets will populate here automatically.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Metrics Carousel */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">Roster Staff</span>
              <span className="text-xl font-bold text-slate-900">{totalEmployees} Registered</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs border-l-4 border-l-emerald-500">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider mb-1">Present Today</span>
              <span className="text-xl font-bold text-emerald-800">{presentCount} Staff</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs border-l-4 border-l-red-500">
              <span className="text-[10px] uppercase font-bold text-red-600 block tracking-wider mb-1">Absent</span>
              <span className="text-xl font-bold text-red-800">{absentCount} Staff</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs border-l-4 border-l-amber-500">
              <span className="text-[10px] uppercase font-bold text-amber-600 block tracking-wider mb-1">Logged Late</span>
              <span className="text-xl font-bold text-amber-800">{lateCount} Staff</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs border-l-4 border-l-blue-500">
              <span className="text-[10px] uppercase font-bold text-blue-600 block tracking-wider mb-1">Attendance Ratio</span>
              <span className="text-xl font-bold text-blue-800">{presentPercentage}% Match</span>
            </div>
          </div>

          {/* Table list with Department selector */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-3">
              <h3 className="text-sm font-bold text-slate-900">Mark Team Status</h3>
              
              <div className="flex items-center gap-1.5 self-start">
                <span className="text-xs text-slate-400 font-medium mr-1">Filter Dept:</span>
                <button
                  id="tab-attendance-dept-all"
                  onClick={() => setSelectedDeptFilter('all')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition ${
                    selectedDeptFilter === 'all' 
                      ? 'bg-blue-900 border-blue-900 text-white shadow-xs' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All Depts ({scheduleAllItems.length})
                </button>
                {departments.map(dept => {
                  const count = scheduleAllItems.filter(i => i.department === dept.name).length;
                  return (
                    <button
                      key={dept.id}
                      id={`tab-attendance-dept-${dept.id}`}
                      onClick={() => setSelectedDeptFilter(dept.name)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition ${
                        selectedDeptFilter === dept.name 
                          ? 'bg-blue-900 border-blue-900 text-white shadow-xs' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {dept.name} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Structured Table */}
            <div className="space-y-4">
              {Object.keys(groupedItems).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No employees match filters in this week.</p>
              ) : (
                Object.entries(groupedItems).map(([deptName, items]) => (
                  <div key={deptName} className="border border-slate-100 rounded-xl overflow-hidden shadow-xs bg-white">
                    <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">{deptName}</span>
                      <span className="text-[9px] uppercase font-bold text-slate-400 select-none">Quick Status Panel</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-white border-b border-slate-50 text-slate-400 uppercase font-semibold text-[9px] tracking-wider">
                            <th className="px-5 py-2.5">Staff Employee</th>
                            <th className="px-5 py-2.5">Schedule Slot</th>
                            <th className="px-5 py-2.5">Day-Off</th>
                            <th className="px-5 py-2.5 text-center" style={{ width: '380px' }}>Mark Attendance Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-medium">
                          {items.map(it => {
                            const hasSplit = it.startTime2 || it.endTime2;
                            return (
                              <tr key={it.id} className="hover:bg-slate-50/50">
                                <td className="px-5 py-3 font-semibold text-slate-800">{it.employeeName}</td>
                                <td className="px-5 py-3 font-mono text-slate-500">
                                  Shift {it.shiftCode} ({it.startTime1} - {it.endTime1}{hasSplit ? ` and ${it.startTime2} - ${it.endTime2}` : ''})
                                </td>
                                <td className="px-5 py-3 text-slate-500">{it.dayOff}</td>
                                <td className="px-5 py-3 text-center">
                                  <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
                                    {/* Present button */}
                                    <button
                                      id={`btn-attend-present-${it.id}`}
                                      onClick={() => onUpdateAttendanceStatus(it.id, 'Present')}
                                      className={`flex items-center gap-1 px-3 py-1 rounded-md text-[10px] font-bold uppercase transition ${
                                        it.attendanceStatus === 'Present'
                                          ? 'bg-emerald-600 text-white shadow-xs' 
                                          : 'text-slate-600 hover:bg-slate-200'
                                      }`}
                                    >
                                      Present
                                    </button>
                                    {/* Absent button */}
                                    <button
                                      id={`btn-attend-absent-${it.id}`}
                                      onClick={() => onUpdateAttendanceStatus(it.id, 'Absent')}
                                      className={`flex items-center gap-1 px-3 py-1 rounded-md text-[10px] font-bold uppercase transition ${
                                        it.attendanceStatus === 'Absent'
                                          ? 'bg-red-600 text-white shadow-xs' 
                                          : 'text-slate-600 hover:bg-slate-200'
                                      }`}
                                    >
                                      Absent
                                    </button>
                                    {/* Late button */}
                                    <button
                                      id={`btn-attend-late-${it.id}`}
                                      onClick={() => onUpdateAttendanceStatus(it.id, 'Late')}
                                      className={`flex items-center gap-1 px-3 py-1 rounded-md text-[10px] font-bold uppercase transition ${
                                        it.attendanceStatus === 'Late'
                                          ? 'bg-amber-500 text-white shadow-xs' 
                                          : 'text-slate-600 hover:bg-slate-200'
                                      }`}
                                    >
                                      Late
                                    </button>
                                    {/* Excused button */}
                                    <button
                                      id={`btn-attend-excused-${it.id}`}
                                      onClick={() => onUpdateAttendanceStatus(it.id, 'Excused')}
                                      className={`flex items-center gap-1 px-3 py-1 rounded-md text-[10px] font-bold uppercase transition ${
                                        it.attendanceStatus === 'Excused'
                                          ? 'bg-blue-600 text-white shadow-xs' 
                                          : 'text-slate-600 hover:bg-slate-200'
                                      }`}
                                    >
                                      Excused
                                    </button>
                                  </div>
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
        </div>
      )}
    </div>
  );
}
