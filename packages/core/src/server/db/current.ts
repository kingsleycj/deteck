import { sql } from 'drizzle-orm';
import { custodyEvent } from './schema.ts';

/**
 * Supply chain records not cancelled or replaced by a later correction.
 *
 * The outer table is named in full on purpose: in a query on one table Drizzle writes bare column
 * names, so `${custodyEvent.id}` inside this subquery would become "id" and mean c2.id.
 */
export const notSuperseded = sql`not exists (select 1 from ${custodyEvent} c2 where c2.supersedes_id = ${custodyEvent}.id)`;
