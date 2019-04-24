[Home](/) &gt; [@h4bff/backend](../backend.md) &gt; [Database](Database.md)

## Database class

Serves as kind of a database driver. Creates and exposes anydb-sql instance of the database, which provides API for database operations. Additionally, it stores the db migration tasks and provides API for migrations.

<b>Signature:</b>

```typescript
export declare class Database extends AppSingleton 
```

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [db](Database.md#db) | <code>import(&quot;anydb-sql-2&quot;).AnydbSql</code> |  |

### db

<b>Signature:</b>

```typescript
db: import("anydb-sql-2").AnydbSql;
```

## Methods

|  Method | Description |
|  --- | --- |
|  [addMigrations(mig)](Database.md#addmigrations) | Ads new migration task. |
|  [downMigrations()](Database.md#downmigrations) | Runs "DOWN" database migration. |
|  [getMigrationsList()](Database.md#getmigrationslist) | Returns the migration task list. |
|  [runMigrations()](Database.md#runmigrations) | Runs the migrations stored in the migration list. |
|  [upMigrations(opts)](Database.md#upmigrations) | Runs "UP" database migration. |

### addMigrations

Ads new migration task.

<b>Signature:</b>

```typescript
addMigrations(mig: migrations.MigrationTask[]): void;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  mig | <code>migrations.MigrationTask[]</code> |  |

<b>Returns:</b>

`void`

### downMigrations

Runs "DOWN" database migration.

<b>Signature:</b>

```typescript
downMigrations(): Promise<void>;
```
<b>Returns:</b>

`Promise<void>`

### getMigrationsList

Returns the migration task list.

<b>Signature:</b>

```typescript
getMigrationsList(): migrations.MigrationTask[];
```
<b>Returns:</b>

`migrations.MigrationTask[]`

### runMigrations

Runs the migrations stored in the migration list.

<b>Signature:</b>

```typescript
runMigrations(): void | Promise<void>;
```
<b>Returns:</b>

`void | Promise<void>`

### upMigrations

Runs "UP" database migration.

<b>Signature:</b>

```typescript
upMigrations(opts: {
        silent: boolean;
    }): Promise<void>;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  opts | <code>{`<p/>`        silent: boolean;`<p/>`    }</code> |  |

<b>Returns:</b>

`Promise<void>`

