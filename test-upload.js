const fs = require('fs');
const FormData = require('form-data');

async function testUpload() {
  try {
    console.log('🧪 Тестируем загрузку резюме...');
    
    // Создаем тестовый файл
    const testContent = `
Иван Петров
Frontend Developer
Опыт: 5 лет
Навыки: React, TypeScript, Node.js
Email: ivan@example.com
Телефон: +7 (999) 123-45-67
Локация: Москва

Опыт работы:
- 2020-2024: Senior Frontend Developer в компании "Технологии"
- 2018-2020: Frontend Developer в стартапе "Инновации"

Образование:
- 2018: Бакалавр информатики, МГУ

Языки:
- Русский (родной)
- Английский (продвинутый)
    `;
    
    fs.writeFileSync('test-resume.txt', testContent);
    
    // Создаем FormData
    const formData = new FormData();
    formData.append('file', fs.createReadStream('test-resume.txt'));
    formData.append('consent', 'true');
    
    // Отправляем запрос
    const response = await fetch('http://localhost:3000/api/resumes/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    console.log('📊 Результат загрузки:');
    console.log('Status:', response.status);
    console.log('Success:', data.success);
    console.log('Message:', data.message);
    
    if (data.error) {
      console.log('❌ Ошибка:', data.error);
    }
    
    if (data.summary) {
      console.log('📄 Сводка:', data.summary);
    }
    
    // Очищаем тестовый файл
    fs.unlinkSync('test-resume.txt');
    
  } catch (error) {
    console.error('❌ Ошибка теста:', error.message);
  }
}

testUpload();
