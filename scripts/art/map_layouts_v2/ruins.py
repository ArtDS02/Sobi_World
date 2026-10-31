# Tàn Tích Cổ (zone_ruins), map layouts v2 (decision 045): main line M7-M9, branch N6 (rune crypt) linked to all three.
# Graph (decision 043): M6-M7-M8-M9, M7-N6, M8-N6, M9-N6; N4-M7 and N5-M8 come in from the mountain zone. Water here is dark and still.
from layout import Layout


def m7() -> Layout:
    L = Layout("map_ruins_gate", "M7", "Cổng Tàn Tích", "zone_ruins", 64, 36,
               "the gate of the ruins: a broad avenue climbs north to a great gate in the wall, with walled courtyards and pools on both sides", 60, seed=113)
    L.border(2, 4)
    L.rect(0, 4, 63, 5, "#")
    L.rect(8, 22, 26, 23, "#")
    L.rect(38, 22, 56, 23, "#")
    L.blob(16, 14, 6, 3.5, "~")
    L.blob(48, 14, 6, 3.5, "~")
    L.blob(6, 10, 5, 4, "#")
    L.blob(57, 28, 5, 4, "#")
    L.line([(0, 30), (20, 30), (32, 28), (32, 0)], 3)
    L.line([(20, 30), (18, 21), (16, 9), (26, 8), (31, 8)], 2)
    L.line([(32, 28), (46, 21), (50, 9), (33, 8)], 2)
    L.line([(48, 18), (63, 18)], 2)
    L.rect(3, 8, 8, 12, ".")
    L.rect(9, 10, 12, 10, ",")
    L.rect(55, 27, 59, 30, ".")
    L.line([(50, 30), (55, 29)], 1)
    L.line([(40, 30), (50, 30)], 2)
    L.cover(53, 25, 61, 31, "a broken stone roof over a hidden chamber")
    for b in [(24, 33, 3, 1.5), (42, 12, 2, 1.5), (10, 18, 2, 1.2)]:
        L.blob(*b, "c")
    L.add("spawn", 2, 30)
    L.add("portal", 6, 27)
    L.add("exit", 0, 30, id="exit_r1_back", to="map_mountain_peak", via="trail")
    L.add("exit", 32, 0, id="exit_r1_east", to="map_ruins_hall", via="trail", lock="guardian", note="the great gate in the north wall")
    L.add("exit", 63, 18, id="exit_r1_side", to="map_ruins_crypt", via="trail")
    L.add("group", 32, 9, id="g_r1_elite", cls="elite", enemy="enemy_stone_sentinel")
    L.foes("r1", [(12, 28, "enemy_rune_wisp"), (24, 26, "enemy_stone_sentinel"), (40, 31, "enemy_ember_idol"), (14, 19, "enemy_tide_wraith"),
                  (22, 12, "enemy_rune_wisp"), (44, 12, "enemy_ember_idol"), (56, 18, "enemy_stone_sentinel"), (40, 18, "enemy_rune_wisp"),
                  (26, 18, "enemy_tide_wraith"), (8, 32, "enemy_ember_idol", {"sleep": True})])
    L.add("chest", 5, 10, id="chest_r1_crypt", type="silver")
    L.add("chest", 58, 28, id="chest_r1_hidden", type="hidden")
    L.add("chest", 20, 19, id="chest_r1_court", type="wood")
    L.add("chest", 58, 9, id="chest_r1_corner", type="wood")
    L.add("gate", 11, 10, id="gate_r1_light", element="LIGHT")
    L.add("spring", 36, 25, id="spring_r1", note="an old fountain")
    L.add("npc", 24, 32, id="npc_r1_altar", note="rune altar")
    L.add("lore", 28, 14, id="lore_r1")
    L.add("landmark", 35, 14, w=3, h=3, what="a huge broken statue of a guardian beast beside the avenue", sprite="prop_adv_ruins_statue")
    L.add("crystal", 42, 12)
    return L


def m8() -> Layout:
    L = Layout("map_ruins_hall", "M8", "Hành Lang Rune", "zone_ruins", 64, 36,
               "the rune hall: a long pillared corridor with small chambers on both sides; the upper chambers form a second way through", 70, seed=127, min_walk=0.3)
    L.rect(0, 0, 63, 35, "#")
    L.rect(0, 16, 63, 20, ".")
    for i, x in enumerate((4, 20, 36, 52)):
        L.rect(x, 4, x + 9, 12, ".")
        L.rect(x, 24, x + 9, 32, ".")
        L.rect(x + 4, 13, x + 5, 15, ",")
        if i < 3:
            L.rect(x + 10, 8, x + 15, 8, ",")
        if i in (2, 3):
            L.rect(x + 4, 21, x + 5, 23, ",")
    L.rect(24, 21, 25, 23, ",")
    L.line([(12, 21), (12, 26)], 1)
    L.cover(3, 21, 14, 33, "a collapsed stone ceiling over a hidden chamber")
    L.line([(56, 33), (56, 35)], 2)
    L.blob(41, 29, 2, 1.5, "~")
    L.blob(8, 29, 2, 1.5, "c")
    L.blob(28, 6, 2, 1.2, "c")
    L.add("spawn", 2, 18)
    L.add("portal", 3, 16)
    L.add("exit", 0, 18, id="exit_r2_west", to="map_ruins_gate", via="trail")
    L.add("exit", 63, 18, id="exit_r2_east", to="map_ruins_sanctum", via="trail", lock="guardian")
    L.add("exit", 56, 35, id="exit_r2_south", to="map_ruins_crypt", via="trail")
    L.add("group", 58, 18, id="g_r2_elite", cls="elite", enemy="enemy_shadow_priest")
    L.foes("r2", [(10, 18, "enemy_rune_wisp"), (22, 17, "enemy_stone_sentinel"), (32, 19, "enemy_tide_wraith"), (46, 17, "enemy_ember_idol"),
                  (9, 8, "enemy_rune_wisp"), (25, 6, "enemy_tide_wraith", {"sleep": True}), (41, 8, "enemy_stone_sentinel"), (56, 6, "enemy_ember_idol"),
                  (27, 29, "enemy_shadow_priest"), (39, 26, "enemy_rune_wisp"), (56, 28, "enemy_tide_wraith")])
    L.add("chest", 43, 30, id="chest_r2_lightning", type="silver")
    L.add("chest", 25, 31, id="chest_r2_dark", type="wood")
    L.add("chest", 6, 30, id="chest_r2_hidden", type="hidden")
    L.add("chest", 59, 5, id="chest_r2_vault", type="wood")
    L.add("gate", 40, 22, id="gate_r2_lightning", element="LIGHTNING")
    L.add("gate", 24, 22, id="gate_r2_dark", element="DARK")
    L.add("spring", 52, 29, id="spring_r2")
    L.add("npc", 44, 5, id="npc_r2_vault", note="ancient vault")
    L.add("lore", 12, 6, id="lore_r2")
    L.add("landmark", 28, 13, w=4, h=2, what="a long cracked wall mural of nine guardian beasts", sprite="prop_adv_ruins_wall")
    L.add("crystal", 8, 29)
    L.add("crystal", 28, 6)
    return L


def m9() -> Layout:
    L = Layout("map_ruins_sanctum", "M9", "Điện Phong Ấn", "zone_ruins", 48, 27,
               "the sealed sanctum: a symmetric outer yard with two dark pools, a great hall with one door where the Ancient Guardian keeps the seal", 85, seed=131)
    L.border(2, 3)
    L.rect(16, 5, 40, 21, "#")
    L.rect(18, 7, 38, 19, ".")
    L.rect(16, 12, 17, 14, ",")
    L.blob(8, 6, 3, 2, "~")
    L.blob(8, 20, 3, 2, "~")
    L.rect(41, 2, 46, 9, "#")
    L.rect(42, 3, 44, 7, ".")
    L.rect(41, 17, 46, 24, "#")
    L.rect(42, 19, 44, 23, ".")
    L.line([(0, 13), (17, 13)], 2)
    L.line([(6, 13), (10, 3), (40, 3), (42, 11)], 2)
    L.line([(6, 13), (10, 23), (40, 23), (42, 15)], 2)
    L.line([(42, 11), (42, 15)], 2)
    L.line([(24, 23), (24, 26)], 2)
    L.rect(43, 8, 43, 8, ",")
    L.rect(43, 17, 43, 18, ",")
    L.cover(18, 15, 23, 19, "a fallen roof corner over a hidden niche")
    for b in [(28, 10, 3, 2), (12, 9, 2, 1.2), (34, 17, 2, 1.2)]:
        L.blob(*b, "c")
    L.add("spawn", 2, 13)
    L.add("exit", 0, 13, id="exit_r3_west", to="map_ruins_hall", via="trail")
    L.add("exit", 24, 26, id="exit_r3_south", to="map_ruins_crypt", via="stairs")
    L.add("group", 32, 13, id="g_r3_boss", cls="boss", enemy="enemy_ancient_guardian")
    L.foes("r3", [(8, 10, "enemy_rune_wisp"), (12, 18, "enemy_stone_sentinel"), (22, 3, "enemy_tide_wraith"), (30, 23, "enemy_ember_idol"),
                  (36, 3, "enemy_shadow_priest"), (44, 13, "enemy_stone_sentinel", {"sleep": True}), (21, 9, "enemy_rune_wisp"), (26, 17, "enemy_tide_wraith")])
    L.add("chest", 43, 5, id="chest_r3_metal", type="wood")
    L.add("chest", 19, 18, id="chest_r3_hidden", type="hidden")
    L.add("chest", 36, 9, id="chest_r3_boss", type="gold")
    L.add("gate", 43, 8, id="gate_r3_metal", element="METAL")
    L.add("npc", 43, 21, id="npc_r3_shrine", note="LIGHT Guardian shrine")
    L.add("spring", 14, 13, id="spring_r3", note="before the hall door")
    L.add("lore", 4, 9, id="lore_r3_seal")
    L.add("landmark", 25, 11, w=4, h=3, what="the great seal: a cracked rune altar with dark-violet crystals bursting through it", sprite="prop_adv_ruins_broken")
    for x, y in [(28, 10), (12, 9), (34, 17)]:
        L.add("crystal", x, y)
    return L


def n6() -> Layout:
    L = Layout("map_ruins_crypt", "N6", "Hầm Mộ Rune", "zone_ruins", 72, 40,
               "the rune crypt under the ruins: stone halls and corridors around a dark water channel, an ossuary hall with a sub-boss, a sealed hidden room", 80, seed=137, min_walk=0.3)
    L.rect(0, 0, 71, 39, "#")
    for r in [(4, 16, 16, 24), (24, 4, 36, 14), (24, 26, 38, 36), (46, 14, 60, 26), (62, 26, 69, 34), (48, 30, 56, 36), (42, 2, 52, 10)]:
        L.rect(*r, ".")
    L.line([(40, 0), (40, 39)], 2, "~")
    for pts in [[(0, 20), (10, 20)], [(10, 20), (30, 9)], [(10, 20), (31, 31)], [(30, 9), (30, 0)], [(36, 10), (47, 6)], [(36, 10), (52, 18)],
                [(31, 31), (46, 22)], [(53, 26), (52, 31)], [(56, 22), (65, 30)], [(65, 30), (71, 30)]]:
        L.line(pts, 2)
    L.cover(41, 1, 53, 11, "a sealed vault ceiling over a hidden room")
    for b in [(30, 34, 2.5, 1.5), (58, 24, 2, 1.2), (8, 22, 2, 1.2)]:
        L.blob(*b, "c")
    L.add("spawn", 2, 20)
    L.add("portal", 6, 17)
    L.add("exit", 0, 20, id="exit_n6_west", to="map_ruins_gate", via="trail")
    L.add("exit", 30, 0, id="exit_n6_north", to="map_ruins_hall", via="stairs")
    L.add("exit", 71, 30, id="exit_n6_east", to="map_ruins_sanctum", via="stairs")
    L.add("group", 54, 18, id="g_n6_boss", cls="subboss", enemy="enemy_shadow_priest")
    L.add("group", 28, 32, id="g_n6_elite", cls="elite", enemy="enemy_stone_sentinel")
    L.add("group", 28, 6, id="g_n6_special", cls="special", when="night", enemy="enemy_tide_wraith")
    L.foes("n6", [(8, 22, "enemy_rune_wisp"), (14, 18, "enemy_ember_idol"), (33, 12, "enemy_tide_wraith"), (26, 11, "enemy_stone_sentinel", {"sleep": True}),
                  (36, 30, "enemy_rune_wisp"), (45, 22, "enemy_ember_idol"), (50, 24, "enemy_rune_wisp", {"cls": "mutant"}), (58, 24, "enemy_stone_sentinel"),
                  (52, 34, "enemy_tide_wraith"), (64, 28, "enemy_ember_idol"), (68, 32, "enemy_rune_wisp"), (34, 5, "enemy_shadow_priest"),
                  (20, 15, "enemy_stone_sentinel", {"sleep": True}), (48, 16, "enemy_tide_wraith")])
    L.add("chest", 58, 16, id="chest_n6_ossuary", type="gold")
    L.add("chest", 50, 4, id="chest_n6_vault", type="hidden")
    L.add("chest", 34, 34, id="chest_n6_hall", type="silver")
    L.add("chest", 66, 32, id="chest_n6_mimic", type="mimic")
    L.add("chest", 5, 17, id="chest_n6_entry", type="wood")
    L.add("gate", 24, 27, id="gate_n6_light", element="LIGHT", note="opens when both rune plates shine")
    L.add("puzzle", 8, 18, id="puzzle_n6_plate_a", element="LIGHT")
    L.add("puzzle", 13, 23, id="puzzle_n6_plate_b", element="LIGHT")
    L.add("spring", 47, 23, id="spring_n6", note="at the door of the ossuary hall")
    L.add("lore", 34, 7, id="lore_n6")
    L.add("landmark", 50, 14, w=4, h=3, what="a vast ossuary wall of stone coffins around a cracked guardian sarcophagus", sprite="prop_adv_ruins_wall")
    for x, y in [(30, 34), (58, 24), (8, 22)]:
        L.add("crystal", x, y)
    return L


LAYOUTS = [m7, m8, m9, n6]
