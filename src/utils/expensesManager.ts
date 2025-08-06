import { storage } from './storage';
import { cashFlowManager } from './cashFlowManager';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  status: 'paid' | 'pending';
  employeeId?: string;
  employeeName?: string;
  createdBy?: string;
  createdAt: string;
}

export interface DeletedExpense extends Expense {
  deletedAt: string;
  deletedBy?: string;
}

export class ExpensesManager {
  private static instance: ExpensesManager;

  static getInstance(): ExpensesManager {
    if (!ExpensesManager.instance) {
      ExpensesManager.instance = new ExpensesManager();
    }
    return ExpensesManager.instance;
  }

  // Get all expenses
  getExpenses(): Expense[] {
    return storage.getItem('expenses', []);
  }

  // Get deleted expenses
  getDeletedExpenses(): DeletedExpense[] {
    return storage.getItem('deleted_expenses', []);
  }

  // Add new expense with cash flow integration
  addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): boolean {
    try {
      const newExpense: Expense = {
        ...expense,
        id: `EXP_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        createdAt: new Date().toISOString()
      };

      const expenses = this.getExpenses();
      expenses.push(newExpense);
      storage.setItem('expenses', expenses);

      // Add to cash flow if paid
      if (newExpense.status === 'paid') {
        this.addToCashFlow(newExpense);
      }

      return true;
    } catch (error) {
      console.error('Error adding expense:', error);
      return false;
    }
  }

  // Update expense
  updateExpense(id: string, updates: Partial<Expense>): boolean {
    try {
      const expenses = this.getExpenses();
      const expenseIndex = expenses.findIndex(exp => exp.id === id);
      
      if (expenseIndex === -1) return false;

      const oldExpense = expenses[expenseIndex];
      const updatedExpense = { ...oldExpense, ...updates };

      expenses[expenseIndex] = updatedExpense;
      storage.setItem('expenses', expenses);

      // Handle cash flow changes
      if (oldExpense.status !== updatedExpense.status) {
        if (updatedExpense.status === 'paid' && oldExpense.status === 'pending') {
          this.addToCashFlow(updatedExpense);
        } else if (updatedExpense.status === 'pending' && oldExpense.status === 'paid') {
          this.removeFromCashFlow(updatedExpense);
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating expense:', error);
      return false;
    }
  }

  // Soft delete expense (move to deleted list)
  deleteExpense(id: string, deletedBy?: string): boolean {
    try {
      const expenses = this.getExpenses();
      const expenseToDelete = expenses.find(exp => exp.id === id);
      
      if (!expenseToDelete) return false;

      // Add to deleted expenses
      const deletedExpense: DeletedExpense = {
        ...expenseToDelete,
        deletedAt: new Date().toISOString(),
        deletedBy: deletedBy || 'مستخدم النظام'
      };

      const deletedExpenses = this.getDeletedExpenses();
      deletedExpenses.push(deletedExpense);
      storage.setItem('deleted_expenses', deletedExpenses);

      // Remove from active expenses
      const updatedExpenses = expenses.filter(exp => exp.id !== id);
      storage.setItem('expenses', updatedExpenses);

      // Remove from cash flow if it was paid
      if (expenseToDelete.status === 'paid') {
        this.removeFromCashFlow(expenseToDelete);
      }

      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      return false;
    }
  }

  // Restore deleted expense
  restoreExpense(id: string): boolean {
    try {
      const deletedExpenses = this.getDeletedExpenses();
      const expenseToRestore = deletedExpenses.find(exp => exp.id === id);
      
      if (!expenseToRestore) return false;

      // Remove from deleted expenses
      const updatedDeletedExpenses = deletedExpenses.filter(exp => exp.id !== id);
      storage.setItem('deleted_expenses', updatedDeletedExpenses);

      // Add back to active expenses
      const { deletedAt, deletedBy, ...restoredExpense } = expenseToRestore;
      const expenses = this.getExpenses();
      expenses.push(restoredExpense);
      storage.setItem('expenses', expenses);

      // Add back to cash flow if paid
      if (restoredExpense.status === 'paid') {
        this.addToCashFlow(restoredExpense);
      }

      return true;
    } catch (error) {
      console.error('Error restoring expense:', error);
      return false;
    }
  }

  // Permanently delete expense
  permanentDeleteExpense(id: string): boolean {
    try {
      const deletedExpenses = this.getDeletedExpenses();
      const updatedDeletedExpenses = deletedExpenses.filter(exp => exp.id !== id);
      storage.setItem('deleted_expenses', updatedDeletedExpenses);

      return true;
    } catch (error) {
      console.error('Error permanently deleting expense:', error);
      return false;
    }
  }

  // Delete all expenses (soft delete)
  deleteAllExpenses(deletedBy?: string): boolean {
    try {
      const expenses = this.getExpenses();
      if (expenses.length === 0) return true;

      const deletedExpensesFromAll: DeletedExpense[] = expenses.map(expense => ({
        ...expense,
        deletedAt: new Date().toISOString(),
        deletedBy: deletedBy || 'مستخدم النظام'
      }));

      const deletedExpenses = this.getDeletedExpenses();
      const updatedDeletedExpenses = [...deletedExpenses, ...deletedExpensesFromAll];
      storage.setItem('deleted_expenses', updatedDeletedExpenses);

      // Clear active expenses
      storage.setItem('expenses', []);

      // Remove all paid expenses from cash flow
      expenses.forEach(expense => {
        if (expense.status === 'paid') {
          this.removeFromCashFlow(expense);
        }
      });

      return true;
    } catch (error) {
      console.error('Error deleting all expenses:', error);
      return false;
    }
  }

  // Clear all deleted expenses permanently
  clearDeletedExpenses(): boolean {
    try {
      storage.setItem('deleted_expenses', []);
      return true;
    } catch (error) {
      console.error('Error clearing deleted expenses:', error);
      return false;
    }
  }

  // Get expenses by category
  getExpensesByCategory(category: string): Expense[] {
    const expenses = this.getExpenses();
    return expenses.filter(exp => exp.category === category);
  }

  // Get expenses by date range
  getExpensesByDateRange(startDate: string, endDate: string): Expense[] {
    const expenses = this.getExpenses();
    return expenses.filter(exp => {
      const expenseDate = new Date(exp.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return expenseDate >= start && expenseDate <= end;
    });
  }

  // Get expense statistics
  getExpenseStatistics() {
    const expenses = this.getExpenses();
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const paidExpenses = expenses.filter(e => e.status === 'paid').reduce((sum, exp) => sum + exp.amount, 0);
    const pendingExpenses = expenses.filter(e => e.status === 'pending').reduce((sum, exp) => sum + exp.amount, 0);

    // Category breakdown
    const categoryBreakdown: { [key: string]: number } = {};
    expenses.forEach(exp => {
      categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + exp.amount;
    });

    return {
      totalExpenses,
      paidExpenses,
      pendingExpenses,
      expenseCount: expenses.length,
      categoryBreakdown,
      deletedCount: this.getDeletedExpenses().length
    };
  }

  // Add expense to cash flow
  private addToCashFlow(expense: Expense): void {
    try {
      cashFlowManager.addTransaction({
        date: expense.date,
        type: 'expense',
        category: this.mapExpenseCategory(expense.category),
        subcategory: expense.category,
        amount: expense.amount,
        description: `مصروف - ${expense.description}`,
        referenceId: expense.id,
        referenceType: 'manual',
        paymentMethod: 'cash',
        notes: expense.notes,
        createdBy: expense.createdBy
      });
    } catch (error) {
      console.error('Error adding expense to cash flow:', error);
    }
  }

  // Remove expense from cash flow
  private removeFromCashFlow(expense: Expense): void {
    try {
      // Get cash flow transactions and remove the one related to this expense
      const transactions = cashFlowManager.getTransactions();
      const updatedTransactions = transactions.filter(t => t.referenceId !== expense.id);
      storage.setItem('cash_flow_transactions', updatedTransactions);
    } catch (error) {
      console.error('Error removing expense from cash flow:', error);
    }
  }

  // Map expense category to cash flow category
  private mapExpenseCategory(expenseCategory: string): 'sales' | 'purchases' | 'payroll' | 'utilities' | 'rent' | 'marketing' | 'other' {
    const categoryMap: { [key: string]: any } = {
      'إيجار المحل': 'rent',
      'الكهرباء والمياه': 'utilities',
      'رواتب الموظفين': 'payroll',
      'مصاريف التسويق': 'marketing',
      'صيانة المعدات': 'other',
      'مصاريف النقل': 'other',
      'أخرى': 'other'
    };

    return categoryMap[expenseCategory] || 'other';
  }

  // Sync existing expenses with cash flow
  syncWithCashFlow(): void {
    try {
      const expenses = this.getExpenses().filter(exp => exp.status === 'paid');
      const existingTransactions = cashFlowManager.getTransactions();
      
      expenses.forEach(expense => {
        // Check if already synced
        const alreadySynced = existingTransactions.some(t => t.referenceId === expense.id);
        if (!alreadySynced) {
          this.addToCashFlow(expense);
        }
      });
    } catch (error) {
      console.error('Error syncing expenses with cash flow:', error);
    }
  }
}

// Export singleton instance
export const expensesManager = ExpensesManager.getInstance();