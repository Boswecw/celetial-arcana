import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const envPath = path.join(projectRoot, '.env');

export function loadDotEnv(): void {
	if (!fs.existsSync(envPath)) {
		return;
	}

	const content = fs.readFileSync(envPath, 'utf-8');
	for (const rawLine of content.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#') || !line.includes('=')) {
			continue;
		}

		const [key, ...valueParts] = line.split('=');
		const name = key.trim();
		let value = valueParts.join('=').trim();

		if (!name) {
			continue;
		}

		if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
			value = value.slice(1, -1);
		}

		if (!Object.prototype.hasOwnProperty.call(process.env, name)) {
			process.env[name] = value;
		}
	}
}
