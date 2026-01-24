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
  counts: {},
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
      counts,
    };
  } catch {
    return {};
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
    counts: state.counts,
    timestamp: Date.now(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
        // 機種が変わった場合はリセット
        if (state.currentMachine?.id !== machine.id) {
          const counts: Counts = {};
          machine.elements.forEach((el) => {
            counts[el.id] = 0;
          });

          const newState = {
            ...state,
            currentMachine: machine,
            startGames: 0,
            currentGames: 0,
            counts,
          };
          saveToStorage(newState);
          return newState;
        }
        return state;
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
          counts,
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
 * 総回転数（計算値）
 */
export const totalGames = derived(appStore, ($state): number => {
  return Math.max(0, $state.currentGames - $state.startGames);
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
  return calculateEstimations(
    $state.currentMachine,
    total,
    $state.counts
  );
});
