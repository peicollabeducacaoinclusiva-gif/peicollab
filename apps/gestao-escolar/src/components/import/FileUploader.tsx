import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { parseFile, ParsedData } from '../../services/importService';

interface FileUploaderProps {
  onFileProcessed: (data: ParsedData) => void;
  acceptedFormats?: string[];
}

export function FileUploader({ onFileProcessed, acceptedFormats: _acceptedFormats = ['.csv', '.json', '.xlsx', '.xls'] }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;
    
    setFile(uploadedFile);
    setError(null);
    setSuccess(false);
    setProcessing(true);
    
    try {
      const parsedData = await parseFile(uploadedFile);
      setSuccess(true);
      onFileProcessed(parsedData);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar arquivo');
      setSuccess(false);
    } finally {
      setProcessing(false);
    }
  }, [onFileProcessed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const removeFile = () => {
    setFile(null);
    setError(null);
    setSuccess(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 bg-card'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-lg text-foreground">Solte o arquivo aqui...</p>
          ) : (
            <>
              <p className="text-lg font-medium text-foreground mb-2">
                Arraste e solte um arquivo aqui
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: CSV, JSON, Excel (.xlsx, .xls)
              </p>
              <p className="text-xs text-muted-foreground">
                Tamanho máximo: 10MB
              </p>
            </>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${
                  success ? 'bg-green-100' : error ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  {processing ? (
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                  ) : success ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : error ? (
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  ) : (
                    <File className="h-6 w-6 text-blue-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                    {processing && ' - Processando...'}
                    {success && ' - Pronto para importar'}
                    {error && ' - Erro no processamento'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={removeFile}
                disabled={processing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  Arquivo processado com sucesso! Prossiga para o próximo passo.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}















