import {Graphics} from 'pixi.js';
import {CELL} from '../config';

const HEAD_COLOR = 0x7ee787;
const SEGMENT_COLOR = 0x2ea043;
const FOOD_COLOR = 0xff7b72;

export function drawHead(): Graphics {
  return new Graphics().roundRect(1, 1, CELL - 2, CELL - 2, 5).fill(HEAD_COLOR);
}

export function drawSegment(): Graphics {
  return new Graphics().roundRect(2, 2, CELL - 4, CELL - 4, 4).fill(SEGMENT_COLOR);
}

export function drawFood(): Graphics {
  return new Graphics().circle(CELL / 2, CELL / 2, CELL / 2 - 3).fill(FOOD_COLOR);
}
