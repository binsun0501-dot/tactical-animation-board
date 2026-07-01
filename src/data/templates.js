const FIELD_SIZE = {
  width: 100,
  height: 64,
  unit: "percent-space",
};

export const TACTIC_TEMPLATES = [
  makeTemplate({
    id: "template_7v7_basic_shape",
    name: "7 人制基础站位模板",
    category: "基础站位",
    description: "帮助青训队员理解门将、后卫、中场和前锋之间的基础距离。",
    suitableFor: ["U8-U12 青训", "校园足球", "新手教练"],
    fieldView: "half",
    format: "7v7",
    tags: ["7人制", "站位", "传接球"],
    difficulty: "入门",
    recommendedMode: "半场讲解",
    steps: [
      step(
        0,
        "初始站位",
        "先让孩子看到 1-2-3-1 的基础距离。",
        board(
          [
            home("p1", "1", 12, 32),
            home("p2", "2", 30, 46),
            home("p4", "4", 30, 20),
            home("p6", "6", 48, 33),
            home("p7", "7", 56, 50),
            home("p10", "10", 60, 18),
            home("p9", "9", 76, 32),
          ],
          [
            away("o3", "3", 68, 46),
            away("o5", "5", 70, 20),
            away("o8", "8", 58, 32),
            away("o9", "9", 82, 32),
          ],
          ball(12, 32, "p1"),
        ),
      ),
      step(
        1,
        "门将分边",
        "门将先把球传给空位后卫，后卫打开角度。",
        board(
          [
            home("p1", "1", 12, 32),
            home("p2", "2", 36, 48),
            home("p4", "4", 30, 20),
            home("p6", "6", 48, 33),
            home("p7", "7", 58, 50),
            home("p10", "10", 60, 18),
            home("p9", "9", 76, 32),
          ],
          [
            away("o3", "3", 68, 46),
            away("o5", "5", 70, 20),
            away("o8", "8", 58, 32),
            away("o9", "9", 82, 32),
          ],
          ball(36, 48, "p2"),
        ),
        [pass("tpl7_s1_pass", { x: 12, y: 32 }, { x: 36, y: 48 })],
      ),
      step(
        2,
        "中场接应",
        "中场靠近持球队友，边路队员保持宽度。",
        board(
          [
            home("p1", "1", 12, 32),
            home("p2", "2", 38, 48),
            home("p4", "4", 30, 20),
            home("p6", "6", 54, 38),
            home("p7", "7", 64, 52),
            home("p10", "10", 62, 17),
            home("p9", "9", 78, 31),
          ],
          [
            away("o3", "3", 70, 46),
            away("o5", "5", 70, 20),
            away("o8", "8", 60, 34),
            away("o9", "9", 82, 32),
          ],
          ball(54, 38, "p6"),
        ),
        [
          run("tpl7_s2_run_p6", { x: 48, y: 33 }, { x: 54, y: 38 }),
          run("tpl7_s2_run_p7", { x: 58, y: 50 }, { x: 64, y: 52 }),
          pass("tpl7_s2_pass", { x: 38, y: 48 }, { x: 54, y: 38 }),
        ],
      ),
      step(
        3,
        "向前连接",
        "前锋回看球，中场把球送到能继续进攻的位置。",
        board(
          [
            home("p1", "1", 12, 32),
            home("p2", "2", 38, 48),
            home("p4", "4", 30, 20),
            home("p6", "6", 58, 38),
            home("p7", "7", 70, 52),
            home("p10", "10", 66, 18),
            home("p9", "9", 82, 32),
          ],
          [
            away("o3", "3", 72, 46),
            away("o5", "5", 72, 20),
            away("o8", "8", 62, 34),
            away("o9", "9", 84, 32),
          ],
          ball(82, 32, "p9"),
        ),
        [
          run("tpl7_s3_run_p9", { x: 78, y: 31 }, { x: 82, y: 32 }),
          pass("tpl7_s3_pass", { x: 54, y: 38 }, { x: 82, y: 32 }),
        ],
      ),
    ],
  }),

  makeTemplate({
    id: "template_433_basic_shape",
    name: "11 人制 4-3-3 基础阵型模板",
    category: "基础站位",
    description: "用关键位置展示 4-3-3 的后场宽度、中场连接和前场三点。",
    suitableFor: ["校园足球", "基础教练", "11 人制入门"],
    fieldView: "full",
    format: "11v11",
    tags: ["11人制", "4-3-3", "阵型"],
    difficulty: "基础",
    recommendedMode: "全场讲解",
    steps: [
      step(
        0,
        "基础阵型",
        "先看 4-3-3 的纵向层次和横向宽度。",
        board(
          [
            home("p1", "1", 9, 32),
            home("p2", "2", 25, 52),
            home("p4", "4", 24, 38),
            home("p5", "5", 24, 26),
            home("p3", "3", 25, 12),
            home("p6", "6", 42, 32),
            home("p8", "8", 52, 42),
            home("p10", "10", 54, 22),
            home("p9", "9", 74, 32),
          ],
          [
            away("o7", "7", 66, 52),
            away("o9", "9", 80, 32),
            away("o11", "11", 66, 12),
            away("o6", "6", 60, 32),
          ],
          ball(42, 32, "p6"),
        ),
      ),
      step(
        1,
        "后场打开",
        "中卫和边后卫拉开，给后腰接球空间。",
        board(
          [
            home("p1", "1", 9, 32),
            home("p2", "2", 29, 56),
            home("p4", "4", 28, 39),
            home("p5", "5", 28, 25),
            home("p3", "3", 29, 8),
            home("p6", "6", 44, 32),
            home("p8", "8", 53, 43),
            home("p10", "10", 55, 21),
            home("p9", "9", 75, 32),
          ],
          [
            away("o7", "7", 66, 52),
            away("o9", "9", 80, 32),
            away("o11", "11", 66, 12),
            away("o6", "6", 61, 32),
          ],
          ball(44, 32, "p6"),
        ),
        [
          run("tpl433_s1_run_p2", { x: 25, y: 52 }, { x: 29, y: 56 }),
          run("tpl433_s1_run_p3", { x: 25, y: 12 }, { x: 29, y: 8 }),
          pass("tpl433_s1_pass", { x: 9, y: 32 }, { x: 44, y: 32 }),
        ],
      ),
      step(
        2,
        "中场连接",
        "8 号和 10 号错开站位，形成两个出球方向。",
        board(
          [
            home("p1", "1", 9, 32),
            home("p2", "2", 31, 56),
            home("p4", "4", 28, 39),
            home("p5", "5", 28, 25),
            home("p3", "3", 31, 8),
            home("p6", "6", 46, 32),
            home("p8", "8", 58, 44),
            home("p10", "10", 60, 20),
            home("p9", "9", 76, 32),
          ],
          [
            away("o7", "7", 68, 52),
            away("o9", "9", 81, 32),
            away("o11", "11", 68, 12),
            away("o6", "6", 62, 32),
          ],
          ball(58, 44, "p8"),
        ),
        [
          run("tpl433_s2_run_p8", { x: 53, y: 43 }, { x: 58, y: 44 }),
          run("tpl433_s2_run_p10", { x: 55, y: 21 }, { x: 60, y: 20 }),
          pass("tpl433_s2_pass", { x: 46, y: 32 }, { x: 58, y: 44 }),
        ],
      ),
      step(
        3,
        "前场三点",
        "中锋定住中路，两侧给出向前选择。",
        board(
          [
            home("p1", "1", 9, 32),
            home("p2", "2", 34, 56),
            home("p4", "4", 29, 39),
            home("p5", "5", 29, 25),
            home("p3", "3", 34, 8),
            home("p6", "6", 48, 32),
            home("p8", "8", 62, 44),
            home("p10", "10", 64, 20),
            home("p9", "9", 80, 32),
          ],
          [
            away("o7", "7", 70, 52),
            away("o9", "9", 82, 32),
            away("o11", "11", 70, 12),
            away("o6", "6", 64, 32),
          ],
          ball(80, 32, "p9"),
        ),
        [
          run("tpl433_s3_run_p9", { x: 76, y: 32 }, { x: 80, y: 32 }),
          pass("tpl433_s3_pass", { x: 58, y: 44 }, { x: 80, y: 32 }),
        ],
      ),
    ],
  }),

  makeTemplate({
    id: "template_fullback_overlap",
    name: "边后卫套边模板",
    category: "进攻配合",
    description: "边锋内收吸引防守，边后卫从外线套上接球。",
    suitableFor: ["边路进攻训练", "U10 以上青训", "业余球队"],
    fieldView: "half",
    format: "7v7/11v11",
    tags: ["边路", "套边", "传中"],
    difficulty: "基础",
    recommendedMode: "半场讲解",
    steps: [
      step(
        0,
        "边路持球",
        "边锋拿球，边后卫在身后保持可套上的距离。",
        board(
          [
            home("p2", "2", 54, 56),
            home("p6", "6", 50, 38),
            home("p7", "7", 66, 50),
            home("p8", "8", 58, 32),
            home("p9", "9", 78, 30),
          ],
          [
            away("o2", "2", 74, 50),
            away("o5", "5", 82, 34),
            away("o6", "6", 62, 40),
          ],
          ball(66, 50, "p7"),
        ),
      ),
      step(
        1,
        "边锋内收",
        "边锋带球向内，先把对方边后卫带离边线。",
        board(
          [
            home("p2", "2", 56, 56),
            home("p6", "6", 50, 38),
            home("p7", "7", 62, 44),
            home("p8", "8", 59, 32),
            home("p9", "9", 79, 30),
          ],
          [
            away("o2", "2", 70, 46),
            away("o5", "5", 82, 34),
            away("o6", "6", 62, 39),
          ],
          ball(62, 44, "p7"),
        ),
        [
          run("tpl_overlap_s1_p7", { x: 66, y: 50 }, { x: 62, y: 44 }),
          run("tpl_overlap_s1_o2", { x: 74, y: 50 }, { x: 70, y: 46 }),
        ],
      ),
      step(
        2,
        "边后卫套上",
        "边后卫沿外线高速套上，边锋抬头准备分球。",
        board(
          [
            home("p2", "2", 80, 56),
            home("p6", "6", 52, 38),
            home("p7", "7", 62, 44),
            home("p8", "8", 61, 32),
            home("p9", "9", 81, 30),
          ],
          [
            away("o2", "2", 70, 46),
            away("o5", "5", 83, 34),
            away("o6", "6", 64, 39),
          ],
          ball(62, 44, "p7"),
        ),
        [
          run("tpl_overlap_s2_p2", { x: 56, y: 56 }, { x: 80, y: 56 }, { x: 66, y: 60 }),
          run("tpl_overlap_s2_p9", { x: 79, y: 30 }, { x: 81, y: 30 }),
        ],
      ),
      step(
        3,
        "分给外线",
        "边锋把球分到外线，边后卫获得向前空间。",
        board(
          [
            home("p2", "2", 84, 56),
            home("p6", "6", 54, 38),
            home("p7", "7", 62, 44),
            home("p8", "8", 64, 32),
            home("p9", "9", 84, 30),
          ],
          [
            away("o2", "2", 72, 47),
            away("o5", "5", 84, 34),
            away("o6", "6", 65, 39),
          ],
          ball(84, 56, "p2"),
        ),
        [
          pass("tpl_overlap_s3_pass", { x: 62, y: 44 }, { x: 84, y: 56 }),
          run("tpl_overlap_s3_p9", { x: 81, y: 30 }, { x: 84, y: 30 }),
        ],
      ),
      step(
        4,
        "准备传中",
        "中路队员前插，边后卫可以传中或倒三角。",
        board(
          [
            home("p2", "2", 88, 54),
            home("p6", "6", 58, 39),
            home("p7", "7", 66, 44),
            home("p8", "8", 70, 34),
            home("p9", "9", 88, 29),
          ],
          [
            away("o2", "2", 76, 48),
            away("o5", "5", 86, 34),
            away("o6", "6", 68, 39),
          ],
          ball(88, 54, "p2"),
        ),
        [
          run("tpl_overlap_s4_p2", { x: 84, y: 56 }, { x: 88, y: 54 }),
          run("tpl_overlap_s4_p8", { x: 64, y: 32 }, { x: 70, y: 34 }),
          run("tpl_overlap_s4_p9", { x: 84, y: 30 }, { x: 88, y: 29 }),
        ],
      ),
    ],
  }),

  makeTemplate({
    id: "template_winger_inside_fullback_width",
    name: "边锋内切 + 边后卫拉宽模板",
    category: "进攻配合",
    description: "边锋向中路拿球，边后卫保持外线宽度，形成内外两个选择。",
    suitableFor: ["边路进攻", "青训配合课", "业余球队"],
    fieldView: "half",
    format: "7v7/11v11",
    tags: ["内切", "拉宽", "边路"],
    difficulty: "基础",
    recommendedMode: "半场讲解",
    steps: [
      step(
        0,
        "边锋在外线",
        "边锋先贴边拿球，边后卫在身后提供保护。",
        board(
          [
            home("p2", "2", 50, 56),
            home("p6", "6", 48, 38),
            home("p7", "7", 68, 54),
            home("p8", "8", 60, 34),
            home("p9", "9", 82, 30),
          ],
          [
            away("o2", "2", 76, 52),
            away("o5", "5", 84, 34),
            away("o6", "6", 64, 40),
          ],
          ball(68, 54, "p7"),
        ),
      ),
      step(
        1,
        "边锋内切",
        "边锋向中路带球，边后卫留在外线拉宽。",
        board(
          [
            home("p2", "2", 62, 58),
            home("p6", "6", 50, 38),
            home("p7", "7", 66, 42),
            home("p8", "8", 62, 34),
            home("p9", "9", 82, 30),
          ],
          [
            away("o2", "2", 72, 48),
            away("o5", "5", 84, 34),
            away("o6", "6", 66, 40),
          ],
          ball(66, 42, "p7"),
        ),
        [
          run("tpl_inside_s1_p7", { x: 68, y: 54 }, { x: 66, y: 42 }),
          run("tpl_inside_s1_p2", { x: 50, y: 56 }, { x: 62, y: 58 }),
        ],
      ),
      step(
        2,
        "外线选择",
        "防守收进中路后，边后卫获得外线接球点。",
        board(
          [
            home("p2", "2", 78, 58),
            home("p6", "6", 52, 38),
            home("p7", "7", 66, 42),
            home("p8", "8", 66, 34),
            home("p9", "9", 84, 30),
          ],
          [
            away("o2", "2", 72, 46),
            away("o5", "5", 84, 34),
            away("o6", "6", 68, 40),
          ],
          ball(78, 58, "p2"),
        ),
        [
          run("tpl_inside_s2_p2", { x: 62, y: 58 }, { x: 78, y: 58 }),
          pass("tpl_inside_s2_pass", { x: 66, y: 42 }, { x: 78, y: 58 }),
        ],
      ),
      step(
        3,
        "中路前插",
        "中锋和中场前插，等待外线传中或倒三角。",
        board(
          [
            home("p2", "2", 84, 56),
            home("p6", "6", 56, 40),
            home("p7", "7", 70, 42),
            home("p8", "8", 74, 36),
            home("p9", "9", 88, 30),
          ],
          [
            away("o2", "2", 76, 48),
            away("o5", "5", 86, 34),
            away("o6", "6", 70, 40),
          ],
          ball(84, 56, "p2"),
        ),
        [
          run("tpl_inside_s3_p8", { x: 66, y: 34 }, { x: 74, y: 36 }),
          run("tpl_inside_s3_p9", { x: 84, y: 30 }, { x: 88, y: 30 }),
        ],
      ),
    ],
  }),

  makeTemplate({
    id: "template_pivot_drop_support",
    name: "后腰回撤接应模板",
    category: "出球组织",
    description: "后腰回撤到中卫之间或身前，帮助后场摆脱第一道逼抢。",
    suitableFor: ["后场出球", "校园足球", "基础教练"],
    fieldView: "half",
    format: "11v11/8v8",
    tags: ["后腰", "接应", "后场出球"],
    difficulty: "基础",
    recommendedMode: "半场讲解",
    steps: [
      step(
        0,
        "后场控球",
        "中卫控球时，后腰先观察身后和两侧空间。",
        board(
          [
            home("p1", "1", 12, 32),
            home("p4", "4", 30, 40),
            home("p5", "5", 30, 24),
            home("p6", "6", 46, 32),
            home("p8", "8", 58, 42),
            home("p10", "10", 60, 22),
          ],
          [
            away("o9", "9", 48, 32),
            away("o7", "7", 54, 45),
            away("o11", "11", 54, 19),
          ],
          ball(30, 40, "p4"),
        ),
      ),
      step(
        1,
        "后腰回撤",
        "后腰回到两个中卫之间，形成新的接球点。",
        board(
          [
            home("p1", "1", 12, 32),
            home("p4", "4", 32, 42),
            home("p5", "5", 32, 22),
            home("p6", "6", 34, 32),
            home("p8", "8", 60, 42),
            home("p10", "10", 60, 22),
          ],
          [
            away("o9", "9", 48, 32),
            away("o7", "7", 56, 45),
            away("o11", "11", 56, 19),
          ],
          ball(34, 32, "p6"),
        ),
        [
          run("tpl_pivot_s1_p6", { x: 46, y: 32 }, { x: 34, y: 32 }),
          pass("tpl_pivot_s1_pass", { x: 30, y: 40 }, { x: 34, y: 32 }),
        ],
      ),
      step(
        2,
        "两侧拉开",
        "两个中卫和中场拉开，后腰可以向弱侧转移。",
        board(
          [
            home("p1", "1", 12, 32),
            home("p4", "4", 34, 46),
            home("p5", "5", 34, 18),
            home("p6", "6", 36, 32),
            home("p8", "8", 62, 44),
            home("p10", "10", 62, 20),
          ],
          [
            away("o9", "9", 50, 32),
            away("o7", "7", 58, 45),
            away("o11", "11", 58, 19),
          ],
          ball(62, 20, "p10"),
        ),
        [
          run("tpl_pivot_s2_p4", { x: 32, y: 42 }, { x: 34, y: 46 }),
          run("tpl_pivot_s2_p5", { x: 32, y: 22 }, { x: 34, y: 18 }),
          pass("tpl_pivot_s2_pass", { x: 36, y: 32 }, { x: 62, y: 20 }),
        ],
      ),
      step(
        3,
        "向前推进",
        "接球中场转身后，前方队友同步前插。",
        board(
          [
            home("p1", "1", 12, 32),
            home("p4", "4", 34, 46),
            home("p5", "5", 34, 18),
            home("p6", "6", 38, 32),
            home("p8", "8", 66, 44),
            home("p10", "10", 68, 20),
          ],
          [
            away("o9", "9", 52, 32),
            away("o7", "7", 60, 45),
            away("o11", "11", 60, 19),
          ],
          ball(68, 20, "p10"),
        ),
        [
          run("tpl_pivot_s3_p10", { x: 62, y: 20 }, { x: 68, y: 20 }),
          run("tpl_pivot_s3_p8", { x: 62, y: 44 }, { x: 66, y: 44 }),
        ],
      ),
    ],
  }),

  makeTemplate({
    id: "template_defensive_line_shift",
    name: "防线整体横移模板",
    category: "防守联动",
    description: "防线根据球所在边路整体横移，保持距离和保护中路。",
    suitableFor: ["防守训练", "青训基础", "业余球队"],
    fieldView: "half",
    format: "7v7/11v11",
    tags: ["防线", "横移", "保护"],
    difficulty: "基础",
    recommendedMode: "半场讲解",
    steps: [
      step(
        0,
        "中路防守",
        "后卫线先保持横向距离，中场在身前保护。",
        board(
          [
            home("p2", "2", 55, 52),
            home("p4", "4", 48, 40),
            home("p5", "5", 48, 24),
            home("p3", "3", 55, 12),
            home("p6", "6", 62, 32),
            home("p8", "8", 70, 42),
          ],
          [
            away("o7", "7", 76, 52),
            away("o9", "9", 80, 32),
            away("o11", "11", 76, 12),
            away("o10", "10", 70, 32),
          ],
          ball(70, 32, "o10"),
        ),
      ),
      step(
        1,
        "球到边路",
        "球到右路时，防线一起向有球侧移动。",
        board(
          [
            home("p2", "2", 62, 54),
            home("p4", "4", 54, 42),
            home("p5", "5", 54, 27),
            home("p3", "3", 60, 16),
            home("p6", "6", 68, 36),
            home("p8", "8", 74, 46),
          ],
          [
            away("o7", "7", 80, 54),
            away("o9", "9", 82, 32),
            away("o11", "11", 76, 12),
            away("o10", "10", 74, 42),
          ],
          ball(80, 54, "o7"),
        ),
        [
          run("tpl_shift_s1_p2", { x: 55, y: 52 }, { x: 62, y: 54 }),
          run("tpl_shift_s1_p4", { x: 48, y: 40 }, { x: 54, y: 42 }),
          run("tpl_shift_s1_p5", { x: 48, y: 24 }, { x: 54, y: 27 }),
          pass("tpl_shift_s1_pass", { x: 70, y: 32 }, { x: 80, y: 54 }),
        ],
      ),
      step(
        2,
        "保护肋部",
        "中卫和后腰保护肋部，不让对手直塞中路。",
        board(
          [
            home("p2", "2", 65, 55),
            home("p4", "4", 58, 43),
            home("p5", "5", 56, 29),
            home("p3", "3", 62, 18),
            home("p6", "6", 70, 38),
            home("p8", "8", 76, 48),
          ],
          [
            away("o7", "7", 82, 55),
            away("o9", "9", 82, 32),
            away("o11", "11", 76, 12),
            away("o10", "10", 76, 42),
          ],
          ball(82, 55, "o7"),
        ),
        [
          run("tpl_shift_s2_p4", { x: 54, y: 42 }, { x: 58, y: 43 }),
          run("tpl_shift_s2_p6", { x: 68, y: 36 }, { x: 70, y: 38 }),
        ],
      ),
      step(
        3,
        "弱侧收紧",
        "远端边后卫向中路收，保证门前人数。",
        board(
          [
            home("p2", "2", 66, 55),
            home("p4", "4", 59, 43),
            home("p5", "5", 58, 30),
            home("p3", "3", 64, 22),
            home("p6", "6", 72, 38),
            home("p8", "8", 78, 48),
          ],
          [
            away("o7", "7", 84, 55),
            away("o9", "9", 84, 32),
            away("o11", "11", 78, 12),
            away("o10", "10", 78, 42),
          ],
          ball(84, 55, "o7"),
        ),
        [run("tpl_shift_s3_p3", { x: 62, y: 18 }, { x: 64, y: 22 })],
      ),
    ],
  }),

  makeTemplate({
    id: "template_high_press_basic",
    name: "高位逼抢基础模板",
    category: "防守联动",
    description: "前场三人统一方向逼抢，后方队员前压保持距离。",
    suitableFor: ["高位逼抢入门", "校园足球", "业余球队"],
    fieldView: "half",
    format: "7v7/11v11",
    tags: ["逼抢", "压迫", "协防"],
    difficulty: "基础",
    recommendedMode: "半场讲解",
    steps: [
      step(
        0,
        "对方后场控球",
        "先确认第一逼抢点和身后保护位置。",
        board(
          [
            home("p9", "9", 70, 32),
            home("p7", "7", 66, 50),
            home("p11", "11", 66, 14),
            home("p8", "8", 55, 40),
            home("p6", "6", 52, 26),
          ],
          [
            away("o1", "1", 90, 32),
            away("o4", "4", 78, 42),
            away("o5", "5", 78, 22),
            away("o6", "6", 68, 32),
          ],
          ball(78, 42, "o4"),
        ),
      ),
      step(
        1,
        "中锋压迫",
        "中锋先压向持球中卫，逼迫对手往边路出球。",
        board(
          [
            home("p9", "9", 76, 38),
            home("p7", "7", 70, 52),
            home("p11", "11", 68, 16),
            home("p8", "8", 58, 42),
            home("p6", "6", 54, 28),
          ],
          [
            away("o1", "1", 90, 32),
            away("o4", "4", 80, 43),
            away("o5", "5", 78, 22),
            away("o6", "6", 69, 32),
          ],
          ball(80, 43, "o4"),
        ),
        [
          run("tpl_press_s1_p9", { x: 70, y: 32 }, { x: 76, y: 38 }),
          run("tpl_press_s1_p7", { x: 66, y: 50 }, { x: 70, y: 52 }),
        ],
      ),
      step(
        2,
        "边锋封边",
        "边锋封住边路回传线路，中场向前保护二点。",
        board(
          [
            home("p9", "9", 80, 42),
            home("p7", "7", 78, 55),
            home("p11", "11", 70, 17),
            home("p8", "8", 64, 44),
            home("p6", "6", 58, 30),
          ],
          [
            away("o1", "1", 90, 32),
            away("o4", "4", 82, 44),
            away("o5", "5", 78, 22),
            away("o6", "6", 70, 32),
          ],
          ball(82, 44, "o4"),
        ),
        [
          run("tpl_press_s2_p7", { x: 70, y: 52 }, { x: 78, y: 55 }),
          run("tpl_press_s2_p8", { x: 58, y: 42 }, { x: 64, y: 44 }),
        ],
      ),
      step(
        3,
        "整体前压",
        "后方队员跟上，保持前后距离，准备抢第二点。",
        board(
          [
            home("p9", "9", 82, 43),
            home("p7", "7", 82, 55),
            home("p11", "11", 74, 18),
            home("p8", "8", 68, 44),
            home("p6", "6", 62, 31),
          ],
          [
            away("o1", "1", 90, 32),
            away("o4", "4", 84, 45),
            away("o5", "5", 80, 22),
            away("o6", "6", 72, 32),
          ],
          ball(84, 45, "o4"),
        ),
        [
          run("tpl_press_s3_p11", { x: 70, y: 17 }, { x: 74, y: 18 }),
          run("tpl_press_s3_p6", { x: 58, y: 30 }, { x: 62, y: 31 }),
        ],
      ),
    ],
  }),

  makeTemplate({
    id: "template_counter_after_win",
    name: "抢断后快速反击模板",
    category: "攻防转换",
    description: "抢断后第一脚向前，边路和中路同步前插形成反击。",
    suitableFor: ["攻防转换", "青训比赛讲解", "业余球队"],
    fieldView: "half",
    format: "7v7/11v11",
    tags: ["反击", "抢断", "向前"],
    difficulty: "基础",
    recommendedMode: "半场讲解",
    steps: [
      step(
        0,
        "中场抢断前",
        "先看中场压迫位置和前方两个反击点。",
        board(
          [
            home("p6", "6", 54, 36),
            home("p8", "8", 58, 46),
            home("p7", "7", 66, 52),
            home("p10", "10", 66, 26),
            home("p9", "9", 78, 34),
          ],
          [
            away("o6", "6", 58, 36),
            away("o3", "3", 78, 50),
            away("o4", "4", 84, 34),
            away("o5", "5", 78, 18),
          ],
          ball(58, 36, "o6"),
        ),
      ),
      step(
        1,
        "完成抢断",
        "6 号抢到球后，第一眼先看前方空间。",
        board(
          [
            home("p6", "6", 58, 36),
            home("p8", "8", 60, 46),
            home("p7", "7", 68, 52),
            home("p10", "10", 68, 26),
            home("p9", "9", 80, 34),
          ],
          [
            away("o6", "6", 60, 38),
            away("o3", "3", 78, 50),
            away("o4", "4", 84, 34),
            away("o5", "5", 78, 18),
          ],
          ball(58, 36, "p6"),
        ),
        [
          run("tpl_counter_s1_p6", { x: 54, y: 36 }, { x: 58, y: 36 }),
          run("tpl_counter_s1_o6", { x: 58, y: 36 }, { x: 60, y: 38 }),
        ],
      ),
      step(
        2,
        "第一脚向前",
        "抢断后快速把球传到前方空当，队友同步启动。",
        board(
          [
            home("p6", "6", 60, 36),
            home("p8", "8", 64, 46),
            home("p7", "7", 76, 54),
            home("p10", "10", 74, 24),
            home("p9", "9", 84, 34),
          ],
          [
            away("o6", "6", 62, 40),
            away("o3", "3", 80, 51),
            away("o4", "4", 86, 34),
            away("o5", "5", 80, 18),
          ],
          ball(76, 54, "p7"),
        ),
        [
          run("tpl_counter_s2_p7", { x: 68, y: 52 }, { x: 76, y: 54 }),
          run("tpl_counter_s2_p10", { x: 68, y: 26 }, { x: 74, y: 24 }),
          run("tpl_counter_s2_p9", { x: 80, y: 34 }, { x: 84, y: 34 }),
          pass("tpl_counter_s2_pass", { x: 60, y: 36 }, { x: 76, y: 54 }),
        ],
      ),
      step(
        3,
        "形成反击",
        "边路带球推进，中路队友前插接应最后一传。",
        board(
          [
            home("p6", "6", 62, 38),
            home("p8", "8", 68, 46),
            home("p7", "7", 86, 54),
            home("p10", "10", 82, 24),
            home("p9", "9", 90, 34),
          ],
          [
            away("o6", "6", 64, 42),
            away("o3", "3", 84, 52),
            away("o4", "4", 88, 35),
            away("o5", "5", 84, 18),
          ],
          ball(86, 54, "p7"),
        ),
        [
          run("tpl_counter_s3_p7", { x: 76, y: 54 }, { x: 86, y: 54 }),
          run("tpl_counter_s3_p9", { x: 84, y: 34 }, { x: 90, y: 34 }),
        ],
      ),
    ],
  }),
];

export function getTemplateById(templateId) {
  return TACTIC_TEMPLATES.find((template) => template.id === templateId) ?? null;
}

export function createTemplateAppState(template) {
  const clonedTemplate = clonePlain(template);
  const now = new Date().toISOString();

  return {
    steps: clonedTemplate.steps,
    activeStepId: clonedTemplate.steps[0]?.id ?? "step_0",
    fieldView: clonedTemplate.field?.view ?? "half",
    tacticMeta: {
      id: `tactic_${Date.now()}`,
      title: `${clonedTemplate.name} 副本`,
      createdAt: now,
      updatedAt: now,
      source: "template_copy",
      sourceTemplateId: clonedTemplate.id,
      sourceTemplateName: clonedTemplate.name,
    },
  };
}

function makeTemplate({
  id,
  name,
  category,
  description,
  suitableFor,
  fieldView,
  format,
  tags,
  difficulty,
  recommendedMode,
  steps,
}) {
  const normalizedSteps = steps.map((templateStep, index) => ({
    ...templateStep,
    order: index,
    baseStateFromStepId: index === 0 ? null : `step_${index - 1}`,
  }));
  const initialState = normalizedSteps[0].state;

  return {
    id,
    name,
    category,
    description,
    suitableFor,
    field: {
      id: "field_football_v1",
      type: "football",
      format,
      view: fieldView,
      orientation: "landscape",
      size: FIELD_SIZE,
    },
    players: clonePieces(initialState.players),
    opponents: clonePieces(initialState.opponents),
    ball: cloneBall(initialState.ball),
    steps: normalizedSteps,
    paths: normalizedSteps.flatMap((templateStep) =>
      templateStep.paths.map((pathItem) => ({
        ...pathItem,
        stepId: templateStep.id,
      })),
    ),
    notes: normalizedSteps.map((templateStep) => templateStep.note),
    tags,
    difficulty,
    recommendedMode,
  };
}

function step(order, title, note, state, paths = []) {
  return {
    id: `step_${order}`,
    order,
    title: `Step ${order} ${title}`,
    label: title,
    note,
    baseStateFromStepId: order === 0 ? null : `step_${order - 1}`,
    state,
    paths,
  };
}

function board(players, opponents, ballState) {
  return {
    players,
    opponents,
    ball: ballState,
  };
}

function home(id, number, x, y) {
  return {
    id,
    teamId: "team_home",
    number,
    position: { x, y },
  };
}

function away(id, number, x, y) {
  return {
    id,
    teamId: "team_away",
    number,
    position: { x, y },
  };
}

function ball(x, y, ownerPlayerId) {
  return {
    id: "ball_1",
    position: { x, y },
    ownerPlayerId,
  };
}

function run(id, from, to, via = null) {
  return path(id, "run", from, to, via);
}

function pass(id, from, to, via = null) {
  return path(id, "pass", from, to, via);
}

function path(id, type, from, to, via) {
  return {
    id,
    type,
    from,
    to,
    points: via ? [from, via, to] : [from, to],
  };
}

function clonePieces(pieces) {
  return pieces.map((piece) => ({
    ...piece,
    position: { ...piece.position },
  }));
}

function cloneBall(ballState) {
  return ballState
    ? {
        ...ballState,
        position: { ...ballState.position },
      }
    : null;
}

function clonePlain(value) {
  return JSON.parse(JSON.stringify(value));
}
