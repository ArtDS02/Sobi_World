// npm run sim:adventure (decision 037 balance check): walks a zone on the game's own combat rules for many parties, so a balance edit
// shows its effect on the win curve and on how varied the winning teams are. Usage: npm run sim:adventure [-- <samples> <seed> <zone> <gear>]
// (zone_forest | zone_mountain | zone_ruins, gear none | common | uncommon | rare | epic; the default is the Forest in common gear).
import { CLASS_LIST, LINEAGE_LIST, type ClassId, type LineageId } from '../src/areas/adventure/logic/config/content';
import { simulateRuns, type GearTier, type SimMember } from '../src/areas/adventure/logic/battleSim';

const samples = Number(process.argv[2] ?? 80);
const seed = Number(process.argv[3] ?? 11);
const zone = process.argv[4] ?? 'zone_forest';
const gearTier = (process.argv[5] ?? 'common') as GearTier;
const LEVELS = zone === 'zone_forest' ? [1, 3, 5, 7, 9, 12] : zone === 'zone_mountain' ? [7, 9, 11, 13, 16, 20] : [12, 14, 16, 18, 20, 24];
const m = (lineage: LineageId, classId: ClassId): SimMember => ({ lineage, classId });

const TEAMS: Record<string, SimMember[]> = {
  'tank+dps+support': [m('thiet_giap', 'tanker'), m('hoa_giai', 'striker'), m('nam_hai', 'support')],
  'starter trio': [m('thiet_giap', 'striker'), m('moc_mau', 'tanker'), m('quang_tru', 'support')],
  'mage trio': [m('loi_duong', 'mage'), m('hoa_giai', 'mage'), m('nam_hai', 'mage')],
  'water+thunder': [m('nam_hai', 'mage'), m('loi_duong', 'striker'), m('quy_son', 'tanker')],
  'void trio': [m('hu_khong', 'mage'), m('hu_khong', 'striker'), m('hu_khong', 'support')],
  'dark+light': [m('da_mac', 'mage'), m('quang_tru', 'support'), m('thiet_giap', 'tanker')],
  'all strikers': [m('thiet_giap', 'striker'), m('loi_duong', 'striker'), m('hoa_giai', 'striker')],
  'nature poison': [m('moc_mau', 'mage'), m('hoa_giai', 'striker'), m('moc_mau', 'support')],
};

console.log(`Win % of a whole trip of ${zone} by team level (gear: ${gearTier}, ${samples} trips each)`);
console.log('team'.padEnd(20), LEVELS.map((l) => `L${l}`.padStart(7)).join(''), '  rounds  battles');
for (const [name, team] of Object.entries(TEAMS)) {
  const rows = LEVELS.map((level) => simulateRuns({ zoneId: zone, level, team, gear: gearTier, samples, seed }));
  const mid = rows[Math.floor(rows.length / 2)]!;
  console.log(name.padEnd(20), rows.map((r) => String(r.winPercent).padStart(7)).join(''), String(mid.averageRounds).padStart(8), String(mid.averageBattles).padStart(8));
}

const level = LEVELS[3]!;
console.log(`\nEvery line × class alone in a mixed team at level ${level} (with a Thiết Giáp tanker and a Nam Hải support):`);
for (const l of LINEAGE_LIST) {
  const cells = CLASS_LIST.map((c) => simulateRuns({ zoneId: zone, level, team: [m('thiet_giap', 'tanker'), m(l.id, c.id), m('nam_hai', 'support')], gear: gearTier, samples: Math.max(20, samples / 2), seed }).winPercent);
  console.log(`  ${l.id.padEnd(11)}`, CLASS_LIST.map((c, i) => `${c.id}:${String(cells[i]).padStart(5)}`).join('  '));
}
const r = simulateRuns({ zoneId: zone, level, team: TEAMS['water+thunder']!, gear: gearTier, samples, seed });
console.log('\nReactions per trip (water+thunder):', r.reactions);
console.log('Skill uses per trip (water+thunder):', Object.entries(r.skillUse).sort((a, b) => b[1] - a[1]).slice(0, 12));
