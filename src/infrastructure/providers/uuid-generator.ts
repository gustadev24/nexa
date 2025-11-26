import type { IdGenerator } from '@/core/interfaces/id-generator';
import type { ID } from '@/core/types/common';

export class UuidGenerator implements IdGenerator {
  generate(): ID {
    return crypto.randomUUID();
  }
}
