import { anydbSQL } from 'anydb-sql-2';
import { AppSingleton, App } from '@h4bff/core';

export class Database extends AppSingleton {
  db = anydbSQL({
    url: process.env['POSTGRES_URL'],
    connections: { min: 2, max: Number(process.env['DB_MAX_CONNS'] || '20') },
  });

  private migrations: string[] = [];

  addMigration(mig: string) {
    this.migrations.push(mig);
  }

  getMigrationsList() {
    return this.migrations;
  }
}
