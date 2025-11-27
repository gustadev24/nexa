import type { Color } from '@/core/types/color';
import type { ID } from '@/core/types/id';

export interface PlayerConfig {
  id: ID;
  username: string;
  color: Color;
}
