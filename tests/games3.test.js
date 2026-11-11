/* 会社がらみの3本を、虚無で単調な作業の3本に差し替え（菓子パンの向きそろえ・謎の歯車・穴を掘って埋める）。
   二度寝からも上司を外す。ゲームまわりの文言に会社・上司の言葉が出てこないこと */
const fs = require('fs');
const path = require('path');
const { openPage, readJSON, ROOT } = require('./helpers/page');

const apps = readJSON('data/apps.json');
let page;
afterEach(() => page && page.close());

const stat = (p, app, k) => p.FZ.stat(app, k);
const tick = async (p, ms = 100) => { p.clock.ms += ms; await p.wait(60); };
async function listen(p) { const heard = []; p.FZ.sfx = n => heard.push(n); return heard; }
const key = (p, k) => p.window.document.dispatchEvent(new p.window.KeyboardEvent('keydown', { key: k, bubbles: true }));

describe('the games are not about offices or bosses', () => {
  const WORDS = /上司|会議|稟議|決裁|承認|ハンコ|残業|出世|昇進|社員|課長|部長|朝礼|会社|決算|予算|副業|夜勤|係長|四半期|全員CC|boss|meeting|approval|office|promotion|overtime|fiscal|budget|reply.all|assembly|quarter end|night shift|second job|month end|spreadsheet|roll call|stamp/i;
  test('none of the company games remain; the monotonous ones replace them', () => {
    const ids = apps.map(a => a.id);
    for (const gone of ['hanko', 'aizuchi', 'ojigi']) {
      expect(ids).not.toContain(gone);
      expect(fs.existsSync(path.join(ROOT, 'apps', gone))).toBe(false);
    }
    for (const now of ['pan', 'haguruma', 'ana']) expect(ids).toContain(now);
  });
  test('game list, sound names, goals and presets avoid office words', () => {
    const u = readJSON('data/unlocks.json');
    const texts = [
      ...apps.flatMap(a => [a.title.en, a.title.ja, a.desc.en, a.desc.ja]),
      ...u.sounds.flatMap(s => [s.name.en, s.name.ja]),
      ...u.drops.flatMap(d => [d.label.en, d.label.ja]),
      ...u.presets.flatMap(p => [p.name.en, p.name.ja]),
    ];
    for (const t of texts) expect(t).not.toMatch(WORDS);
  });
  test('the game pages avoid office words', () => {
    for (const a of apps) expect(fs.readFileSync(path.join(ROOT, 'apps', a.id, 'index.html'), 'utf8')).not.toMatch(WORDS);
  });
});

describe('Bun Alignment', () => {
  const first = p => p.$('.bun');
  // random 0.3 → 流れてくるパンは全部90°傾いている。4秒で流れきる
  test('turning a crooked bun upright before it leaves counts as aligned', async () => {
    page = await openPage('/apps/pan/', { random: () => 0.3 });
    const heard = await listen(page);
    const b = first(page);
    expect(b.dataset.rot).toBe('90');
    for (let i = 0; i < 3; i++) b.click();
    expect(b.dataset.rot).toBe('0');
    expect(heard).toEqual(['tap', 'tap', 'tap']);
    for (let i = 0; i < 42; i++) await tick(page);
    expect(stat(page, 'pan', 'aligned')).toBe(1);
    expect(heard).toContain('pop');
  });
  test('every tap turns the bun exactly 90 degrees forward on screen (never 270 back from 270 to 0)', async () => {
    page = await openPage('/apps/pan/', { random: () => 0.3 });   // 90°から
    const b = first(page);
    const angle = () => Number(b.style.transform.match(/rotate\((-?[\d.]+)deg\)/)[1]);
    expect(angle()).toBe(90);
    for (const want of [180, 270, 360, 450]) { b.click(); expect(angle()).toBe(want); }
    expect(b.dataset.rot).toBe('90');                        // 向きの判定は0〜270のまま
    await tick(page, 200);                                     // 流れている間も見た目の角度は戻らない
    expect(angle()).toBe(450);
  });
  test('letting crooked buns through, several in a row', async () => {
    page = await openPage('/apps/pan/', { random: () => 0.3 });
    const heard = await listen(page);
    for (let i = 0; i < 105; i++) await tick(page);        // 4秒＋1.5秒×4 で5個流れる
    expect(stat(page, 'pan', 'crookedStreak')).toBeGreaterThanOrEqual(5);
    expect(stat(page, 'pan', 'aligned')).toBe(0);
    expect(heard).toContain('clunk');
  });
  test('turning a bun that was already right, and spinning one all the way round', async () => {
    page = await openPage('/apps/pan/', { random: () => 0 });   // 0 → まっすぐ
    const b = first(page);
    b.click();
    expect(stat(page, 'pan', 'overSpin')).toBe(1);
    b.click(); b.click(); b.click();
    expect(stat(page, 'pan', 'fullSpin')).toBe(1);
  });
  test('an aligned streak is remembered', async () => {
    page = await openPage('/apps/pan/', { random: () => 0 });
    for (let i = 0; i < 105; i++) await tick(page);
    expect(stat(page, 'pan', 'streak')).toBeGreaterThanOrEqual(5);
  });
});

describe('The Mysterious Wheel', () => {
  test('alternating feet turns the wheel; it produces nothing', async () => {
    page = await openPage('/apps/haguruma/', { lang: 'ja' });
    const heard = await listen(page);
    for (let i = 0; i < 24; i++) page.$(i % 2 ? '#rfoot' : '#lfoot').click();
    expect(stat(page, 'haguruma', 'turns')).toBe(2);
    expect(stat(page, 'haguruma', 'nonstop')).toBe(24);
    expect(page.text('#made')).toMatch(/なし/);
    expect(heard).toContain('clunk');
  });
  test('the arrow keys work too', async () => {
    page = await openPage('/apps/haguruma/');
    for (let i = 0; i < 12; i++) key(page, i % 2 ? 'ArrowRight' : 'ArrowLeft');
    expect(stat(page, 'haguruma', 'turns')).toBe(1);
  });
  test('the same foot twice is a stumble', async () => {
    page = await openPage('/apps/haguruma/');
    const heard = await listen(page);
    for (let i = 0; i < 6; i++) page.$('#lfoot').click();
    expect(stat(page, 'haguruma', 'stumbleStreak')).toBe(5);
    expect(heard).toContain('ng');
  });
  test('asking what it is for', async () => {
    page = await openPage('/apps/haguruma/', { lang: 'ja' });
    for (let i = 0; i < 5; i++) page.$('#why').click();
    expect(stat(page, 'haguruma', 'askWhy')).toBe(5);
    expect(page.text('#say')).toMatch(/知りません/);
  });
});

describe('Dig and Fill', () => {
  const dig = (p, n) => { for (let i = 0; i < n; i++) p.$('#dig').click(); };
  const fill = (p, n) => { for (let i = 0; i < n; i++) p.$('#fill').click(); };
  test('dig a full hole, fill it back: one hole, nothing changed', async () => {
    page = await openPage('/apps/ana/', { lang: 'ja' });
    const heard = await listen(page);
    dig(page, 10);
    expect(page.$('#hole').dataset.depth).toBe('100');
    fill(page, 10);
    expect(stat(page, 'ana', 'holes')).toBe(1);
    expect(page.text('#say')).toMatch(/元通り/);
    expect(heard).toContain('thud');
    expect(heard).toContain('rustle');
    expect(heard[heard.length - 1]).toBe('chime');
  });
  test('digging stops at the bottom', async () => {
    page = await openPage('/apps/ana/');
    dig(page, 14);
    expect(page.$('#hole').dataset.depth).toBe('100');
  });
  test('filling a half-dug hole back in', async () => {
    page = await openPage('/apps/ana/');
    dig(page, 5); fill(page, 5);
    expect(stat(page, 'ana', 'halfway')).toBe(1);
    expect(stat(page, 'ana', 'holes')).toBe(0);
  });
  test('"filling" flat ground', async () => {
    page = await openPage('/apps/ana/');
    const heard = await listen(page);
    fill(page, 3);
    expect(stat(page, 'ana', 'flatTaps')).toBe(3);
    expect(heard).toEqual(['fizzle', 'fizzle', 'fizzle']);
  });
});

describe('Snooze without a boss', () => {
  test('the danger is losing your blanket, not a phone call', async () => {
    page = await openPage('/apps/nidone/', { lang: 'ja', random: () => 0 });
    page.$('#snooze').click();
    expect(page.text('#say')).toMatch(/布団/);
    expect(page.text('#say')).not.toMatch(/上司|電話/);
    expect(stat(page, 'nidone', 'caught')).toBe(1);
  });
});
