# 開発ガイドライン (Development Guidelines)

## コーディング規約

### 命名規則

#### 変数・関数

**TypeScript**:
```typescript
// ✅ 良い例
const taskTitle = normalizeTitle(rawInput);
function generateBranchName(taskId: number, title: string): string { }

// ❌ 悪い例
const data = normalize(input);
function gen(id: number, t: string): string { }
```

**原則**:
- 変数: camelCase、名詞または名詞句
- 関数: camelCase、動詞で始める(例: `createTask`, `loadStore`, `switchBranch`)
- 定数: UPPER_SNAKE_CASE(例: `MAX_TITLE_LENGTH`, `BACKUP_GENERATIONS`)
- Boolean: `is`, `has`, `should`で始める(例: `isGitRepository`, `hasBranch`)

#### クラス・インターフェース

```typescript
// クラス: PascalCase、名詞 + 役割接尾辞(Manager/Service)
class TaskManager { }
class GitService { }
class FileStorage { }

// インターフェース: PascalCase、接頭辞なし
interface Task { }
interface TaskStore { }

// 型エイリアス: PascalCase
type TaskStatus = 'open' | 'in_progress' | 'completed' | 'archived';
```

`src/types/`, `src/errors/` に配置するエンティティ・エラー名は、[repository-structure.md](./repository-structure.md) の命名規則(PascalCase + `Error`接尾辞)に従う。

### コードフォーマット

**インデント**: 2スペース

**行の長さ**: 最大100文字

**フォーマッタ・Linter**: Prettier + ESLint(TypeScript ESLint)。コミット前に `npm run lint` と `npm run format` を実行する。

**例**:
```typescript
export class TaskManager {
  constructor(
    private readonly storage: FileStorage,
    private readonly git: GitService,
  ) {}

  addTask(title: string): Task {
    const normalized = title.trim();
    if (normalized.length === 0 || normalized.length > 200) {
      throw new ValidationError('タイトルは1〜200文字で入力してください', 'title', title);
    }
    // ...
  }
}
```

### コメント規約

**関数・クラスのドキュメント(TSDoc)**:
```typescript
/**
 * タスクを開始し、Gitブランチを作成・切り替える
 *
 * @param id - 対象タスクのID
 * @returns 更新後のTask(status: in_progress, branch設定済み)
 * @throws {TaskNotFoundError} 指定IDのタスクが存在しない場合
 */
startTask(id: number): Task {
  // 実装
}
```

**インラインコメント**:
```typescript
// ✅ 良い例: なぜそうするかを説明(非自明な理由)
// simple-gitはシェル経由ではなく引数配列で渡すため、タイトルのサニタイズは不要
await this.git.raw(['checkout', '-b', branchName]);

// ❌ 悪い例: 何をしているか(コードを見れば分かる)
// ブランチを作成する
await this.git.raw(['checkout', '-b', branchName]);
```

原則として自明なコードにコメントは書かない。書くのは「なぜ」がコードから読み取れない場合のみ([functional-design.md](./functional-design.md) のエラーハンドリング設計など、非自明な制約に基づく実装は理由を残す)。

### エラーハンドリング

**原則**:
- 予期されるエラー(バリデーション失敗、タスク未検出、Gitリポジトリ不在など)は `src/errors/` に定義したカスタムエラークラスを使用する([functional-design.md](./functional-design.md) のエラー分類表に対応させる)
- 予期しないエラーはキャッチせずそのまま上位に伝播させ、CLIレイヤーの最上位ハンドラでのみキャッチする
- エラーを握りつぶさない(catchして何もしない、は禁止)

**例**:
```typescript
// エラークラス定義(src/errors/ValidationError.ts)
export class ValidationError extends TaskCliError {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// CLIレイヤーでのハンドリング(src/cli/TaskCLI.ts)
try {
  const task = taskManager.addTask(title);
  this.displaySuccess(`タスクを作成しました (ID: ${task.id})`);
} catch (error) {
  if (error instanceof TaskCliError) {
    this.displayError(error); // ユーザー向けメッセージのみ表示
  } else {
    throw error; // 予期しないエラーはスタックトレースごと上位へ
  }
}
```

## Git運用ルール

### ブランチ戦略

**ブランチ種別**:
- `main`: 常にリリース可能な状態を保つ
- `feature/[機能名]`: 新機能開発(例: `feature/task-git-integration`)
- `fix/[修正内容]`: バグ修正(例: `fix/branch-name-slugify`)
- `refactor/[対象]`: リファクタリング

TaskCLI自体が「タスクとブランチの自動連携」を提供するツールであるため、本プロジェクトの開発でもドッグフーディングとして `task start` によるブランチ作成を利用することを推奨する。

**フロー**:
```
main
  ├─ feature/task-crud
  ├─ feature/task-git-integration
  └─ fix/backup-rotation
```

### コミットメッセージ規約

**フォーマット(Conventional Commits)**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント([docs/](.)配下の更新を含む)
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: 依存関係更新、ビルド設定等

**例**:
```
feat(git): task startでのブランチ自動作成を実装

task start実行時にfeature/task-<id>-<slug>ブランチを
作成・切り替えするGitServiceを追加した。

Closes #12
```

### プルリクエストプロセス

**作成前のチェック**:
- [ ] `npm test` が全てパス(ユニット・統合テスト)
- [ ] `npm run lint` がエラーなし
- [ ] `npm run typecheck` がパス
- [ ] コンフリクトが解決されている

**PRテンプレート**:
```markdown
## 概要
[変更内容の簡潔な説明]

## 変更理由
[functional-design.md / architecture.md のどの要件に対応するか]

## 変更内容
- [変更点1]
- [変更点2]

## テスト
- [ ] ユニットテスト追加
- [ ] 手動でCLIを実行して動作確認

## 関連Issue / タスク
Closes #[Issue番号]
```

**レビュープロセス**:
1. セルフレビュー(diffを見直す)
2. 自動テスト・Lint実行
3. レビュアーアサイン
4. フィードバック対応
5. 承認後マージ

## テスト戦略

[architecture.md](./architecture.md) のテスト戦略(Vitest、レイヤーごとのカバレッジ目標80%以上)に基づき、以下のパターンで実装する。

### テストの種類

#### ユニットテスト

**対象**: `TaskManager`, `GitService`, `FileStorage` などの個別クラス・関数

**カバレッジ目標**: サービスレイヤー・データレイヤーで80%以上([architecture.md](./architecture.md) 準拠)

**例**:
```typescript
describe('TaskManager', () => {
  describe('addTask', () => {
    it('正常なタイトルでタスクを作成できる', () => {
      const manager = new TaskManager(mockStorage, mockGit);
      const task = manager.addTask('ユーザー認証機能の実装');

      expect(task.id).toBe(1);
      expect(task.status).toBe('open');
    });

    it('空のタイトルの場合ValidationErrorをスローする', () => {
      const manager = new TaskManager(mockStorage, mockGit);

      expect(() => manager.addTask('')).toThrow(ValidationError);
    });
  });
});
```

#### 統合テスト

**対象**: [functional-design.md](./functional-design.md) のユースケース単位(TaskManager + GitService + FileStorageの連携)

**例**:
```typescript
describe('task start', () => {
  it('Gitリポジトリ内でブランチを作成しステータスをin_progressにする', async () => {
    const { manager, tmpDir } = await setupTempGitRepo();

    const task = manager.addTask('ログイン機能');
    const started = await manager.startTask(task.id);

    expect(started.status).toBe('in_progress');
    expect(started.branch).toBe('feature/task-1-login');
    expect(await currentBranch(tmpDir)).toBe('feature/task-1-login');
  });
});
```

#### E2Eテスト

**対象**: [product-requirements.md](./product-requirements.md) に記載のユーザーストーリー全体

**例**:
```typescript
describe('タスク管理フロー', () => {
  it('add → start → done の一連の流れが完了する', async () => {
    const result1 = await runCli(['add', '新しいタスク']);
    expect(result1.stdout).toContain('タスクを作成しました');

    const result2 = await runCli(['start', '1']);
    expect(result2.stdout).toContain('ブランチ');

    const result3 = await runCli(['done', '1']);
    expect(result3.stdout).toContain('完了');
  });
});
```

### テスト命名規則

**パターン**: `[対象]_[条件]_[期待結果]` または日本語での振る舞い記述(`it('...できる')`)。本プロジェクトは日本語での振る舞い記述を標準とする(PRD・設計書が日本語で書かれているため一貫性を優先)。

**例**:
```typescript
// ✅ 良い例
it('存在しないIDを指定した場合TaskNotFoundErrorをスローする', () => { });
it('Gitリポジトリでない場合ステータスのみ更新する', () => { });

// ❌ 悪い例
it('test1', () => { });
it('works', () => { });
```

### モック・スタブの使用

**原則**:
- 外部依存(ファイルシステム、`git`コマンド実行)はユニットテストでモック化する
- 統合テスト・E2Eテストでは実際の一時ディレクトリ・一時Gitリポジトリを使用する([architecture.md](./architecture.md) の統合テスト方針に準拠)
- ビジネスロジック(TaskManager)は常に実装をそのまま使用する

**例**:
```typescript
const mockStorage: FileStorage = {
  load: vi.fn().mockReturnValue({ nextId: 1, tasks: [] }),
  save: vi.fn(),
  exists: vi.fn().mockReturnValue(true),
  initialize: vi.fn(),
};

const manager = new TaskManager(mockStorage, mockGit);
```

## コードレビュー基準

### レビューポイント

**機能性**:
- [ ] PRD・機能設計書の受け入れ条件を満たしているか
- [ ] Gitリポジトリ外での実行など、エッジケースが考慮されているか
- [ ] エラーハンドリングが[functional-design.md](./functional-design.md) のエラー分類表に沿っているか

**可読性**:
- [ ] 命名が本ガイドラインの規則に沿っているか
- [ ] 非自明な実装にのみコメントが付与されているか

**保守性**:
- [ ] レイヤー間の依存ルール([repository-structure.md](./repository-structure.md))が守られているか(例: CLIレイヤーがFileStorageを直接呼んでいないか)
- [ ] 重複コードがないか

**パフォーマンス**:
- [ ] `task list` で不要な全件走査を繰り返していないか([architecture.md](./architecture.md) のパフォーマンス要件を参照)

**セキュリティ**:
- [ ] Gitコマンドの引数がシェル文字列結合でなく配列渡しになっているか(コマンドインジェクション対策)
- [ ] 機密情報(将来のPersonal Access Token等)がログやエラーメッセージに含まれていないか

### レビューコメントの書き方

**建設的なフィードバック**:
```markdown
## ✅ 良い例
`task list`が毎回tasks.json全体をパースしているので、
1000件規模だと再読み込みコストが気になります。
呼び出し元でキャッシュする方針はどうでしょうか？

## ❌ 悪い例
このやり方は良くないです。
```

**優先度の明示**:
- `[必須]`: 修正必須
- `[推奨]`: 修正推奨
- `[提案]`: 検討してほしい
- `[質問]`: 理解のための質問

## 開発環境セットアップ

### 必要なツール

| ツール | バージョン | インストール方法 |
|--------|-----------|-----------------|
| Node.js | v24.11.0 | devcontainerに同梱済み |
| npm | 11.x | Node.jsに同梱 |
| Git | 任意(2.x以降推奨) | devcontainerに同梱済み |
| GitHub CLI | 任意 | devcontainerに同梱済み(P1のGitHub連携開発時に使用) |

### セットアップ手順

```bash
# 1. リポジトリのクローン
git clone <repository-url>
cd taskcli

# 2. 依存関係のインストール
npm install

# 3. 型チェック・Lintの動作確認
npm run typecheck
npm run lint

# 4. テストの実行
npm test

# 5. 開発用CLIの実行(ビルドなしでtsx経由)
npm run dev -- add "動作確認用タスク"
```

### 推奨開発ツール

- **VS Code拡張機能**: ESLint, Prettier, Vitest
- **Vitest watch mode**: `npm run test:watch` でファイル変更時に自動テスト実行
