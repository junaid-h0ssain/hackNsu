import { writable, derived } from 'svelte/store';

interface LoadingState {
  operations: Map<string, { loading: boolean; progress?: number; message?: string }>;
}

function createLoadingStore() {
  const { subscribe, update } = writable<LoadingState>({
    operations: new Map(),
  });

  return {
    subscribe,
    
    startLoading: (key: string, message?: string) => {
      update(state => {
        state.operations.set(key, { loading: true, progress: undefined, message });
        return { operations: new Map(state.operations) };
      });
    },
    
    updateProgress: (key: string, progress: number, message?: string) => {
      update(state => {
        const existing = state.operations.get(key);
        state.operations.set(key, { 
          loading: true, 
          progress: Math.min(100, Math.max(0, progress)),
          message: message || existing?.message 
        });
        return { operations: new Map(state.operations) };
      });
    },
    
    stopLoading: (key: string) => {
      update(state => {
        state.operations.delete(key);
        return { operations: new Map(state.operations) };
      });
    },
    
    isLoading: (key: string) => {
      let result = false;
      const unsubscribe = subscribe(state => {
        result = state.operations.get(key)?.loading ?? false;
      });
      unsubscribe();
      return result;
    },
    
    getProgress: (key: string) => {
      let result: number | undefined;
      const unsubscribe = subscribe(state => {
        result = state.operations.get(key)?.progress;
      });
      unsubscribe();
      return result;
    },
    
    clear: () => {
      update(() => ({ operations: new Map() }));
    },
  };
}

export const loadingStore = createLoadingStore();

export const isAnyLoading = derived(loadingStore, $store => $store.operations.size > 0);

export function createOperationLoading(key: string) {
  return derived(loadingStore, $store => $store.operations.get(key) || { loading: false });
}
