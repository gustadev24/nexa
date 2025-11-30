import type { ID } from '@/core/types/id';

export interface IdGeneratorStrategy {
  generate(): ID;
}
