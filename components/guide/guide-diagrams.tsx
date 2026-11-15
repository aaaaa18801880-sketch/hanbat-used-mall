// 파일 경로: components/guide/guide-diagrams.tsx
import React from "react";
import {
  Aircon2in1VsSinglesDiagram,
  AirconCyclePartsDiagram,
  AirconDrainLeakDiagram,
  AirconPipeComparisonDiagram,
  AirconPumpdownTapingDiagram,
  AirconPyeongSizingDiagram,
  AirconRelocationCostFactorsDiagram,
  AirconRepairTimelineDiagram,
  AirconSingleVsMultiDiagram,
  CeilingVsStandInstallDiagram,
  CoolingVsHeatpumpNameplateDiagram,
  DefrostCycleWalkwayDiagram,
  FixedSpeedVsInverterDiagram,
  HeatingHeatpumpVsHeaterDiagram,
  InverterDutyCycleDiagram,
  OutdoorLouverAirflowDiagram,
  OutdoorUnitWeatherproofDiagram,
  PcbFailureCausesDiagram,
  RefrigerantLeakMythDiagram,
  RefrigerantTypesComparisonDiagram,
  VillaInstallConstraintsDiagram,
} from "./diagrams/aircon-diagrams";
import {
  ApplianceNameplateLifespanDiagram,
  ApplianceResaleValueDiagram,
  BuybackInspectionPointsDiagram,
  CableReelTrackingFireDiagram,
  CafePlumbingDrainCheckDiagram,
  ClearanceBlueprintDiagram,
  ElbVsMccbTripDiagram,
  EnergyGradeRevisionDiagram,
  InductionWiringBreakerDiagram,
  KwVsKwhDiagram,
  NeutralWireDangerDiagram,
  StartupPowerBudgetDiagram,
  StoreRestorationScopeDiagram,
  StoreTakeoverChecklistDiagram,
  TvPanelBurninBacklightDiagram,
  UsedVsStoreFlowDiagram,
  VoltageBreakerDiagram,
  WastePickupVsBuybackDiagram,
} from "./diagrams/electrical-ops-diagrams";
import {
  AirVsWaterCooledDiagram,
  Commercial45BoxCoolingDiagram,
  CommercialCondenserCleaningDiagram,
  CommercialDishwasherSetupDiagram,
  CommercialFridgeRepairRoiDiagram,
  CommercialFryerKClassDiagram,
  CompressorVentilationClearanceDiagram,
  DryerHeatpumpCondenserDiagram,
  FreezerDefrostPipeRiskDiagram,
  FridgeFreezerAirflowDiagram,
  FridgeTiltOilReturnDiagram,
  GasVsInductionKitchenDiagram,
  GasketMoldSafeCleaningDiagram,
  IcemakerHeatRejectionDiagram,
  KimchiFridgeCoolingDiagram,
  KitchenHoodDuctFanDiagram,
  KitchenfitVsFreestandingDiagram,
  LpgVsLngNozzleDetectorDiagram,
  ShowcaseCondensationDiagram,
  WasherComboVsStackDiagram,
  WasherTubInspectionDiagram,
  WaterHeaterInstantVsStorageDiagram,
  WinterKitchenFreezeCareDiagram,
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
  | "waste-pickup-vs-buyback"
  | "store-takeover-checklist"
  | "heating-heatpump-vs-heater"
  | "aircon-2in1-vs-singles"
  | "gas-vs-induction-kitchen"
  | "lpg-vs-lng-nozzle-detector"
  | "winter-kitchen-freeze-care"
  | "freezer-defrost-pipe-risk"
  | "kitchenfit-vs-freestanding"
  | "cable-reel-tracking-fire"
  | "compressor-ventilation-clearance"
  | "appliance-nameplate-lifespan"
  | "aircon-refrigerant-types"
  | "commercial-fryer-k-class"
  | "kitchen-hood-duct-fan"
  | "air-vs-water-cooled"
  | "cooling-vs-heatpump-nameplate"
  | "water-heater-instant-vs-storage"
  | "gasket-mold-safe-cleaning"
  | "villa-install-constraints"
  | "store-restoration-scope";

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
    case "store-takeover-checklist":
      return <StoreTakeoverChecklistDiagram />;
    case "heating-heatpump-vs-heater":
      return <HeatingHeatpumpVsHeaterDiagram />;
    case "aircon-2in1-vs-singles":
      return <Aircon2in1VsSinglesDiagram />;
    case "gas-vs-induction-kitchen":
      return <GasVsInductionKitchenDiagram />;
    case "lpg-vs-lng-nozzle-detector":
      return <LpgVsLngNozzleDetectorDiagram />;
    case "winter-kitchen-freeze-care":
      return <WinterKitchenFreezeCareDiagram />;
    case "freezer-defrost-pipe-risk":
      return <FreezerDefrostPipeRiskDiagram />;
    case "kitchenfit-vs-freestanding":
      return <KitchenfitVsFreestandingDiagram />;
    case "cable-reel-tracking-fire":
      return <CableReelTrackingFireDiagram />;
    case "compressor-ventilation-clearance":
      return <CompressorVentilationClearanceDiagram />;
    case "appliance-nameplate-lifespan":
      return <ApplianceNameplateLifespanDiagram />;
    case "aircon-refrigerant-types":
      return <RefrigerantTypesComparisonDiagram />;
    case "commercial-fryer-k-class":
      return <CommercialFryerKClassDiagram />;
    case "kitchen-hood-duct-fan":
      return <KitchenHoodDuctFanDiagram />;
    case "air-vs-water-cooled":
      return <AirVsWaterCooledDiagram />;
    case "cooling-vs-heatpump-nameplate":
      return <CoolingVsHeatpumpNameplateDiagram />;
    case "water-heater-instant-vs-storage":
      return <WaterHeaterInstantVsStorageDiagram />;
    case "gasket-mold-safe-cleaning":
      return <GasketMoldSafeCleaningDiagram />;
    case "villa-install-constraints":
      return <VillaInstallConstraintsDiagram />;
    case "store-restoration-scope":
      return <StoreRestorationScopeDiagram />;
  }
}
