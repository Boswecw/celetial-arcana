import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { spawn } from 'child_process';
import { join } from 'path';

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
    // Get the project root directory from environment or use a hardcoded path
    const projectRoot = process.env.PROJECT_ROOT || '/home/charles/projects/Coding2025/celestia-arcana';
    const scriptPath = join(projectRoot, 'astro_tarot_reader.py');

    console.log('[astro-tarot] Project root:', projectRoot);
    console.log('[astro-tarot] Script path:', scriptPath);

    // Build command-line arguments with postprocessing enabled
    const args = [
      '--question', payload.question,
      '--timeframe', payload.timeframe,
      '--model', payload.model || 'gpt-4o-mini',
      '--temperature', String(payload.temperature || 0.2),
      '--num-predict', String(payload.num_predict || 1500),
      '--postprocess', // Enable postprocessing with faith-aware validator
    ];

    // Spawn Python process with environment variables
    const pythonProcess = spawn('python3', [scriptPath, ...args], {
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
