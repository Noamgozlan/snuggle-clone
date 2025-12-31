import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TradeFeedback {
  id: string;
  mentor_id: string;
  student_id: string;
  trade_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface MentorNote {
  id: string;
  mentor_id: string;
  student_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const useMentorFeedback = (studentId?: string) => {
  const { user } = useAuth();
  const [tradeFeedback, setTradeFeedback] = useState<TradeFeedback[]>([]);
  const [mentorNotes, setMentorNotes] = useState<MentorNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const targetStudentId = studentId || user.id;

    try {
      // Fetch trade feedback
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('mentor_trade_feedback')
        .select('*')
        .eq('student_id', targetStudentId)
        .order('created_at', { ascending: false });

      if (feedbackError) throw feedbackError;
      setTradeFeedback(feedbackData || []);

      // Fetch mentor notes
      const { data: notesData, error: notesError } = await supabase
        .from('mentor_notes')
        .select('*')
        .eq('student_id', targetStudentId)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      setMentorNotes(notesData || []);
    } catch (error) {
      console.error('Error fetching mentor feedback:', error);
    } finally {
      setLoading(false);
    }
  }, [user, studentId]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const addTradeFeedback = async (
    targetStudentId: string,
    tradeId: string | null,
    content: string
  ): Promise<{ success: boolean }> => {
    if (!user) return { success: false };

    try {
      const { error } = await supabase
        .from('mentor_trade_feedback')
        .insert({
          mentor_id: user.id,
          student_id: targetStudentId,
          trade_id: tradeId,
          content,
        });

      if (error) throw error;

      await fetchFeedback();
      return { success: true };
    } catch (error) {
      console.error('Error adding trade feedback:', error);
      return { success: false };
    }
  };

  const addMentorNote = async (
    targetStudentId: string,
    content: string
  ): Promise<{ success: boolean }> => {
    if (!user) return { success: false };

    try {
      const { error } = await supabase
        .from('mentor_notes')
        .insert({
          mentor_id: user.id,
          student_id: targetStudentId,
          content,
        });

      if (error) throw error;

      await fetchFeedback();
      return { success: true };
    } catch (error) {
      console.error('Error adding mentor note:', error);
      return { success: false };
    }
  };

  const deleteFeedback = async (feedbackId: string): Promise<{ success: boolean }> => {
    if (!user) return { success: false };

    try {
      const { error } = await supabase
        .from('mentor_trade_feedback')
        .delete()
        .eq('id', feedbackId)
        .eq('mentor_id', user.id);

      if (error) throw error;

      await fetchFeedback();
      return { success: true };
    } catch (error) {
      console.error('Error deleting feedback:', error);
      return { success: false };
    }
  };

  const deleteNote = async (noteId: string): Promise<{ success: boolean }> => {
    if (!user) return { success: false };

    try {
      const { error } = await supabase
        .from('mentor_notes')
        .delete()
        .eq('id', noteId)
        .eq('mentor_id', user.id);

      if (error) throw error;

      await fetchFeedback();
      return { success: true };
    } catch (error) {
      console.error('Error deleting note:', error);
      return { success: false };
    }
  };

  return {
    tradeFeedback,
    mentorNotes,
    loading,
    addTradeFeedback,
    addMentorNote,
    deleteFeedback,
    deleteNote,
    refreshFeedback: fetchFeedback,
  };
};
