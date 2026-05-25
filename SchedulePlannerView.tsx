/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Employee, Shift, Schedule, ScheduleItem, Department } from '../types';
import { generateScheduleItems } from '../rotation';
import { exportScheduleToExcel } from '../excelExport';
import ExportConfigModal from './ExportConfigModal';

import { 
  CalendarDays, 
  Sparkles, 
  Download, 
  AlertOctagon, 
  Save, 
  Trash2, 
  Info,
  CalendarCheck
} from 'lucide-react';

interface SchedulePlannerViewProps {
  employees: Employee[];
  shifts: Shift[];
  departments: Department[];
  schedules: Schedule[];
  scheduleItems: ScheduleItem[];
  onSaveSchedule: (schedule: Schedule, items: ScheduleItem[]) => void;
}

export default function SchedulePlannerView({
  employees,
  shifts,
  departments,
  schedules,
  scheduleItems,
  onSaveSchedule
}: SchedulePlannerViewProps) {
  const currentYear = new Date().getFullYear();
  
  // Planner configurations
  const [month, setMonth] = useState('May');
  const [year, setYear] = useState(currentYear);
  const [weekNum, setWeekNum] = useState(1);
  const [shiftType, setShiftType] = useState<'Normal' | 'Ramadan' | 'Eid'>('Normal');
  
  // Current active draft
  const [draftSchedule, setDraftSchedule] = useState<Schedule | null>(null);
  const [draftItems, setDraftItems] = useState<ScheduleItem[]>([]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [missingAlert, setMissingAlert] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);


  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calculate start-end dates based on week number, month and year
  const getWeekDates = (w: number, mName: string, y: number) => {
    const mIdx = months.indexOf(mName);
    const startDay = 1 + (w - 1) * 7;
    const start = new Date(y, mIdx, startDay);
    
    // For week 4, it encompasses the end of the month
    const lastDayOfMonth = new Date(y, mIdx + 1, 0).getDate();
    const endDay = w === 4 ? lastDayOfMonth : (startDay + 6);
    const end = new Date(y, mIdx, endDay);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    return { start: formatDate(start), end: formatDate(end) };
  };

  const activeDates = getWeekDates(weekNum, month, year);

  // Validate missing available employees
  const validateAvailableEmployeesPresence = (items: ScheduleItem[]) => {
    const availableEmployees = employees.filter(e => e.isAvailable);
    const scheduledEmployeeIds = new Set(items.map(i => i.employeeId));
    
    const missing: Employee[] = [];
    for (const emp of availableEmployees) {
      if (!scheduledEmployeeIds.has(emp.id)) {
        missing.push(emp);
      }
    }

    if (missing.length > 0) {
      setMissingAlert(
        `There are available employees missing from the schedule (${missing.map(e => e.name).join(', ')}). Please review before exporting.`
      );
      return false;
    } else {
      setMissingAlert(null);
      return true;
    }
  };

  // Generate Schedule Proposal
  const handleGenerate = () => {
    const availableEmployees = employees.filter(e => e.isAvailable);
    
    // Create new temporary Schedule object
    const newScheduleId = `sched_${Date.now()}`;
    const newSchedule: Schedule = {
      id: newScheduleId,
      month,
      year,
      weekNumber: weekNum,
      shiftType,
      startDate: activeDates.start,
      endDate: activeDates.end,
      createdAt: Date.now()
    };

    // Run rotation engine
    const proposedItems = generateScheduleItems(newScheduleId, shiftType, availableEmployees);

    setDraftSchedule(newSchedule);
    setDraftItems(proposedItems);
    setIsGenerated(true);
    setSaveSuccess(false);

    // Validate right away
    validateAvailableEmployeesPresence(proposedItems);
  };

  // Handle inline changes to draft items (to make customized tweaks)
  const handleItemFieldChange = (itemId: string, field: keyof ScheduleItem, value: any) => {
    const updated = draftItems.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        
        // If they modified shift code, load the correct start/end duty period times and hours!
        if (field === 'shiftCode') {
          const matchedShift = shifts.find(s => s.code === value && s.shiftType === shiftType);
          if (matchedShift) {
            updatedItem.startTime1 = matchedShift.startTime1;
            updatedItem.endTime1 = matchedShift.endTime1;
            updatedItem.startTime2 = matchedShift.startTime2 || '';
            updatedItem.endTime2 = matchedShift.endTime2 || '';
            updatedItem.hours = matchedShift.hours;
          }
        }
        return updatedItem;
      }
      return item;
    });

    setDraftItems(updated);
    validateAvailableEmployeesPresence(updated);
  };

  // Delete item from draft schedule (to simulate testing validation alert)
  const handleDeleteDraftItem = (itemId: string) => {
    const filt = draftItems.filter(item => item.id !== itemId);
    setDraftItems(filt);
    validateAvailableEmployeesPresence(filt);
  };

  // Save draft schedule to Database
  const handleSaveToDatabase = () => {
    if (!draftSchedule) return;

    // Check if there are available employees missing
    const isValid = validateAvailableEmployeesPresence(draftItems);
    if (!isValid) {
      alert("Validation Failed:\n" + (missingAlert || "Available employees are missing."));
      return;
    }

    onSaveSchedule(draftSchedule, draftItems);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  // Download Excel Trigger
  const handleDownloadExcel = () => {
    if (!draftSchedule) return;

    // Strict validation requirement from prompt
    const isValid = validateAvailableEmployeesPresence(draftItems);
    if (!isValid) {
      alert("Export Blocked:\nThere are available employees missing from the schedule. Please review before exporting.");
      return;
    }

    setIsExportModalOpen(true);
  };


  // Run validation whenever draft changes
  useEffect(() => {
    if (isGenerated) {
      validateAvailableEmployeesPresence(draftItems);
    }
  }, [employees]);

  // Group draft items by department
  const groupedDraft: { [dept: string]: ScheduleItem[] } = {};
  for (const item of draftItems) {
    if (!groupedDraft[item.department]) {
      groupedDraft[item.department] = [];
    }
    groupedDraft[item.department].push(item);
  }

  return (
    <div className="space-y-6">
      {/* Configure banner */}
      <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-100 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Select Month
          </label>
          <select
            id="planner-month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 font-medium"
          >
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Year
          </label>
          <select
            id="planner-year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 font-medium"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Week Number
          </label>
          <select
            id="planner-week"
            value={weekNum}
            onChange={(e) => setWeekNum(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 font-medium bg-white"
          >
            <option value="1">Week 1</option>
            <option value="2">Week 2</option>
            <option value="3">Week 3</option>
            <option value="4">Week 4</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Active Shift Standard
          </label>
          <select
            id="planner-shifttype"
            value={shiftType}
            onChange={(e) => setShiftType(e.target.value as any)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 font-semibold text-slate-800"
          >
            <option value="Normal">Normal Shift Rules</option>
            <option value="Ramadan">Ramadan (6hrs max rules)</option>
            <option value="Eid">Eid Holidays (4hrs split rules)</option>
          </select>
        </div>

        <div>
          <button
            id="btn-generate-schedule"
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2 bg-blue-900 hover:bg-slate-900 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-all shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            Generate Proposal
          </button>
        </div>
      </div>

      {isGenerated && draftSchedule && (
        <div className="space-y-5">
          {/* Active stats bar */}
          <div className="bg-slate-900 text-white p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 select-none block tracking-wider">Draft Schedule Overview</span>
              <p className="text-base font-semibold tracking-tight">
                Week {draftSchedule.weekNumber} ({draftSchedule.month} {draftSchedule.year}) • Start: {draftSchedule.startDate} to End: {draftSchedule.endDate}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                id="btn-save-schedule"
                onClick={handleSaveToDatabase}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                <Save className="w-4 h-4" />
                Save Schedule
              </button>
              <button
                id="btn-export-excel"
                onClick={handleDownloadExcel}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                <Download className="w-4 h-4" />
                Download Excel Schedule
              </button>
            </div>
          </div>

          {/* Success toast indicator */}
          {saveSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-850 text-sm flex items-center gap-3 animate-pulse">
              <CalendarCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <b>Perfect!</b> Schedule items were successfully committed to persistence database and are now viewable in the Past Schedules & Attendance tabs immediately.
              </div>
            </div>
          )}

          {/* Verification Warning Sheet */}
          {missingAlert && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-900 text-sm flex items-start gap-3 animate-bounce">
              <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <b className="font-bold block">Validation Alert: Missing Active Staff</b>
                <span>{missingAlert}</span>
                <p className="text-xs text-red-500 mt-1 font-semibold">
                  * Note: Excel export and database save are BLOCKED until these staff are re-allocated. Press "Generate Proposal" or assign them shifts manually below.
                </p>
              </div>
            </div>
          )}

          {/* Schedule Table Grouped by Departments */}
          <div className="space-y-6">
            {Object.keys(groupedDraft).length === 0 ? (
              <div className="bg-white p-12 text-center text-slate-400 text-sm border border-slate-100 rounded-xl">
                There are currently no scheduled employees.
              </div>
            ) : (
              Object.entries(groupedDraft).map(([dept, items]) => (
                <div key={dept} className="bg-white rounded-xl shadow-xs border border-slate-150 overflow-hidden">
                  <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">{dept} ({items.length} Employees Assigned)</span>
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider select-none">Manual Override Area</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white border-b border-slate-100 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                          <th className="px-5 py-3">Employee</th>
                          <th className="px-5 py-3">Shift Code</th>
                          <th className="px-5 py-3">Working Period 1</th>
                          <th className="px-5 py-3">Working Period 2 (Split)</th>
                          <th className="px-5 py-3 text-center">Hours</th>
                          <th className="px-5 py-3">Weekly Day Off</th>
                          <th className="px-5 py-3 text-right">Override</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map(item => {
                          const validCodeShifts = shifts.filter(s => s.shiftType === shiftType);
                          const isSplit = item.startTime2 || item.endTime2;
                          
                          return (
                            <tr key={item.id} className="text-sm">
                              <td className="px-5 py-4 font-semibold text-slate-800">{item.employeeName}</td>
                              <td className="px-5 py-4">
                                <select
                                  id={`override-code-${item.id}`}
                                  value={item.shiftCode}
                                  onChange={(e) => handleItemFieldChange(item.id, 'shiftCode', e.target.value)}
                                  className="px-2 py-1 text-xs border border-slate-200 rounded bg-white font-bold font-mono text-blue-900 focus:outline-none"
                                >
                                  {validCodeShifts.map(s => (
                                    <option key={s.id} value={s.code}>{s.code}</option>
                                  ))}
                                </select>
                              </td> 
                              <td className="px-5 py-4 font-mono text-xs text-slate-600">
                                {item.startTime1} - {item.endTime1}
                              </td>
                              <td className="px-5 py-4 font-mono text-xs text-slate-500">
                                {isSplit ? `${item.startTime2} - ${item.endTime2}` : '—'}
                              </td>
                              <td className="px-5 py-4 font-mono text-xs text-center font-bold text-slate-700">
                                {item.hours}
                              </td>
                              <td className="px-5 py-4">
                                <select
                                  id={`override-dayoff-${item.id}`}
                                  value={item.dayOff}
                                  onChange={(e) => handleItemFieldChange(item.id, 'dayOff', e.target.value)}
                                  className="px-2 py-1 text-xs border border-slate-200 bg-white font-semibold text-slate-600 focus:outline-none"
                                >
                                  <option value="Friday">Friday</option>
                                  <option value="Saturday">Saturday</option>
                                  <option value="Sunday">Sunday</option>
                                  <option value="Monday">Monday</option>
                                  <option value="Tuesday">Tuesday</option>
                                  <option value="Wednesday">Wednesday</option>
                                  <option value="Thursday">Thursday</option>
                                </select>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <button
                                  id={`btn-del-draft-${item.id}`}
                                  onClick={() => handleDeleteDraftItem(item.id)}
                                  className="p-1 rounded text-red-500 hover:bg-red-50 transition"
                                  title="Exclude Employee from this Week"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
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
      )}

      {!isGenerated && (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center text-slate-500">
          <CalendarDays className="w-12 h-12 text-slate-350 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-slate-900 mb-1">Schedule Proposal Planner</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">Visualizer for custom rosters. Fill in details and click "Generate Proposal" to generate dynamic rotating assignments fairly.</p>
          <div className="flex justify-center gap-6 text-left max-w-lg mx-auto bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-900 mt-0.5 shrink-0" />
              <div>
                <b className="text-slate-800">Static Assignment Integration</b>
                <p>Employees flagged with "Static Shift" keep their configurations across months.</p>
              </div>
            </div>
            <div className="flex items-start gap-2 border-l border-slate-200 pl-4">
              <Info className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" />
              <div>
                <b className="text-slate-800">Dynamic History Rotation</b>
                <p>All rotating available team members alternate shifts based on immediate past schedules lists.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <ExportConfigModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirm={(options) => exportScheduleToExcel(draftSchedule!, draftItems, options)}
        schedule={draftSchedule}
      />
    </div>
  );
}

