// AuthProvider.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import supabase from './supabaseService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   // Handle auth changes (also fires on initial load with valid session)
  //   const { data: { subscription } } = supabase.auth.onAuthStateChange(
  //     async (_event, session) => {
  //       console.log("Auth event:", _event, "Session:", session);
  //       setUser(session?.user ?? null);
  //       setLoading(false);
  //     }
  //   );

  //   return () => subscription.unsubscribe();
  // }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // console.log("Auth event:", _event, "Session:", session);

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchUserProfile(currentUser.id); // Pass user ID explicitly
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      // console.error("Error fetching user profile:", error);
    }
  };


  // Fetch user profile when user state changes
  useEffect(() => {
    if (user) {
    fetchUserProfile(user.id);
    } else {
      setUserProfile(null);
    }
  }, [user]);

  // const fetchUserProfile = async () => {
  //   try {
  //     const { data, error } = await supabase
  //       .from('profiles')
  //       .select('*')
  //       .eq('id', user.id)
  //       .single();

  //     if (error) throw error;
  //     setUserProfile(data);
  //   } catch (error) {
  //     console.error('Error fetching user profile:', error);
  //   }
  // };

  const signUp = async (email, password, userData) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            user_type: userData.user_type
          }
        }
      });

      if (authError) throw authError;

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (session) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: session.user.id,
            full_name: userData.full_name,
            user_type: userData.user_type,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (profileError) {
          // console.error('Profile creation error:', profileError);
          await supabase.auth.admin.deleteUser(session.user.id);
          throw profileError;
        }

        return { user: session.user, error: null };
      }

      return { user: authData.user, error: null };
    } catch (error) {
      // console.error('SignUp error:', error);
      return { user: null, error };
    }
  };

  const signIn = async (email, password, userType = 'user') => {
    try {
      const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (userType === 'admin') {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();

        if (profileError || !profile || profile.user_type !== 'admin') {
          await supabase.auth.signOut();
          throw new Error('Access denied. Admin privileges required.');
        }
      }

      return { user, error: null };
    } catch (error) {
      // console.error('Sign in error:', error);
      return {
        user: null,
        error: error.message || 'Failed to sign in. Please check your credentials.'
      };
    }
  };

  const adminSignIn = async (email, password) => {
    return signIn(email, password, 'admin');
  };

  const signOut = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }

      setUser(null);
      setUserProfile(null);
    } catch (error) {
      setUser(null);
      setUserProfile(null);
      // console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signUp,
        signIn,
        adminSignIn,
        signOut,
        setUserProfile,
        fetchUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
