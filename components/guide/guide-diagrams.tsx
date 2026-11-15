// 파일 경로: components/guide/guide-diagrams.tsx
import React from "react";
import {
  AirconCyclePartsDiagram,
  AirconDrainLeakDiagram,
  AirconPipeComparisonDiagram,
  AirconPumpdownTapingDiagram,
  AirconPyeongSizingDiagram,
  AirconRelocationCostFactorsDiagram,
  AirconRepairTimelineDiagram,
  AirconSingleVsMultiDiagram,
  CeilingVsStandInstallDiagram,
  DefrostCycleWalkwayDiagram,
  FixedSpeedVsInverterDiagram,
  InverterDutyCycleDiagram,
  OutdoorLouverAirflowDiagram,
  OutdoorUnitWeatherproofDiagram,
  PcbFailureCausesDiagram,
  RefrigerantLeakMythDiagram,
} from "./diagrams/aircon-diagrams";
import {
  ApplianceResaleValueDiagram,
  BuybackInspectionPointsDiagram,
  CafePlumbingDrainCheckDiagram,
  ClearanceBlueprintDiagram,
  ElbVsMccbTripDiagram,
  EnergyGradeRevisionDiagram,
  InductionWiringBreakerDiagram,
  KwVsKwhDiagram,
  NeutralWireDangerDiagram,
  StartupPowerBudgetDiagram,
  TvPanelBurninBacklightDiagram,
  UsedVsStoreFlowDiagram,
  VoltageBreakerDiagram,
  WastePickupVsBuybackDiagram,
} from "./diagrams/electrical-ops-diagrams";
import {
  Commercial45BoxCoolingDiagram,
  CommercialCondenserCleaningDiagram,
  CommercialDishwasherSetupDiagram,
  CommercialFridgeRepairRoiDiagram,
  DryerHeatpumpCondenserDiagram,
  FridgeFreezerAirflowDiagram,
  FridgeTiltOilReturnDiagram,
  IcemakerHeatRejectionDiagram,
  KimchiFridgeCoolingDiagram,
  ShowcaseCondensationDiagram,
  WasherComboVsStackDiagram,
  WasherTubInspectionDiagram,
} from "./diagrams/home-kitchen-diagrams";

export type GuideDiagramId =
  | "aircon-repair-timeline"
  | "voltage-220v-380v-breaker"
  | "startup-power-budget"
  | "kw-vs-kwh-water-analogy"
  | "clearance-ladder-blueprint"
  | "used-vs-new-vs-p2p-flow"
  | "buyback-inspection-points"
  | "aircon-cycle-parts"
  | "outdoor-unit-weatherproof"
  | "pcb-failure-causes"
  | "ceiling-vs-stand-install"
  | "defrost-cycle-walkway"
  | "fixed-speed-vs-inverter"
  | "fridge-freezer-airflow"
  | "washer-tub-inspection"
  | "fridge-tilt-oil-return"
  | "commercial-45box-cooling"
  | "icemaker-heat-rejection"
  | "commercial-dishwasher-setup"
  | "refrigerant-leak-myth"
  | "aircon-pyeong-sizing"
  | "dryer-heatpump-condenser"
  | "kimchi-fridge-cooling"
  | "inverter-duty-cycle-curve"
  | "aircon-drain-leak-causes"
  | "aircon-pipe-copper-vs-alu"
  | "showcase-condensation-drain"
  | "appliance-resale-value-factors"
  | "energy-grade-revision-curve"
  | "aircon-single-vs-multi"
  | "induction-wiring-breaker"
  | "cafe-plumbing-drain-check"
  | "commercial-fridge-repair-roi"
  | "aircon-relocation-cost-factors"
  | "neutral-wire-danger"
  | "elb-vs-mccb-trip"
  | "tv-panel-burnin-backlight"
  | "commercial-condenser-cleaning"
  | "outdoor-louver-airflow"
  | "aircon-pumpdown-taping"
  | "washer-combo-vs-stack"
  | "waste-pickup-vs-buyback";

export function GuideSectionDiagram({ id }: { id: GuideDiagramId }) {
  switch (id) {
    case "aircon-repair-timeline":
      return <AirconRepairTimelineDiagram />;
    case "voltage-220v-380v-breaker":
      return <VoltageBreakerDiagram />;
    case "startup-power-budget":
      return <StartupPowerBudgetDiagram />;
    case "kw-vs-kwh-water-analogy":
      return <KwVsKwhDiagram />;
    case "clearance-ladder-blueprint":
      return <ClearanceBlueprintDiagram />;
    case "used-vs-new-vs-p2p-flow":
      return <UsedVsStoreFlowDiagram />;
    case "buyback-inspection-points":
      return <BuybackInspectionPointsDiagram />;
    case "aircon-cycle-parts":
      return <AirconCyclePartsDiagram />;
    case "outdoor-unit-weatherproof":
      return <OutdoorUnitWeatherproofDiagram />;
    case "pcb-failure-causes":
      return <PcbFailureCausesDiagram />;
    case "ceiling-vs-stand-install":
      return <CeilingVsStandInstallDiagram />;
    case "defrost-cycle-walkway":
      return <DefrostCycleWalkwayDiagram />;
    case "fixed-speed-vs-inverter":
      return <FixedSpeedVsInverterDiagram />;
    case "fridge-freezer-airflow":
      return <FridgeFreezerAirflowDiagram />;
    case "washer-tub-inspection":
      return <WasherTubInspectionDiagram />;
    case "fridge-tilt-oil-return":
      return <FridgeTiltOilReturnDiagram />;
    case "commercial-45box-cooling":
      return <Commercial45BoxCoolingDiagram />;
    case "icemaker-heat-rejection":
      return <IcemakerHeatRejectionDiagram />;
    case "commercial-dishwasher-setup":
      return <CommercialDishwasherSetupDiagram />;
    case "refrigerant-leak-myth":
      return <RefrigerantLeakMythDiagram />;
    case "aircon-pyeong-sizing":
      return <AirconPyeongSizingDiagram />;
    case "dryer-heatpump-condenser":
      return <DryerHeatpumpCondenserDiagram />;
    case "kimchi-fridge-cooling":
      return <KimchiFridgeCoolingDiagram />;
    case "inverter-duty-cycle-curve":
      return <InverterDutyCycleDiagram />;
    case "aircon-drain-leak-causes":
      return <AirconDrainLeakDiagram />;
    case "aircon-pipe-copper-vs-alu":
      return <AirconPipeComparisonDiagram />;
    case "showcase-condensation-drain":
      return <ShowcaseCondensationDiagram />;
    case "appliance-resale-value-factors":
      return <ApplianceResaleValueDiagram />;
    case "energy-grade-revision-curve":
      return <EnergyGradeRevisionDiagram />;
    case "aircon-single-vs-multi":
      return <AirconSingleVsMultiDiagram />;
    case "induction-wiring-breaker":
      return <InductionWiringBreakerDiagram />;
    case "cafe-plumbing-drain-check":
      return <CafePlumbingDrainCheckDiagram />;
    case "commercial-fridge-repair-roi":
      return <CommercialFridgeRepairRoiDiagram />;
    case "aircon-relocation-cost-factors":
      return <AirconRelocationCostFactorsDiagram />;
    case "neutral-wire-danger":
      return <NeutralWireDangerDiagram />;
    case "elb-vs-mccb-trip":
      return <ElbVsMccbTripDiagram />;
    case "tv-panel-burnin-backlight":
      return <TvPanelBurninBacklightDiagram />;
    case "commercial-condenser-cleaning":
      return <CommercialCondenserCleaningDiagram />;
    case "outdoor-louver-airflow":
      return <OutdoorLouverAirflowDiagram />;
    case "aircon-pumpdown-taping":
      return <AirconPumpdownTapingDiagram />;
    case "washer-combo-vs-stack":
      return <WasherComboVsStackDiagram />;
    case "waste-pickup-vs-buyback":
      return <WastePickupVsBuybackDiagram />;
  }
}
