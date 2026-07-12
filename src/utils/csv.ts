import { Transaction } from '../types';

export type ImportedTransaction = Omit<Transaction, 'id' | 'userId'>;

const splitCsvLine = (line: string) => {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += char;
    }
  }

  cells.push(cell.trim());
  return cells;
};

const escapeCsv = (value: string | number | undefined) => {
  const raw = String(value ?? '');
  return /[",\n\r]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
};

export const transactionsToCsv = (transactions: Transaction[]) => {
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Notes'];
  const rows = transactions.map(t =>
    [t.date, t.type, t.category, t.description, t.amount, t.notes].map(escapeCsv).join(','),
  );
  return [headers.join(','), ...rows].join('\n');
};

export const parseTransactionsCsv = (raw: string) => {
  const lines = raw.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV should contain a header row and at least one transaction.');
  }

  const headers = splitCsvLine(lines[0]).map(header => header.trim().toLowerCase());
  const required = ['date', 'type', 'category', 'description', 'amount'];
  const missing = required.filter(header => !headers.includes(header));
  if (missing.length) {
    throw new Error(`Missing required header: ${missing.join(', ')}.`);
  }

  const index = (header: string) => headers.indexOf(header);
  const imported: ImportedTransaction[] = [];
  const skipped: number[] = [];

  lines.slice(1).forEach((line, rowIndex) => {
    const cells = splitCsvLine(line);
    const type = cells[index('type')]?.toLowerCase();
    const amount = Number.parseFloat(cells[index('amount')]);
    const date = cells[index('date')];
    const description = cells[index('description')];
    const category = cells[index('category')];

    if ((type !== 'income' && type !== 'expense') || !date || !category || !description || !Number.isFinite(amount) || amount <= 0) {
      skipped.push(rowIndex + 2);
      return;
    }

    imported.push({
      type,
      amount,
      category,
      date,
      description,
      notes: cells[index('notes')] || undefined,
      isRecurring: false,
    });
  });

  return { imported, skipped };
};

export const downloadTextFile = (contents: string, filename: string, type: string) => {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
