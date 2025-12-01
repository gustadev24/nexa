import type { IdGeneratorStrategy } from '@/application/strategies/id-generator/id-generator-strategy';
import type { ID } from '@/core/types/id';

export class UuidGenerator implements IdGeneratorStrategy {
  generate(): ID {
    return crypto.randomUUID();
  }
}
