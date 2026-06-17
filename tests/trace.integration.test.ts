import { describe, it, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { initTestEnv, clearDatabase, cleanupTestDb, app } from "./helpers";

describe("良种推广溯源全链路集成测试", () => {
  before(async () => {
    await initTestEnv();
  });

  beforeEach(() => {
    clearDatabase();
  });

  after(() => {
    cleanupTestDb();
  });

  describe("全链路正向流程：建种源→种子批次→育苗批次→出圃批次→调运单→推广点", () => {
    it("应能完整创建整条链路，并验证层层绑定关系正确", async () => {
      // 1. 建种源
      const seedSourceRes = await request(app).post("/api/seed-sources").send({
        name: "测试云杉母树林",
        location: "四川省测试市",
        species: "云杉",
        description: "集成测试用种源",
      });
      assert.equal(seedSourceRes.status, 201);
      const seedSource = seedSourceRes.body;
      assert.equal(seedSource.name, "测试云杉母树林");
      assert.ok(seedSource.id !== undefined);

      // 2. 建种子批次，绑定种源
      const seedBatchRes = await request(app).post("/api/seed-batches").send({
        batch_code: "ZZ-TEST-001",
        seed_source_id: seedSource.id,
        quantity: 100,
        unit: "kg",
        harvest_date: "2024-09-15",
        responsible_person: "测试员A",
      });
      assert.equal(seedBatchRes.status, 201);
      const seedBatch = seedBatchRes.body;
      assert.equal(seedBatch.batch_code, "ZZ-TEST-001");
      assert.equal(seedBatch.seed_source_id, seedSource.id);

      // 验证种子批次详情能查到关联的种源
      const seedBatchDetailRes = await request(app).get(
        `/api/seed-batches/${seedBatch.id}`,
      );
      assert.equal(seedBatchDetailRes.status, 200);
      assert.equal(seedBatchDetailRes.body.seed_source.id, seedSource.id);
      assert.equal(seedBatchDetailRes.body.seed_source.name, "测试云杉母树林");

      // 3. 建育苗批次，绑定种子批次
      const nurseryBatchRes = await request(app)
        .post("/api/nursery-batches")
        .send({
          batch_code: "YM-TEST-001",
          seed_batch_id: seedBatch.id,
          nursery_name: "测试中心苗圃",
          quantity: 50000,
          planting_date: "2024-03-10",
          responsible_person: "测试员B",
        });
      assert.equal(nurseryBatchRes.status, 201);
      const nurseryBatch = nurseryBatchRes.body;
      assert.equal(nurseryBatch.batch_code, "YM-TEST-001");
      assert.equal(nurseryBatch.seed_batch_id, seedBatch.id);

      // 验证育苗批次详情能查到关联的种子批次和种源
      const nurseryBatchDetailRes = await request(app).get(
        `/api/nursery-batches/${nurseryBatch.id}`,
      );
      assert.equal(nurseryBatchDetailRes.status, 200);
      assert.equal(nurseryBatchDetailRes.body.seed_batch.id, seedBatch.id);
      assert.equal(
        nurseryBatchDetailRes.body.seed_batch.seed_source.id,
        seedSource.id,
      );

      // 4. 建出圃批次，绑定育苗批次
      const seedlingBatchRes = await request(app)
        .post("/api/seedling-batches")
        .send({
          batch_code: "CP-TEST-001",
          nursery_batch_id: nurseryBatch.id,
          quantity: 45000,
          out_date: "2025-10-15",
          responsible_person: "测试员B",
        });
      assert.equal(seedlingBatchRes.status, 201);
      const seedlingBatch = seedlingBatchRes.body;
      assert.equal(seedlingBatch.batch_code, "CP-TEST-001");
      assert.equal(seedlingBatch.nursery_batch_id, nurseryBatch.id);

      // 验证出圃批次详情能查到关联的育苗、种子、种源
      const seedlingBatchDetailRes = await request(app).get(
        `/api/seedling-batches/${seedlingBatch.id}`,
      );
      assert.equal(seedlingBatchDetailRes.status, 200);
      assert.equal(
        seedlingBatchDetailRes.body.nursery_batch.id,
        nurseryBatch.id,
      );
      assert.equal(
        seedlingBatchDetailRes.body.nursery_batch.seed_batch.id,
        seedBatch.id,
      );
      assert.equal(
        seedlingBatchDetailRes.body.nursery_batch.seed_batch.seed_source.id,
        seedSource.id,
      );

      // 5. 建推广点
      const site1Res = await request(app).post("/api/promotion-sites").send({
        name: "测试推广点A",
        address: "测试县A乡",
        responsible_person: "测试员C",
        contact_phone: "13800000001",
      });
      assert.equal(site1Res.status, 201);
      const site1 = site1Res.body;

      const site2Res = await request(app).post("/api/promotion-sites").send({
        name: "测试推广点B",
        address: "测试县B乡",
        responsible_person: "测试员D",
        contact_phone: "13800000002",
      });
      assert.equal(site2Res.status, 201);
      const site2 = site2Res.body;

      // 6. 生成调运单，发到推广点
      const order1Res = await request(app).post("/api/dispatch-orders").send({
        seedling_batch_id: seedlingBatch.id,
        promotion_site_id: site1.id,
        quantity: 20000,
        dispatch_date: "2025-11-01",
      });
      assert.equal(order1Res.status, 201);
      const order1 = order1Res.body;
      assert.equal(order1.seedling_batch_id, seedlingBatch.id);
      assert.equal(order1.promotion_site_id, site1.id);

      const order2Res = await request(app).post("/api/dispatch-orders").send({
        seedling_batch_id: seedlingBatch.id,
        promotion_site_id: site2.id,
        quantity: 15000,
        dispatch_date: "2025-11-02",
      });
      assert.equal(order2Res.status, 201);
      const order2 = order2Res.body;
      assert.equal(order2.seedling_batch_id, seedlingBatch.id);
      assert.equal(order2.promotion_site_id, site2.id);

      // 7. 溯源接口验证：从种子批次号能追溯全链路
      const traceRes = await request(app).get(
        `/api/trace?batchCode=${seedBatch.batch_code}`,
      );
      assert.equal(traceRes.status, 200);
      const trace = traceRes.body;

      assert.equal(trace.seed_source.id, seedSource.id);
      assert.equal(trace.seed_source.name, "测试云杉母树林");
      assert.equal(trace.seed_batch.id, seedBatch.id);
      assert.equal(trace.seed_batch.batch_code, "ZZ-TEST-001");
      assert.equal(trace.nursery_batch.id, nurseryBatch.id);
      assert.equal(trace.nursery_batch.batch_code, "YM-TEST-001");
      assert.equal(trace.seedling_batch.id, seedlingBatch.id);
      assert.equal(trace.seedling_batch.batch_code, "CP-TEST-001");
      assert.equal(trace.dispatch_orders.length, 2);

      const siteIds = trace.promotion_sites
        .map((s: any) => s.id)
        .sort((a: number, b: number) => a - b);
      assert.deepEqual(
        siteIds,
        [site1.id, site2.id].sort((a, b) => a - b),
      );
    });

    it("溯源接口应支持从不同层级的批次号进行追溯", async () => {
      // 先创建完整链路
      const seedSourceRes = await request(app).post("/api/seed-sources").send({
        name: "溯源测试种源",
        location: "测试地",
        species: "云杉",
      });
      const seedSource = seedSourceRes.body;

      const seedBatchRes = await request(app).post("/api/seed-batches").send({
        batch_code: "ZZ-TRACE-001",
        seed_source_id: seedSource.id,
        quantity: 50,
        unit: "kg",
        harvest_date: "2024-09-01",
        responsible_person: "测试员",
      });
      const seedBatch = seedBatchRes.body;

      const nurseryBatchRes = await request(app)
        .post("/api/nursery-batches")
        .send({
          batch_code: "YM-TRACE-001",
          seed_batch_id: seedBatch.id,
          nursery_name: "测试苗圃",
          quantity: 10000,
          planting_date: "2024-03-01",
          responsible_person: "测试员",
        });
      const nurseryBatch = nurseryBatchRes.body;

      const seedlingBatchRes = await request(app)
        .post("/api/seedling-batches")
        .send({
          batch_code: "CP-TRACE-001",
          nursery_batch_id: nurseryBatch.id,
          quantity: 8000,
          out_date: "2025-10-01",
          responsible_person: "测试员",
        });
      const seedlingBatch = seedlingBatchRes.body;

      const siteRes = await request(app).post("/api/promotion-sites").send({
        name: "溯源测试点",
        address: "测试地址",
        responsible_person: "测试员",
        contact_phone: "13900000000",
      });
      const site = siteRes.body;

      await request(app).post("/api/dispatch-orders").send({
        seedling_batch_id: seedlingBatch.id,
        promotion_site_id: site.id,
        quantity: 5000,
        dispatch_date: "2025-11-01",
      });

      // 从育苗批次号追溯
      const traceFromNursery = await request(app).get(
        `/api/trace?batchCode=${nurseryBatch.batch_code}`,
      );
      assert.equal(traceFromNursery.status, 200);
      assert.equal(traceFromNursery.body.seed_batch.id, seedBatch.id);
      assert.equal(traceFromNursery.body.nursery_batch.id, nurseryBatch.id);
      assert.equal(traceFromNursery.body.seedling_batch.id, seedlingBatch.id);

      // 从出圃批次号追溯
      const traceFromSeedling = await request(app).get(
        `/api/trace?batchCode=${seedlingBatch.batch_code}`,
      );
      assert.equal(traceFromSeedling.status, 200);
      assert.equal(traceFromSeedling.body.seed_batch.id, seedBatch.id);
      assert.equal(traceFromSeedling.body.nursery_batch.id, nurseryBatch.id);
      assert.equal(traceFromSeedling.body.seedling_batch.id, seedlingBatch.id);
      assert.equal(traceFromSeedling.body.dispatch_orders.length, 1);
      assert.equal(traceFromSeedling.body.promotion_sites.length, 1);
    });
  });

  describe("质量问题触发预警：验证受影响范围计算", () => {
    async function createFullChain() {
      const seedSourceRes = await request(app).post("/api/seed-sources").send({
        name: "预警测试种源",
        location: "预警测试地",
        species: "云杉",
      });
      const seedSource = seedSourceRes.body;

      const seedBatchRes = await request(app).post("/api/seed-batches").send({
        batch_code: "ZZ-WARN-001",
        seed_source_id: seedSource.id,
        quantity: 80,
        unit: "kg",
        harvest_date: "2024-09-01",
        responsible_person: "测试员",
      });
      const seedBatch = seedBatchRes.body;

      const nurseryBatchRes = await request(app)
        .post("/api/nursery-batches")
        .send({
          batch_code: "YM-WARN-001",
          seed_batch_id: seedBatch.id,
          nursery_name: "预警测试苗圃",
          quantity: 30000,
          planting_date: "2024-03-01",
          responsible_person: "测试员",
        });
      const nurseryBatch = nurseryBatchRes.body;

      const seedlingBatchRes = await request(app)
        .post("/api/seedling-batches")
        .send({
          batch_code: "CP-WARN-001",
          nursery_batch_id: nurseryBatch.id,
          quantity: 25000,
          out_date: "2025-10-01",
          responsible_person: "测试员",
        });
      const seedlingBatch = seedlingBatchRes.body;

      const site1Res = await request(app).post("/api/promotion-sites").send({
        name: "预警测试点A",
        address: "预警县A",
        responsible_person: "测试员A",
        contact_phone: "13700000001",
      });
      const site1 = site1Res.body;

      const site2Res = await request(app).post("/api/promotion-sites").send({
        name: "预警测试点B",
        address: "预警县B",
        responsible_person: "测试员B",
        contact_phone: "13700000002",
      });
      const site2 = site2Res.body;

      const order1Res = await request(app).post("/api/dispatch-orders").send({
        seedling_batch_id: seedlingBatch.id,
        promotion_site_id: site1.id,
        quantity: 10000,
        dispatch_date: "2025-11-01",
      });
      const order1 = order1Res.body;

      const order2Res = await request(app).post("/api/dispatch-orders").send({
        seedling_batch_id: seedlingBatch.id,
        promotion_site_id: site2.id,
        quantity: 8000,
        dispatch_date: "2025-11-02",
      });
      const order2 = order2Res.body;

      return {
        seedSource,
        seedBatch,
        nurseryBatch,
        seedlingBatch,
        site1,
        site2,
        order1,
        order2,
      };
    }

    it("育苗批次质检不合格应自动生成预警，并正确计算受影响范围", async () => {
      const chain = await createFullChain();

      // 对育苗批次做不合格质检
      const inspectionRes = await request(app)
        .post("/api/quality-inspections")
        .send({
          batch_type: "nursery",
          batch_id: chain.nurseryBatch.id,
          result: "unqualified",
          items: "苗高,地径,病害",
          values: "不达标,不达标,检出立枯病",
          inspector: "检测员张",
          inspect_date: "2025-06-15",
        });
      assert.equal(inspectionRes.status, 201);

      // 验证预警已生成
      const warningsRes = await request(app).get("/api/warnings?status=active");
      assert.equal(warningsRes.status, 200);
      const warnings = warningsRes.body;

      const nurseryWarning = warnings.find(
        (w: any) =>
          w.batch_type === "nursery" && w.batch_id === chain.nurseryBatch.id,
      );
      assert.ok(nurseryWarning !== undefined);
      assert.equal(nurseryWarning.status, "active");
      assert.equal(nurseryWarning.batch_code, chain.nurseryBatch.batch_code);

      // 验证受影响的出圃批次
      const affectedSeedlingBatches = JSON.parse(
        nurseryWarning.affected_seedling_batches,
      );
      assert.ok(affectedSeedlingBatches.includes(chain.seedlingBatch.id));
      assert.equal(affectedSeedlingBatches.length, 1);

      // 验证受影响的调运单
      const affectedDispatchOrders = JSON.parse(
        nurseryWarning.affected_dispatch_orders,
      );
      const orderIds = [chain.order1.id, chain.order2.id].sort((a, b) => a - b);
      assert.deepEqual(
        affectedDispatchOrders.sort((a: number, b: number) => a - b),
        orderIds,
      );
      assert.equal(affectedDispatchOrders.length, 2);

      // 验证受影响的推广点
      const affectedPromotionSites = JSON.parse(
        nurseryWarning.affected_promotion_sites,
      );
      const siteIds = [chain.site1.id, chain.site2.id].sort((a, b) => a - b);
      assert.deepEqual(
        affectedPromotionSites.sort((a: number, b: number) => a - b),
        siteIds,
      );
      assert.equal(affectedPromotionSites.length, 2);

      // 验证预警影响范围接口返回正确
      const impactRes = await request(app).get(
        `/api/warnings/impact/nursery/${chain.nurseryBatch.id}`,
      );
      assert.equal(impactRes.status, 200);
      const impact = impactRes.body;

      assert.equal(impact.affected_seedling_batches.length, 1);
      assert.equal(
        impact.affected_seedling_batches[0].id,
        chain.seedlingBatch.id,
      );

      assert.equal(impact.affected_dispatch_orders.length, 2);
      const impactOrderIds = impact.affected_dispatch_orders
        .map((o: any) => o.id)
        .sort((a: number, b: number) => a - b);
      assert.deepEqual(impactOrderIds, orderIds);

      assert.equal(impact.affected_promotion_sites.length, 2);
      const impactSiteIds = impact.affected_promotion_sites
        .map((s: any) => s.id)
        .sort((a: number, b: number) => a - b);
      assert.deepEqual(impactSiteIds, siteIds);
    });

    it("种子批次质检不合格应能追溯到所有下游育苗、出圃和推广点", async () => {
      // 创建一个种子批次关联两个育苗批次的场景
      const seedSourceRes = await request(app).post("/api/seed-sources").send({
        name: "种子预警种源",
        location: "测试地",
        species: "云杉",
      });
      const seedSource = seedSourceRes.body;

      const seedBatchRes = await request(app).post("/api/seed-batches").send({
        batch_code: "ZZ-SEEDWARN-001",
        seed_source_id: seedSource.id,
        quantity: 200,
        unit: "kg",
        harvest_date: "2024-09-01",
        responsible_person: "测试员",
      });
      const seedBatch = seedBatchRes.body;

      const nursery1Res = await request(app).post("/api/nursery-batches").send({
        batch_code: "YM-SEEDWARN-001",
        seed_batch_id: seedBatch.id,
        nursery_name: "苗圃A",
        quantity: 50000,
        planting_date: "2024-03-01",
        responsible_person: "测试员",
      });
      const nursery1 = nursery1Res.body;

      const nursery2Res = await request(app).post("/api/nursery-batches").send({
        batch_code: "YM-SEEDWARN-002",
        seed_batch_id: seedBatch.id,
        nursery_name: "苗圃B",
        quantity: 40000,
        planting_date: "2024-03-05",
        responsible_person: "测试员",
      });
      const nursery2 = nursery2Res.body;

      const seedling1Res = await request(app)
        .post("/api/seedling-batches")
        .send({
          batch_code: "CP-SEEDWARN-001",
          nursery_batch_id: nursery1.id,
          quantity: 45000,
          out_date: "2025-10-01",
          responsible_person: "测试员",
        });
      const seedling1 = seedling1Res.body;

      const seedling2Res = await request(app)
        .post("/api/seedling-batches")
        .send({
          batch_code: "CP-SEEDWARN-002",
          nursery_batch_id: nursery2.id,
          quantity: 35000,
          out_date: "2025-10-05",
          responsible_person: "测试员",
        });
      const seedling2 = seedling2Res.body;

      const siteRes = await request(app).post("/api/promotion-sites").send({
        name: "种子预警测试点",
        address: "测试地址",
        responsible_person: "测试员",
        contact_phone: "13600000001",
      });
      const site = siteRes.body;

      await request(app).post("/api/dispatch-orders").send({
        seedling_batch_id: seedling1.id,
        promotion_site_id: site.id,
        quantity: 20000,
        dispatch_date: "2025-11-01",
      });

      await request(app).post("/api/dispatch-orders").send({
        seedling_batch_id: seedling2.id,
        promotion_site_id: site.id,
        quantity: 15000,
        dispatch_date: "2025-11-02",
      });

      // 对种子批次做不合格质检
      const inspectionRes = await request(app)
        .post("/api/quality-inspections")
        .send({
          batch_type: "seed",
          batch_id: seedBatch.id,
          result: "unqualified",
          items: "发芽率,纯度",
          values: "不达标,不达标",
          inspector: "检测员李",
          inspect_date: "2025-09-01",
        });
      assert.equal(inspectionRes.status, 201);

      // 验证种子批次预警
      const warningsRes = await request(app).get("/api/warnings?status=active");
      const seedWarning = warningsRes.body.find(
        (w: any) => w.batch_type === "seed" && w.batch_id === seedBatch.id,
      );
      assert.ok(seedWarning !== undefined);

      // 验证受影响的育苗批次有2个
      const impactRes = await request(app).get(
        `/api/warnings/impact/seed/${seedBatch.id}`,
      );
      assert.equal(impactRes.status, 200);
      const impact = impactRes.body;

      const seedlingIds = impact.affected_seedling_batches
        .map((s: any) => s.id)
        .sort((a: number, b: number) => a - b);
      assert.deepEqual(
        seedlingIds,
        [seedling1.id, seedling2.id].sort((a, b) => a - b),
      );

      assert.equal(impact.affected_dispatch_orders.length, 2);
      assert.equal(impact.affected_promotion_sites.length, 1);
      assert.equal(impact.affected_promotion_sites[0].id, site.id);
    });

    it("出圃批次质检不合格应正确计算受影响的调运单和推广点", async () => {
      const chain = await createFullChain();

      const inspectionRes = await request(app)
        .post("/api/quality-inspections")
        .send({
          batch_type: "seedling",
          batch_id: chain.seedlingBatch.id,
          result: "unqualified",
          items: "苗高,根系",
          values: "不达标,发育不良",
          inspector: "检测员王",
          inspect_date: "2025-11-10",
        });
      assert.equal(inspectionRes.status, 201);

      const warningsRes = await request(app).get("/api/warnings?status=active");
      const seedlingWarning = warningsRes.body.find(
        (w: any) =>
          w.batch_type === "seedling" && w.batch_id === chain.seedlingBatch.id,
      );
      assert.ok(seedlingWarning !== undefined);
      assert.equal(seedlingWarning.batch_code, chain.seedlingBatch.batch_code);

      const affectedSeedlingBatches = JSON.parse(
        seedlingWarning.affected_seedling_batches,
      );
      assert.deepEqual(affectedSeedlingBatches, [chain.seedlingBatch.id]);

      const affectedDispatchOrders = JSON.parse(
        seedlingWarning.affected_dispatch_orders,
      );
      const orderIds = [chain.order1.id, chain.order2.id].sort((a, b) => a - b);
      assert.deepEqual(
        affectedDispatchOrders.sort((a: number, b: number) => a - b),
        orderIds,
      );

      const affectedPromotionSites = JSON.parse(
        seedlingWarning.affected_promotion_sites,
      );
      const siteIds = [chain.site1.id, chain.site2.id].sort((a, b) => a - b);
      assert.deepEqual(
        affectedPromotionSites.sort((a: number, b: number) => a - b),
        siteIds,
      );

      const impactRes = await request(app).get(
        `/api/warnings/impact/seedling/${chain.seedlingBatch.id}`,
      );
      assert.equal(impactRes.status, 200);
      assert.equal(impactRes.body.affected_seedling_batches.length, 1);
      assert.equal(impactRes.body.affected_dispatch_orders.length, 2);
      assert.equal(impactRes.body.affected_promotion_sites.length, 2);
    });

    it("预警应能标记为已解决", async () => {
      const chain = await createFullChain();

      const inspectionRes = await request(app)
        .post("/api/quality-inspections")
        .send({
          batch_type: "nursery",
          batch_id: chain.nurseryBatch.id,
          result: "unqualified",
          items: "病害",
          values: "检出立枯病",
          inspector: "检测员",
          inspect_date: "2025-06-15",
        });
      assert.equal(inspectionRes.status, 201);

      const warningsRes = await request(app).get("/api/warnings?status=active");
      const warning = warningsRes.body.find(
        (w: any) =>
          w.batch_type === "nursery" && w.batch_id === chain.nurseryBatch.id,
      );
      assert.ok(warning !== undefined);
      assert.equal(warning.status, "active");
      assert.equal(warning.resolved_at, null);

      const resolveRes = await request(app)
        .patch(`/api/warnings/${warning.id}`)
        .send({});
      assert.equal(resolveRes.status, 200);
      assert.equal(resolveRes.body.status, "resolved");
      assert.ok(resolveRes.body.resolved_at !== null);

      const activeWarningsRes = await request(app).get(
        "/api/warnings?status=active",
      );
      const stillActive = activeWarningsRes.body.find(
        (w: any) => w.id === warning.id,
      );
      assert.ok(stillActive === undefined);

      const allWarningsRes = await request(app).get("/api/warnings");
      const resolvedWarning = allWarningsRes.body.find(
        (w: any) => w.id === warning.id,
      );
      assert.ok(resolvedWarning !== undefined);
      assert.equal(resolvedWarning.status, "resolved");
    });
  });

  describe("边界测试", () => {
    it("溯源接口查询不存在的批次号应返回404", async () => {
      const traceRes = await request(app).get(
        "/api/trace?batchCode=NOT-EXIST-12345",
      );
      assert.equal(traceRes.status, 404);
      assert.ok(traceRes.body.error !== undefined);
    });

    it("溯源接口不提供batchCode参数应返回400", async () => {
      const traceRes = await request(app).get("/api/trace");
      assert.equal(traceRes.status, 400);
    });

    it("没有下游的育苗批次被判为质量问题时，受影响范围应为空", async () => {
      // 创建种源、种子批次、育苗批次，但不创建出圃批次
      const seedSourceRes = await request(app).post("/api/seed-sources").send({
        name: "孤立测试种源",
        location: "测试地",
        species: "云杉",
      });
      const seedSource = seedSourceRes.body;

      const seedBatchRes = await request(app).post("/api/seed-batches").send({
        batch_code: "ZZ-ISO-001",
        seed_source_id: seedSource.id,
        quantity: 50,
        unit: "kg",
        harvest_date: "2024-09-01",
        responsible_person: "测试员",
      });
      const seedBatch = seedBatchRes.body;

      const nurseryBatchRes = await request(app)
        .post("/api/nursery-batches")
        .send({
          batch_code: "YM-ISO-001",
          seed_batch_id: seedBatch.id,
          nursery_name: "孤立测试苗圃",
          quantity: 10000,
          planting_date: "2024-03-01",
          responsible_person: "测试员",
        });
      const nurseryBatch = nurseryBatchRes.body;

      // 对育苗批次做不合格质检
      const inspectionRes = await request(app)
        .post("/api/quality-inspections")
        .send({
          batch_type: "nursery",
          batch_id: nurseryBatch.id,
          result: "unqualified",
          items: "苗高",
          values: "不达标",
          inspector: "检测员",
          inspect_date: "2025-06-01",
        });
      assert.equal(inspectionRes.status, 201);

      // 验证预警存在
      const warningsRes = await request(app).get("/api/warnings?status=active");
      const warning = warningsRes.body.find(
        (w: any) =>
          w.batch_type === "nursery" && w.batch_id === nurseryBatch.id,
      );
      assert.ok(warning !== undefined);

      // 验证受影响范围都是空
      const affectedSeedlingBatches = JSON.parse(
        warning.affected_seedling_batches,
      );
      const affectedDispatchOrders = JSON.parse(
        warning.affected_dispatch_orders,
      );
      const affectedPromotionSites = JSON.parse(
        warning.affected_promotion_sites,
      );

      assert.deepEqual(affectedSeedlingBatches, []);
      assert.deepEqual(affectedDispatchOrders, []);
      assert.deepEqual(affectedPromotionSites, []);

      // 验证影响范围接口
      const impactRes = await request(app).get(
        `/api/warnings/impact/nursery/${nurseryBatch.id}`,
      );
      assert.equal(impactRes.status, 200);
      assert.deepEqual(impactRes.body.affected_seedling_batches, []);
      assert.deepEqual(impactRes.body.affected_dispatch_orders, []);
      assert.deepEqual(impactRes.body.affected_promotion_sites, []);
    });

    it("同一个出圃批次发往多个推广点时，受牵连推广点应去重不重复计算", async () => {
      const seedSourceRes = await request(app).post("/api/seed-sources").send({
        name: "去重测试种源",
        location: "测试地",
        species: "云杉",
      });
      const seedSource = seedSourceRes.body;

      const seedBatchRes = await request(app).post("/api/seed-batches").send({
        batch_code: "ZZ-DEDUP-001",
        seed_source_id: seedSource.id,
        quantity: 50,
        unit: "kg",
        harvest_date: "2024-09-01",
        responsible_person: "测试员",
      });
      const seedBatch = seedBatchRes.body;

      const nurseryBatchRes = await request(app)
        .post("/api/nursery-batches")
        .send({
          batch_code: "YM-DEDUP-001",
          seed_batch_id: seedBatch.id,
          nursery_name: "去重测试苗圃",
          quantity: 20000,
          planting_date: "2024-03-01",
          responsible_person: "测试员",
        });
      const nurseryBatch = nurseryBatchRes.body;

      const seedlingBatchRes = await request(app)
        .post("/api/seedling-batches")
        .send({
          batch_code: "CP-DEDUP-001",
          nursery_batch_id: nurseryBatch.id,
          quantity: 18000,
          out_date: "2025-10-01",
          responsible_person: "测试员",
        });
      const seedlingBatch = seedlingBatchRes.body;

      // 创建两个推广点
      const site1Res = await request(app).post("/api/promotion-sites").send({
        name: "去重测试点A",
        address: "测试地A",
        responsible_person: "测试员A",
        contact_phone: "13500000001",
      });
      const site1 = site1Res.body;

      const site2Res = await request(app).post("/api/promotion-sites").send({
        name: "去重测试点B",
        address: "测试地B",
        responsible_person: "测试员B",
        contact_phone: "13500000002",
      });
      const site2 = site2Res.body;

      // 同一个出圃批次发3张调运单，其中2张发往同一个推广点
      await request(app).post("/api/dispatch-orders").send({
        seedling_batch_id: seedlingBatch.id,
        promotion_site_id: site1.id,
        quantity: 5000,
        dispatch_date: "2025-11-01",
      });

      await request(app).post("/api/dispatch-orders").send({
        seedling_batch_id: seedlingBatch.id,
        promotion_site_id: site1.id,
        quantity: 3000,
        dispatch_date: "2025-11-02",
      });

      await request(app).post("/api/dispatch-orders").send({
        seedling_batch_id: seedlingBatch.id,
        promotion_site_id: site2.id,
        quantity: 4000,
        dispatch_date: "2025-11-03",
      });

      // 对育苗批次做不合格质检，触发预警
      const inspectionRes = await request(app)
        .post("/api/quality-inspections")
        .send({
          batch_type: "nursery",
          batch_id: nurseryBatch.id,
          result: "unqualified",
          items: "病害",
          values: "检出立枯病",
          inspector: "检测员",
          inspect_date: "2025-06-01",
        });
      assert.equal(inspectionRes.status, 201);

      // 获取预警
      const warningsRes = await request(app).get("/api/warnings?status=active");
      const warning = warningsRes.body.find(
        (w: any) =>
          w.batch_type === "nursery" && w.batch_id === nurseryBatch.id,
      );
      assert.ok(warning !== undefined);

      // 验证受影响调运单数是3
      const affectedDispatchOrders = JSON.parse(
        warning.affected_dispatch_orders,
      );
      assert.equal(affectedDispatchOrders.length, 3);

      // 验证受影响推广点数是2（去重后的）
      const affectedPromotionSites = JSON.parse(
        warning.affected_promotion_sites,
      );
      assert.equal(affectedPromotionSites.length, 2);

      const siteIds = affectedPromotionSites.sort(
        (a: number, b: number) => a - b,
      );
      assert.deepEqual(
        siteIds,
        [site1.id, site2.id].sort((a, b) => a - b),
      );

      // 验证影响范围接口也去重了
      const impactRes = await request(app).get(
        `/api/warnings/impact/nursery/${nurseryBatch.id}`,
      );
      assert.equal(impactRes.status, 200);
      assert.equal(impactRes.body.affected_dispatch_orders.length, 3);
      assert.equal(impactRes.body.affected_promotion_sites.length, 2);

      // 溯源接口也验证推广点去重
      const traceRes = await request(app).get(
        `/api/trace?batchCode=${seedBatch.batch_code}`,
      );
      assert.equal(traceRes.status, 200);
      assert.equal(traceRes.body.promotion_sites.length, 2);
    });

    it("质检合格不应生成预警", async () => {
      const seedSourceRes = await request(app).post("/api/seed-sources").send({
        name: "合格测试种源",
        location: "测试地",
        species: "云杉",
      });
      const seedSource = seedSourceRes.body;

      const seedBatchRes = await request(app).post("/api/seed-batches").send({
        batch_code: "ZZ-QUALIFIED-001",
        seed_source_id: seedSource.id,
        quantity: 50,
        unit: "kg",
        harvest_date: "2024-09-01",
        responsible_person: "测试员",
      });
      const seedBatch = seedBatchRes.body;

      // 质检合格
      const beforeWarningsRes = await request(app).get(
        "/api/warnings?status=active",
      );
      const beforeCount = beforeWarningsRes.body.length;

      const inspectionRes = await request(app)
        .post("/api/quality-inspections")
        .send({
          batch_type: "seed",
          batch_id: seedBatch.id,
          result: "qualified",
          items: "发芽率",
          values: "95%",
          inspector: "检测员",
          inspect_date: "2025-09-01",
        });
      assert.equal(inspectionRes.status, 201);

      // 验证没有新增预警
      const afterWarningsRes = await request(app).get(
        "/api/warnings?status=active",
      );
      assert.equal(afterWarningsRes.body.length, beforeCount);
    });
  });
});
