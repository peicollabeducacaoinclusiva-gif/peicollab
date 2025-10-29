// Teste direto da importação
const testData = {
  name: "Escola Teste API",
  network_name: "Rede Municipal de Ensino",
  network_email: "teste@escola.com",
  network_phone: "(11) 99999-9999",
  network_address: "Rua Teste, 123",
  network_responsible: "João Silva",
  is_active: true
};

console.log("Dados de teste:", testData);

// Simular a requisição
const url = "http://127.0.0.1:54321/rest/v1/tenants";
const headers = {
  "apikey": "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH",
  "Authorization": "Bearer sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH",
  "Content-Type": "application/json"
};

console.log("URL:", url);
console.log("Headers:", headers);
console.log("Dados:", JSON.stringify(testData, null, 2));



