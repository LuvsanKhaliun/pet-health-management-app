import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://bdjyydubiomnrygycxrr.supabase.co";
const supabaseAnonKey = "sb_publishable_TZIpa3aAnNTQmuTQF4PhqQ_s4WUqXFx";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
