import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ProfileStore } from '../../../../src/profile/ProfileStore';

describe('ProfileStore', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'profile-store-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('load', () => {
    it('config.jsonが存在しない場合はprofile: nullを返す', () => {
      // Given: 準備
      const store = new ProfileStore(tempDir);

      // When: 実行
      const result = store.load();

      // Then: 検証
      expect(result).toEqual({ profile: null });
    });
  });

  describe('save', () => {
    it('保存した内容をloadで読み込むと一致する', () => {
      // Given: 準備
      const store = new ProfileStore(tempDir);
      const config = {
        profile: { name: 'Alice', updatedAt: '2026-07-19T00:00:00.000Z' },
      };

      // When: 実行
      store.save(config);
      const result = store.load();

      // Then: 検証
      expect(result).toEqual(config);
    });

    it('.taskディレクトリが存在しない状態から自動作成される', () => {
      // Given: 準備
      const store = new ProfileStore(tempDir);
      const config = {
        profile: { name: 'Bob', updatedAt: '2026-07-19T00:00:00.000Z' },
      };

      // When: 実行
      store.save(config);

      // Then: 検証
      expect(existsSync(join(tempDir, '.task'))).toBe(true);
      expect(existsSync(join(tempDir, '.task', 'config.json'))).toBe(true);
    });

    it('config.jsonが所有者のみ読み書き可能なパーミッションで作成される', () => {
      // Given: 準備
      const store = new ProfileStore(tempDir);
      const config = {
        profile: { name: 'Carol', updatedAt: '2026-07-19T00:00:00.000Z' },
      };

      // When: 実行
      store.save(config);

      // Then: 検証
      const mode = statSync(join(tempDir, '.task', 'config.json')).mode & 0o777;
      expect(mode).toBe(0o600);
    });
  });
});
