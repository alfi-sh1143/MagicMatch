import { PrintJob, PrintJobStatus } from '../../types';

export type PrintQueueListener = (jobs: PrintJob[]) => void;

export interface PrintQueueService {
  enqueueJob(job: Omit<PrintJob, 'id' | 'createdAt' | 'status' | 'attempts'>): Promise<PrintJob>;
  getJobs(): PrintJob[];
  getJob(id: string): PrintJob | undefined;
  retryJob(id: string): Promise<boolean>;
  cancelJob(id: string): void;
  addListener(listener: PrintQueueListener): () => void;
  clearQueue(): void;
  getQueueStats(): { total: number; queued: number; completed: number; failed: number };
}

class BrowserPrintQueueService implements PrintQueueService {
  private jobs: PrintJob[] = [];
  private listeners: Set<PrintQueueListener> = new Set();
  private isProcessing: boolean = false;
  private storageKey = 'magicmatch_print_queue';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.jobs = JSON.parse(stored);
      }
    } catch {}
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.jobs.slice(0, 30)));
    } catch {}
    this.notify();
  }

  private notify() {
    const copy = [...this.jobs];
    this.listeners.forEach((listener) => listener(copy));
  }

  addListener(listener: PrintQueueListener): () => void {
    this.listeners.add(listener);
    listener([...this.jobs]);
    return () => this.listeners.delete(listener);
  }

  getJobs(): PrintJob[] {
    return [...this.jobs];
  }

  getJob(id: string): PrintJob | undefined {
    return this.jobs.find((j) => j.id === id);
  }

  getQueueStats() {
    return {
      total: this.jobs.length,
      queued: this.jobs.filter((j) => j.status === 'QUEUED' || j.status === 'PRINTING').length,
      completed: this.jobs.filter((j) => j.status === 'COMPLETED').length,
      failed: this.jobs.filter((j) => j.status === 'FAILED').length,
    };
  }

  async enqueueJob(data: Omit<PrintJob, 'id' | 'createdAt' | 'status' | 'attempts'>): Promise<PrintJob> {
    const job: PrintJob = {
      ...data,
      id: `PJ-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      createdAt: Date.now(),
      status: 'QUEUED',
      attempts: 0,
    };

    this.jobs.unshift(job);
    this.persist();

    // Trigger queue worker
    this.processNext();
    return job;
  }

  private async processNext() {
    if (this.isProcessing) return;
    const nextJob = this.jobs.find((j) => j.status === 'QUEUED');
    if (!nextJob) return;

    this.isProcessing = true;
    nextJob.status = 'PRINTING';
    nextJob.attempts += 1;
    this.persist();

    try {
      if (typeof window !== 'undefined') {
        // Trigger browser native print dialogue
        window.print();
        // Give short grace period before marking completed
        await new Promise((r) => setTimeout(r, 600));
        nextJob.status = 'COMPLETED';
      } else {
        nextJob.status = 'COMPLETED';
      }
    } catch (err: any) {
      console.error('Print queue dispatch error:', err);
      nextJob.status = 'FAILED';
      nextJob.errorMessage = err?.message || 'Printer dialogue interrupted or unavailable';
    } finally {
      this.persist();
      this.isProcessing = false;
      // Continue next if any queued
      setTimeout(() => this.processNext(), 500);
    }
  }

  async retryJob(id: string): Promise<boolean> {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) return false;
    job.status = 'QUEUED';
    job.errorMessage = undefined;
    this.persist();
    this.processNext();
    return true;
  }

  cancelJob(id: string): void {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) return;
    job.status = 'CANCELLED';
    this.persist();
  }

  clearQueue(): void {
    this.jobs = [];
    this.persist();
  }
}

export const printQueueService: PrintQueueService = new BrowserPrintQueueService();
