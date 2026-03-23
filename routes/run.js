const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const router = express.Router();

/**
 * @route POST /api/run
 * @description Execute Python code safely using subprocess
 */
router.post('/run', async (req, res) => {
    const { code, problem_title, problem_id } = req.body;

    if (!code) {
        return res.status(400).json({ success: false, error: 'No code provided' });
    }

    // Security: Basic check for dangerous imports
    const dangerousKeywords = ['import os', 'import sys', 'import subprocess', 'import shutil', 'import socket', 'eval(', 'exec('];
    const hasDanger = dangerousKeywords.some(kw => code.includes(kw));

    if (hasDanger) {
        return res.json({ 
            success: false, 
            error: 'Security Alert: Use of restricted libraries or functions (os, sys, eval, etc.) is not allowed.' 
        });
    }

    // 🏆 Dataset Preloading Logic
    let preloadCode = "";
    let datasetSchema = null;
    if (problem_title) {
        const title = problem_title.toLowerCase();
        if (title.includes('pizza')) {
            preloadCode = "import pandas as pd\ndf = pd.read_csv('datasets/pizza.csv')\n";
            datasetSchema = ['diameter', 'toppings', 'price'];
        } else if (title.includes('traffic')) {
            preloadCode = "import pandas as pd\ndf = pd.read_csv('datasets/website_traffic.csv')\n";
            datasetSchema = ['date', 'page_name', 'visitors'];
        }
    }

    // 🏆 Test Injection Logic
    let verificationSnippet = "";
    if (problem_id) {
        const testsPath = path.join(__dirname, '..', 'problems', problem_id, 'tests.json');
        if (fs.existsSync(testsPath)) {
            try {
                const testsData = JSON.parse(fs.readFileSync(testsPath, 'utf8'));
                const tests = testsData.tests || [];
                verificationSnippet = "\n\n# --- AUTOMATED TEST VALIDATION ---\n";
                tests.forEach((test) => {
                    // Create a safe condition check
                    const condition = test.condition || "False";
                    verificationSnippet += `
try:
    if ${condition}:
        print(f"__ORBIT_TEST__:${test.name}:Passed")
    else:
        print(f"__ORBIT_TEST__:${test.name}:Failed")
except Exception as e:
    print(f"__ORBIT_TEST__:${test.name}:Error ({str(e)})")
`;
                });
            } catch (e) {
                console.error('[Run API] Error preparing test injection:', e.message);
            }
        }
    }

    const finalCode = preloadCode + code + verificationSnippet; 

    // Create a temporary file
    const tempFileName = `orbit_exec_${crypto.randomBytes(4).toString('hex')}.py`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);

    try {
        fs.writeFileSync(tempFilePath, finalCode);

        const pythonProcess = spawn('python', [tempFilePath]);

        let stdout = '';
        let stderr = '';

        // Timeout mechanism: 15 seconds
        const timeout = setTimeout(() => {
            if (pythonProcess) pythonProcess.kill();
        }, 15000);

        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
            clearTimeout(timeout);
            
            // Clean up temp file
            try {
                if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            } catch (err) {
                console.error('[Run API] Cleanup error:', err.message);
            }

            if (code === null) {
                return res.json({ success: false, error: 'Execution timed out', timeout: 15 });
            }

            if (code !== 0) {
                return res.json({ success: false, error: stderr || `Execution failed with exit code ${code}` });
            }

            // 🏆 Test Case Validation Logic (Variable-Based)
            const lines = stdout.split('\n');
            const filteredOutput = lines.filter(l => !l.startsWith('__ORBIT_TEST__')).join('\n');
            const testResults = lines
                .filter(l => l.trim().startsWith('__ORBIT_TEST__:'))
                .map((line, index) => {
                    const parts = line.trim().replace('__ORBIT_TEST__:', '').split(':');
                    return {
                        case: index + 1,
                        name: parts[0] ? parts[0].trim() : "Unknown",
                        result: parts[1] ? parts[1].trim() : "Error"
                    };
                });

            res.json({ 
                success: true, 
                output: filteredOutput,
                tests: testResults,
                dataset_schema: datasetSchema
            });
        });

    } catch (err) {
        console.error('[Run API] Fatal Error:', err.message);
        res.status(500).json({ success: false, error: 'Server error during execution' });
        
        // Final cleanup attempt
        if (fs.existsSync(tempFilePath)) {
            try { fs.unlinkSync(tempFilePath); } catch (e) {}
        }
    }
});

module.exports = router;
