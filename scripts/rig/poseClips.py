"""The clips of a pose-to-pose rig (decision 050, 2026-11-06 (5)): every action shows the creature's own approved key pose at the
moment that matters (the attack drawing on the strike, the cast drawing on the release, the hurt drawing on the hit…), and the grid
does the rest — anticipation, squash and stretch, the lunge with feet planted, the head lagging behind, the settle back to rest.

Channels move only `body` (pivot at the feet: + rot leans forward), `head` (lags) and the pose slot. Times in ms; marks line the
clip up with a battle beat (windup / release / contact / recover). Imported by poseRig.py.
"""
from __future__ import annotations


def clip(length, tracks, poses, marks=None, loop=False, fade=100, life=0.3, waves=None):
    return {"len": length, "loop": loop, "fade": fade, "marks": marks or {}, "tracks": tracks,
            "faces": {"pose": [[t, p] for t, p in poses]}, "life": life, "waves": waves or {}}


def squash(t_down, k_down, t_up, k_up, t_end):
    """sx / sy keys for a squash at t_down (k_down < 1 on y), a stretch at t_up, back to 1 at t_end."""
    return {
        "sx": [[0, 1], [t_down, round(2 - k_down, 3), "in"], [t_up, round(2 - k_up, 3), "outBack"], [t_end, 1]],
        "sy": [[0, 1], [t_down, k_down, "in"], [t_up, k_up, "outBack"], [t_end, 1]],
    }


def strike(pose, windup, release, contact, recover, length, lean=5, reach=12, crouch=0.9, extra=None, drawn_windup=False):
    """Lean back and squash (anticipation), lunge on the release with the strike drawing (stretch), a small squash on contact.

    drawn_windup: the creature has an approved windup drawing (`cb_<art>_windup`). It shows early in the anticipation and already
    crouches and pulls back, so the grid only eases into it (40 % of the lean, the step back and the squash) instead of doubling it.
    """
    back = 0.4 if drawn_windup else 1.0
    crouch = round(1 - (1 - crouch) * back, 3)
    body = {"rot": [[0, 0], [windup, round(-lean * back, 2), "in"], [release, lean * 0.8, "out"], [contact, lean], [recover, 0, "inOut"]],
            "x": [[0, 0], [windup, round(-reach * back, 2), "in"], [release, reach * 0.8, "out"], [contact, reach], [recover, 0, "inOut"]],
            "sx": [[0, 1], [windup, round(2 - crouch, 3), "in"], [release, 0.94, "outBack"], [release + 100, 1], [contact, 1.04], [contact + 60, 1]],
            "sy": [[0, 1], [windup, crouch, "in"], [release, 1.07, "outBack"], [release + 100, 1], [contact, 0.96], [contact + 60, 1]]}
    tracks = {"body": body, "head": {"rot": [[0, 0], [windup, round(-4 * back, 2)], [release + 40, 5, "outBack"], [contact, 3], [recover, 0]]}}
    for bone, ch in (extra or {}).items():
        tracks.setdefault(bone, {}).update(ch)
    marks = {"windup": windup, "release": release, "contact": contact, "recover": recover}
    poses = [[0, "rest"], [release - 40, pose], [recover + 20, "rest"]]
    if drawn_windup:
        poses.insert(1, [round(windup * 0.3), "windup"])
    return clip(length, tracks, poses, marks)


def raise_up(pose, windup, release, recover, length, rise=14, crouch=0.88, contact=None, end_pose="rest"):
    body = {"y": [[0, 0], [windup, 4, "in"], [release, -rise, "out"], [recover - 100, -rise * 0.6], [length - 80, 0, "inOut"]],
            "rot": [[0, 0], [windup, -3], [release, 0, "out"]],
            **squash(windup, crouch, release, 1.08, release + 160)}
    marks = {"windup": windup, "release": release, "recover": recover}
    if contact:
        marks = {"windup": windup, "release": release, "contact": contact, "recover": recover}
    tracks = {"body": body, "head": {"rot": [[0, 0], [windup, 3], [release + 40, -5, "outBack"], [recover, 0]]}}
    return clip(length, tracks, [[0, "rest"], [windup + 30, pose], [length - 100, end_pose]], marks)


CLIPS = {
    "idle": clip(2400, {"head": {"rot": [[0, 0], [1200, 1.5, "inOut"], [2400, 0, "inOut"]]},
                        "body": {"x": [[0, 0], [1200, 0.8, "inOut"], [2400, 0, "inOut"]]}}, [[0, "rest"]], loop=True, fade=160, life=1),
    "idle_look": clip(1600, {"head": {"rot": [[0, 0], [300, -3, "out"], [900, -3], [1200, 2, "inOut"], [1600, 0, "inOut"]]}}, [[0, "rest"]], life=1),
    "idle_hop": clip(800, {"body": {"y": [[0, 0], [140, 0], [300, -10, "out"], [460, 0, "in"], [800, 0]],
                                    "sy": [[0, 1], [140, 0.94, "in"], [300, 1.05, "out"], [460, 0.94], [600, 1]],
                                    "sx": [[0, 1], [140, 1.05, "in"], [300, 0.96, "out"], [460, 1.05], [600, 1]]}}, [[0, "rest"]], life=1),
    "move": clip(560, {"body": {"y": [[0, 0], [140, -12, "out"], [280, 0, "in"], [420, -12, "out"], [560, 0, "in"]],
                                "sy": [[0, 0.95], [140, 1.04], [280, 0.95], [420, 1.04], [560, 0.95]],
                                "sx": [[0, 1.04], [140, 0.97], [280, 1.04], [420, 0.97], [560, 1.04]],
                                "rot": [[0, 3]]}}, [[0, "rest"]], loop=True, life=0.8),
    "attack": strike("attack", 260, 340, 560, 780, 980),
    "cast": raise_up("cast", 380, 520, 900, 1100),
    "hurt": clip(560, {"body": {"x": [[0, -14, "out"], [220, -6], [460, 0, "inOut"]], "rot": [[0, -9, "out"], [180, 3], [460, 0, "inOut"]],
                                "sx": [[0, 1.08, "out"], [160, 0.97], [300, 1]], "sy": [[0, 0.9, "out"], [160, 1.03], [300, 1]]},
                       "head": {"rot": [[0, -6], [200, 3], [460, 0]]}}, [[0, "hurt"], [470, "rest"]], fade=30),
    "hurt_heavy": clip(780, {"body": {"x": [[0, -24, "out"], [300, -10], [680, 0, "inOut"]], "rot": [[0, -13, "out"], [240, 4], [680, 0, "inOut"]],
                                      "sx": [[0, 1.12, "out"], [200, 0.96], [380, 1]], "sy": [[0, 0.86, "out"], [200, 1.04], [380, 1]]},
                             "head": {"rot": [[0, -8], [260, 4], [680, 0]]}}, [[0, "hurt"], [690, "rest"]], fade=30),
    "ko": clip(900, {"body": {"sy": [[0, 1], [200, 0.86, "out"], [340, 1.04], [480, 1]], "sx": [[0, 1], [200, 1.1, "out"], [340, 0.98], [480, 1]],
                              "x": [[0, -10, "out"], [200, -4], [480, 0]]}}, [[0, "hurt"], [200, "ko"]], fade=40, life=0),
    "victory": clip(1400, {"body": {"y": [[0, 0], [180, -26, "out"], [360, 0, "in"], [420, 0], [600, -16, "out"], [760, 0, "in"]],
                                    "sy": [[0, 1], [160, 1.06], [360, 0.92], [440, 1], [600, 1.04], [760, 0.95], [860, 1]],
                                    "sx": [[0, 1], [160, 0.95], [360, 1.07], [440, 1], [600, 0.97], [760, 1.04], [860, 1]]},
                           "head": {"rot": [[0, 0], [400, -3, "inOut"], [800, 3, "inOut"], [1400, 0, "inOut"]]}}, [[0, "victory"]], fade=120, life=0.8),
    "guard": clip(600, {"body": {"sx": [[0, 1], [160, 1.05, "out"]], "sy": [[0, 1], [160, 0.94, "out"]], "x": [[0, 0], [160, -6, "out"]]}},
                  [[0, "rest"]], life=0.6),
    "stunned": clip(1200, {"body": {"rot": [[0, -4, "inOut"], [300, 4, "inOut"], [600, -4, "inOut"], [900, 4, "inOut"], [1200, -4]]},
                           "head": {"rot": [[0, 3, "inOut"], [300, -3, "inOut"], [600, 3, "inOut"], [900, -3, "inOut"], [1200, 3]]}},
                   [[0, "hurt"]], loop=True, life=0.4),
    "buff": clip(900, {"body": {"y": [[0, 0], [200, -12, "out"], [420, 0, "in"]], "sy": [[0, 1], [180, 1.05], [420, 0.94], [560, 1]],
                                "sx": [[0, 1], [180, 0.96], [420, 1.05], [560, 1]]}}, [[0, "victory"], [800, "rest"]], life=0.6),
    "dodge": clip(520, {"body": {"x": [[0, 0], [120, -30, "out"], [400, -30], [520, 0, "in"]], "y": [[0, 0], [100, -10, "out"], [240, 0, "in"]],
                                 "rot": [[0, 0], [120, -6, "out"], [400, -3], [520, 0]]}}, [[0, "rest"]], fade=40),
    # Skill gestures (decision 050, R2): the same drawings, other timing and other body work.
    "g_shoot": strike("attack", 300, 380, 520, 760, 900, lean=3, reach=8, crouch=0.92),
    "g_breath": strike("attack", 320, 420, 640, 860, 1000, lean=7, reach=6, crouch=0.92),
    "g_charge": strike("attack", 360, 420, 600, 860, 1000, lean=6, reach=20, crouch=0.86),
    "g_lash": strike("attack", 280, 340, 480, 700, 900, lean=10, reach=10, crouch=0.9),
    "g_roar": strike("attack", 320, 400, 640, 860, 1000, lean=4, reach=4, crouch=0.9,
                     extra={"body": {"y": [[0, 0], [400, -4], [460, 0], [520, -4], [580, 0], [640, -3], [700, 0]]}}),
    "g_slam": raise_up("cast", 420, 520, 900, 1100, rise=18, crouch=0.86, contact=640, end_pose="rest"),
    "g_summon_ground": raise_up("cast", 380, 500, 900, 1100, rise=4, crouch=0.86),
    "g_summon_sky": raise_up("cast", 380, 520, 900, 1100, rise=16, crouch=0.9),
    "g_channel": raise_up("cast", 400, 600, 1000, 1200, rise=8, crouch=0.92),
    "g_brace": clip(900, {"body": {**squash(300, 0.92, 360, 0.94, 860), "x": [[0, 0], [300, -6, "in"], [860, 0, "inOut"]]}},
                    [[0, "rest"]], {"windup": 300, "release": 360, "recover": 700}),
    "ultimate": raise_up("cast", 700, 860, 1300, 1600, rise=20, crouch=0.84, contact=1000),
}
# The ultimate lets go with the strike drawing: gather on the cast pose, strike on the attack pose, back to rest.
CLIPS["ultimate"]["faces"]["pose"] = [[0, "rest"], [300, "cast"], [820, "attack"], [1500, "rest"]]
CLIPS["g_slam"]["faces"]["pose"] = [[0, "rest"], [300, "cast"], [600, "attack"], [1000, "rest"]]

# Creatures with an approved windup drawing (cb_<art>_windup; pilot batch rig-02-windup): the plain attack winds up on it.
# Skill gestures keep their own anticipation for now (one drawing per moment is checked against its picture first).
WINDUP_CLIPS = {"attack": strike("attack", 260, 340, 560, 780, 980, drawn_windup=True)}
