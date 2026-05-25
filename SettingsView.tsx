/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { Shift, Department } from '../types';

interface SettingsViewProps {
  shifts: Shift[];
  departments: Department[];
  onUpdateShifts: (updatedShifts: Shift[]) => void;
}

export default function SettingsView({
  shifts,
  departments,
  onUpdateShifts
}: SettingsViewProps) {
  // Config States loaded from localStorage (or default)
  const [systemName, setSystemName] = useState(() => {
    return localStorage.getItem('cfg_system_name') || 'Shift Planner';
  });

  const [selectedLogo, setSelectedLogo] = useState(() => {
    return localStorage.getItem('cfg_logo_type') || 'emblem';
  });

  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('cfg_theme_color') || 'navy';
  });

  const [excelFooter, setExcelFooter] = useState(() => {
    return localStorage.getItem('cfg_excel_footer') || 'Employee Holiday & Duty Allocation Schedule';
  });

  const [excelHeader, setExcelHeader] = useState(() => {
    return localStorage.getItem('cfg_excel_header') || 'National Health & Duty Corporate Roster';
  });

  const [maxWorkdays, setMaxWorkdays] = useState(() => {
    return Number(localStorage.getItem('cfg_max_workdays') || '6');
  });

  const [minRestHours, setMinRestHours] = useState(() => {
    return Number(localStorage.getItem('cfg_min_rest_hours') || '12');
  });

  const [rotationStyle, setRotationStyle] = useState(() => {
    return localStorage.getItem('cfg_rotation_style') || 'alternate';
  });

  const [staticShiftStrict, setStaticShiftStrict] = useState(() => {
    return localStorage.getItem('cfg_static_shift_strict') === 'true';
  });

  const [gracePeriod, setGracePeriod] = useState(() => {
    return Number(localStorage.getItem('cfg_grace_period') || '15');
  });

  const [autoAbsent, setAutoAbsent] = useState(() => {
    return localStorage.getItem('cfg_auto_absent') !== 'false';
  });

  const [retentionMonths, setRetentionMonths] = useState(() => {
    return Number(localStorage.getItem('cfg_retention_months') || '2');
  });

  const [notifyPublish, setNotifyPublish] = useState(() => {
    return localStorage.getItem('cfg_notify_publish') === 'true';
  });

  const [notifyUnderstaff, setNotifyUnderstaff] = useState(() => {
    return localStorage.getItem('cfg_notify_understaff') === 'true';
  });

  const [appLanguage, setAppLanguage] = useState(() => {
    return localStorage.getItem('cfg_language') || 'en';
  });

  // Role permissions simulation states
  const [roles, setRoles] = useState([
    { id: 'admin', name: 'Systems Administrator', users: 2, write: true, export: true, deleteSchedules: true },
    { id: 'supervisor', name: 'Duty Shift Supervisor', users: 5, write: true, export: true, deleteSchedules: false },
    { id: 'hr', name: 'HR Officer', users: 3, write: false, export: true, deleteSchedules: false },
    { id: 'auditor', name: 'Internal Auditor', users: 1, write: false, export: true, deleteSchedules: false },
  ]);

  const [logoPreview, setLogoPreview] = useState<string | null>(() => {
    return localStorage.getItem('cfg_custom_logo_base64') || null;
  });

  const [showStatus, setShowStatus] = useState<string | null>(null);

  // Synchronize changes to localStorage with events
  const handleSaveConfigs = () => {
    localStorage.setItem('cfg_system_name', systemName);
    localStorage.setItem('cfg_logo_type', selectedLogo);
    localStorage.setItem('cfg_theme_color', themeColor);
    localStorage.setItem('cfg_excel_footer', excelFooter);
    localStorage.setItem('cfg_excel_header', excelHeader);
    localStorage.setItem('cfg_max_workdays', String(maxWorkdays));
    localStorage.setItem('cfg_min_rest_hours', String(minRestHours));
    localStorage.setItem('cfg_rotation_style', rotationStyle);
    localStorage.setItem('cfg_static_shift_strict', String(staticShiftStrict));
    localStorage.setItem('cfg_grace_period', String(gracePeriod));
    localStorage.setItem('cfg_auto_absent', String(autoAbsent));
    localStorage.setItem('cfg_retention_months', String(retentionMonths));
    localStorage.setItem('cfg_notify_publish', String(notifyPublish));
    localStorage.setItem('cfg_notify_understaff', String(notifyUnderstaff));
    localStorage.setItem('cfg_language', appLanguage);
    
    // Dispatch storage event to update top bar live
    window.dispatchEvent(new Event('storage'));
    
    setShowStatus('Configuration successfully saved to enterprise settings database.');
    setTimeout(() => setShowStatus(null), 4000);
  };

  // Simulated logo file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        localStorage.setItem('cfg_custom_logo_base64', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearCustomLogo = () => {
    setLogoPreview(null);
    localStorage.removeItem('cfg_custom_logo_base64');
  };

  // Backup exports
  const handleBackupExport = () => {
    const backupObj = {
      employees: localStorage.getItem('esm_employees'),
      shifts: localStorage.getItem('esm_shifts'),
      schedules: localStorage.getItem('esm_schedules'),
      schedule_items: localStorage.getItem('esm_schedule_items'),
      departments: localStorage.getItem('esm_departments'),
      systemConfigs: {
        systemName,
        selectedLogo,
        themeColor,
        excelFooter,
        excelHeader,
        maxWorkdays,
        minRestHours,
        rotationStyle,
        gracePeriod,
        autoAbsent,
        retentionMonths,
        appLanguage
      }
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `hr_shift_planner_backup_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
  };

  // Restore Database backup simulation
  const handleBackupRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string);
        if (backup.employees) localStorage.setItem('esm_employees', backup.employees);
        if (backup.shifts) localStorage.setItem('esm_shifts', backup.shifts);
        if (backup.schedules) localStorage.setItem('esm_schedules', backup.schedules);
        if (backup.schedule_items) localStorage.setItem('esm_schedule_items', backup.schedule_items);
        if (backup.departments) localStorage.setItem('esm_departments', backup.departments);

        if (backup.systemConfigs) {
          const cfg = backup.systemConfigs;
          if (cfg.systemName) setSystemName(cfg.systemName);
          if (cfg.themeColor) setThemeColor(cfg.themeColor);
          if (cfg.excelFooter) setExcelFooter(cfg.excelFooter);
          if (cfg.appLanguage) setAppLanguage(cfg.appLanguage);
        }

        setShowStatus('Database restored successfully. Restored employees, shifts schedule matrix and settings.');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        alert('Invalid database restore file formats. Ensure file is a valid JSON backup exported from Shift Planner.');
      }
    };
    reader.readAsText(file);
  };

  // Inject a popular rotation shift template
  const handleAddTemplateShift = (code: string, desc: string, hours: number, type: 'Normal' | 'Ramadan' | 'Eid', cat: 'morning' | 'evening' | 'split', s1: string, e1: string, s2?: string, e2?: string) => {
    const exists = shifts.some(s => s.code === code && s.shiftType === type);
    if (exists) {
      alert(`Template insertion filtered out: Shift code "${code}" already exists for ${type} rules.`);
      return;
    }

    const templateShift: Shift = {
      id: `shift_temp_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      code,
      shiftType: type,
      category: cat,
      startTime1: s1,
      endTime1: e1,
      startTime2: s2,
      endTime2: e2,
      hours
    };

    onUpdateShifts([...shifts, templateShift]);
    setShowStatus(`Shift template "${code}" successfully inserted to active configurations pool.`);
    setTimeout(() => setShowStatus(null), 3000);
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-10">
      
      {/* Banner status notification */}
      {showStatus && (
        <div className="bg-slate-900 text-white rounded-xl p-4 text-xs font-semibold tracking-wide animate-pulse flex items-center justify-between shadow-md">
          <span>{showStatus}</span>
          <button onClick={() => setShowStatus(null)} className="text-slate-400 hover:text-white font-bold ml-2">✕</button>
        </div>
      )}

      {/* Hero section */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">System Configuration Portal</h2>
        <p className="text-xs text-slate-500 mt-1">Manage global enterprise HR compliance schedules, template intervals, rotation policies, and file exporters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Main Organization, Colors, Image Upload, Language */}
        <div className="space-y-8 lg:col-span-2">
          
          {/* Card 1: System and Brand Identities */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Corporate System Identity</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Define corporate system labels and brand representations</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Company/System Label</label>
                <input
                  type="text"
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  placeholder="e.g. Shift Planner"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 font-sans">System Language & Culture</label>
                <select
                  value={appLanguage}
                  onChange={(e) => setAppLanguage(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900 font-semibold text-slate-700"
                >
                  <option value="en">English (US General Edition)</option>
                  <option value="ar">العربية (Kingdom of Saudi Arabia Format)</option>
                </select>
              </div>
            </div>

            {/* Logo upload and selection */}
            <div className="pt-2 border-t border-slate-100/80">
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Corporate Brand Logo Mark</label>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {/* Logo rendering preview */}
                <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center overflow-hidden shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Brand Logo Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] uppercase font-extrabold text-blue-900 tracking-wider">
                        {selectedLogo === 'emblem' ? '🛡️' : (selectedLogo === 'healthcare' ? '🏥' : '🏢')}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase">
                        {selectedLogo}
                      </span>
                    </div>
                  )}
                </div>

                {/* Interaction controls */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition select-none">
                      Upload Custom PNG
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                    {logoPreview && (
                      <button
                        onClick={handleClearCustomLogo}
                        className="px-2 py-1.5 text-xs font-semibold text-red-600 hover:text-red-800 transition"
                      >
                        Reset Logo
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Supported extensions: PNG, SVG, JPG. Recommended aspect ratio: 1:1. Select default vector categories if no file is uploaded.
                  </p>
                </div>
              </div>

              {/* Vector Logo Selection */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { id: 'emblem', icon: '🛡️', label: 'Shield Emblem', desc: 'Secure enterprise symbol' },
                  { id: 'healthcare', icon: '🏥', label: 'Clinical Cross', desc: 'Medical staff scheduling' },
                  { id: 'corporate', icon: '🏢', label: 'Monolith Office', desc: 'HQ corporate planner' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedLogo(item.id)}
                    className={`p-2.5 text-left rounded-lg border transition ${
                      selectedLogo === item.id 
                        ? 'border-blue-900 bg-slate-50 text-blue-950' 
                        : 'border-slate-150 bg-white hover:bg-slate-50/70 text-slate-700'
                    }`}
                  >
                    <span className="text-xs block font-bold mb-0.5">{item.icon} {item.label}</span>
                    <span className="text-[8px] text-slate-400 leading-tight block">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Theme Colors Palette Customizable */}
            <div className="pt-2 border-t border-slate-100/80">
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Corporate Primary Accent Theme</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'navy', label: 'Royal Navy Blue', style: 'bg-blue-900 border-blue-950', details: 'Rigid administrative' },
                  { id: 'charcoal', label: 'Premium Charcoal', style: 'bg-slate-800 border-slate-900', details: 'Slate brutalist' },
                  { id: 'emerald', label: 'Forest Emerald', style: 'bg-emerald-800 border-emerald-950', details: 'Clinical clean' },
                  { id: 'burgundy', label: 'Vintage Burgundy', style: 'bg-rose-950 border-rose-950', details: 'Executive premium' }
                ].map(color => (
                  <button
                    key={color.id}
                    onClick={() => setThemeColor(color.id)}
                    className={`p-2 rounded-lg border text-left transition ${
                      themeColor === color.id 
                        ? 'border-slate-900 bg-slate-50 text-slate-900' 
                        : 'border-slate-150 bg-white text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-3.5 h-3.5 rounded-full ${color.style} block`} />
                      <span className="text-xs font-bold leading-none">{color.label}</span>
                    </div>
                    <span className="text-[8px] text-slate-400 block tracking-tight leading-none">{color.details}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Schedule & Shift Allocation Rules */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Schedule & Rotation Rules Engine</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Parameters governing automatic schedule generation compliance checks</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Max Consecutive Workdays */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Max Consecutive Duties Allowed</label>
                <input
                  type="number"
                  min="2"
                  max="12"
                  value={maxWorkdays}
                  onChange={(e) => setMaxWorkdays(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 leading-normal block mt-1">
                  Enforces maximum continuous daily shift slots for rotating members before flagging.
                </span>
              </div>

              {/* Minimum Rest Interval */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Min Rest Interval Hours</label>
                <input
                  type="number"
                  min="6"
                  max="24"
                  value={minRestHours}
                  onChange={(e) => setMinRestHours(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 leading-normal block mt-1">
                  Rest hour buffer between an evening shift and subsequent morning assigned shift.
                </span>
              </div>

              {/* Rotation style selector */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Rotation Style Rules</label>
                <select
                  value={rotationStyle}
                  onChange={(e) => setRotationStyle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none text-slate-700 font-semibold"
                >
                  <option value="alternate">Alternating Morning / Evening Sequence</option>
                  <option value="consecutive">Continuous Morning-Morning (Strict Stability)</option>
                  <option value="fair">Balanced Hours Target Matrix</option>
                </select>
                <span className="text-[10px] text-slate-400 leading-normal block mt-1">
                  Determines rotation weight given to historic roles inside local browser storage.
                </span>
              </div>

              {/* Static shift enforcement */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Static Shift Constraints Strictness</label>
                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <input
                    type="checkbox"
                    id="strict-static-shift"
                    checked={staticShiftStrict}
                    onChange={(e) => setStaticShiftStrict(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-900 border-slate-300 focus:ring-slate-900"
                  />
                  <div>
                    <label htmlFor="strict-static-shift" className="text-xs font-bold text-slate-800 block leading-tight">Enforce Static Priority</label>
                    <span className="text-[9px] text-slate-400 block mt-0.5 leading-normal">
                      Blocks allocation planner from rotating staff assigned with fixed shift code.
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Card 3: Shift Config quick insertion template tools */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Shift Template Library</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Quickly import standardized shift rules into active database. Double-checks existing items duplicates first.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {[
                { code: 'N8', desc: 'Standard 8hr Night Shift', hours: 8, type: 'Normal' as const, cat: 'evening' as const, s1: '11:00 PM', e1: '07:00 AM' },
                { code: 'S4', desc: 'Weekend Split Help Shift', hours: 4, type: 'Normal' as const, cat: 'split' as const, s1: '08:00 AM', e1: '10:00 AM', s2: '05:00 PM', e2: '07:00 PM' },
                { code: 'RN6', desc: 'Ramadan Evening 6hr Shift', hours: 6, type: 'Ramadan' as const, cat: 'evening' as const, s1: '06:00 PM', e1: '12:00 AM' },
                { code: 'EH4', desc: 'Eid Holiday Duty 4hr Shift', hours: 4, type: 'Eid' as const, cat: 'morning' as const, s1: '08:00 AM', e1: '12:00 PM' }
              ].map((tpl, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold font-mono text-blue-950">{tpl.code}</span>
                    <span className="text-[10px] text-slate-500 block leading-tight">{tpl.desc} ({tpl.hours} hrs)</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-200/80 font-bold uppercase tracking-wide text-slate-500 mt-1 inline-block">
                      {tpl.type} • {tpl.cat}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAddTemplateShift(tpl.code, tpl.desc, tpl.hours, tpl.type, tpl.cat, tpl.s1, tpl.e1, tpl.s2, tpl.e2)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-blue-900 hover:border-slate-300 rounded-lg text-xs font-bold transition shadow-xs"
                  >
                    Import Shift
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Attendance Logs Rules */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Attendance Register Compliance</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Define grace periods, automatic absence logs and audit rules</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Grace Period For Late Mark (Minutes)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={gracePeriod}
                    onChange={(e) => setGracePeriod(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                  />
                  <span className="text-xs text-slate-500 font-bold">Mins</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Absent Autopurge Triggers</label>
                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <input
                    type="checkbox"
                    id="auto-absent-log"
                    checked={autoAbsent}
                    onChange={(e) => setAutoAbsent(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-900 border-slate-300 focus:ring-slate-900"
                  />
                  <div>
                    <label htmlFor="auto-absent-log" className="text-xs font-bold text-slate-800 block leading-tight">Fallback Missing to "Absent"</label>
                    <span className="text-[9px] text-slate-400 block mt-0.5 leading-normal">
                      Treat un-logged scheduled slots automatically as absent when rendering analytics reports.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Excel Document Exporter Formatting */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Excel Exporter Meta Formatting</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Control print headings, structural title sheets and author metadata for spreadsheet output downloads</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Exported Document Header Text</label>
                <input
                  type="text"
                  value={excelHeader}
                  onChange={(e) => setExcelHeader(e.target.value)}
                  placeholder="e.g. Employee Allocation Schedule"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Spreadsheet Page Footer Notation</label>
                <input
                  type="text"
                  value={excelFooter}
                  onChange={(e) => setExcelFooter(e.target.value)}
                  placeholder="e.g. Confidential schedule document"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none font-medium text-slate-800"
                />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Database size, notifications, backup export, roles matrix */}
        <div className="space-y-8">
          
          {/* Card 1: Data Retention & Garbage Collection */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Information Storage & Retention</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Control storage limits and automated garbage purging policies</p>
            </div>

            <div className="space-y-3">
              <div>
                <dt className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Weekly Schedules Retention Limit</dt>
                <select
                  value={retentionMonths}
                  onChange={(e) => setRetentionMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none font-semibold text-slate-700 bg-white"
                >
                  <option value="2">2 Months (Recommended Default - Auto Purge)</option>
                  <option value="3">3 Months (Medium Scale History)</option>
                  <option value="6">6 Months (Enterprise Audit Matrix)</option>
                </select>
                <span className="text-[9px] text-slate-400 block mt-1 leading-normal">
                  Schedules exceeding this date limit are systematically deleted on index load to maintain fast query response times.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Manual Cleanup</span>
                  <span className="text-xs font-semibold text-slate-800">Clear database cache now</span>
                </div>
                <button
                  onClick={() => {
                    if (confirm('CRITICAL ACTION:\nAre you sure you want to completely clear localStorage for this app? This resets employees, shifts, archived rosters, and attendance logs.')) {
                      localStorage.clear();
                      alert('Local Storage successfully wiped clean. Page will now refresh.');
                      window.location.reload();
                    }
                  }}
                  className="px-2.5 py-1.5 bg-red-50 text-red-700 rounded-lg text-[10px] font-bold border border-red-250 hover:bg-red-100 transition"
                >
                  Hard Reset Database
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Notifications, publications & alerts */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Notifications & Alerts Dispatch</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Control internal reminders dispatched when schedules changes are committed</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                <div>
                  <label htmlFor="notif-pub" className="text-xs font-bold text-slate-700 block select-none">Notify Staff on Publish</label>
                  <span className="text-[9px] text-slate-400 block">Dispatch automatic alerts</span>
                </div>
                <input
                  type="checkbox"
                  id="notif-pub"
                  checked={notifyPublish}
                  onChange={(e) => setNotifyPublish(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-900 border-slate-300 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                <div>
                  <label htmlFor="notif-understaff" className="text-xs font-bold text-slate-700 block select-none">Capacity Alert Advisory</label>
                  <span className="text-[9px] text-slate-400 block">Warn when department has zero slots</span>
                </div>
                <input
                  type="checkbox"
                  id="notif-understaff"
                  checked={notifyUnderstaff}
                  onChange={(e) => setNotifyUnderstaff(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-900 border-slate-300 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Backup & Restore Management */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Backup & Recovery</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Export active system snapshots & restore historical databases locally</p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={handleBackupExport}
                className="w-full text-center py-2.5 bg-blue-900 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition shadow-xs"
              >
                Export Enterprise Snapshot (.json)
              </button>

              <label className="w-full block text-center py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold cursor-pointer transition select-none border border-slate-200">
                Import Enterprise Snapshot (.json)
                <input type="file" accept=".json" onChange={handleBackupRestore} className="hidden" />
              </label>
            </div>
          </div>

          {/* Card 4: Detailed User Roles & Permission Matrix */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">User Governance & Roles</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Interactive permission hierarchies mapping admin roles for secure duty allocations</p>
            </div>

            <div className="space-y-3">
              {roles.map(r => (
                <div key={r.id} className="p-3 rounded-lg border border-slate-100/80 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 leading-none">{r.name}</span>
                    <span className="text-[9px] font-bold text-slate-400 leading-none">{r.users} Users</span>
                  </div>
                  
                  {/* Permissions mini toggles row */}
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-dashed border-slate-250">
                    <label className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                      <input 
                        type="checkbox" 
                        checked={r.write} 
                        onChange={(e) => {
                          const val = e.target.checked;
                          setRoles(roles.map(it => it.id === r.id ? { ...it, write: val } : it));
                        }}
                        className="w-3.5 h-3.5 rounded text-blue-900 border-slate-300"
                      />
                      Write Config
                    </label>

                    <label className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                      <input 
                        type="checkbox" 
                        checked={r.export} 
                        onChange={(e) => {
                          const val = e.target.checked;
                          setRoles(roles.map(it => it.id === r.id ? { ...it, export: val } : it));
                        }}
                        className="w-3.5 h-3.5 rounded text-blue-900 border-slate-300"
                      />
                      Excel Export
                    </label>

                    <label className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                      <input 
                        type="checkbox" 
                        checked={r.deleteSchedules} 
                        disabled={r.id === 'hr' || r.id === 'auditor'}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setRoles(roles.map(it => it.id === r.id ? { ...it, deleteSchedules: val } : it));
                        }}
                        className="w-3.5 h-3.5 rounded text-blue-900 border-slate-300"
                      />
                      Purge Logs
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Global Bottom Sticky Action Bar */}
      <div className="bg-slate-50 border-t border-slate-200 py-4 flex items-center justify-end gap-3 sticky bottom-0 z-10">
        <span className="text-[10px] text-slate-400 font-bold uppercase select-none mr-2">Enterprise administration system changes</span>
        <button
          onClick={handleSaveConfigs}
          className="px-6 py-3 bg-blue-900 hover:bg-slate-900 text-white font-bold rounded-lg text-xs tracking-wide transition shadow-md"
        >
          Save All Enterprise Configurations
        </button>
      </div>

    </div>
  );
}
