'use client';

import { Transaction } from '@/types/index';
import Dexie, { Table } from 'dexie';

export interface OfflineTransaction extends Transaction {
  offline_id?: string;
  synced: boolean;
  sync_error?: string;
}

export class OfflineDB extends Dexie {
  transactions!: Table<OfflineTransaction>;
  backups!: Table<any>;

  constructor() {
    super('GestorGastosDB');
    this.version(1).stores({
      transactions: '++id, user_id, synced',
      backups: '++id, user_id, created_at',
    });
  }
}

export const db = new OfflineDB();

export function useOfflineSync(userId?: string) {
  const saveOfflineTransaction = async (transaction: Transaction) => {
    const offlineTransaction: OfflineTransaction = {
      ...transaction,
      offline_id: `offline-${Date.now()}`,
      synced: false,
    };

    await db.transactions.add(offlineTransaction);
    return offlineTransaction;
  };

  const syncOfflineTransactions = async () => {
    try {
      const unsyncedTransactions = await db.transactions
        .where('synced')
        .equals(0 as any)
        .toArray();

      const results = [];

      for (const transaction of unsyncedTransactions) {
        try {
          const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction),
          });

          if (response.ok) {
            await db.transactions.update(transaction.id || '', { synced: true });
            results.push({ id: transaction.id, status: 'success' });
          } else {
            results.push({
              id: transaction.id,
              status: 'error',
              error: 'Erro no servidor',
            });
          }
        } catch (error: any) {
          results.push({
            id: transaction.id,
            status: 'error',
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      throw error;
    }
  };

  const createBackup = async (data: any) => {
    const backup = {
      user_id: userId,
      data: JSON.stringify(data),
      created_at: new Date().toISOString(),
      size: new Blob([JSON.stringify(data)]).size,
    };

    await db.backups.add(backup);

    // Salvar também no localStorage para acesso rápido
    localStorage.setItem(
      `backup-${userId}-latest`,
      JSON.stringify(backup)
    );

    return backup;
  };

  const restoreBackup = async (backupId: string) => {
    const backup = await db.backups.get(backupId);
    if (!backup) throw new Error('Backup não encontrado');

    return JSON.parse(backup.data);
  };

  const getBackups = async () => {
    if (!userId) return [];
    return db.backups.where('user_id').equals(userId).toArray();
  };

  const deleteBackup = async (backupId: string) => {
    return db.backups.delete(backupId);
  };

  const getOfflineTransactions = async () => {
    if (!userId) return [];
    return db.transactions.where('user_id').equals(userId).toArray();
  };

  const deleteOfflineTransaction = async (id: string) => {
    return db.transactions.delete(id);
  };

  return {
    saveOfflineTransaction,
    syncOfflineTransactions,
    createBackup,
    restoreBackup,
    getBackups,
    deleteBackup,
    getOfflineTransactions,
    deleteOfflineTransaction,
  };
}
