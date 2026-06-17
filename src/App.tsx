import { Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import SeedSources from "@/pages/SeedSources";
import SeedBatches from "@/pages/SeedBatches";
import NurseryBatches from "@/pages/NurseryBatches";
import SeedlingBatches from "@/pages/SeedlingBatches";
import DispatchOrders from "@/pages/DispatchOrders";
import PromotionSites from "@/pages/PromotionSites";
import Trace from "@/pages/Trace";
import Warnings from "@/pages/Warnings";
import Statistics from "@/pages/Statistics";
import PlantingFeedbacks from "@/pages/PlantingFeedbacks";
import Effectiveness from "@/pages/Effectiveness";
import Recalls from "@/pages/Recalls";
import RecallDetail from "@/pages/RecallDetail";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/seed-sources" element={<SeedSources />} />
        <Route path="/seed-batches" element={<SeedBatches />} />
        <Route path="/nursery-batches" element={<NurseryBatches />} />
        <Route path="/seedling-batches" element={<SeedlingBatches />} />
        <Route path="/dispatch-orders" element={<DispatchOrders />} />
        <Route path="/promotion-sites" element={<PromotionSites />} />
        <Route path="/trace" element={<Trace />} />
        <Route path="/warnings" element={<Warnings />} />
        <Route path="/recalls" element={<Recalls />} />
        <Route path="/recalls/:id" element={<RecallDetail />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/planting-feedbacks" element={<PlantingFeedbacks />} />
        <Route path="/effectiveness" element={<Effectiveness />} />
      </Route>
    </Routes>
  );
}
