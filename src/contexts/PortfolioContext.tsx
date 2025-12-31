import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  drawdown: number | null;
  profit_goal: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface PortfolioContextType {
  portfolios: Portfolio[];
  activePortfolio: Portfolio | null;
  loading: boolean;
  setActivePortfolio: (portfolio: Portfolio | null) => void;
  fetchPortfolios: () => Promise<void>;
  createPortfolio: (data: { name: string; balance: number; drawdown?: number; profit_goal?: number }) => Promise<{ success: boolean; portfolio?: Portfolio }>;
  updatePortfolio: (id: string, data: Partial<Portfolio>) => Promise<{ success: boolean }>;
  deletePortfolio: (id: string) => Promise<{ success: boolean }>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [activePortfolio, setActivePortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPortfolios = useCallback(async () => {
    if (!user) {
      setPortfolios([]);
      setActivePortfolio(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const portfoliosData = (data || []) as Portfolio[];
      setPortfolios(portfoliosData);

      // Set active portfolio
      if (portfoliosData.length > 0) {
        const defaultPortfolio = portfoliosData.find(p => p.is_default) || portfoliosData[0];
        setActivePortfolio(defaultPortfolio);
      } else {
        setActivePortfolio(null);
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createPortfolio = async (data: { name: string; balance: number; drawdown?: number; profit_goal?: number }) => {
    if (!user) return { success: false };

    try {
      const isFirst = portfolios.length === 0;
      
      const { data: portfolio, error } = await supabase
        .from('portfolios')
        .insert({
          user_id: user.id,
          name: data.name,
          balance: data.balance,
          drawdown: data.drawdown || null,
          profit_goal: data.profit_goal || null,
          is_default: isFirst,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchPortfolios();
      return { success: true, portfolio: portfolio as Portfolio };
    } catch (error) {
      console.error('Error creating portfolio:', error);
      return { success: false };
    }
  };

  const updatePortfolio = async (id: string, data: Partial<Portfolio>) => {
    try {
      const { error } = await supabase
        .from('portfolios')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      await fetchPortfolios();
      return { success: true };
    } catch (error) {
      console.error('Error updating portfolio:', error);
      return { success: false };
    }
  };

  const deletePortfolio = async (id: string) => {
    try {
      const { error } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchPortfolios();
      return { success: true };
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      return { success: false };
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  return (
    <PortfolioContext.Provider value={{
      portfolios,
      activePortfolio,
      loading,
      setActivePortfolio,
      fetchPortfolios,
      createPortfolio,
      updatePortfolio,
      deletePortfolio,
    }}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};
