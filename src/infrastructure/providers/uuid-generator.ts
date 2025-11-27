import type { IdGenerator } from '@/core/interfaces/id-generator';
import type { ID } from '@/core/types/id';

export class UuidGenerator implements IdGenerator {
  generate(): ID {
    return crypto.randomUUID();
  }
}
