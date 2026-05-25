/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shift } from '../types';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Clock, 
  Sun, 
  Moon, 
  Calendar, 
  FolderSync
} from 'lucide-react';

interface ShiftsViewProps {
  shifts: Shift[];
  onUpdateShifts: (shifts: Shift[]) => void;
}

export default function ShiftsView({
  shifts,
  onUpdateShifts
}: ShiftsViewProps) {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'All' | 'Normal' | 'Ramadan' | 'Eid'>('All');
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [shiftType, setShiftType] = useState<'Normal' | 'Ramadan' | 'Eid'>('Normal');
  const [category, setCategory] = useState<'morning' | 'evening' | 'split'>('morning');
  const [startTime1, setStartTime1] = useState('09:00 AM');
  const [endTime1, setEndTime1] = useState('05:00 PM');
  const [startTime2, setStartTime2] = useState('');
  const [endTime2, setEndTime2] = useState('');
  const [hours, setHours] = useState(8);

  const handleOpenAdd = () => {
    setEditingShift(null);
    setCode('');
    setShiftType('Normal');
    setCategory('morning');
    setStartTime1('09:00 AM');
    setEndTime1('05:00 PM');
    setStartTime2('');
    setEndTime2('');
    setHours(8);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (shift: Shift) => {
    setEditingShift(shift);
    setCode(shift.code);
    setShiftType(shift.shiftType);
    setCategory(shift.category);
    setStartTime1(shift.startTime1);
    setEndTime1(shift.endTime1);
    setStartTime2(shift.startTime2 || '');
    setEndTime2(shift.endTime2 || '');
    setHours(shift.hours);
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const shiftData: Shift = {
      id: editingShift ? editingShift.id : `shift_${Date.now()}`,
      code: code.trim().toUpperCase(),
      shiftType,
      category,
      startTime1,
      endTime1,
      startTime2: category === 'split' ? startTime2 : undefined,
      endTime2: category === 'split' ? endTime2 : undefined,
      hours: Number(hours)
    };

    if (editingShift) {
      onUpdateShifts(shifts.map(s => s.id === editingShift.id ? shiftData : s));
    } else {
      onUpdateShifts([...shifts, shiftData]);
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this shift definition? Existing schedules mapping this code may display incomplete timing.')) {
      onUpdateShifts(shifts.filter(s => s.id !== id));
    }
  };

  const filteredShifts = selectedTypeFilter === 'All' 
    ? shifts 
    : shifts.filter(s => s.shiftType === selectedTypeFilter);

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl shadow-xs border border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-teal-50 text-teal-800 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Shift Configurations</h2>
            <p className="text-xs text-slate-500">Add, adjust, or remove Normal, Ramadan, and Eid schedules intervals</p>
          </div>
        </div>
        <button
          id="btn-add-shift"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-blue-900 hover:bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Shift Rule
        </button>
      </div>

      {/* Tabs list inside local space */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full max-w-md">
        {(['All', 'Normal', 'Ramadan', 'Eid'] as const).map(tab => (
          <button
            key={tab}
            id={`tab-shift-filter-${tab}`}
            onClick={() => setSelectedTypeFilter(tab)}
            className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              selectedTypeFilter === tab 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Shifts catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredShifts.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center text-slate-400 text-sm rounded-xl border border-slate-100">
            No shift configurations exist for the selected type.
          </div>
        ) : (
          filteredShifts.map(shift => {
            const isSplit = shift.category === 'split';
            return (
              <div 
                key={shift.id} 
                className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs relative hover:shadow-sm hover:border-slate-200 transition-all flex flex-col justify-between"
              >
                {/* Meta details */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-2xl font-black font-mono tracking-tight ${
                      shift.shiftType === 'Ramadan' ? 'text-emerald-700' : (shift.shiftType === 'Eid' ? 'text-amber-700' : 'text-blue-900')
                    }`}>
                      {shift.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        shift.shiftType === 'Ramadan' 
                          ? 'bg-emerald-50 text-emerald-800' 
                          : (shift.shiftType === 'Eid' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800')
                      }`}>
                        {shift.shiftType}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600`}>
                        {shift.category}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {/* Timing 1 */}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      {shift.category === 'morning' ? (
                        <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                      ) : shift.category === 'evening' ? (
                        <Moon className="w-4 h-4 text-indigo-500 shrink-0" />
                      ) : (
                        <FolderSync className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Duty Interval 1</span>
                        <span className="font-mono font-medium text-slate-800 text-xs">
                          {shift.startTime1} - {shift.endTime1}
                        </span>
                      </div>
                    </div>

                    {/* Timing 2 */}
                    {isSplit && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 border-t border-dashed border-slate-100 pt-2">
                        <FolderSync className="w-4 h-4 text-teal-500 shrink-0" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Duty Interval 2 (Split)</span>
                          <span className="font-mono font-medium text-slate-800 text-xs">
                            {shift.startTime2} - {shift.endTime2}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer details */}
                <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-2">
                  <span className="text-xs font-semibold text-slate-500">
                    Target: <b className="text-slate-800">{shift.hours} hours</b>/day
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <button
                      id={`btn-edit-shift-${shift.id}`}
                      onClick={() => handleOpenEdit(shift)}
                      className="p-1.5 bg-slate-50 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-900 transition-colors"
                      title="Edit Shift Timings"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`btn-delete-shift-${shift.id}`}
                      onClick={() => handleDelete(shift.id)}
                      className="p-1.5 bg-slate-50 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Shift"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Form Sheet / Dialect Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                {editingShift ? `Modify Shift ${editingShift.code}` : 'Define New Shift'}
              </h3>
              <button
                id="btn-close-shift-modal"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold transition animate-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Shift Code and Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Shift Code
                  </label>
                  <input
                    id="form-shift-code"
                    type="text"
                    required
                    placeholder="e.g. A, RB, EC"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg uppercase font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Shift Type
                  </label>
                  <select
                    id="form-shift-type"
                    value={shiftType}
                    onChange={(e) => setShiftType(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Ramadan">Ramadan</option>
                    <option value="Eid">Eid</option>
                  </select>
                </div>
              </div>

              {/* Classification Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Category (For Fair Rotations)
                </label>
                <select
                  id="form-shift-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                >
                  <option value="morning">Morning Shift (e.g. A, B, RC)</option>
                  <option value="evening">Evening/Night Shift (e.g. D, E, RE)</option>
                  <option value="split">Split Duty Shift (e.g. Z, RF)</option>
                </select>
              </div>

              {/* Interval 1 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Start Time 1
                  </label>
                  <input
                    id="form-shift-start1"
                    type="text"
                    required
                    placeholder="e.g. 07:00 AM"
                    value={startTime1}
                    onChange={(e) => setStartTime1(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    End Time 1
                  </label>
                  <input
                    id="form-shift-end1"
                    type="text"
                    required
                    placeholder="e.g. 03:00 PM"
                    value={endTime1}
                    onChange={(e) => setEndTime1(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                  />
                </div>
              </div>

              {/* Interval 2 (Enabled only for split Category) */}
              {category === 'split' && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 animate-in slide-in-from-top-3 duration-100">
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                      Start Time 2
                    </label>
                    <input
                      id="form-shift-start2"
                      type="text"
                      placeholder="e.g. 04:00 PM"
                      value={startTime2}
                      onChange={(e) => setStartTime2(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-emerald-200 rounded-lg bg-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                      End Time 2
                    </label>
                    <input
                      id="form-shift-end2"
                      type="text"
                      placeholder="e.g. 08:00 PM"
                      value={endTime2}
                      onChange={(e) => setEndTime2(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-emerald-200 rounded-lg bg-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Working Hours calculation */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Target Shift Hours/Day
                </label>
                <input
                  id="form-shift-hours"
                  type="number"
                  min="1"
                  max="24"
                  required
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                />
              </div>

              {/* Action row buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  id="btn-shift-cancel"
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  id="btn-shift-submit"
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition shadow-xs"
                >
                  Save Shift Design
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
