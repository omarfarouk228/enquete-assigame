import { describe, it, expect } from 'vitest';
import { NODES, CLUES, PEOPLE, LOCATIONS, HOTSPOTS, AGAIN, DEDUCTION, EVENTS, CHAPTERS } from '../src/story.js';

describe('scénario', () => {
  it('toutes les références existent', () => {
    for (const [k, n] of Object.entries(NODES)) {
      expect(PEOPLE[n.who], k).toBeTruthy();
      if (n.clue) expect(CLUES[n.clue], k).toBeTruthy();
      if (n.confront) { expect(NODES[n.confront.ok], k).toBeTruthy(); for (const c of [].concat(n.confront.clue)) expect(CLUES[c], `${k}:${c}`).toBeTruthy(); }
      for (const c of n.choices || []) { if (c.go) expect(NODES[c.go], `${k} → ${c.go}`).toBeTruthy(); if (c.clue) expect(CLUES[c.clue]).toBeTruthy(); }
    }
    for (const [loc, list] of Object.entries(HOTSPOTS)) { expect(LOCATIONS[loc]).toBeTruthy(); for (const h of list) if (h.clue) expect(CLUES[h.clue]).toBeTruthy(); }
    for (const L of Object.values(LOCATIONS)) for (const p of L.people) expect(PEOPLE[p]).toBeTruthy();
    for (const id of Object.keys(PEOPLE)) { if (id === 'kafui') continue; expect(NODES[`${id}_0`], id).toBeTruthy(); expect(NODES[AGAIN[id]], id).toBeTruthy(); }
    for (const d of DEDUCTION) expect(d.options[d.ok]).toBeTruthy();
    for (const e of EVENTS) expect(typeof e.cost).toBe('number');
    for (const c of Object.values(CHAPTERS)) expect(LOCATIONS[c.loc]).toBeTruthy();
  });
  it('la meilleure fin est atteignable', () => {
    const have = new Set(['roues']);
    const visit = (k) => { const n = NODES[k]; if (n.clue) have.add(n.clue); if (n.set) have.add(n.set); return n; };
    const any = (c) => [].concat(c).some(x => have.has(x));
    visit('kodjo_vu'); visit('kodjo_pousseurs');
    const ref = NODES.ayaovi_refus.choices.find(c => c.go === 'ayaovi_komi'); expect(any(ref.need)).toBe(true); visit('ayaovi_komi');
    expect(any(NODES.komi_conf.confront.clue)).toBe(true); expect(NODES.komi_conf.confront.ok).toBe('komi_fuite');
    expect(NODES.komi_fuite.choices[0].mini).toBe('chase');
    expect(any(NODES.komi_rattrape.confront.clue)).toBe(true); visit('komi_aveu');
    expect(have.has(LOCATIONS.hotel.locked)).toBe(true);
    const ch = HOTSPOTS.hotel.find(h => h.mini === 'search'); expect(have.has(ch.need)).toBe(true); have.add('recu');
    expect(any(NODES.dossou_conf.confront.clue)).toBe(true);
    expect(NODES.dossou_aveu.choices.some(c => c.go === 'fin_police')).toBe(true);
    expect(NODES.fin_police.choices[0].end).toBe('police');
  });
  it('la déduction est soutenue par des indices existants', () => {
    for (const d of DEDUCTION) for (const h of d.hint) expect(CLUES[h] || ['piste_cotonou', 'sena_vu', 'komi_nomme'].includes(h), h).toBeTruthy();
  });
});
