/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileSpreadsheet, Layout, CheckSquare, Square, X, Info } from 'lucide-react';
import { ExportOptions } from '../excelExport';
import { Schedule } from '../types';

interface ExportConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: ExportOptions) => void;
  schedule?: Schedule | null;
}

export default function ExportConfigModal({
  isOpen,
  onClose,
  onConfirm,
  schedule
}: ExportConfigModalProps) {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [includeShiftCode, setIncludeShiftCode] = useState(false);
  const [includeShiftType, setIncludeShiftType] = useState(false);
  const [includeDayOff, setIncludeDayOff] = useState(true);

  const handleExport = () => {
    onConfirm({
      orientation,
      includeShiftCode,
      includeShiftType,
      includeDayOff
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-850 text-base leading-tight">
                    Excel Export Options
                  </h3>
                  {schedule && (
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Configure Roster: Week {schedule.weekNumber} ({schedule.month})
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 px-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6">
              {/* Orientation Setting */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Page Layout Orientation
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Landscape Button */}
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`flex items-center justify-center p-3.5 rounded-xl border-2 transition-all ${
                      orientation === 'landscape'
                        ? 'border-emerald-600 bg-emerald-50/40 text-emerald-800 font-bold'
                        : 'border-slate-200 hover:border-slate-350 text-slate-600 bg-white'
                    }`}
                  >
                    <Layout className="w-4 h-4 mr-2 rotate-90" />
                    <span className="text-xs">Landscape (Wide)</span>
                  </button>

                  {/* Portrait Button */}
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`flex items-center justify-center p-3.5 rounded-xl border-2 transition-all ${
                      orientation === 'portrait'
                        ? 'border-emerald-600 bg-emerald-50/40 text-emerald-800 font-bold'
                        : 'border-slate-200 hover:border-slate-350 text-slate-600 bg-white'
                    }`}
                  >
                    <Layout className="w-4 h-4 mr-2" />
                    <span className="text-xs">Portrait (Tall)</span>
                  </button>
                </div>
              </div>

              {/* Column Selectors */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Optional Columns to Include
                </label>

                <div className="p-4 bg-slate-50 rounded-xl space-y-3.5 border border-slate-150">
                  {/* Fixed Core Columns Warning */}
                  <div className="flex gap-2 text-[10px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-100 shadow-3xs">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span><b>Employee Name</b>, <b>Department</b>, and <b>Shift Hours/Timings</b> are always exported and styled beautifully.</span>
                  </div>

                  {/* Toggle Shift Code */}
                  <label className="flex items-center justify-between cursor-pointer group py-0.5">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-700">Include Shift Code</span>
                      <span className="text-[10px] text-slate-400">e.g. A, B, RC, Z</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIncludeShiftCode(!includeShiftCode)}
                      className={`p-1 transition-colors ${
                        includeShiftCode ? 'text-emerald-600' : 'text-slate-350 hover:text-slate-400'
                      }`}
                    >
                      {includeShiftCode ? (
                        <CheckSquare className="w-5.5 h-5.5 fill-emerald-50" />
                      ) : (
                        <Square className="w-5.5 h-5.5" />
                      )}
                    </button>
                  </label>

                  {/* Toggle Shift Type */}
                  <label className="flex items-center justify-between cursor-pointer group py-0.5">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-700">Include Shift Type</span>
                      <span className="text-[10px] text-slate-400">e.g. Normal, Ramadan, Eid</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIncludeShiftType(!includeShiftType)}
                      className={`p-1 transition-colors ${
                        includeShiftType ? 'text-emerald-600' : 'text-slate-350 hover:text-slate-400'
                      }`}
                    >
                      {includeShiftType ? (
                        <CheckSquare className="w-5.5 h-5.5 fill-emerald-50" />
                      ) : (
                        <Square className="w-5.5 h-5.5" />
                      )}
                    </button>
                  </label>

                  {/* Toggle Day Off */}
                  <label className="flex items-center justify-between cursor-pointer group py-0.5">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-700">Include Weekly Day Off</span>
                      <span className="text-[10px] text-slate-400">The assigned rest day for staff</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIncludeDayOff(!includeDayOff)}
                      className={`p-1 transition-colors ${
                        includeDayOff ? 'text-emerald-600' : 'text-slate-350 hover:text-slate-400'
                      }`}
                    >
                      {includeDayOff ? (
                        <CheckSquare className="w-5.5 h-5.5 fill-emerald-50" />
                      ) : (
                        <Square className="w-5.5 h-5.5" />
                      )}
                    </button>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Form Controls */}
            <div className="flex items-center justify-end space-x-3 p-5 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-3xs transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md active:scale-98 transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                Generate Excel (.xlsx)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
