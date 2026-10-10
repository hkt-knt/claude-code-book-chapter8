# リポジトリ構造定義書 (Repository Structure Document)

## プロジェクト構造

```
taskcli/
├── src/                      # ソースコード
│   ├── cli/                  # CLIレイヤー(Commander.js、エントリポイントを兼ねるindex.ts)
│   ├── services/             # サービスレイヤー(TaskManager、未実装)
│   ├── git/                  # Git連携レイヤー(GitService、未実装)
│   ├── storage/              # データレイヤー(FileStorage、未実装)
│   ├── profile/              # ユーザープロフィール機能(ProfileService/ProfileStore、実装済み)
│   ├── types/                # 型定義(Task, TaskStatus, Profile等)
│   └── errors/                # カスタムエラークラス
├── tests/                    # テストコード
│   ├── unit/                 # ユニットテスト
│   ├── integration/          # 統合テスト
│   └── e2e/                  # E2Eテスト
├── docs/                     # プロジェクトドキュメント
├── .steering/                # 作業単位のステアリングファイル
└── .claude/                  # Claude Code設定
```

## ディレクトリ詳細

### src/ (ソースコードディレクトリ)

#### cli/

**役割**: コマンドライン引数の受付、バリデーション、結果・エラーのターミナルへの表示(機能設計書のCLIレイヤーに対応)

**配置ファイル**:
- `index.ts`: Commander.jsのコマンド登録とハンドラ、および`bin`エントリポイントを兼ねる(初回実装であるユーザープロフィール編集機能では`profile show`/`profile set`を登録)
- `formatters/TaskTableFormatter.ts`: `task list`の表形式出力・カラーコーディング(TaskManager実装時に追加予定)

**命名規則**:
- クラスファイルはPascalCase、CLIエントリポイントは慣例に従い`index.ts`とする

**依存関係**:
- 依存可能: `services/`, `profile/`, `types/`, `errors/`
- 依存禁止: `storage/`, `git/`(サービスレイヤーを経由せず直接データ層・Git層を呼び出さない)。`profile/`についても同様に、CLIレイヤーは`ProfileService`のみに依存し`ProfileStore`を直接importしない(`ProfileService.createDefault()`ファクトリメソッド経由でインスタンス化する)

**例**:
```
cli/
├── index.ts
└── formatters/
    └── TaskTableFormatter.ts
```

#### profile/

**役割**: ローカルユーザープロフィール(表示名)の管理。TaskManager/FileStorageの実装に先行して追加された最初の機能モジュール

**配置ファイル**:
- `ProfileService.ts`: バリデーション・更新ロジック(サービスレイヤー)、`createDefault()`ファクトリメソッドを持つ
- `ProfileStore.ts`: `.task/config.json`の読み書き(データレイヤー)

**命名規則**:
- クラスファイルはPascalCase

**依存関係**:
- 依存可能: `types/`, `errors/`
- 依存禁止: `cli/`, `services/`, `git/`, `storage/`

**備考**: `services/`/`storage/`という汎用レイヤー分割ではなく機能単位のサブディレクトリとした理由は、実装時点でTaskManager/FileStorageが未実装だったため([.steering/20260719-user-profile-edit/design.md](../.steering/20260719-user-profile-edit/design.md)を参照)。TaskManager実装時に`services/profile/`, `storage/profile/`へ配置し直すことを想定する。

#### services/

**役割**: タスクのCRUD・ステータス遷移などのビジネスロジック(機能設計書のサービスレイヤーに対応)

**配置ファイル**:
- `TaskManager.ts`: addTask/listTasks/startTask/completeTask/changeStatus/deleteTaskを実装

**命名規則**:
- クラスファイルはPascalCase + `Manager`または`Service`接尾辞

**依存関係**:
- 依存可能: `git/`, `storage/`, `types/`, `errors/`
- 依存禁止: `cli/`(サービスレイヤーがCLIレイヤーに依存してはならない)

**例**:
```
services/
└── TaskManager.ts
```

#### git/

**役割**: Gitリポジトリ判定、ブランチ作成・切り替え、ブランチ名生成(機能設計書のGit連携レイヤーに対応)

**配置ファイル**:
- `GitService.ts`: simple-gitをラップし、ブランチ操作を提供
- `slugify.ts`: タイトルからブランチ名用スラッグを生成する関数

**命名規則**:
- クラスファイルはPascalCase、関数ファイルはcamelCase

**依存関係**:
- 依存可能: `types/`, `errors/`
- 依存禁止: `cli/`, `services/`, `storage/`(Git連携レイヤーはタスクデータを直接扱わない)

**例**:
```
git/
├── GitService.ts
└── slugify.ts
```

#### storage/

**役割**: `.task/tasks.json`の読み込み・書き込み・バックアップ(機能設計書のデータレイヤーに対応)

**配置ファイル**:
- `FileStorage.ts`: load/save/exists/initializeを実装
- `BackupRotator.ts`: 直近5世代のバックアップローテーション

**命名規則**:
- クラスファイルはPascalCase

**依存関係**:
- 依存可能: `types/`, `errors/`
- 依存禁止: `cli/`, `services/`, `git/`(データレイヤーはビジネスロジックを持たない)

**例**:
```
storage/
├── FileStorage.ts
└── BackupRotator.ts
```

#### types/

**役割**: `Task`, `TaskStatus`, `TaskStore`など、レイヤー間で共有する型定義

**配置ファイル**:
- `Task.ts`: Task, TaskStatus, StatusChangeインターフェース
- `TaskStore.ts`: TaskStoreインターフェース

**命名規則**:
- 型定義ファイルはPascalCase(対象エンティティ名と一致させる)

**依存関係**:
- 依存可能: なし(最下層。他レイヤーから参照されるのみ)
- 依存禁止: `cli/`, `services/`, `git/`, `storage/`

#### errors/

**役割**: `TaskNotFoundError`, `ValidationError`など、レイヤー間で共有するカスタムエラークラス

**配置ファイル**:
- `TaskCliError.ts`: 基底エラークラス
- `TaskNotFoundError.ts`, `ValidationError.ts`, `NotGitRepositoryError.ts`: 個別エラークラス

**命名規則**:
- クラスファイルはPascalCase + `Error`接尾辞

**依存関係**:
- 依存可能: なし
- 依存禁止: `cli/`, `services/`, `git/`, `storage/`

### tests/ (テストディレクトリ)

#### unit/

**役割**: ユニットテストの配置

**構造**:
```
tests/unit/
└── src/                    # srcディレクトリと同じ構造
    ├── services/
    │   └── TaskManager.test.ts
    ├── git/
    │   └── slugify.test.ts
    └── storage/
        └── FileStorage.test.ts
```

**命名規則**:
- パターン: `[テスト対象ファイル名].test.ts`
- 例: `TaskManager.ts` → `TaskManager.test.ts`

#### integration/

**役割**: 統合テストの配置

**構造**:
```
tests/integration/
├── task-crud/
│   └── add-and-list.test.ts
└── task-git/
    ├── start-creates-branch.test.ts
    └── start-without-git-repo.test.ts
```

#### e2e/

**役割**: E2Eテストの配置

**構造**:
```
tests/e2e/
├── basic-workflow/
│   └── add-start-done.test.ts
└── performance/
    └── list-1000-tasks.test.ts
```

### docs/ (ドキュメントディレクトリ)

**配置ドキュメント**:
- `product-requirements.md`: プロダクト要求定義書
- `functional-design.md`: 機能設計書
- `architecture.md`: アーキテクチャ設計書
- `repository-structure.md`: リポジトリ構造定義書(本ドキュメント)
- `development-guidelines.md`: 開発ガイドライン
- `glossary.md`: 用語集
- `ideas/`: 壁打ち・ブレインストーミングの成果物

## ファイル配置規則

### ソースファイル

| ファイル種別 | 配置先 | 命名規則 | 例 |
|------------|--------|---------|-----|
| CLIコマンド | `src/cli/` | PascalCase + `CLI` | `TaskCLI.ts` |
| サービスクラス | `src/services/` | PascalCase + `Manager`/`Service` | `TaskManager.ts` |
| Git連携クラス | `src/git/` | PascalCase + `Service` | `GitService.ts` |
| ストレージクラス | `src/storage/` | PascalCase | `FileStorage.ts` |
| 型定義 | `src/types/` | PascalCase(対象エンティティ名) | `Task.ts` |
| エラークラス | `src/errors/` | PascalCase + `Error` | `TaskNotFoundError.ts` |
| 純粋関数 | 各レイヤーディレクトリ直下 | camelCase | `slugify.ts` |

### テストファイル

| テスト種別 | 配置先 | 命名規則 | 例 |
|-----------|--------|---------|-----|
| ユニットテスト | `tests/unit/src/<layer>/` | `[対象].test.ts` | `TaskManager.test.ts` |
| 統合テスト | `tests/integration/<feature>/` | `[シナリオ].test.ts` | `start-creates-branch.test.ts` |
| E2Eテスト | `tests/e2e/<scenario>/` | `[フロー].test.ts` | `add-start-done.test.ts` |

## 命名規則

### ディレクトリ名

- **レイヤーディレクトリ**: 複数形、kebab-case
  - 例: `services/`, `errors/`, `types/`
- **機能・シナリオディレクトリ(テスト配下)**: 単数形、kebab-case
  - 例: `task-crud/`, `basic-workflow/`

### ファイル名

- **クラスファイル**: PascalCase
  - 例: `TaskManager.ts`, `FileStorage.ts`
- **関数ファイル**: camelCase
  - 例: `slugify.ts`
- **型定義ファイル**: PascalCase(対象エンティティ名)
  - 例: `Task.ts`, `TaskStore.ts`

### テストファイル名

- パターン: `[テスト対象].test.ts`
- 例: `TaskManager.test.ts`, `slugify.test.ts`

## 依存関係のルール

### レイヤー間の依存

```
CLIレイヤー(cli/)
    ↓ (OK)
サービスレイヤー(services/)
    ↓ (OK)              ↓ (OK)
Git連携レイヤー(git/)   データレイヤー(storage/)
    ↓ (OK)              ↓ (OK)
型定義(types/) / エラー(errors/)
```

**禁止される依存**:
- データレイヤー → サービスレイヤー (❌)
- データレイヤー → CLIレイヤー (❌)
- Git連携レイヤー → サービスレイヤー (❌)
- サービスレイヤー → CLIレイヤー (❌)
- CLIレイヤー → データレイヤー / Git連携レイヤーへの直接依存 (❌、必ずservices/を経由する)

### モジュール間の依存

**循環依存の禁止**:
`services/TaskManager.ts` が `git/GitService.ts` と `storage/FileStorage.ts` の両方に依存するが、`git/`と`storage/`が互いに依存することは禁止する。共通で必要な型は`types/`に抽出する。

## スケーリング戦略

### 機能の追加

1. **小規模機能**: 既存ディレクトリに配置(例: 新しいCLIサブコマンドは`cli/TaskCLI.ts`に追加)
2. **中規模機能**: レイヤー内にサブディレクトリを作成(例: P1のGitHub連携は`services/github/`として追加)
3. **大規模機能**: 独立したモジュールとして分離(例: P2のチーム機能・カレンダー機能は`src/modules/team/`のような独立モジュールを検討)

**例(P1のGitHub連携追加時)**:
```
src/
├── services/
│   ├── TaskManager.ts
│   └── github/
│       ├── GitHubService.ts       # GitHub REST API連携
│       └── IssueSyncService.ts    # Issue↔タスク同期ロジック
```

### ファイルサイズの管理

**ファイル分割の目安**:
- 1ファイル: 300行以下を推奨
- 300-500行: リファクタリングを検討
- 500行以上: 分割を強く推奨

`TaskManager.ts`がCRUD・ステータス遷移・Git連携オーケストレーションを担うため、500行を超えた場合は`TaskStatusService.ts`(ステータス遷移専用)への分割を検討する。

## 特殊ディレクトリ

### .steering/ (ステアリングファイル)

**役割**: 特定の開発作業における「今回何をするか」を定義

**構造**:
```
.steering/
└── [YYYYMMDD]-[task-name]/
    ├── requirements.md      # 今回の作業の要求内容
    ├── design.md            # 変更内容の設計
    └── tasklist.md          # タスクリスト
```

**命名規則**: `20260719-add-user-profile` 形式

### .claude/ (Claude Code設定)

**役割**: Claude Code設定とカスタマイズ

**構造**:
```
.claude/
├── commands/                # スラッシュコマンド
├── skills/                  # タスクモード別スキル
└── agents/                  # サブエージェント定義
```

## 除外設定

### .gitignore

プロジェクトで除外すべきファイル:
- `node_modules/`
- `dist/`
- `.env`
- `*.log`
- `.DS_Store`
- `.task/backups/`(バックアップファイルはリポジトリで共有する必要がないためGit管理対象外とする。`.task/tasks.json`本体はチーム共有のため管理対象とする)

### .prettierignore, .eslintignore

ツールで除外すべきファイル:
- `dist/`
- `node_modules/`
- `coverage/`
