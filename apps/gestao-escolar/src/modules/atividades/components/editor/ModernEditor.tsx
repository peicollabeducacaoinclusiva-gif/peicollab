import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@pei/ui';
import { Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, FileDown } from 'lucide-react';
import { toast } from 'sonner';

interface ModernEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
  onExportPDF?: () => void;
}

export function ModernEditor({ content, onChange, onExportPDF }: ModernEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [blocks, setBlocks] = useState<Array<{ id: string; type: string; content: string }>>(
    content.blocks || [{ id: '1', type: 'paragraph', content: '' }]
  );

  useEffect(() => {
    onChange({ blocks });
  }, [blocks, onChange]);

  const addBlock = (type: string) => {
    const newBlock = {
      id: Date.now().toString(),
      type,
      content: '',
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, content } : block
    ));
  };

  const deleteBlock = (id: string) => {
    if (blocks.length > 1) {
      setBlocks(blocks.filter(block => block.id !== id));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const currentIndex = blocks.findIndex(b => b.id === blockId);
      const newBlock = {
        id: Date.now().toString(),
        type: 'paragraph',
        content: '',
      };
      const newBlocks = [...blocks];
      newBlocks.splice(currentIndex + 1, 0, newBlock);
      setBlocks(newBlocks);
    }

    if (e.key === 'Backspace' && e.currentTarget.textContent === '') {
      e.preventDefault();
      deleteBlock(blockId);
    }
  };

  const renderBlock = (block: { id: string; type: string; content: string }) => {
    const baseClasses = 'w-full outline-none resize-none min-h-[1.5rem]';

    switch (block.type) {
      case 'heading1':
        return (
          <h1
            className={`${baseClasses} text-3xl font-bold`}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => updateBlock(block.id, e.currentTarget.textContent || '')}
            onKeyDown={(e) => handleKeyDown(e, block.id)}
          >
            {block.content}
          </h1>
        );
      case 'heading2':
        return (
          <h2
            className={`${baseClasses} text-2xl font-semibold`}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => updateBlock(block.id, e.currentTarget.textContent || '')}
            onKeyDown={(e) => handleKeyDown(e, block.id)}
          >
            {block.content}
          </h2>
        );
      case 'bulleted-list':
        return (
          <ul className="list-disc list-inside">
            <li
              className={baseClasses}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => updateBlock(block.id, e.currentTarget.textContent || '')}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
            >
              {block.content}
            </li>
          </ul>
        );
      case 'numbered-list':
        return (
          <ol className="list-decimal list-inside">
            <li
              className={baseClasses}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => updateBlock(block.id, e.currentTarget.textContent || '')}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
            >
              {block.content}
            </li>
          </ol>
        );
      default:
        return (
          <p
            className={baseClasses}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => updateBlock(block.id, e.currentTarget.textContent || '')}
            onKeyDown={(e) => handleKeyDown(e, block.id)}
          >
            {block.content}
          </p>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Editor de Atividade</CardTitle>
            <CardDescription>
              Editor moderno tipo Notion para criar atividades
            </CardDescription>
          </div>
          {onExportPDF && (
            <Button variant="outline" size="sm" onClick={onExportPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Toolbar */}
        <div className="flex items-center gap-2 p-2 border-b mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addBlock('heading1')}
            title="Título 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addBlock('heading2')}
            title="Título 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addBlock('bulleted-list')}
            title="Lista com marcadores"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addBlock('numbered-list')}
            title="Lista numerada"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        {/* Editor */}
        <div ref={editorRef} className="min-h-[400px] space-y-4">
          {blocks.map((block) => (
            <div key={block.id} className="group">
              {renderBlock(block)}
            </div>
          ))}
        </div>

        {/* Adicionar novo bloco */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => addBlock('paragraph')}
          className="mt-4"
        >
          + Adicionar Bloco
        </Button>
      </CardContent>
    </Card>
  );
}

