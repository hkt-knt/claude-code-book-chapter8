#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { ProfileService } from '../profile/ProfileService.js';
import { TaskCliError } from '../errors/TaskCliError.js';
import { ValidationError } from '../errors/ValidationError.js';

export function createProgram(
  service: ProfileService = ProfileService.createDefault()
): Command {
  const program = new Command();
  program.name('task').description('Gitと一体化したタスク管理CLIツール');

  const profile = program
    .command('profile')
    .description('ローカルユーザープロフィールの管理');

  profile
    .command('show')
    .description('現在のプロフィールを表示する')
    .action(() => {
      try {
        const current = service.getProfile();
        if (!current) {
          console.log(
            'プロフィールが設定されていません。`task profile set --name "<表示名>"` で設定してください。'
          );
          return;
        }
        console.log(`表示名: ${current.name}`);
      } catch (error) {
        handleError(error);
      }
    });

  profile
    .command('set')
    .description('プロフィールの表示名を設定する')
    .option('--name <name>', '設定する表示名(1〜50文字)')
    .action((options: { name?: string }) => {
      try {
        if (options.name === undefined) {
          throw new ValidationError(
            '--name オプションで表示名を指定してください',
            'name',
            undefined
          );
        }
        const updated = service.setName(options.name);
        console.log(chalk.green(`プロフィールを更新しました: ${updated.name}`));
      } catch (error) {
        handleError(error);
      }
    });

  return program;
}

function handleError(error: unknown): void {
  if (error instanceof TaskCliError) {
    console.error(chalk.red(`エラー: ${error.message}`));
    process.exitCode = 1;
    return;
  }
  throw error;
}

const isMainModule =
  process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  createProgram().parse(process.argv);
}
