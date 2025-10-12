import fs from 'fs';
import path from 'path';

// Caminho da pasta que você quer listar
const pastaAlvo = './'; // ou substitua por qualquer caminho

// Caminho do arquivo de saída
const arquivoSaida = 'lista.txt';

// Função recursiva para listar arquivos e diretórios
function listarConteudo(pasta, resultado = []) {
  const itens = fs.readdirSync(pasta);
  for (const item of itens) {
    const caminhoCompleto = path.join(pasta, item);
    const stats = fs.statSync(caminhoCompleto);
    resultado.push(caminhoCompleto);
    if (stats.isDirectory()) {
      listarConteudo(caminhoCompleto, resultado);
    }
  }
  return resultado;
}

// Executa e salva no txt
const lista = listarConteudo(pastaAlvo);
fs.writeFileSync(arquivoSaida, lista.join('\n'), 'utf-8');

console.log(`✅ Lista salva em ${arquivoSaida}`);
