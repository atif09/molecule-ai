import React from 'react';
import MoleculeCard from './MoleculeCard';
import BindingAffinityCard from './BindingAffinityCard';
import AdmetCard from './AdmetCard';
import DrugabilityCard from './DrugabilityCard';
import AiInsightsCard from './AiInsightsCard';
import WhyFailedCard from './WhyFailedCard';
import ComparableCard from './ComparableCard';
import ReasoningTraceCard from './ReasoningTraceCard';
import BoiledEggPlot from './BoiledEggPlot';
import BindingHeatmapCard from './BindingHeatmapCard';

const ResultsGrid = ({ data, repurposingData }) => {
  if (!data) return null;

  const grade = data.druggability?.grade;
  const showFailCard = ['C', 'D'].includes(grade) && data.failure_reasons?.length > 0;

  return (
    <div className="grid grid-cols-12 gap-6 w-full pb-20">

      {/* Row 1: 3D Structure | BOILED-Egg Plot */}
      <div className="col-span-12 lg:col-span-6">
        <MoleculeCard moleculeData={data} />
      </div>
      <div className="col-span-12 lg:col-span-6">
        <BoiledEggPlot descriptors={data.descriptors} />
      </div>

      {/* Row 2: Stats — Binding | ADMET | Druggability */}
      <div className="col-span-12 lg:col-span-4">
        <BindingAffinityCard bindingAffinity={data.binding_affinity} />
      </div>
      <div className="col-span-12 lg:col-span-4">
        <AdmetCard admet={data.admet} />
      </div>
      <div className="col-span-12 lg:col-span-4">
        <DrugabilityCard druggability={data.druggability} />
      </div>

      {/* Row 3: Binding Heatmap | Why Failed or Comparable */}
      <div className="col-span-12 lg:col-span-6">
        <BindingHeatmapCard moleculeName={data.molecule_name} />
      </div>
      <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
        {showFailCard && <WhyFailedCard failureReasons={data.failure_reasons} grade={grade} />}
        {repurposingData && <ComparableCard repurposingData={repurposingData} />}
      </div>

      {/* Row 4: Reasoning Trace */}
      {data.reasoning_trace?.length > 0 && (
        <div className="col-span-12">
          <ReasoningTraceCard steps={data.reasoning_trace} />
        </div>
      )}

      {/* Row 5: AI Insights */}
      <div className="col-span-12">
        <AiInsightsCard
          aiInterpretation={data.ai_interpretation}
          processingTime={data.processing_time_ms}
        />
      </div>

    </div>
  );
};

export default ResultsGrid;
