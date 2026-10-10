import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createProgram } from '../../../../src/cli/index';
import { ProfileService } from '../../../../src/profile/ProfileService';
import { ProfileStore } from '../../../../src/profile/ProfileStore';

describe('CLI profile commands', () => {
  let tempDir: string;
  let service: ProfileService;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'cli-test-'));
    service = new ProfileService(new ProfileStore(tempDir));
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    process.exitCode = undefined;
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    logSpy.mockRestore();
    errorSpy.mockRestore();
    process.exitCode = undefined;
  });

  it('profile showは未設定時に案内メッセージを表示する', async () => {
    // Given: 準備
    const program = createProgram(service);

    // When: 実行
    await program.parseAsync(['node', 'task', 'profile', 'show']);

    // Then: 検証
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('プロフィールが設定されていません')
    );
  });

  it('profile set --nameで表示名を設定し、profile showで確認できる', async () => {
    // Given: 準備
    const setProgram = createProgram(service);
    const showProgram = createProgram(service);

    // When: 実行
    await setProgram.parseAsync([
      'node',
      'task',
      'profile',
      'set',
      '--name',
      'Alice',
    ]);
    await showProgram.parseAsync(['node', 'task', 'profile', 'show']);

    // Then: 検証
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Alice'));
  });

  it('不正な表示名を設定するとエラーメッセージを表示しexitCodeが1になる', async () => {
    // Given: 準備
    const program = createProgram(service);

    // When: 実行
    await program.parseAsync(['node', 'task', 'profile', 'set', '--name', '']);

    // Then: 検証
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('エラー'));
    expect(process.exitCode).toBe(1);
  });

  it('--nameオプションを省略した場合も自前のエラーメッセージを表示しexitCodeが1になる', async () => {
    // Given: 準備
    const program = createProgram(service);

    // When: 実行
    await program.parseAsync(['node', 'task', 'profile', 'set']);

    // Then: 検証
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('--name オプションで表示名を指定してください')
    );
    expect(process.exitCode).toBe(1);
  });
});
