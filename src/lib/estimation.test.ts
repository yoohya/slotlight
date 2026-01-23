import { describe, it, expect } from 'vitest';
import { calculateEstimation, calculateLogLikelihoods } from './estimation';
import type { Koyaku } from './types';

// マイジャグラーVのテスト用データ
const myJugglerKoyaku: Koyaku[] = [
  {
    id: 'grape',
    name: 'ぶどう',
    hasSettingDiff: true,
    probBySettings: {
      1: 5.98,
      2: 5.88,
      3: 5.84,
      4: 5.81,
      5: 5.76,
      6: 5.65,
    },
  },
  {
    id: 'big',
    name: 'BIG',
    hasSettingDiff: true,
    isBonus: true,
    probBySettings: {
      1: 273.1,
      2: 269.7,
      3: 265.9,
      4: 259.0,
      5: 252.1,
      6: 240.9,
    },
  },
  {
    id: 'reg',
    name: 'REG',
    hasSettingDiff: true,
    isBonus: true,
    probBySettings: {
      1: 452.0,
      2: 423.4,
      3: 372.4,
      4: 320.3,
      5: 294.9,
      6: 266.4,
    },
  },
  {
    id: 'solo-reg',
    name: '単独REG',
    hasSettingDiff: true,
    parentId: 'reg',
    probBySettings: {
      1: 628.1,
      2: 598.1,
      3: 498.3,
      4: 403.4,
      5: 381.1,
      6: 334.3,
    },
  },
  {
    id: 'cherry-reg',
    name: 'チェリーREG',
    hasSettingDiff: true,
    parentId: 'reg',
    probBySettings: {
      1: 1079.9,
      2: 1071.8,
      3: 1079.9,
      4: 1078.7,
      5: 890.5,
      6: 813.0,
    },
  },
];

describe('calculateEstimation', () => {
  it('総回転数0のとき均等割り', () => {
    const result = calculateEstimation(myJugglerKoyaku, { grape: 100 }, 0);
    expect(result[1]).toBeCloseTo(16.67, 1);
    expect(result[6]).toBeCloseTo(16.67, 1);
  });

  it('カウントが0のとき均等割り', () => {
    const result = calculateEstimation(myJugglerKoyaku, {}, 1000);
    expect(result[1]).toBeCloseTo(16.67, 1);
    expect(result[6]).toBeCloseTo(16.67, 1);
  });

  describe('ぶどうのみのテスト', () => {
    it('ぶどう確率が設定6相当のとき設定6が最有力', () => {
      // 設定6: 1/5.65 → 1000回転で約177回
      const result = calculateEstimation(myJugglerKoyaku, { grape: 177 }, 1000);
      console.log('ぶどう177/1000 (1/5.65相当):', result);
      expect(result[6]).toBeGreaterThan(result[1]);
      expect(result[6]).toBeGreaterThan(result[3]);
    });

    it('ぶどう確率が設定1相当のとき設定1が最有力', () => {
      // 設定1: 1/5.98 → 1000回転で約167回
      const result = calculateEstimation(myJugglerKoyaku, { grape: 167 }, 1000);
      console.log('ぶどう167/1000 (1/5.98相当):', result);
      expect(result[1]).toBeGreaterThan(result[6]);
    });

    it('ぶどう確率が中間のとき中間設定が高い', () => {
      // 設定3-4あたり: 1/5.82 → 1000回転で約172回
      const result = calculateEstimation(myJugglerKoyaku, { grape: 172 }, 1000);
      console.log('ぶどう172/1000 (中間相当):', result);
      // 中間設定が極端に低くないことを確認
      expect(result[3] + result[4]).toBeGreaterThan(20);
    });
  });

  describe('REGのみのテスト', () => {
    it('REG確率が設定6相当のとき設定6が最有力', () => {
      // 設定6: 1/266.4 → 1000回転で約3.75回 ≈ 4回
      const result = calculateEstimation(myJugglerKoyaku, { reg: 4 }, 1000);
      console.log('REG 4/1000 (1/250相当):', result);
      expect(result[6]).toBeGreaterThan(result[1]);
    });

    it('REG確率が設定1相当のとき設定1が最有力', () => {
      // 設定1: 1/452 → 1000回転で約2.2回 ≈ 2回
      const result = calculateEstimation(myJugglerKoyaku, { reg: 2 }, 1000);
      console.log('REG 2/1000 (1/500相当):', result);
      expect(result[1]).toBeGreaterThan(result[6]);
    });
  });

  describe('複合テスト（ぶどう + REG）', () => {
    it('両方とも設定6相当のとき設定6が圧倒的', () => {
      const result = calculateEstimation(
        myJugglerKoyaku,
        { grape: 177, reg: 4 },
        1000
      );
      console.log('ぶどう177 + REG4 /1000:', result);
      expect(result[6]).toBeGreaterThan(result[1]);
      expect(result[6]).toBeGreaterThan(30); // 設定6が30%以上
    });

    it('ぶどう良好 + REG不調でもバランスが取れる', () => {
      // ぶどう設定6相当、REG設定1相当
      const result = calculateEstimation(
        myJugglerKoyaku,
        { grape: 177, reg: 2 },
        1000
      );
      console.log('ぶどう177(良) + REG2(悪) /1000:', result);
      // どちらかに極端に偏らないはず
      expect(result[1]).toBeLessThan(80);
      expect(result[6]).toBeLessThan(80);
    });
  });

  describe('ユーザー報告のシナリオ', () => {
    it('単独REG0 vs 単独REG1 の比較', () => {
      // 単独REG=0のとき
      const result0 = calculateEstimation(
        myJugglerKoyaku,
        {
          grape: 170,
          big: 6,
          reg: 4,
          'solo-reg': 0,
          'cherry-reg': 1,
        },
        1000
      );
      console.log('単独REG=0:', result0);

      // 単独REG=1のとき
      const result1 = calculateEstimation(
        myJugglerKoyaku,
        {
          grape: 170,
          big: 6,
          reg: 4,
          'solo-reg': 1,
          'cherry-reg': 1,
        },
        1000
      );
      console.log('単独REG=1:', result1);

      // 差分
      console.log('差分 (1-0):');
      for (let i = 1; i <= 6; i++) {
        const key = i as 1 | 2 | 3 | 4 | 5 | 6;
        console.log(`  設定${i}: ${(result1[key] - result0[key]).toFixed(2)}`);
      }
    });

    it('総回転1000、ぶどう170、BIG6、REG4、単独REG1、チェリーREG1', () => {
      const result = calculateEstimation(
        myJugglerKoyaku,
        {
          grape: 170,
          big: 6,
          reg: 4, // 親は除外されるはず
          'solo-reg': 1,
          'cherry-reg': 1,
        },
        1000
      );
      console.log('ユーザーシナリオ:', result);

      // デバッグ用：対数尤度の詳細を出力
      const logLikes = calculateLogLikelihoods(
        myJugglerKoyaku,
        {
          grape: 170,
          big: 6,
          reg: 4,
          'solo-reg': 1,
          'cherry-reg': 1,
        },
        1000
      );
      console.log('対数尤度詳細:');
      logLikes.forEach((ll) => {
        console.log(`  設定${ll.setting}: ${ll.logLike.toFixed(4)}`);
        ll.details.forEach((d) => {
          console.log(`    ${d.koyakuId}: ${d.logLike.toFixed(4)}`);
        });
      });

      // 単独REG1回だけで設定1が圧倒的にならないことを確認
      expect(result[1]).toBeLessThan(50);
    });

    it('単独REGを1から2に増やしても急激に変わらない', () => {
      const result1 = calculateEstimation(
        myJugglerKoyaku,
        { grape: 170, big: 6, 'solo-reg': 1, 'cherry-reg': 1 },
        1000
      );
      const result2 = calculateEstimation(
        myJugglerKoyaku,
        { grape: 170, big: 6, 'solo-reg': 2, 'cherry-reg': 1 },
        1000
      );
      console.log('単独REG 1回:', result1);
      console.log('単独REG 2回:', result2);

      // 設定1の変化が極端でないこと（例：30%以上変化しない）
      expect(Math.abs(result1[1] - result2[1])).toBeLessThan(30);
    });
  });

  describe('親子関係のテスト', () => {
    it('単独REGがカウントされているときREG合算は除外される', () => {
      const result = calculateEstimation(
        myJugglerKoyaku,
        { reg: 10, 'solo-reg': 5 },
        1000
      );

      // REG合算が除外されているか確認するため、REGのみの結果と比較
      const resultRegOnly = calculateEstimation(
        myJugglerKoyaku,
        { reg: 10 },
        1000
      );
      const resultSoloOnly = calculateEstimation(
        myJugglerKoyaku,
        { 'solo-reg': 5 },
        1000
      );

      console.log('REG10 + 単独REG5:', result);
      console.log('REGのみ10:', resultRegOnly);
      console.log('単独REGのみ5:', resultSoloOnly);

      // REG10 + 単独5の結果は、単独5のみの結果に近いはず（REGが除外されるため）
      expect(Math.abs(result[6] - resultSoloOnly[6])).toBeLessThan(5);
    });
  });

  describe('大量回転のテスト', () => {
    it('8000回転でもアンダーフローしない', () => {
      const result = calculateEstimation(
        myJugglerKoyaku,
        { grape: 1400, big: 30, reg: 25 },
        8000
      );
      console.log('8000回転:', result);

      // 合計が約100%になること
      const total = result[1] + result[2] + result[3] + result[4] + result[5] + result[6];
      expect(total).toBeCloseTo(100, 0);

      // NaNやInfinityがないこと
      expect(result[1]).not.toBeNaN();
      expect(result[6]).not.toBeNaN();
      expect(result[1]).toBeGreaterThanOrEqual(0);
      expect(result[6]).toBeGreaterThanOrEqual(0);
    });
  });
});
