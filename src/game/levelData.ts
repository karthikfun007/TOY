/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LevelData, WorldDefinition } from './types';
import { ALL_WORLDS, getWorldById, getWorldForRound, WORLD_TRAINING, WORLDS_BY_ID } from './worlds';

export const TOYBOX_TROUBLE_LEVEL: WorldDefinition = WORLD_TRAINING;

export {
  ALL_WORLDS,
  getWorldById,
  getWorldForRound,
  WORLDS_BY_ID,
  type LevelData,
  type WorldDefinition,
};
