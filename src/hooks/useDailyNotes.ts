import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePortfolio } from "@/contexts/PortfolioContext";

export interface DailyNote {
  id: string;
  user_id: string;
  portfolio_id: string | null;
  note_date: string;
  pre_market_note: string | null;
  post_market_note: string | null;
  mood_rating: number | null;
  created_at: string;
  updated_at: string;
}

export const useDailyNotes = () => {
  const { user } = useAuth();
  const { activePortfolio } = usePortfolio();
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    if (!user) { setNotes([]); setLoading(false); return; }
    try {
      let query = supabase
        .from('daily_notes' as any)
        .select('*')
        .eq('user_id', user.id);
      if (activePortfolio) query = query.eq('portfolio_id', activePortfolio.id);
      const { data, error } = await query;
      if (error) throw error;
      setNotes((data || []) as any as DailyNote[]);
    } catch (e) { console.error('Error fetching daily notes:', e); }
    finally { setLoading(false); }
  }, [user, activePortfolio]);

  const upsertNote = async (date: string, preNote: string, postNote: string, mood: number | null) => {
    if (!user) return { success: false };
    try {
      const existing = notes.find(n => n.note_date === date);
      if (existing) {
        const { error } = await (supabase.from('daily_notes' as any) as any)
          .update({ pre_market_note: preNote, post_market_note: postNote, mood_rating: mood })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('daily_notes' as any) as any)
          .insert({ user_id: user.id, portfolio_id: activePortfolio?.id || null, note_date: date, pre_market_note: preNote, post_market_note: postNote, mood_rating: mood });
        if (error) throw error;
      }
      await fetchNotes();
      return { success: true };
    } catch (e) { console.error('Error saving note:', e); return { success: false }; }
  };

  const getNoteForDate = (date: string) => notes.find(n => n.note_date === date) || null;
  const getDatesWithNotes = () => notes.map(n => n.note_date);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  return { notes, loading, upsertNote, getNoteForDate, getDatesWithNotes, fetchNotes };
};
