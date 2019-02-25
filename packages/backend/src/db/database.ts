import { create } from 'anydb-sql-2';
import * as migrations from 'anydb-sql-2-migrations';
import * as Promise from 'bluebird';
import { AppSingleton } from '@h4bff/core';

/**
 * Serves as kind of a database driver.
 * Creates and exposes anydb-sql instance of the database, which provides API for database operations.
 * Additionally, it stores the db migration tasks and provides API for migrations.
 */
export class Database extends AppSingleton {
  private migrations: migrations.MigrationTask[] = [];

  db = create({
    url: process.env['POSTGRES_URL'],
    connections: { min: 2, max: Number(process.env['DB_MAX_CONNS'] || '20') },
  });

  /**
   * Ads new migration task.
   */
  addMigrations(mig: migrations.MigrationTask[]) {
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
    const sequence = migrations.create(this.db, this.migrations);
    return sequence.run();
  }

  /**
   * Runs "UP" database migration.
   */
  upMigrations(opts: { silent: boolean }): Promise<void> {
    const sequence = migrations.create(this.db, this.migrations);
    return sequence.migrate(opts);
  }

  /**
   * Runs "DOWN" database migration.
   */
  downMigrations(): Promise<void> {
    const sequence = migrations.create(this.db, this.migrations);
    return sequence.drop();
  }
}
