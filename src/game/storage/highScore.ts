import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@mark0_voxel_jump_high_score_v1';

export async function loadHighScore(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw == null) return 0;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export async function saveHighScore(score: number): Promise<void> {
  try {
    const prev = await loadHighScore();
    if (score > prev) {
      await AsyncStorage.setItem(STORAGE_KEY, String(score));
    }
  } catch {
    /* ignore */
  }
}
