import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import { supabase } from '@pei/database';

export interface ParsedData {
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
  fileInfo: {
    name: string;
    size: number;
    format: string;
  };
}

export interface ImportResult {
  success: boolean;
  batchId?: string;
  totalRecords: number;
  successCount: number;
  failureCount: number;
  duplicateCount: number;
  skippedCount: number;
  errors: Array<{ row: number; message: string }>;
  warnings: Array<{ row: number; message: string }>;
}

/**
 * Detecta automaticamente o formato do arquivo
 */
export function detectFileFormat(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'csv') return 'csv';
  if (extension === 'json') return 'json';
  if (extension === 'xlsx' || extension === 'xls') return 'excel';
  
  return 'unknown';
}

/**
 * Parse arquivo CSV
 */
export async function parseCSV(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        resolve({
          headers: results.meta.fields || [],
          rows: results.data as Record<string, any>[],
          totalRows: results.data.length,
          fileInfo: {
            name: file.name,
            size: file.size,
            format: 'csv'
          }
        });
      },
      error: (error) => {
        reject(new Error(`Erro ao processar CSV: ${error.message}`));
      }
    });
  });
}

/**
 * Parse arquivo JSON
 */
export async function parseJSON(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Se é array direto
        if (Array.isArray(data)) {
          const headers = data.length > 0 ? Object.keys(data[0]) : [];
          resolve({
            headers,
            rows: data,
            totalRows: data.length,
            fileInfo: {
              name: file.name,
              size: file.size,
              format: 'json'
            }
          });
        } 
        // Se tem estrutura { data: [...] }
        else if (data.data && Array.isArray(data.data)) {
          const headers = data.data.length > 0 ? Object.keys(data.data[0]) : [];
          resolve({
            headers,
            rows: data.data,
            totalRows: data.data.length,
            fileInfo: {
              name: file.name,
              size: file.size,
              format: 'json'
            }
          });
        } else {
          reject(new Error('Formato JSON inválido. Esperado array ou objeto com propriedade "data".'));
        }
      } catch (error: any) {
        reject(new Error(`Erro ao processar JSON: ${error.message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
}

/**
 * Parse arquivo Excel (.xlsx)
 */
export async function parseExcel(file: File): Promise<ParsedData> {
  return new Promise(async (resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(buffer);
          
          // Pegar primeira aba
          const worksheet = workbook.getWorksheet(1);
          if (!worksheet) {
            reject(new Error('Planilha não encontrada'));
            return;
          }
          
          // Ler cabeçalhos da primeira linha
          const headerRow = worksheet.getRow(1);
          const headers: string[] = [];
          headerRow.eachCell((cell, colNumber) => {
            const value = cell.value?.toString() || `Coluna${colNumber}`;
            headers.push(value);
          });
          
          // Ler dados das linhas seguintes
          const rows: Record<string, any>[] = [];
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Pular cabeçalho
            
            const rowData: Record<string, any> = {};
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              const header = headers[colNumber - 1];
              if (header) {
                // Converter valores de Excel para tipos apropriados
                const value = cell.value;
                if (value !== null && value !== undefined) {
                  if (typeof value === 'object' && 'text' in value) {
                    rowData[header] = (value as any).text;
                  } else if (value instanceof Date) {
                    rowData[header] = value.toISOString().split('T')[0];
                  } else {
                    rowData[header] = value.toString();
                  }
                } else {
                  rowData[header] = '';
                }
              }
            });
            rows.push(rowData);
          });
          
          resolve({
            headers,
            rows,
            totalRows: rows.length,
            fileInfo: {
              name: file.name,
              size: file.size,
              format: 'excel'
            }
          });
        } catch (error: any) {
          reject(new Error(`Erro ao processar Excel: ${error.message}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      reject(new Error(`Erro ao processar Excel: ${error.message}`));
    }
  });
}

/**
 * Parse arquivo - detecta formato automaticamente
 */
export async function parseFile(file: File): Promise<ParsedData> {
  const format = detectFileFormat(file);
  
  switch (format) {
    case 'csv':
      return parseCSV(file);
    case 'json':
      return parseJSON(file);
    case 'excel':
      return parseExcel(file);
    default:
      throw new Error('Formato de arquivo não suportado');
  }
}

/**
 * Validar CPF
 */
export function validateCPF(cpf: string): boolean {
  if (!cpf) return false;
  
  // Remove caracteres não numéricos
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false; // Todos iguais
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
}

/**
 * Aplicar transformações em dados
 */
export function applyTransform(value: any, transform?: string): any {
  if (!value) return value;
  
  switch (transform) {
    case 'uppercase':
      return String(value).toUpperCase();
    case 'lowercase':
      return String(value).toLowerCase();
    case 'trim':
      return String(value).trim();
    case 'cpf_format':
      return String(value).replace(/\D/g, '');
    case 'phone_format':
      return String(value).replace(/\D/g, '');
    case 'date_br_to_iso':
      // Converte DD/MM/YYYY para YYYY-MM-DD
      const parts = String(value).split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return value;
    case 'boolean':
      const lower = String(value).toLowerCase();
      return lower === 'sim' || lower === 'true' || lower === '1' || lower === 'yes';
    default:
      return value;
  }
}

/**
 * Encontrar duplicados
 */
export async function findDuplicates(
  records: Record<string, any>[],
  recordType: string,
  matchFields: string[]
): Promise<Array<{ sourceRow: number; existing: any; new: any }>> {
  const duplicates: Array<{ sourceRow: number; existing: any; new: any }> = [];
  
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    let query = supabase.from(getTableName(recordType)).select('*');
    
    // Construir query de busca baseada nos campos de match
    matchFields.forEach(field => {
      if (record[field]) {
        query = query.eq(field, record[field]);
      }
    });
    
    const { data: existing } = await query.limit(1).maybeSingle();
    
    if (existing) {
      duplicates.push({
        sourceRow: i + 1,
        existing,
        new: record
      });
    }
  }
  
  return duplicates;
}

/**
 * Criar lote de importação
 */
export async function createImportBatch(
  fileName: string,
  fileSize: number,
  fileFormat: string,
  totalRecords: number,
  configId?: string
): Promise<string> {
  const { data: user } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, school_id')
    .eq('id', user.user?.id)
    .single();
  
  const { data, error } = await supabase
    .from('import_batches')
    .insert({
      config_id: configId || null,
      file_name: fileName,
      file_size: fileSize,
      file_format: fileFormat,
      total_records: totalRecords,
      created_by: user.user?.id,
      tenant_id: profile?.tenant_id,
      school_id: profile?.school_id,
      status: 'processing'
    })
    .select('id')
    .single();
  
  if (error) throw error;
  return data.id;
}

/**
 * Atualizar status do lote
 */
export async function updateBatchStatus(
  batchId: string,
  status: string,
  summary?: any
): Promise<void> {
  const update: any = {
    status,
    completed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : null
  };
  
  if (summary) {
    update.successful_records = summary.successCount || 0;
    update.failed_records = summary.failureCount || 0;
    update.duplicate_records = summary.duplicateCount || 0;
    update.skipped_records = summary.skippedCount || 0;
    update.warnings_count = summary.warningsCount || 0;
    update.summary = summary;
  }
  
  const { error } = await supabase
    .from('import_batches')
    .update(update)
    .eq('id', batchId);
  
  if (error) throw error;
}

/**
 * Registrar linha importada
 */
export async function logImportRecord(
  batchId: string,
  rowNumber: number,
  recordType: string,
  sourceData: any,
  mappedData: any,
  status: string,
  targetId?: string,
  actionTaken?: string,
  errorMessage?: string,
  warnings?: any[]
): Promise<void> {
  await supabase.from('import_records').insert({
    batch_id: batchId,
    row_number: rowNumber,
    record_type: recordType,
    source_data: sourceData,
    mapped_data: mappedData,
    target_id: targetId,
    status,
    action_taken: actionTaken,
    error_message: errorMessage,
    warnings: warnings || []
  });
}

/**
 * Helper: obter nome da tabela baseado no tipo
 */
function getTableName(recordType: string): string {
  const mapping: Record<string, string> = {
    'student': 'students',
    'professional': 'professionals',
    'user': 'profiles',
    'class': 'classes',
    'subject': 'subjects'
  };
  
  return mapping[recordType] || recordType;
}















