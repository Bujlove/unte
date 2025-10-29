/**
 * Script to test resume parsing without database
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');

// Import parsing functions
const { parseResumeTextWithRetry, calculateQualityScore, extractSkills, createResumeSummary } = require('../src/lib/deepseek/parser');
const { extractTextFromFile } = require('../src/lib/storage/file-parser');

async function testParsing() {
  try {
    console.log('🧪 Testing resume parsing...');
    
    // Read test resume
    const testResumePath = path.join(__dirname, '..', 'test_resume.txt');
    const testResumeText = fs.readFileSync(testResumePath, 'utf8');
    
    console.log('📄 Test resume content:');
    console.log(testResumeText.substring(0, 200) + '...');
    
    // Test text extraction
    console.log('\n🔍 Testing text extraction...');
    const buffer = Buffer.from(testResumeText, 'utf8');
    const extractedText = await extractTextFromFile(buffer, 'text/plain', 'test_resume.txt');
    console.log('✅ Text extraction successful');
    console.log('Extracted length:', extractedText.length);
    
    // Test parsing
    console.log('\n🤖 Testing AI parsing...');
    const parsedData = await parseResumeTextWithRetry(extractedText);
    console.log('✅ Parsing successful');
    
    // Test quality score
    const qualityScore = calculateQualityScore(parsedData);
    console.log('📊 Quality score:', qualityScore);
    
    // Test skills extraction
    const skills = extractSkills(parsedData);
    console.log('🛠️ Skills:', skills);
    
    // Test summary creation
    const summary = createResumeSummary(parsedData);
    console.log('📝 Summary:', summary);
    
    console.log('\n🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testParsing();
