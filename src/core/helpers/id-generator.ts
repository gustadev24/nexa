import type { ID } from '@/core/types/id';

export interface IdGenerator {
  generate(): ID;
}
