import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Confirmation {
  id: string;
  strategy_id: string;
  name: string;
  created_at: string;
}

export interface Strategy {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  confirmations: Confirmation[];
  created_at: string;
  updated_at: string;
}

export const useStrategies = () => {
  const { user } = useAuth();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStrategies = useCallback(async () => {
    if (!user) {
      setStrategies([]);
      setLoading(false);
      return;
    }

    try {
      const { data: strategiesData, error: strategiesError } = await supabase
        .from('strategies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (strategiesError) throw strategiesError;

      const { data: confirmationsData, error: confirmationsError } = await supabase
        .from('confirmations')
        .select('*');

      if (confirmationsError) throw confirmationsError;

      const strategiesWithConfirmations = (strategiesData || []).map(strategy => ({
        ...strategy,
        confirmations: (confirmationsData || []).filter(c => c.strategy_id === strategy.id)
      }));

      setStrategies(strategiesWithConfirmations);
    } catch (error) {
      console.error('Error fetching strategies:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createStrategy = async (name: string, description: string, confirmationNames: string[]) => {
    if (!user) return { success: false };

    try {
      const { data: strategy, error: strategyError } = await supabase
        .from('strategies')
        .insert({ user_id: user.id, name, description })
        .select()
        .single();

      if (strategyError) throw strategyError;

      if (confirmationNames.length > 0) {
        const confirmations = confirmationNames.map(confName => ({
          strategy_id: strategy.id,
          name: confName
        }));

        const { error: confError } = await supabase
          .from('confirmations')
          .insert(confirmations);

        if (confError) throw confError;
      }

      await fetchStrategies();
      return { success: true };
    } catch (error) {
      console.error('Error creating strategy:', error);
      return { success: false, error };
    }
  };

  const updateStrategy = async (id: string, name: string, description: string, confirmationNames: string[]) => {
    if (!user) return { success: false };

    try {
      const { error: updateError } = await supabase
        .from('strategies')
        .update({ name, description })
        .eq('id', id);

      if (updateError) throw updateError;

      // Delete existing confirmations
      const { error: deleteError } = await supabase
        .from('confirmations')
        .delete()
        .eq('strategy_id', id);

      if (deleteError) throw deleteError;

      // Add new confirmations
      if (confirmationNames.length > 0) {
        const confirmations = confirmationNames.map(confName => ({
          strategy_id: id,
          name: confName
        }));

        const { error: confError } = await supabase
          .from('confirmations')
          .insert(confirmations);

        if (confError) throw confError;
      }

      await fetchStrategies();
      return { success: true };
    } catch (error) {
      console.error('Error updating strategy:', error);
      return { success: false, error };
    }
  };

  const deleteStrategy = async (id: string) => {
    try {
      const { error } = await supabase
        .from('strategies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchStrategies();
      return { success: true };
    } catch (error) {
      console.error('Error deleting strategy:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  return {
    strategies,
    loading,
    fetchStrategies,
    createStrategy,
    updateStrategy,
    deleteStrategy,
  };
};
