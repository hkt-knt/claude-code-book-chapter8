import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ProfileService } from '../../../../src/profile/ProfileService';
import { ProfileStore } from '../../../../src/profile/ProfileStore';
import { ValidationError } from '../../../../src/errors/ValidationError';

describe('ProfileService', () => {
  let tempDir: string;
  let service: ProfileService;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'profile-service-test-'));
    service = new ProfileService(new ProfileStore(tempDir));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('getProfile', () => {
    it('プロフィール未設定の場合はnullを返す', () => {
      // Given: 準備(何もしない)

      // When: 実行
      const result = service.getProfile();

      // Then: 検証
      expect(result).toBeNull();
    });
  });

  describe('setName', () => {
    it('1〜50文字の表示名で更新できる', () => {
      // Given: 準備
      const name = 'Alice';

      // When: 実行
      const result = service.setName(name);

      // Then: 検証
      expect(result.name).toBe('Alice');
      expect(service.getProfile()?.name).toBe('Alice');
    });

    it('前後の空白をトリムして保存する', () => {
      // Given: 準備
      const name = '  Bob  ';

      // When: 実行
      const result = service.setName(name);

      // Then: 検証
      expect(result.name).toBe('Bob');
    });

    it('空文字の場合ValidationErrorをスローする', () => {
      // Given: 準備
      const name = '   ';

      // When/Then: 実行と検証
      expect(() => service.setName(name)).toThrow(ValidationError);
    });

    it('51文字以上の場合ValidationErrorをスローする', () => {
      // Given: 準備
      const name = 'a'.repeat(51);

      // When/Then: 実行と検証
      expect(() => service.setName(name)).toThrow(ValidationError);
    });

    it('既存のプロフィールを再設定すると上書きされる', () => {
      // Given: 準備
      service.setName('Alice');

      // When: 実行
      service.setName('Alice Updated');

      // Then: 検証
      expect(service.getProfile()?.name).toBe('Alice Updated');
    });
  });
});
