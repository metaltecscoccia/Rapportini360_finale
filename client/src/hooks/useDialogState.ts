import { useReducer } from 'react';

/**
 * Discriminated Union Types per Dialog State Management
 * Consolida 23 dialog boolean + 19 selection states in un unico reducer
 */

// ===== EMPLOYEE DIALOGS =====
type EmployeeDialog =
  | { type: 'none' }
  | { type: 'addEmployee' }
  | { type: 'editEmployee'; employee: any }
  | { type: 'deleteEmployee'; employee: any }
  | { type: 'toggleEmployeeStatus'; employee: any }
  | { type: 'resetPassword'; employee: any }
  | { type: 'showTempPassword'; employee: any; password: string }
  | { type: 'employeeStats'; employee: any };

// ===== REPORT DIALOGS =====
type ReportDialog =
  | { type: 'none' }
  | { type: 'createReport'; employee?: any }
  | { type: 'editReport'; report: any; operations: any[] }
  | { type: 'deleteReport'; report: any }
  | { type: 'changeReportDate'; report: any; currentDate?: string };

// ===== WORK ORDER DIALOGS =====
type WorkOrderDialog =
  | { type: 'none' }
  | { type: 'addWorkOrder' }
  | { type: 'editWorkOrder'; workOrder: any }
  | { type: 'deleteWorkOrder'; workOrder: any };

// ===== CLIENT DIALOGS =====
type ClientDialog =
  | { type: 'none' }
  | { type: 'addClient' }
  | { type: 'deleteClient'; client: any; workOrdersCount: number; operationsCount: number };

// ===== WORK TYPE DIALOGS =====
type WorkTypeDialog =
  | { type: 'none' }
  | { type: 'addWorkType' }
  | { type: 'editWorkType'; workType: any }
  | { type: 'deleteWorkType'; workType: any };

// ===== MATERIAL DIALOGS =====
type MaterialDialog =
  | { type: 'none' }
  | { type: 'addMaterial' }
  | { type: 'editMaterial'; material: any }
  | { type: 'deleteMaterial'; material: any };

// ===== LIGHTBOX =====
type LightboxDialog =
  | { type: 'none' }
  | { type: 'openLightbox'; photos: string[]; index: number };

// ===== COMBINED DIALOG STATE =====
export interface DialogState {
  employee: EmployeeDialog;
  report: ReportDialog;
  workOrder: WorkOrderDialog;
  client: ClientDialog;
  workType: WorkTypeDialog;
  material: MaterialDialog;
  lightbox: LightboxDialog;
}

// ===== ACTIONS =====
export type DialogAction =
  | { category: 'employee'; payload: EmployeeDialog }
  | { category: 'report'; payload: ReportDialog }
  | { category: 'workOrder'; payload: WorkOrderDialog }
  | { category: 'client'; payload: ClientDialog }
  | { category: 'workType'; payload: WorkTypeDialog }
  | { category: 'material'; payload: MaterialDialog }
  | { category: 'lightbox'; payload: LightboxDialog }
  | { category: 'closeAll' };

// ===== INITIAL STATE =====
const initialState: DialogState = {
  employee: { type: 'none' },
  report: { type: 'none' },
  workOrder: { type: 'none' },
  client: { type: 'none' },
  workType: { type: 'none' },
  material: { type: 'none' },
  lightbox: { type: 'none' },
};

// ===== REDUCER =====
function dialogReducer(state: DialogState, action: DialogAction): DialogState {
  if (action.category === 'closeAll') {
    return initialState;
  }

  return {
    ...state,
    [action.category]: action.payload,
  };
}

// ===== HOOK =====
export function useDialogState() {
  const [state, dispatch] = useReducer(dialogReducer, initialState);

  // Helper functions for common operations
  const openEmployeeDialog = (dialog: EmployeeDialog) => {
    dispatch({ category: 'employee', payload: dialog });
  };

  const openReportDialog = (dialog: ReportDialog) => {
    dispatch({ category: 'report', payload: dialog });
  };

  const openWorkOrderDialog = (dialog: WorkOrderDialog) => {
    dispatch({ category: 'workOrder', payload: dialog });
  };

  const openClientDialog = (dialog: ClientDialog) => {
    dispatch({ category: 'client', payload: dialog });
  };

  const openWorkTypeDialog = (dialog: WorkTypeDialog) => {
    dispatch({ category: 'workType', payload: dialog });
  };

  const openMaterialDialog = (dialog: MaterialDialog) => {
    dispatch({ category: 'material', payload: dialog });
  };

  const openLightbox = (photos: string[], index: number = 0) => {
    dispatch({ category: 'lightbox', payload: { type: 'openLightbox', photos, index } });
  };

  const closeDialog = (category: DialogAction['category']) => {
    if (category === 'closeAll') {
      dispatch({ category: 'closeAll' });
    } else {
      dispatch({ category, payload: { type: 'none' } as any });
    }
  };

  const closeAllDialogs = () => {
    dispatch({ category: 'closeAll' });
  };

  return {
    state,
    dispatch,
    // Helper functions
    openEmployeeDialog,
    openReportDialog,
    openWorkOrderDialog,
    openClientDialog,
    openWorkTypeDialog,
    openMaterialDialog,
    openLightbox,
    closeDialog,
    closeAllDialogs,
  };
}

// ===== TYPE GUARDS =====
export const isEmployeeDialog = (dialog: EmployeeDialog, type: EmployeeDialog['type']): boolean => {
  return dialog.type === type;
};

export const isReportDialog = (dialog: ReportDialog, type: ReportDialog['type']): boolean => {
  return dialog.type === type;
};

export const isWorkOrderDialog = (dialog: WorkOrderDialog, type: WorkOrderDialog['type']): boolean => {
  return dialog.type === type;
};

export const isClientDialog = (dialog: ClientDialog, type: ClientDialog['type']): boolean => {
  return dialog.type === type;
};

export const isWorkTypeDialog = (dialog: WorkTypeDialog, type: WorkTypeDialog['type']): boolean => {
  return dialog.type === type;
};

export const isMaterialDialog = (dialog: MaterialDialog, type: MaterialDialog['type']): boolean => {
  return dialog.type === type;
};
