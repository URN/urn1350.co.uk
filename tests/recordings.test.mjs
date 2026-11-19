import test from 'node:test';
import assert from 'node:assert/strict';
import { signRecordingUrl } from '../lib/recordingSigner.mjs';
import {
  parseRecordingFile,
  retentionStatus,
  londonToday,
  listSlotHours,
  slotBelongsToShows,
} from '../lib/recordings.mjs';

test('signer matches the openssl shell pipeline', () => {
  // printf '%s' "1767225600/2026-11-19-18.mp3 test-secret" | openssl md5 -binary | openssl base64 | tr '+/' '-_' | tr -d '='
  const url = signRecordingUrl('/2026-11-19-18.mp3', 'test-secret', 12 * 3600, (1767225600 - 43200) * 1000);
  assert.equal(
    url,
    'https://recordings.urn1350.co.uk/2026-11-19-18.mp3?md5=31A3rbtvrvnmKneCBp63hQ&expires=1767225600',
  );
});

test('signer refuses an empty secret', () => {
  assert.throws(() => signRecordingUrl('/2026-11-19-18.mp3', ''));
});

test('parseRecordingFile accepts valid and rejects hostile names', () => {
  const ok = parseRecordingFile('2026-04-06-18.mp3');
  assert.equal(ok.weekday, 'Monday');
  assert.equal(ok.hour, 18);
  for (const bad of [
    '../etc/passwd', '/2026-04-06-18.mp3', '%2e%2e%2f', '2026-04-06-18.mp3/../x',
    '2026-02-30-10.mp3', '2026-04-06-24.mp3', '2026-04-06-18.mp3?x=1', ['2026-04-06-18.mp3'],
    undefined, '2026-04-06-18.mp3\n',
  ]) {
    assert.equal(parseRecordingFile(bad), null, String(bad));
  }
});

test('londonToday respects the clock changes', () => {
  assert.equal(londonToday(new Date('2026-10-24T23:30:00Z')), '2026-10-25'); // BST
  assert.equal(londonToday(new Date('2026-10-25T23:30:00Z')), '2026-10-25'); // GMT
  assert.equal(londonToday(new Date('2026-03-29T00:30:00Z')), '2026-03-29');
});

test('retentionStatus edges', () => {
  const now = new Date('2026-11-19T12:30:00Z'); // 12:30 London (GMT)
  const st = (f) => retentionStatus(parseRecordingFile(f), now);
  assert.equal(st('2026-11-19-11.mp3'), 'ok');
  assert.equal(st('2026-11-19-12.mp3'), 'future');
  assert.equal(st('2026-11-20-00.mp3'), 'future');
  assert.equal(st('2026-10-08-10.mp3'), 'ok'); // 42 days back
  assert.equal(st('2026-10-07-10.mp3'), 'expired'); // 43 days back
});

test('listSlotHours expands a weekly slot', () => {
  const now = new Date('2026-11-19T12:30:00Z'); // Thursday
  const slots = [{ day: 'Monday', start_hour: 18, end_hour: 20, name: 'Test Show', show_id: 's1' }];
  const list = listSlotHours(slots, now);
  assert.equal(list.length, 12); // 6 Mondays x 2 hours
  assert.ok(list.every((x) => parseRecordingFile(x.file).weekday === 'Monday'));
  assert.equal(list[0].file, '2026-11-16-19.mp3');
});

test('listSlotHours drops unfinished hours today', () => {
  const now = new Date('2026-11-19T18:30:00Z'); // Thursday 18:30 London
  const slots = [{ day: 'Thursday', start_hour: 17, end_hour: 20, name: 'X' }];
  const todays = listSlotHours(slots, now).filter((x) => x.dateKey === '2026-11-19');
  assert.deepEqual(todays.map((x) => x.hour), [17]);
});

test('slotBelongsToShows matches by id, else by name for legacy null show_id', () => {
  const shows = [{ id: 'a', name: 'S2S Sounds' }];
  assert.ok(slotBelongsToShows({ show_id: 'a', name: 'x' }, shows));
  assert.ok(slotBelongsToShows({ show_id: null, name: ' s2s sounds ' }, shows));
  assert.ok(!slotBelongsToShows({ show_id: 'b', name: 'S2S Sounds' }, shows));
  assert.ok(!slotBelongsToShows({ show_id: null, name: 'Other' }, shows));
  assert.ok(!slotBelongsToShows({ show_id: null, name: '' }, [{ id: 'a', name: '' }]));
});

test('groupEpisodes merges hours of one show per date, newest first', async () => {
  const { groupEpisodes } = await import('../lib/recordings.mjs');
  const now = new Date('2026-11-19T12:30:00Z');
  const slots = [{ day: 'Sunday', start_hour: 18, end_hour: 20, name: 'S2S', show_id: 's1' }];
  const eps = groupEpisodes(listSlotHours(slots, now));
  assert.equal(eps.length, 6);
  assert.equal(eps[0].dateKey, '2026-11-15');
  assert.deepEqual(eps[0].hours.map((h) => h.hour), [18, 19]);
  assert.equal([eps[0].startHour, eps[0].endHour].join('-'), '18-20');
});
