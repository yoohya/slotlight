import { writable, derived } from 'svelte/store';
import type { AppState, MachineData, Counts, StorageData, EstimationResult } from './types';
import { getMachineById } from './machines';
import { calculateEstimations } from './logic';
import { getClosestSetting } from './estimation';

const STORAGE_KEY = 'slotlight_data';

/**
 * 初期状態
 */
const initialState: AppState = {
  currentMachine: null,
  startGames: 0,
  currentGames: 0,
  normalGames: 0,
  counts: {},
  ignoredElements: {},
  minusMode: false,
  showSettings: false,
};

/**
 * ローカルストレージから読み込み
 */
function loadFromStorage(): Partial<AppState> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return {};

    const parsed: StorageData = JSON.parse(data);
    const machine = getMachineById(parsed.machineId);

    if (!machine) return {};

    // 足りない要素があれば追加
    const counts: Counts = { ...parsed.counts };
    machine.elements.forEach((el) => {
      if (!(el.id in counts)) {
        counts[el.id] = 0;
      }
    });

    return {
      currentMachine: machine,
      startGames: parsed.startGames || 0,
      currentGames: parsed.currentGames || 0,
      normalGames: parsed.normalGames || 0,
      counts,
      ignoredElements: parsed.ignoredElements || {},
    };
  } catch {
    return {};
  }
}

/**
 * ストレージから特定の機種のデータを読み込み
 */
function loadMachineDataFromStorage(machineId: string): { startGames: number; currentGames: number; normalGames: number; counts: Counts; ignoredElements: Record<string, boolean> } | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const parsed: StorageData = JSON.parse(data);
    if (parsed.machineId !== machineId) return null;

    return {
      startGames: parsed.startGames || 0,
      currentGames: parsed.currentGames || 0,
      normalGames: parsed.normalGames || 0,
      counts: parsed.counts || {},
      ignoredElements: parsed.ignoredElements || {},
    };
  } catch {
    return null;
  }
}

/**
 * ローカルストレージに保存
 */
function saveToStorage(state: AppState): void {
  if (!state.currentMachine) return;

  const data: StorageData = {
    machineId: state.currentMachine.id,
    startGames: state.startGames,
    currentGames: state.currentGames,
    normalGames: state.normalGames,
    counts: state.counts,
    ignoredElements: state.ignoredElements,
    timestamp: Date.now(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * 機種がdenominatorType付き要素を持つか（通常時ゲーム数の入力が必要か）
 */
export function needsNormalGames(machine: MachineData | null): boolean {
  if (!machine) return false;
  return machine.elements.some((el) => el.denominatorType === 'normal' || el.denominatorType === 'at');
}

/**
 * アプリ状態ストア
 */
function createAppStore() {
  const loaded = loadFromStorage();
  const { subscribe, set, update } = writable<AppState>({
    ...initialState,
    ...loaded,
  });

  return {
    subscribe,

    /**
     * 機種を選択
     */
    selectMachine(machine: MachineData): void {
      update((state) => {
        // 既に同じ機種が選択されている場合は何もしない
        if (state.currentMachine?.id === machine.id) {
          return state;
        }

        // ストレージに同じ機種のデータがあれば復元
        const savedData = loadMachineDataFromStorage(machine.id);
        if (savedData) {
          // 足りない要素があれば追加
          const counts: Counts = { ...savedData.counts };
          machine.elements.forEach((el) => {
            if (!(el.id in counts)) {
              counts[el.id] = 0;
            }
          });

          return {
            ...state,
            currentMachine: machine,
            startGames: savedData.startGames,
            currentGames: savedData.currentGames,
            normalGames: savedData.normalGames,
            counts,
            ignoredElements: savedData.ignoredElements,
          };
        }

        // 新規または別の機種の場合はリセット
        const counts: Counts = {};
        machine.elements.forEach((el) => {
          counts[el.id] = 0;
        });

        const newState = {
          ...state,
          currentMachine: machine,
          startGames: 0,
          currentGames: 0,
          normalGames: 0,
          counts,
          ignoredElements: {},
        };
        saveToStorage(newState);
        return newState;
      });
    },

    /**
     * 機種選択を解除
     */
    clearMachine(): void {
      update((state) => ({
        ...state,
        currentMachine: null,
      }));
    },

    /**
     * カウントを増減
     * 親要素がある場合は親も同時にカウント
     */
    updateCount(elementId: string, delta: number): void {
      update((state) => {
        const newCount = Math.max(0, (state.counts[elementId] || 0) + delta);
        const newCounts = {
          ...state.counts,
          [elementId]: newCount,
        };

        // 親要素がある場合は親もカウント
        const element = state.currentMachine?.elements.find((el) => el.id === elementId);
        if (element?.parentId) {
          const parentCount = Math.max(0, (state.counts[element.parentId] || 0) + delta);
          newCounts[element.parentId] = parentCount;
        }

        const newState = {
          ...state,
          counts: newCounts,
        };
        saveToStorage(newState);
        return newState;
      });
    },

    /**
     * 現在ゲーム数を更新
     */
    updateCurrentGames(delta: number): void {
      update((state) => {
        const newState = {
          ...state,
          currentGames: Math.max(state.startGames, state.currentGames + delta),
        };
        saveToStorage(newState);
        return newState;
      });
    },

    /**
     * 現在ゲーム数を直接設定
     */
    setCurrentGames(value: number): void {
      update((state) => {
        const newState = {
          ...state,
          currentGames: Math.max(state.startGames, value),
        };
        saveToStorage(newState);
        return newState;
      });
    },

    /**
     * 打ち始めゲーム数を設定
     */
    setStartGames(value: number): void {
      update((state) => {
        const startGames = Math.max(0, value);
        const newState = {
          ...state,
          startGames,
          currentGames: Math.max(startGames, state.currentGames),
        };
        saveToStorage(newState);
        return newState;
      });
    },

    /**
     * 通常時ゲーム数を更新（デルタ）
     */
    updateNormalGames(delta: number): void {
      update((state) => {
        const total = Math.max(0, state.currentGames - state.startGames);
        const newState = {
          ...state,
          normalGames: Math.max(0, Math.min(total, state.normalGames + delta)),
        };
        saveToStorage(newState);
        return newState;
      });
    },

    /**
     * 通常時ゲーム数を直接設定
     */
    setNormalGames(value: number): void {
      update((state) => {
        const total = Math.max(0, state.currentGames - state.startGames);
        const newState = {
          ...state,
          normalGames: Math.max(0, Math.min(total, value)),
        };
        saveToStorage(newState);
        return newState;
      });
    },

    /**
     * カウントをリセット
     */
    resetCounts(): void {
      update((state) => {
        const counts: Counts = {};
        state.currentMachine?.elements.forEach((el) => {
          counts[el.id] = 0;
        });

        const newState = {
          ...state,
          startGames: 0,
          currentGames: 0,
          normalGames: 0,
          counts,
          ignoredElements: {},
        };
        saveToStorage(newState);
        return newState;
      });
    },

    /**
     * 要素の無視状態を切り替え
     */
    toggleIgnoreElement(elementId: string): void {
      update((state) => {
        const newIgnored = { ...state.ignoredElements };
        if (newIgnored[elementId]) {
          delete newIgnored[elementId];
        } else {
          newIgnored[elementId] = true;
        }

        const newState = {
          ...state,
          ignoredElements: newIgnored,
        };
        saveToStorage(newState);
        return newState;
      });
    },

    /**
     * マイナスモードを切り替え
     */
    toggleMinusMode(): void {
      update((state) => ({
        ...state,
        minusMode: !state.minusMode,
      }));
    },

    /**
     * 設定表示モードを切り替え
     */
    toggleShowSettings(): void {
      update((state) => ({
        ...state,
        showSettings: !state.showSettings,
      }));
    },
  };
}

export const appStore = createAppStore();

// getClosestSettingをre-export
export { getClosestSetting };

/**
 * 総回転数（計算値）= 通常時 + AT時
 */
export const totalGames = derived(appStore, ($state): number => {
  return Math.max(0, $state.currentGames - $state.startGames);
});

/**
 * 通常時ゲーム数
 */
export const normalGames = derived(appStore, ($state): number => {
  return $state.normalGames;
});

/**
 * AT時ゲーム数（= 総回転 - 通常時）
 */
export const atGames = derived(appStore, ($state): number => {
  const total = Math.max(0, $state.currentGames - $state.startGames);
  return Math.max(0, total - $state.normalGames);
});

/**
 * 設定推測（ベイズ推定）
 */
export const estimation = derived(appStore, ($state): EstimationResult => {
  if (!$state.currentMachine) {
    // デフォルト6段階設定
    return [1, 2, 3, 4, 5, 6].map((setting) => ({ setting, percentage: 16.67 }));
  }

  const total = Math.max(0, $state.currentGames - $state.startGames);
  const normal = $state.normalGames;
  return calculateEstimations(
    $state.currentMachine,
    total,
    normal,
    $state.counts,
    $state.ignoredElements
  );
});
