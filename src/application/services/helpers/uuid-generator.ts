import type { IdGenerator } from '@/core/helpers/id-generator';
import type { ID } from '@/core/types/id';

export class UuidGenerator implements IdGenerator {
  generate(): ID {
    return crypto.randomUUID();
  }
}
