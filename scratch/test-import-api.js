const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:2816/api/resume/import';

async function testPdfImport() {
    console.log('\n--- Testing PDF Import (test-debug.pdf) ---');
    const form = new FormData();
    const filePath = path.join(__dirname, '..', 'test-debug.pdf');
    form.append('resume', fs.createReadStream(filePath));
    form.append('jobDescription', 'Software engineer with leadership experience');

    try {
        const response = await axios.post(API_URL, form, {
            headers: form.getHeaders()
        });
        console.log('Status:', response.status);
        console.log('Success:', response.data.success);
        console.log('Meta:', response.data.meta);
        console.log('Extracted Basic Info:', response.data.data ? response.data.data.personalInfo : 'none');
        console.log('Extracted Experience count:', response.data.data && response.data.data.experience ? response.data.data.experience.length : 0);
    } catch (err) {
        console.error('PDF Import failed:', err.response ? err.response.data : err.message);
    }
}

async function testImageImport() {
    console.log('\n--- Testing Image Import (wipro.png) ---');
    const form = new FormData();
    const filePath = path.join(__dirname, '..', 'wipro.png');
    form.append('resume', fs.createReadStream(filePath));

    try {
        const response = await axios.post(API_URL, form, {
            headers: form.getHeaders()
        });
        console.log('Status:', response.status);
        console.log('Success:', response.data.success);
        console.log('Meta:', response.data.meta);
        console.log('Extracted Basic Info:', response.data.data ? response.data.data.personalInfo : 'none');
    } catch (err) {
        console.error('Image Import failed:', err.response ? err.response.data : err.message);
    }
}

async function run() {
    await testPdfImport();
    await testImageImport();
}

run();
