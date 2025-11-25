import { writable, derived } from 'svelte/store';
import { parseError, type AppError } from '$lib/utils/errorHandling';

interface ErrorState {
  errors: AppError[];
  maxErrors: number;
}

function createErrorStore() {
  const { subscribe, update, set } = writable<ErrorState>({
    errors: [],
    maxErrors: 5,
  });

  return {
    subscribe,
    
    addError: (error: unknown, context?: string) => {
      const appError = parseError(error);
      if (context) {
        appError.message = `${context}: ${appError.message}`;
      }
      
      update(state => {
        const newErrors = [appError, ...state.errors].slice(0, state.maxErrors);
        return { ...state, errors: newErrors };
      });
      
      return appError;
    },
    
    removeError: (index: number) => {
      update(state => ({
        ...state,
        errors: state.errors.filter((_, i) => i !== index),
      }));
    },
    
    clearErrors: () => {
      update(state => ({ ...state, errors: [] }));
    },
    
    clearByCategory: (category: AppError['category']) => {
      update(state => ({
        ...state,
        errors: state.errors.filter(e => e.category !== category),
      }));
    },
  };
}

export const errorStore = createErrorStore();

export const hasErrors = derived(errorStore, $store => $store.errors.length > 0);
export const latestError = derived(errorStore, $store => $store.errors[0] || null);
