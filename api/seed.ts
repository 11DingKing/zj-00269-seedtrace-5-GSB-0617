import db from "./database.js";

const count = db.prepare("SELECT COUNT(*) as c FROM seed_sources").get() as {
  c: number;
};

const alreadySeeded = count.c > 0;
if (alreadySeeded) {
  console.log("种子数据已存在，跳过初始化");
}

if (process.env.SKIP_SEED === "true") {
  // 跳过种子数据初始化
}

const insertSeedSource = db.prepare(
  "INSERT INTO seed_sources (name, location, species, description) VALUES (?, ?, ?, ?)",
);
const insertSeedBatch = db.prepare(
  "INSERT INTO seed_batches (batch_code, seed_source_id, quantity, unit, harvest_date, responsible_person) VALUES (?, ?, ?, ?, ?, ?)",
);
const insertNurseryBatch = db.prepare(
  "INSERT INTO nursery_batches (batch_code, seed_batch_id, nursery_name, quantity, planting_date, responsible_person) VALUES (?, ?, ?, ?, ?, ?)",
);
const insertSeedlingBatch = db.prepare(
  "INSERT INTO seedling_batches (batch_code, nursery_batch_id, quantity, out_date, responsible_person) VALUES (?, ?, ?, ?, ?)",
);
const insertPromotionSite = db.prepare(
  "INSERT INTO promotion_sites (name, address, responsible_person, contact_phone) VALUES (?, ?, ?, ?)",
);
const insertDispatchOrder = db.prepare(
  "INSERT INTO dispatch_orders (order_code, seedling_batch_id, promotion_site_id, quantity, dispatch_date, status) VALUES (?, ?, ?, ?, ?, ?)",
);
const insertInspection = db.prepare(
  'INSERT INTO quality_inspections (batch_type, batch_id, result, items, "values", inspector, inspect_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
);
const insertWarning = db.prepare(
  "INSERT INTO warnings (batch_type, batch_id, batch_code, reason, affected_seedling_batches, affected_dispatch_orders, affected_promotion_sites, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
);

const seed = db.transaction(() => {
  const ss1 = insertSeedSource.run(
    "马尔康云杉母树林",
    "四川省阿坝州马尔康市",
    "云杉",
    "川西高原原生云杉母树林，海拔2800-3200m",
  );
  const ss2 = insertSeedSource.run(
    "小金云杉优树采种基地",
    "四川省阿坝州小金县",
    "云杉",
    "经子代测定筛选的优树无性系采种基地",
  );
  const ss3 = insertSeedSource.run(
    "丹巴云杉种子园",
    "四川省甘孜州丹巴县",
    "云杉",
    "省级良种基地，建园材料经遗传评估",
  );

  const sb1 = insertSeedBatch.run(
    "ZZ-2023-001",
    ss1.lastInsertRowid,
    50,
    "kg",
    "2023-09-15",
    "王建国",
  );
  const sb2 = insertSeedBatch.run(
    "ZZ-2023-002",
    ss2.lastInsertRowid,
    30,
    "kg",
    "2023-10-01",
    "李志强",
  );
  const sb3 = insertSeedBatch.run(
    "ZZ-2024-001",
    ss3.lastInsertRowid,
    40,
    "kg",
    "2024-09-20",
    "张明远",
  );
  const sb4 = insertSeedBatch.run(
    "ZZ-2024-002",
    ss1.lastInsertRowid,
    35,
    "kg",
    "2024-10-05",
    "王建国",
  );

  insertInspection.run(
    "seed",
    sb1.lastInsertRowid,
    "qualified",
    "发芽率,净度,含水量",
    "92%,98%,8.5%",
    "陈检测",
    "2023-10-20",
  );
  insertInspection.run(
    "seed",
    sb2.lastInsertRowid,
    "qualified",
    "发芽率,净度,含水量",
    "89%,97%,9.0%",
    "陈检测",
    "2023-10-25",
  );
  insertInspection.run(
    "seed",
    sb3.lastInsertRowid,
    "qualified",
    "发芽率,净度,含水量",
    "94%,99%,7.8%",
    "刘检测",
    "2024-10-28",
  );
  insertInspection.run(
    "seed",
    sb4.lastInsertRowid,
    "qualified",
    "发芽率,净度,含水量",
    "91%,97%,8.2%",
    "刘检测",
    "2024-10-30",
  );

  const nb1 = insertNurseryBatch.run(
    "YM-2024-001",
    sb1.lastInsertRowid,
    "马尔康中心苗圃",
    20000,
    "2024-03-10",
    "赵育苗",
  );
  const nb2 = insertNurseryBatch.run(
    "YM-2024-002",
    sb2.lastInsertRowid,
    "小金林业苗圃",
    12000,
    "2024-03-15",
    "钱育苗",
  );
  const nb3 = insertNurseryBatch.run(
    "YM-2024-003",
    sb3.lastInsertRowid,
    "丹巴良种苗圃",
    16000,
    "2024-03-20",
    "孙育苗",
  );
  const nb4 = insertNurseryBatch.run(
    "YM-2024-004",
    sb4.lastInsertRowid,
    "马尔康中心苗圃",
    15000,
    "2024-04-01",
    "赵育苗",
  );

  insertInspection.run(
    "nursery",
    nb1.lastInsertRowid,
    "qualified",
    "苗高,地径,根系",
    "25cm,3.5mm,发达",
    "周检测",
    "2025-06-01",
  );
  insertInspection.run(
    "nursery",
    nb2.lastInsertRowid,
    "qualified",
    "苗高,地径,根系",
    "22cm,3.2mm,良好",
    "周检测",
    "2025-06-02",
  );
  insertInspection.run(
    "nursery",
    nb3.lastInsertRowid,
    "unqualified",
    "苗高,地径,根系,病害",
    "20cm,2.8mm,一般,检出立枯病",
    "周检测",
    "2025-06-03",
  );
  insertInspection.run(
    "nursery",
    nb4.lastInsertRowid,
    "qualified",
    "苗高,地径,根系",
    "24cm,3.4mm,发达",
    "周检测",
    "2025-06-05",
  );

  const cp1 = insertSeedlingBatch.run(
    "CP-2025-001",
    nb1.lastInsertRowid,
    18000,
    "2025-10-15",
    "赵育苗",
  );
  const cp2 = insertSeedlingBatch.run(
    "CP-2025-002",
    nb2.lastInsertRowid,
    10000,
    "2025-10-20",
    "钱育苗",
  );
  const cp3 = insertSeedlingBatch.run(
    "CP-2025-003",
    nb3.lastInsertRowid,
    14000,
    "2025-10-25",
    "孙育苗",
  );
  const cp4 = insertSeedlingBatch.run(
    "CP-2025-004",
    nb4.lastInsertRowid,
    13000,
    "2025-11-01",
    "赵育苗",
  );

  insertInspection.run(
    "seedling",
    cp1.lastInsertRowid,
    "qualified",
    "苗高,地径,根系,病虫害",
    "35cm,5.2mm,发达,无",
    "吴检测",
    "2025-11-10",
  );
  insertInspection.run(
    "seedling",
    cp2.lastInsertRowid,
    "qualified",
    "苗高,地径,根系,病虫害",
    "32cm,4.8mm,良好,无",
    "吴检测",
    "2025-11-12",
  );
  insertInspection.run(
    "seedling",
    cp3.lastInsertRowid,
    "unqualified",
    "苗高,地径,根系,病虫害",
    "28cm,3.9mm,一般,检出立枯病携带",
    "吴检测",
    "2025-11-14",
  );
  insertInspection.run(
    "seedling",
    cp4.lastInsertRowid,
    "qualified",
    "苗高,地径,根系,病虫害",
    "34cm,5.0mm,发达,无",
    "吴检测",
    "2025-11-15",
  );

  const ps1 = insertPromotionSite.run(
    "金川县生态修复项目",
    "四川省阿坝州金川县",
    "刘造林",
    "13800001111",
  );
  const ps2 = insertPromotionSite.run(
    "理县退耕还林工程",
    "四川省阿坝州理县",
    "陈造林",
    "13800002222",
  );
  const ps3 = insertPromotionSite.run(
    "康定市荒山绿化项目",
    "四川省甘孜州康定市",
    "杨造林",
    "13800003333",
  );
  const ps4 = insertPromotionSite.run(
    "泸定县生态屏障建设",
    "四川省甘孜州泸定县",
    "黄造林",
    "13800004444",
  );

  const dy1 = insertDispatchOrder.run(
    "DY-2025-001",
    cp1.lastInsertRowid,
    ps1.lastInsertRowid,
    8000,
    "2025-11-20",
    "received",
  );
  const dy2 = insertDispatchOrder.run(
    "DY-2025-002",
    cp1.lastInsertRowid,
    ps2.lastInsertRowid,
    6000,
    "2025-11-22",
    "received",
  );
  const dy3 = insertDispatchOrder.run(
    "DY-2025-003",
    cp2.lastInsertRowid,
    ps2.lastInsertRowid,
    5000,
    "2025-11-25",
    "delivered",
  );
  const dy4 = insertDispatchOrder.run(
    "DY-2025-004",
    cp2.lastInsertRowid,
    ps3.lastInsertRowid,
    5000,
    "2025-11-28",
    "delivered",
  );
  const dy5 = insertDispatchOrder.run(
    "DY-2025-005",
    cp3.lastInsertRowid,
    ps3.lastInsertRowid,
    7000,
    "2025-12-01",
    "pending",
  );
  const dy6 = insertDispatchOrder.run(
    "DY-2025-006",
    cp3.lastInsertRowid,
    ps4.lastInsertRowid,
    5000,
    "2025-12-03",
    "pending",
  );
  const dy7 = insertDispatchOrder.run(
    "DY-2025-007",
    cp4.lastInsertRowid,
    ps1.lastInsertRowid,
    7000,
    "2025-12-05",
    "delivered",
  );
  const dy8 = insertDispatchOrder.run(
    "DY-2025-008",
    cp4.lastInsertRowid,
    ps4.lastInsertRowid,
    4000,
    "2025-12-08",
    "pending",
  );

  insertWarning.run(
    "nursery",
    nb3.lastInsertRowid,
    "YM-2024-003",
    "检出立枯病，苗木质量不达标",
    JSON.stringify([cp3.lastInsertRowid]),
    JSON.stringify([dy5.lastInsertRowid, dy6.lastInsertRowid]),
    JSON.stringify([ps3.lastInsertRowid, ps4.lastInsertRowid]),
    "active",
  );

  insertWarning.run(
    "seedling",
    cp3.lastInsertRowid,
    "CP-2025-003",
    "出圃苗木携带立枯病",
    JSON.stringify([cp3.lastInsertRowid]),
    JSON.stringify([dy5.lastInsertRowid, dy6.lastInsertRowid]),
    JSON.stringify([ps3.lastInsertRowid, ps4.lastInsertRowid]),
    "active",
  );
});

if (process.env.SKIP_SEED !== "true" && !alreadySeeded) {
  seed();
  console.log("种子数据初始化完成");
}
