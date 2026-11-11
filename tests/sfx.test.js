/* 効果音：core の FZ.sfx と、追加した12本のゲームでの鳴らしどころ */
const { openPage, readJSON } = require('./helpers/page');

const apps = readJSON('data/apps.json');
let page;
afterEach(() => page && page.close());

const down = (p, el, init = {}) => p.pointer(el, 'pointerdown', Object.assign({ pointerId: 1 }, init));
const move = (p, el, init = {}) => p.pointer(el, 'pointermove', Object.assign({ pointerId: 1 }, init));
const up = (p, init = {}) => p.pointer(p.window, 'pointerup', Object.assign({ pointerId: 1 }, init));
// 鳴らした効果音の名前を記録する
async function open(path, opts) {
  page = await openPage(path, opts);
  const heard = [];
  page.FZ.sfx = name => heard.push(name);
  return heard;
}

describe('FZ.sfx', () => {
  test('every named sound plays without errors, and unknown names are ignored', async () => {
    page = await openPage('/apps/usb/');
    expect(page.FZ.sfxNames.length).toBeGreaterThanOrEqual(15);
    for (const n of page.FZ.sfxNames) page.FZ.sfx(n);
    page.FZ.sfx('no-such-sound');
    expect(page.audio.contexts.length).toBe(1);                // 1つの AudioContext を使い回す
    expect(page.errors).toEqual([]);
  });
});

describe('the game name sits in the middle of the top bar', () => {
  test.each(apps.map(a => [a.id]))('%s', async id => {
    page = await openPage(`/apps/${id}/`);
    const cs = page.window.getComputedStyle(page.$('.fz-bar [data-i18n="title"]'));
    expect(cs.position).toBe('absolute');
    expect(cs.left).toBe('50%');
  });
});

describe('sound effects in the added games', () => {
  test('Bubble Wrap: pop, and a fanfare for a cleared sheet', async () => {
    const heard = await open('/apps/puchipuchi/');
    down(page, page.$('.bubble'));
    expect(heard).toContain('pop');
    for (const b of page.$$('.bubble:not(.popped)')) down(page, b);
    expect(heard).toContain('fanfare');
  });
  test('USB First Try: clunk when wrong, connect when it goes in', async () => {
    const heard = await open('/apps/usb/', { random: () => 0.1 });
    page.$('#insert').click();
    expect(heard).toEqual(['clunk']);
    page.window.Math.random = () => 0.9;
    page.$('#insert').click();
    expect(heard).toContain('connect');
  });
  test('Label Peel: rustle while peeling, chime when done, rip when torn', async () => {
    const heard = await open('/apps/label/');
    down(page, page.$('#label'), { clientX: 0, clientY: 50 });
    for (let x = 20; x <= 320; x += 20) { page.clock.ms += 60; move(page, page.$('#label'), { clientX: x, clientY: 50 }); }
    up(page);
    expect(heard).toContain('rustle');
    expect(heard[heard.length - 1]).toBe('chime');
    down(page, page.$('#label'), { clientX: 0, clientY: 50 });
    page.clock.ms += 10;
    move(page, page.$('#label'), { clientX: 200, clientY: 50 });
    expect(heard[heard.length - 1]).toBe('rip');
  });
  test('Ticket Gate: beep to pass, ping-pong otherwise', async () => {
    const heard = await open('/apps/kaisatsu/');
    for (const ms of [500, 80]) { down(page, page.$('#card')); page.clock.ms += ms; up(page); }
    expect(heard).toEqual(['beep', 'pingpong']);
  });
  test('Static Shock: crackle while rubbing, zap at the knob, a tap when there is no charge', async () => {
    const heard = await open('/apps/seidenki/');
    page.$('#knob').click();
    expect(heard).toEqual(['tap']);
    down(page, page.$('#carpet'), { clientX: 0 });
    for (let i = 1; i <= 10; i++) { page.clock.ms += 200; move(page, page.$('#carpet'), { clientX: i % 2 ? 200 : 0 }); }
    up(page);
    expect(heard).toContain('crackle');
    page.$('#knob').click();
    expect(heard[heard.length - 1]).toBe('zap');
  });
  test('Cup Noodle Clock: pour, then slurp', async () => {
    const heard = await open('/apps/cupmen/');
    page.$('#pour').click();
    page.clock.ms += 30000;
    page.$('#eat').click();
    expect(heard).toEqual(['pour', 'slurp']);
  });
  test('Packed Train: a door chime, clacks as it lurches, a thud when you fall', async () => {
    const heard = await open('/apps/tsurikawa/', { random: () => 0.99 });
    page.$('#start').click();
    for (let i = 0; i < 60 && page.$('#start').hidden; i++) { page.clock.ms += 100; await page.wait(60); }
    expect(heard[0]).toBe('chime');
    expect(heard).toContain('clack');
    expect(heard[heard.length - 1]).toBe('thud');
  });
  test('Snooze: tap to snooze, a whoosh when the blanket is yanked, a fanfare when you get up', async () => {
    const heard = await open('/apps/nidone/', { random: () => 0.99 });
    page.$('#snooze').click();
    page.$('#wake').click();
    page.window.Math.random = () => 0;
    page.$('#snooze').click();
    expect(heard).toEqual(['tap', 'fanfare', 'swoosh']);
  });
  test('Almost Sneeze: fizzle when nothing comes, achoo at the peak', async () => {
    const heard = await open('/apps/kushami/');
    page.$('#sneeze').click();
    page.clock.ms += 700 * Math.PI / 2;
    page.$('#sneeze').click();
    expect(heard).toEqual(['fizzle', 'achoo']);
  });
  test('Odd Sock: pop to pick, ng for a mismatch, chime for the pair', async () => {
    const heard = await open('/apps/kutsushita/');
    const socks = page.$$('.sock'), kinds = socks.map(s => s.dataset.kind);
    const dup = kinds.find((k, i) => kinds.indexOf(k) !== i);
    const others = socks.filter(s => s.dataset.kind !== dup), pair = socks.filter(s => s.dataset.kind === dup);
    others[0].click(); others[1].click();
    pair[0].click(); pair[1].click();
    expect(heard).toEqual(['pop', 'ng', 'pop', 'chime']);
  });
});
