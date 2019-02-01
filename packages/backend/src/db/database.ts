import { anydbSQL } from 'anydb-sql-2';
import * as migrations from 'anydb-sql-2-migrations';
import * as Promise from 'bluebird';
import { AppSingleton } from '@h4bff/core';

export class Database extends AppSingleton {
  private migrations: migrations.MigrationTask[] = [];

  db = anydbSQL({
    url: process.env['POSTGRES_URL'],
    connections: { min: 2, max: Number(process.env['DB_MAX_CONNS'] || '20') },
  });

  addMigrations(mig: migrations.MigrationTask[]) {
    this.migrations.push(...mig);
  }

  getMigrationsList() {
    return this.migrations;
  }

  runMigrations(): void | Promise<void> {
    const sequence = migrations.create(this.db, this.migrations);
    return sequence.run();
  }

  upMigrations(opts: { silent: boolean }): Promise<void> {
    const sequence = migrations.create(this.db, this.migrations);
    return sequence.migrate(opts);
  }

  downMigrations(): Promise<void> {
    const sequence = migrations.create(this.db, this.migrations);
    return sequence.drop();
  }
}
