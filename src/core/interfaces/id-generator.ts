import type { ID } from '@/core/types/common';

export interface IdGenerator {
  generate(): ID;
}
