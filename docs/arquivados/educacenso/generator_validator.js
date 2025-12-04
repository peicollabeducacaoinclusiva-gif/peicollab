// generator_validator.js
// Node.js script (CommonJS) to validate a JSON structure and generate Educacenso-like .txt
// Usage: node generator_validator.js input.json output.txt
const fs = require('fs');
const crypto = require('crypto');

function isValidDate(d) {
  const parts = d.split('/');
  if(parts.length !== 3) return false;
  const day = parseInt(parts[0],10), month=parseInt(parts[1],10), year=parseInt(parts[2],10);
  if(isNaN(day)||isNaN(month)||isNaN(year)) return false;
  const date = new Date(year, month-1, day);
  return date.getFullYear()===year && date.getMonth()===month-1 && date.getDate()===day;
}

function validateCPF(cpf) {
  if(!cpf) return true;
  cpf = cpf.replace(/\D/g,'');
  if(cpf.length !== 11) return false;
  // invalid known CPFs
  if(/^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for(let i=0;i<9;i++) sum += parseInt(cpf.charAt(i))*(10-i);
  let rev = 11 - (sum % 11);
  if(rev === 10 || rev === 11) rev = 0;
  if(rev !== parseInt(cpf.charAt(9))) return false;
  sum = 0;
  for(let i=0;i<10;i++) sum += parseInt(cpf.charAt(i))*(11-i);
  rev = 11 - (sum % 11);
  if(rev === 10 || rev === 11) rev = 0;
  if(rev !== parseInt(cpf.charAt(10))) return false;
  return true;
}

function normalizeName(n) {
  return n.replace(/\|/g,' ').replace(/\t/g,' ').replace(/\s+/g,' ').trim();
}

function generateLines(data, report) {
  const lines = [];
  // 00: schools metadata (one per file assumed)
  const school = data.school;
  lines.push(`00|${school.municipio_ibge}|${school.dependencia}|${normalizeName(school.name)}|${school.inep_code||''}|${school.ano_base}`);
  // 10: infra
  if(data.infra) {
    const i = data.infra;
    lines.push(`10|${school.inep_code||''}|${i.num_salas||0}|${i.num_labs||0}|${i.internet?1:0}|${i.acessibilidade?1:0}`);
  }
  // 20: turmas
  (data.classes||[]).forEach(c=>{
    lines.push(`20|${school.municipio_ibge}|${c.local_id}|${normalizeName(c.description)}|${c.shift}|${c.serie}|${c.capacity}|${c.modalidade}`);
  });
  // 30: people
  (data.people||[]).forEach(p=>{
    lines.push(`30|${p.local_id}|${normalizeName(p.name)}|${p.birthdate}|${p.sex}|${p.cpf||''}|${p.inep_id||''}`);
  });
  // 40: managers
  (data.managers||[]).forEach(m=>{
    lines.push(`40|${m.person_local_id}|${m.name}|${m.role}|${m.start_date||''}|${m.inep_id||''}`);
  });
  // 50: staff
  (data.staff||[]).forEach(s=>{
    lines.push(`50|${s.person_local_id}|${s.role_code}|${s.workload||0}|${s.admission_date||''}|${s.inep_id||''}`);
  });
  // 60: enrollments
  (data.enrollments||[]).forEach(e=>{
    lines.push(`60|${e.person_local_id}|${e.class_local_id}|${e.serie}|${e.enrollment_date}|${e.situation}|${e.inep_id||''}`);
  });
  // 99 final
  const sha = crypto.createHash('sha256').update(lines.join('\n')).digest('hex');
  lines.push(`99|${lines.length}|${sha}|${new Date().toLocaleDateString('pt-BR')}`);
  return {lines, sha};
}

function validateData(data) {
  const report = {errors:[], warnings:[]};
  if(!data.school) report.errors.push('Falta bloco "school"');
  else {
    if(!/^\d{7,8}$/.test(String(data.school.municipio_ibge))) report.errors.push('municipio_ibge inválido');
    if(!data.school.name) report.errors.push('nome da escola vazio');
    if(!/^\d{4}$/.test(String(data.school.ano_base))) report.errors.push('ano_base inválido');
  }
  (data.people||[]).forEach(p=>{
    if(!p.local_id) report.errors.push(`Pessoa sem local_id: ${JSON.stringify(p)}`);
    if(!p.name) report.errors.push(`Pessoa sem nome: ${p.local_id}`);
    if(!isValidDate(p.birthdate)) report.errors.push(`Data de nascimento inválida: ${p.local_id}`);
    if(p.cpf && !validateCPF(p.cpf)) report.errors.push(`CPF inválido: ${p.local_id}`);
  });
  // referential checks
  const peopleIds = new Set((data.people||[]).map(p=>p.local_id));
  (data.enrollments||[]).forEach(e=>{
    if(!peopleIds.has(e.person_local_id)) report.errors.push(`Matrícula com pessoa não listada: ${e.person_local_id}`);
  });
  return report;
}

// If run as script
if(require.main === module) {
  const input = process.argv[2];
  const output = process.argv[3] || 'output.txt';
  if(!input) {
    console.error('Uso: node generator_validator.js input.json [output.txt]');
    process.exit(1);
  }
  const raw = fs.readFileSync(input,'utf-8');
  const data = JSON.parse(raw);
  const report = validateData(data);
  if(report.errors.length>0) {
    fs.writeFileSync(output.replace('.txt','_report.json'), JSON.stringify(report,null,2),'utf-8');
    console.error('Erros na validação. Ver ', output.replace('.txt','_report.json'));
    process.exit(2);
  }
  const {lines, sha} = generateLines(data, report);
  fs.writeFileSync(output, lines.join('\\n'),'utf-8');
  fs.writeFileSync(output.replace('.txt','.sha.txt'), sha,'utf-8');
  fs.writeFileSync(output.replace('.txt','_report.json'), JSON.stringify(report,null,2),'utf-8');
  console.log('Arquivo gerado:', output);
}
