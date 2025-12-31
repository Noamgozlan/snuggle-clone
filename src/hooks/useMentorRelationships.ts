import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MentorRelationship {
  id: string;
  mentor_id: string;
  student_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface MentorWithProfile extends MentorRelationship {
  mentor_profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export interface StudentWithProfile extends MentorRelationship {
  student_profile?: {
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export const useMentorRelationships = () => {
  const { user } = useAuth();
  const [myMentor, setMyMentor] = useState<MentorWithProfile | null>(null);
  const [myStudents, setMyStudents] = useState<StudentWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<StudentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRelationships = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch my mentor (where I'm the student)
      const { data: mentorData, error: mentorError } = await supabase
        .from('mentor_relationships')
        .select('*')
        .eq('student_id', user.id)
        .maybeSingle();

      if (mentorError) throw mentorError;

      if (mentorData) {
        // Get mentor profile
        const { data: mentorProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, avatar_url')
          .eq('user_id', mentorData.mentor_id)
          .maybeSingle();

        setMyMentor({
          ...mentorData,
          status: mentorData.status as 'pending' | 'accepted' | 'rejected',
          mentor_profile: mentorProfile || undefined,
        });
      } else {
        setMyMentor(null);
      }

      // Fetch my students (where I'm the mentor)
      const { data: studentsData, error: studentsError } = await supabase
        .from('mentor_relationships')
        .select('*')
        .eq('mentor_id', user.id);

      if (studentsError) throw studentsError;

      if (studentsData && studentsData.length > 0) {
        // Get all student profiles
        const studentIds = studentsData.map(s => s.student_id);
        const { data: studentProfiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, username, email, avatar_url')
          .in('user_id', studentIds);

        const profileMap = new Map(studentProfiles?.map(p => [p.user_id, p]) || []);

        const studentsWithProfiles: StudentWithProfile[] = studentsData.map(student => ({
          ...student,
          status: student.status as 'pending' | 'accepted' | 'rejected',
          student_profile: profileMap.get(student.student_id) || undefined,
        }));

        setMyStudents(studentsWithProfiles.filter(s => s.status === 'accepted'));
        setPendingRequests(studentsWithProfiles.filter(s => s.status === 'pending'));
      } else {
        setMyStudents([]);
        setPendingRequests([]);
      }
    } catch (error) {
      console.error('Error fetching mentor relationships:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRelationships();
  }, [fetchRelationships]);

  const sendMentorRequest = async (mentorUsername: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'לא מחובר' };

    try {
      // Find mentor by username using the security definer function
      const { data: mentorUserId, error: lookupError } = await supabase
        .rpc('lookup_user_id_by_username', { p_username: mentorUsername });

      if (lookupError) throw lookupError;
      if (!mentorUserId) {
        return { success: false, error: 'לא נמצא משתמש עם שם המשתמש הזה' };
      }

      if (mentorUserId === user.id) {
        return { success: false, error: 'לא ניתן להיות מנטור של עצמך' };
      }

      // Check if already has a mentor
      if (myMentor) {
        return { success: false, error: 'כבר יש לך מנטור, נא להסיר אותו קודם' };
      }

      // Create the relationship
      const { error: insertError } = await supabase
        .from('mentor_relationships')
        .insert({
          mentor_id: mentorUserId,
          student_id: user.id,
          status: 'pending',
        });

      if (insertError) {
        if (insertError.code === '23505') {
          return { success: false, error: 'כבר שלחת בקשה למנטור הזה' };
        }
        throw insertError;
      }

      await fetchRelationships();
      return { success: true };
    } catch (error) {
      console.error('Error sending mentor request:', error);
      return { success: false, error: 'שגיאה בשליחת הבקשה' };
    }
  };

  const respondToRequest = async (relationshipId: string, accept: boolean): Promise<{ success: boolean }> => {
    if (!user) return { success: false };

    try {
      const { error } = await supabase
        .from('mentor_relationships')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', relationshipId)
        .eq('mentor_id', user.id);

      if (error) throw error;

      await fetchRelationships();
      return { success: true };
    } catch (error) {
      console.error('Error responding to request:', error);
      return { success: false };
    }
  };

  const removeMentor = async (): Promise<{ success: boolean }> => {
    if (!user || !myMentor) return { success: false };

    try {
      const { error } = await supabase
        .from('mentor_relationships')
        .delete()
        .eq('id', myMentor.id)
        .eq('student_id', user.id);

      if (error) throw error;

      await fetchRelationships();
      return { success: true };
    } catch (error) {
      console.error('Error removing mentor:', error);
      return { success: false };
    }
  };

  const removeStudent = async (relationshipId: string): Promise<{ success: boolean }> => {
    if (!user) return { success: false };

    try {
      // We use update to rejected status since mentor can't delete
      const { error } = await supabase
        .from('mentor_relationships')
        .update({ status: 'rejected' })
        .eq('id', relationshipId)
        .eq('mentor_id', user.id);

      if (error) throw error;

      await fetchRelationships();
      return { success: true };
    } catch (error) {
      console.error('Error removing student:', error);
      return { success: false };
    }
  };

  return {
    myMentor,
    myStudents,
    pendingRequests,
    loading,
    sendMentorRequest,
    respondToRequest,
    removeMentor,
    removeStudent,
    refreshRelationships: fetchRelationships,
  };
};
