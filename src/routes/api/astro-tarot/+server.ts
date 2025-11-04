import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { spawn } from 'child_process';
import { join } from 'path';
import { execSync } from 'child_process';

// Detect if running in serverless environment
function isServerlessEnvironment(): boolean {
  const env = process.env;
  return !!(
    env.AWS_LAMBDA_FUNCTION_NAME ||
    env.NETLIFY ||
    env.VERCEL ||
    env.AWS_EXECUTION_ENV ||
    env.LAMBDA_TASK_ROOT ||
    (env.PATH && env.PATH.includes('/var/lang/bin'))
  );
}

// Detect Python executable
function findPythonExecutable(): string {
  // Check if in serverless environment
  if (isServerlessEnvironment()) {
    const serverlessMsg =
      'Python astrological synthesis is not available in serverless environments (Netlify/Vercel Functions). ' +
      'This feature requires a server with Python runtime. ' +
      'Please deploy to a platform that supports Python (e.g., a VPS, Railway, Render) or disable astrological synthesis.';
    console.warn('[Python Detection] Serverless environment detected:', {
      AWS_LAMBDA: !!process.env.AWS_LAMBDA_FUNCTION_NAME,
      NETLIFY: !!process.env.NETLIFY,
      VERCEL: !!process.env.VERCEL,
      PATH: process.env.PATH
    });
    throw new Error(serverlessMsg);
  }

  // Check if user specified a Python path via environment variable
  const envPython = process.env.PYTHON_PATH || process.env.PYTHON_EXECUTABLE;
  if (envPython) {
    try {
      execSync(`${envPython} --version`, { stdio: 'pipe', timeout: 5000 });
      console.log(`[Python Detection] ✓ Using env var: ${envPython}`);
      return envPython;
    } catch {
      console.log(`[Python Detection] ⚠ Env var Python path invalid: ${envPython}`);
    }
  }

  const candidates = [
    'python3',
    'python',
    '/usr/bin/python3',
    '/usr/local/bin/python3',
    '/bin/python3',
    '/opt/homebrew/bin/python3',
    'C:\\Python312\\python.exe',
    'C:\\Python311\\python.exe',
    'C:\\Python310\\python.exe'
  ];

  console.log('[Python Detection] Starting search...');
  console.log('[Python Detection] PATH:', process.env.PATH);

  for (const cmd of candidates) {
    try {
      const result = execSync(`${cmd} --version`, {
        stdio: 'pipe',
        timeout: 5000,
        env: process.env
      });
      const version = result.toString().trim();
      console.log(`[Python Detection] ✓ Found: ${cmd} (${version})`);
      return cmd;
    } catch (err) {
      console.log(`[Python Detection] ✗ Not found: ${cmd}`);
    }
  }

  // Try using 'which' or 'where' to find Python
  try {
    const whichCmd = process.platform === 'win32' ? 'where' : 'which';
    const result = execSync(`${whichCmd} python3`, {
      stdio: 'pipe',
      timeout: 5000
    });
    const pythonPath = result.toString().trim().split('\n')[0];
    if (pythonPath) {
      console.log(`[Python Detection] ✓ Found via ${whichCmd}: ${pythonPath}`);
      return pythonPath;
    }
  } catch {
    console.log('[Python Detection] which/where command failed');
  }

  const errorMsg = 'Python not found. Please install Python 3.6+ and ensure it is in your PATH.\n' +
    'Tried: ' + candidates.join(', ') + '\n' +
    'Current PATH: ' + (process.env.PATH || 'not set');

  console.error('[Python Detection]', errorMsg);
  throw new Error(errorMsg);
}

interface AstroTarotRequest {
  question: string;
  timeframe: string;
  astro: {
    sun: string;
    moon: string;
    asc: string;
    dominant_elements?: string[];
    notable_aspects?: Array<{ aspect: string; orb: string; interpretation: string }>;
    lunar_phase?: string;
  };
  spread: Array<{
    position: string;
    card: string;
    orientation?: string;
    element?: string;
  }>;
  model?: string;
  temperature?: number;
  num_predict?: number;
}

interface PythonOutput {
  meta: {
    question: string;
    timeframe: string;
    spread_name: string;
    timestamp: string;
  };
  astro_summary: {
    core: {
      sun: string;
      moon: string;
      asc: string;
      dominant_elements: string[];
      notable_aspects: Array<{ aspect: string; orb: string; interpretation: string }>;
      lunar_phase: string;
    };
    themes: string[];
  };
  spread_summary: {
    layout: string[];
    card_elements_count: { Fire: number; Earth: number; Air: number; Water: number };
    majors_count: number;
  };
  resonance: {
    matches: Array<{ type: string; detail: string; why: string }>;
    tensions: Array<{ type: string; detail: string; why: string }>;
    element_balance: { astro: string; tarot: string; comment: string };
  };
  interpretation: {
    theme: string;
    positions: Array<{ card: string; position: string; element: string; insight: string }>;
    timing: string[];
    action_items: string[];
    affirmations: string[];
  };
  confidence: { overall: number; notes: string };
}

function executePythonScript(payload: AstroTarotRequest): Promise<PythonOutput> {
  return new Promise((resolvePromise, reject) => {
    // Find Python executable
    let pythonCmd: string;
    try {
      pythonCmd = findPythonExecutable();
    } catch (err) {
      reject(err);
      return;
    }

    // Use current working directory as project root
    const projectRoot = process.cwd();
    const scriptPath = join(projectRoot, 'astro_tarot_reader.py');

    console.log('[astro-tarot] Python executable:', pythonCmd);
    console.log('[astro-tarot] Project root:', projectRoot);
    console.log('[astro-tarot] Script path:', scriptPath);

    // Build command-line arguments with postprocessing enabled
    const args = [
      scriptPath,
      '--question', payload.question,
      '--timeframe', payload.timeframe,
      '--model', payload.model || 'gpt-4o-mini',
      '--temperature', String(payload.temperature || 0.2),
      '--num-predict', String(payload.num_predict || 1500),
      '--postprocess', // Enable postprocessing with faith-aware validator
    ];

    // Spawn Python process with environment variables
    const pythonProcess = spawn(pythonCmd, args, {
      cwd: projectRoot,
      timeout: 3600000, // 1 hour timeout
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      },
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr?.on('data', (data) => {
      stderr += data.toString();
      console.error('[Python stderr]', data.toString());
    });

    pythonProcess.on('error', (err) => {
      reject(new Error(`Failed to spawn Python process: ${err.message}`));
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        // Extract JSON from stdout (script may have debug output)
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON output found from Python script');
        }

        const result = JSON.parse(jsonMatch[0]) as PythonOutput;
        resolvePromise(result);
      } catch (parseErr) {
        reject(new Error(`Failed to parse Python output: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`));
      }
    });
  });
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const payload = (await request.json()) as AstroTarotRequest;

    // Validate required fields
    if (!payload.question || !payload.timeframe || !payload.astro || !payload.spread) {
      return error(400, 'Missing required fields: question, timeframe, astro, spread');
    }

    if (payload.spread.length === 0) {
      return error(400, 'Spread must contain at least one card');
    }

    // Execute Python script
    const result = await executePythonScript(payload);

    return json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[astro-tarot API error]', message);
    return error(500, `Astro-Tarot synthesis failed: ${message}`);
  }
};
