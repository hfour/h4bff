import { anydbSQL } from 'anydb-sql-2';
import { AppSingleton, App } from 'core';

export class Database extends AppSingleton {
  db = anydbSQL({ url: 'postgres://admin:admin@localhost:5432/draft' });

  private migrations: string[] = [];

  addMigration(mig: string) {
    this.migrations.push(mig);
  }

  getMigrationsList() {
    return this.migrations;
  }

  constructor(app: App) {
    super(app);
  }
}
