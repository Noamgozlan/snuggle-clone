// Backtesting page component
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BacktestingWorkspace } from "@/components/backtesting/BacktestingWorkspace";

const Backtesting = () => {
  return (
    <DashboardLayout>
      <BacktestingWorkspace />
    </DashboardLayout>
  );
};

export default Backtesting;
