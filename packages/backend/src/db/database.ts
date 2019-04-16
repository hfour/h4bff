import { anydbSQL, createMigration, MigrationTask } from 'anydb-sql-3';
import * as Promise from 'bluebird';
import { AppSingleton } from '@h4bff/core';

/**
 * Serves as kind of a database driver.
 * Creates and exposes anydb-sql instance of the database, which provides API for database operations.
 * Additionally, it stores the db migration tasks and provides API for migrations.
 */
export class Database extends AppSingleton {
  private migrations: MigrationTask[] = [];

  db = anydbSQL({
    url: process.env['POSTGRES_URL'],
    connections: { min: 2, max: Number(process.env['DB_MAX_CONNS'] || '20') },
  });

  /**
   * Ads new migration task.
   */
  addMigrations(mig: MigrationTask[]) {
    this.migrations.push(...mig);
  }

  /**
   * Returns the migration task list.
   */
  getMigrationsList() {
    return this.migrations;
  }

  /**
   * Runs the migrations stored in the migration list.
   */
  runMigrations(): void | Promise<void> {
    const sequence = createMigration(this.db, this.migrations);
    // TODO: Remove cast to any
    return sequence.run() as any;
  }

  /**
   * Runs "UP" database migration.
   */
  upMigrations(_opts: { silent: boolean }): Promise<void> {
    const sequence = createMigration(this.db, this.migrations);
    // TODO: Remove cast to any
    return sequence.migrate() as any;
  }

  /**
   * Runs "DOWN" database migration.
   */
  downMigrations(): Promise<void> {
    const sequence = createMigration(this.db, this.migrations);
    // TODO: Remove cast to any
    return sequence.drop() as any;
  }
}
