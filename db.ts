/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Employee, Shift, Schedule, ScheduleItem, Department } from './types';
import { DEFAULT_DEPARTMENTS, DEFAULT_SHIFTS, DEFAULT_EMPLOYEES } from './data';

const STORAGE_KEYS = {
  EMPLOYEES: 'esm_employees',
  SHIFTS: 'esm_shifts',
  SCHEDULES: 'esm_schedules',
  SCHEDULE_ITEMS: 'esm_schedule_items',
  DEPARTMENTS: 'esm_departments'
};

// Auto purge items older than 2 months (60 days)
export function purgeOldSchedules(schedules: Schedule[], items: ScheduleItem[]): {
  purgedSchedules: Schedule[];
  purgedItems: ScheduleItem[];
  deletedCount: number;
} {
  const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
  
  const originalCount = schedules.length;
  const filteredSchedules = schedules.filter(s => s.createdAt >= sixtyDaysAgo);
  const activeScheduleIds = new Set(filteredSchedules.map(s => s.id));
  const filteredItems = items.filter(item => activeScheduleIds.has(item.scheduleId));
  const deletedCount = originalCount - filteredSchedules.length;

  return {
    purgedSchedules: filteredSchedules,
    purgedItems: filteredItems,
    deletedCount
  };
}

export function initializeDatabase() {
  const versionKey = 'esm_db_version_clinical_v1';
  const hasVersion = localStorage.getItem(versionKey);

  // If the clinical version hasn't been seeded yet, override tables to present correct clinical data immediately
  if (!hasVersion) {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(DEFAULT_EMPLOYEES));
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(DEFAULT_DEPARTMENTS));
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(DEFAULT_SHIFTS));
    localStorage.setItem(versionKey, 'true');
  }

  // Check and setup defaults if not present
  if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(DEFAULT_EMPLOYEES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SHIFTS)) {
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(DEFAULT_SHIFTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)) {
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(DEFAULT_DEPARTMENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SCHEDULES)) {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SCHEDULE_ITEMS)) {
    localStorage.setItem(STORAGE_KEYS.SCHEDULE_ITEMS, JSON.stringify([]));
  }

  // Trigger automated purging
  const rawSchedules = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
  const rawItems = localStorage.getItem(STORAGE_KEYS.SCHEDULE_ITEMS);
  
  if (rawSchedules && rawItems) {
    try {
      const parsedSchedules = JSON.parse(rawSchedules) as Schedule[];
      const parsedItems = JSON.parse(rawItems) as ScheduleItem[];
      
      const { purgedSchedules, purgedItems, deletedCount } = purgeOldSchedules(parsedSchedules, parsedItems);
      
      if (deletedCount > 0) {
        console.log(`[ESM Database] Auto-purged ${deletedCount} schedules older than 2 months.`);
        localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(purgedSchedules));
        localStorage.setItem(STORAGE_KEYS.SCHEDULE_ITEMS, JSON.stringify(purgedItems));
      }
    } catch (e) {
      console.error('Error purifying database:', e);
    }
  }
}

// Data Getters and Setters
export function getEmployees(): Employee[] {
  initializeDatabase();
  const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
  return raw ? JSON.parse(raw) : [];
}

export function saveEmployees(employees: Employee[]) {
  localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
}

export function getShifts(): Shift[] {
  initializeDatabase();
  const raw = localStorage.getItem(STORAGE_KEYS.SHIFTS);
  return raw ? JSON.parse(raw) : [];
}

export function saveShifts(shifts: Shift[]) {
  localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
}

export function getSchedules(): Schedule[] {
  initializeDatabase();
  const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
  return raw ? JSON.parse(raw) : [];
}

export function saveSchedules(schedules: Schedule[]) {
  localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
}

export function getScheduleItems(): ScheduleItem[] {
  initializeDatabase();
  const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULE_ITEMS);
  return raw ? JSON.parse(raw) : [];
}

export function saveScheduleItems(items: ScheduleItem[]) {
  localStorage.setItem(STORAGE_KEYS.SCHEDULE_ITEMS, JSON.stringify(items));
}

export function getDepartments(): Department[] {
  initializeDatabase();
  const raw = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
  return raw ? JSON.parse(raw) : [];
}

export function saveDepartments(departments: Department[]) {
  localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
}
