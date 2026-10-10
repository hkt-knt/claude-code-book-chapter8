import {
  mkdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
  renameSync,
} from 'node:fs';
import { join } from 'node:path';
import type { ProfileConfig } from '../types/Profile.js';

const TASK_DIR = '.task';
const CONFIG_FILE = 'config.json';

export class ProfileStore {
  constructor(private readonly baseDir: string = process.cwd()) {}

  private get taskDir(): string {
    return join(this.baseDir, TASK_DIR);
  }

  private get configPath(): string {
    return join(this.taskDir, CONFIG_FILE);
  }

  load(): ProfileConfig {
    if (!existsSync(this.configPath)) {
      return { profile: null };
    }
    const raw = readFileSync(this.configPath, 'utf-8');
    return JSON.parse(raw) as ProfileConfig;
  }

  save(config: ProfileConfig): void {
    if (!existsSync(this.taskDir)) {
      mkdirSync(this.taskDir, { recursive: true });
    }

    const tmpPath = `${this.configPath}.tmp`;
    writeFileSync(tmpPath, JSON.stringify(config, null, 2), {
      encoding: 'utf-8',
      mode: 0o600,
    });
    renameSync(tmpPath, this.configPath);
  }
}
