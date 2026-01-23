import type { MachineData } from './types';
import machinesJson from './data/machines.json';

/**
 * 機種データ（JSONからロード）
 */
export const MACHINES: MachineData[] = machinesJson as MachineData[];

/**
 * 機種リストを取得
 */
export function getMachineList(): MachineData[] {
  return MACHINES;
}

/**
 * IDから機種を取得
 */
export function getMachineById(id: string): MachineData | null {
  return MACHINES.find((m) => m.id === id) ?? null;
}
