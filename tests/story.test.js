import { describe, it, expect } from 'vitest';
import { NODES, CLUES, PEOPLE, LOCATIONS, HOTSPOTS } from '../src/story.js';

describe('scénario', () => {
  it('toutes les références existent', () => {
    for (const [k, n] of Object.entries(NODES)) {
      expect(PEOPLE[n.who], k).toBeTruthy();
      if (n.clue) expect(CLUES[n.clue], k).toBeTruthy();
      if (n.confront) {
        expect(NODES[n.confront.ok], k).toBeTruthy();
        for (const c of [].concat(n.confront.clue)) expect(CLUES[c], k).toBeTruthy();
      }
      for (const c of n.choices || []) { if (c.go) expect(NODES[c.go], `${k} → ${c.go}`).toBeTruthy(); if (c.clue) expect(CLUES[c.clue]).toBeTruthy(); }
    }
    for (const [loc, list] of Object.entries(HOTSPOTS)) { expect(LOCATIONS[loc]).toBeTruthy(); for (const h of list) if (h.clue) expect(CLUES[h.clue]).toBeTruthy(); }
    for (const L of Object.values(LOCATIONS)) for (const p of L.people) expect(PEOPLE[p]).toBeTruthy();
  });
  it('la meilleure fin est atteignable', () => {
    // parcours : sable (roues) → Kodjo (témoin, Komi nommé) → kiosque (transfert) → Komi (aveux, adresse) → Dossou
    const have = new Set(['roues']);
    const visit = (k) => { const n = NODES[k]; if (n.clue) have.add(n.clue); if (n.set) have.add(n.set); return n; };
    visit('kodjo_vu'); visit('kodjo_pousseurs'); have.add('komi_nomme');
    const ref = NODES.ayaovi_refus.choices.find(c => c.go === 'ayaovi_komi');
    expect(have.has(ref.need)).toBe(true); visit('ayaovi_komi');
    const c1 = NODES.komi_conf.confront.clue; expect([].concat(c1).some(c => have.has(c))).toBe(true);
    expect(have.has(NODES.komi_presse.confront.clue)).toBe(true); visit('komi_aveu');
    expect(have.has(LOCATIONS.hotel.locked)).toBe(true);
    expect([].concat(NODES.dossou_conf.confront.clue).some(c => have.has(c))).toBe(true);
    expect(NODES.dossou_aveu.choices.some(c => c.go === 'fin_police')).toBe(true);
  });
});
