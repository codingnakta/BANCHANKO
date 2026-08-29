import bunnyMascot from '@/assets/mascots/bunny.png'
import catMascot from '@/assets/mascots/cat.png'
import dogMascot from '@/assets/mascots/dog.png'
import type { MascotKey } from './constants'

export const MASCOT_IMAGE: Record<MascotKey, string> = {
  dog: dogMascot,
  bunny: bunnyMascot,
  cat: catMascot,
}

/** 스크린리더용 이름 — 답변자를 구분해 읽어준다 */
export const MASCOT_NAME: Record<MascotKey, string> = {
  dog: '강아지',
  bunny: '토끼',
  cat: '고양이',
}
