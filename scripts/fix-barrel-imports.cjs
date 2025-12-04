/**
 * Script para expandir barrel imports de ../components/ui
 */

const fs = require('fs');
const path = require('path');

// Mapeamento de componentes para seus arquivos
const UI_COMPONENT_MAP = {
  Button: '@/components/ui/button',
  Input: '@/components/ui/input',
  Card: '@/components/ui/card',
  CardHeader: '@/components/ui/card',
  CardTitle: '@/components/ui/card',
  CardContent: '@/components/ui/card',
  CardFooter: '@/components/ui/card',
  CardDescription: '@/components/ui/card',
  Badge: '@/components/ui/badge',
  Label: '@/components/ui/label',
  Checkbox: '@/components/ui/checkbox',
  Select: '@/components/ui/select',
  SelectTrigger: '@/components/ui/select',
  SelectValue: '@/components/ui/select',
  SelectContent: '@/components/ui/select',
  SelectItem: '@/components/ui/select',
  Textarea: '@/components/ui/textarea',
  Dialog: '@/components/ui/dialog',
  DialogContent: '@/components/ui/dialog',
  DialogHeader: '@/components/ui/dialog',
  DialogTitle: '@/components/ui/dialog',
  DialogDescription: '@/components/ui/dialog',
  DialogFooter: '@/components/ui/dialog',
  DialogTrigger: '@/components/ui/dialog',
  Table: '@/components/ui/table',
  TableHeader: '@/components/ui/table',
  TableBody: '@/components/ui/table',
  TableRow: '@/components/ui/table',
  TableHead: '@/components/ui/table',
  TableCell: '@/components/ui/table',
  Progress: '@/components/ui/progress',
  Tabs: '@/components/ui/tabs',
  TabsList: '@/components/ui/tabs',
  TabsTrigger: '@/components/ui/tabs',
  TabsContent: '@/components/ui/tabs',
  Separator: '@/components/ui/separator',
  Avatar: '@/components/ui/avatar',
  AvatarImage: '@/components/ui/avatar',
  AvatarFallback: '@/components/ui/avatar',
  ScrollArea: '@/components/ui/scroll-area',
  Switch: '@/components/ui/switch',
  Tooltip: '@/components/ui/tooltip',
  TooltipProvider: '@/components/ui/tooltip',
  TooltipTrigger: '@/components/ui/tooltip',
  TooltipContent: '@/components/ui/tooltip',
  Form: '@/components/ui/form',
  FormItem: '@/components/ui/form',
  FormLabel: '@/components/ui/form',
  FormControl: '@/components/ui/form',
  FormDescription: '@/components/ui/form',
  FormMessage: '@/components/ui/form',
  FormField: '@/components/ui/form',
};

function expandBarrelImport(content) {
  // Regex para capturar imports de barrel: { Comp1, Comp2 } from '../components/ui'
  const barrelImportRegex = /import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]\.\.\/components\/ui['"]/g;
  
  // Também trocar imports relativos ../components/ui/ para @/components/ui/
  content = content.replace(/from ['"]\.\.\/components\/ui\//g, 'from \'@/components/ui/');
  
  let modified = false;
  content = content.replace(barrelImportRegex, (match, components) => {
    modified = true;
    
    // Separar componentes
    const compList = components.split(',').map(c => c.trim()).filter(Boolean);
    
    // Agrupar por arquivo de origem
    const grouped = {};
    for (const comp of compList) {
      const targetFile = UI_COMPONENT_MAP[comp] || '@/components/ui/card';
      if (!grouped[targetFile]) {
        grouped[targetFile] = [];
      }
      grouped[targetFile].push(comp);
    }
    
    // Gerar imports individuais
    const imports = Object.entries(grouped).map(([file, comps]) => {
      return `import { ${comps.join(', ')} } from '${file}';`;
    });
    
    return imports.join('\n');
  });
  
  return { content, modified };
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    const { content: newContent, modified } = expandBarrelImport(content);
    
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dirPath) {
  let filesModified = 0;
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      filesModified += processDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      if (processFile(fullPath)) {
        filesModified++;
      }
    }
  }
  
  return filesModified;
}

console.log('🔧 Expandindo barrel imports...\n');

const planoAeePath = 'apps/pei-collab/src/modules/plano-aee';
if (fs.existsSync(planoAeePath)) {
  console.log(`📁 ${planoAeePath}`);
  const modified = processDirectory(planoAeePath);
  console.log(`   Arquivos modificados: ${modified}\n`);
}

console.log('✅ Concluído!');

