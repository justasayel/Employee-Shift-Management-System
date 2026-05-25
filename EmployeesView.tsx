/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Employee, Shift, Department } from '../types';
import { 
  UserPlus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Search, 
  SlidersHorizontal,
  FolderSync,
  Pin
} from 'lucide-react';

interface EmployeesViewProps {
  employees: Employee[];
  shifts: Shift[];
  departments: Department[];
  onUpdateEmployees: (emps: Employee[]) => void;
  onUpdateDepartments?: (depts: Department[]) => void;
}

export default function EmployeesView({
  employees,
  shifts,
  departments,
  onUpdateEmployees,
  onUpdateDepartments
}: EmployeesViewProps) {
  // Local state for actions
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [deptDropdownVal, setDeptDropdownVal] = useState('');
  const [customDeptName, setCustomDeptName] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [staticShiftId, setStaticShiftId] = useState('');

  // Open form for adding
  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setName('');
    const initialDept = departments[0]?.name || '';
    setDepartment(initialDept);
    setDeptDropdownVal(initialDept);
    setCustomDeptName('');
    setIsAvailable(true);
    setStaticShiftId('');
    setIsFormOpen(true);
  };

  // Open form for editing
  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setDepartment(emp.department);
    setDeptDropdownVal(emp.department);
    setCustomDeptName('');
    setIsAvailable(emp.isAvailable);
    setStaticShiftId(emp.staticShiftId || '');
    setIsFormOpen(true);
  };

  // Save employee
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let finalDept = deptDropdownVal;
    if (deptDropdownVal === 'Other') {
      const trimmedCustom = customDeptName.trim();
      if (!trimmedCustom) {
        alert('Please enter a custom department name.');
        return;
      }
      
      // Check if department name already exists (case-insensitive)
      const existingDept = departments.find(
        d => d.name.toLowerCase() === trimmedCustom.toLowerCase()
      );
      
      if (existingDept) {
        finalDept = existingDept.name;
      } else {
        // Create new department structure
        const nextId = `dep_${Date.now()}`;
        const newDeptName = trimmedCustom; // Preserve case
        
        const bgColors = [
          'bg-indigo-50 text-indigo-700 border-indigo-200',
          'bg-teal-50 text-teal-700 border-teal-200',
          'bg-amber-50 text-amber-700 border-amber-200',
          'bg-sky-50 text-sky-700 border-sky-200',
          'bg-rose-50 text-rose-700 border-rose-200',
          'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
          'bg-orange-50 text-orange-700 border-orange-200',
          'bg-violet-50 text-violet-700 border-violet-200',
          'bg-emerald-50 text-emerald-700 border-emerald-200',
          'bg-cyan-50 text-cyan-700 border-cyan-200'
        ];
        const randomStyle = bgColors[Math.floor(Math.random() * bgColors.length)];
        
        const newDept: Department = {
          id: nextId,
          name: newDeptName,
          colorClass: randomStyle
        };
        
        if (onUpdateDepartments) {
          onUpdateDepartments([...departments, newDept]);
        }
        finalDept = newDeptName;
      }
    }

    if (editingEmployee) {
      // Edit
      const updated = employees.map(emp => 
        emp.id === editingEmployee.id 
          ? { 
              ...emp, 
              name: name.trim(), 
              department: finalDept, 
              isAvailable, 
              staticShiftId: staticShiftId || undefined 
            }
          : emp
      );
      onUpdateEmployees(updated);
    } else {
      // Create new
      const newEmp: Employee = {
        id: `emp_${Date.now()}`,
        name: name.trim(),
        department: finalDept,
        isAvailable,
        staticShiftId: staticShiftId || undefined
      };
      onUpdateEmployees([...employees, newEmp]);
    }
    setIsFormOpen(false);
  };

  // Delete employee
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this employee? This cannot be undone.')) {
      onUpdateEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  // Filter logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'all' || emp.department === selectedDept;
    const matchesStatus = 
      selectedStatus === 'all' || 
      (selectedStatus === 'available' && emp.isAvailable) || 
      (selectedStatus === 'unavailable' && !emp.isAvailable);
    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl shadow-xs border border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-900 rounded-lg">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Employees Base</h2>
            <p className="text-xs text-slate-500">Manage schedules configurations, availability, and static assignments</p>
          </div>
        </div>
        <button
          id="btn-add-employee"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-blue-900 hover:bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Filters and search card */}
      <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="search-employee"
            type="text"
            placeholder="Search employees by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
          />
        </div>

        <div>
          <select
            id="filter-dept"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.name}>{dept.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            id="filter-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available (Active for Scheduling)</option>
            <option value="unavailable">Unavailable (Excluded from Schedules)</option>
          </select>
        </div>
      </div>

      {/* Employees grid and table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Employee Details</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Allocation Style</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                    No employees fit the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => {
                  const matchedShift = emp.staticShiftId 
                    ? shifts.find(s => s.id === emp.staticShiftId) 
                    : null;
                  const deptInfo = departments.find(d => d.name === emp.department);

                  return (
                    <tr 
                      key={emp.id} 
                      className={`transition-colors hover:bg-slate-50/50 ${!emp.isAvailable ? 'bg-slate-50/30 opacity-70' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                            emp.isAvailable 
                              ? 'bg-blue-50 text-blue-900 border border-blue-100' 
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className={`font-medium ${emp.isAvailable ? 'text-slate-900' : 'text-slate-500 line-through'}`}>
                              {emp.name}
                            </p>
                            <p className="text-xs text-slate-400">ID: {emp.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          deptInfo?.colorClass || 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {emp.department}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {emp.staticShiftId ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Pin className="w-3 h-3 text-amber-600" />
                            Static Shift: {matchedShift?.code || 'Custom'}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <FolderSync className="w-3 h-3 text-emerald-600" />
                            Rotation
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {emp.isAvailable ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                            <XCircle className="w-4 h-4 text-slate-300" />
                            Unavailable
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            id={`btn-edit-${emp.id}`}
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1 px-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
                            title="Edit Employee Detail"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-delete-${emp.id}`}
                            onClick={() => handleDelete(emp.id)}
                            className="p-1 px-2 rounded-md hover:bg-red-50 text-red-600 transition-colors"
                            title="Remove Employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal Sheet */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                {editingEmployee ? `Edit ${editingEmployee.name}` : 'Add New Employee'}
              </h3>
              <button
                id="btn-close-modal"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Employee Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Employee Full Name
                </label>
                <input
                  id="form-emp-name"
                  type="text"
                  required
                  placeholder="e.g. Noura Al-Dosari"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                />
              </div>

              {/* Department */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Department
                  </label>
                  <select
                    id="form-emp-dept"
                    value={deptDropdownVal}
                    onChange={(e) => setDeptDropdownVal(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 font-semibold text-slate-700 bg-white"
                  >
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Conditional Enter Department Name Input with Animation */}
                {deptDropdownVal === 'Other' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 mt-2"
                  >
                    <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Enter Department Name
                    </label>
                    <input
                      id="form-emp-custom-dept"
                      type="text"
                      required
                      placeholder="e.g. PHYSICAL THERAPY"
                      value={customDeptName}
                      onChange={(e) => setCustomDeptName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 font-semibold"
                    />
                    <p className="text-[9px] text-slate-400">
                      The new department will be dynamically created and saved to selectable database options automatically.
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Static shift assignment */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Static Shift Assign (Optional)
                </label>
                <select
                  id="form-emp-shift"
                  value={staticShiftId}
                  onChange={(e) => setStaticShiftId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                >
                  <option value="">None (Allocates via Rotation)</option>
                  
                  {/* Normal Shifts */}
                  <optgroup label="Normal Shifts">
                    {shifts.filter(s => s.shiftType === 'Normal').map(s => (
                      <option key={s.id} value={s.id}>
                        Code {s.code} ({s.startTime1} - {s.endTime1})
                      </option>
                    ))}
                  </optgroup>
                  
                  {/* Ramadan Shifts */}
                  <optgroup label="Ramadan Shifts">
                    {shifts.filter(s => s.shiftType === 'Ramadan').map(s => (
                      <option key={s.id} value={s.id}>
                        Code {s.code} ({s.startTime1} - {s.endTime1})
                      </option>
                    ))}
                  </optgroup>

                  {/* Eid Shifts */}
                  <optgroup label="Eid Shifts">
                    {shifts.filter(s => s.shiftType === 'Eid').map(s => (
                      <option key={s.id} value={s.id}>
                        Code {s.code} ({s.startTime1} - {s.endTime1})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  If selected, this employee keeps the chosen static shift. If empty, the employee will rotate between morning and evening shifts based on history.
                </p>
              </div>

              {/* Availability Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  id="form-emp-available"
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-4 h-4 text-blue-900 border-slate-300 rounded focus:ring-blue-900"
                />
                <div>
                  <label htmlFor="form-emp-available" className="block text-sm font-medium text-slate-700 select-none">
                    Available for Scheduling
                  </label>
                  <span className="text-[10px] text-slate-400">
                    If unchecked, employee is Unavailable and won't appear in newly generated schedules.
                  </span>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  id="btn-form-cancel"
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  id="btn-form-submit"
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition shadow-xs"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
