// src/services/landService.ts
import { supabase } from "../lib/supabase";

export const landService = {
  /** Fetch all land arrangements WITH review summary merged */
  async getAllLandArrangements() {
    // Fetch base land arrangements
    const { data: list, error } = await supabase
      .from("land_arrangements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading land arrangements:", error);
      return [];
    }

    if (!list || list.length === 0) return [];

    // Get all land_ids
    const ids = list.map((x) => x.land_id);

    // Fetch summary data for each land arrangement
    const { data: summaries } = await supabase
      .from("review_summary")
      .select("source_id, avg_rating, total_reviews, weighted_rating")
      .eq("source_type", "land")
      .in("source_id", ids);

    // Merge review summary
    return list.map((item) => {
      const summary = summaries?.find((s) => s.source_id === item.land_id);

      return {
        ...item,
        avg_rating: summary?.avg_rating ?? 0,
        weighted_rating: summary?.weighted_rating ?? 0,
        total_reviews: summary?.total_reviews ?? 0,
      };
    });
  },

  /** Featured Land Arrangements sorted by weighted rating */
  async getFeaturedLandArrangements() {
    // Step 1: Get top-rated items from summary table
    const { data: summaries, error } = await supabase
      .from("review_summary")
      .select("source_id, avg_rating, weighted_rating, total_reviews")
      .eq("source_type", "land")
      .order("weighted_rating", { ascending: false })
      .limit(4);

    if (error) {
      console.error("Error loading featured summaries:", error);
      return [];
    }

    console.log("featured summaries:", summaries);

    if (!summaries || summaries.length === 0) return [];

    const ids = summaries.map((s) => s.source_id);

    console.log("featured ids:", ids);

    // Step 2: fetch land arrangement details
    const { data: details } = await supabase
      .from("land_arrangements")
      .select("*")
      .in("land_id", ids);

    // Step 3: merge
    return summaries.map((s) => {
      const info = details?.find((d) => d.land_id === s.source_id);

      return {
        ...info,
        avg_rating: s.avg_rating,
        weighted_rating: s.weighted_rating,
        total_reviews: s.total_reviews,
      };
    });
  },
  async getAll() {
    const { data: list } = await supabase
      .from("land_arrangements")
      .select("*");

    if (!list || list.length === 0) return [];

    const ids = list.map((x) => x.land_id);

    const { data: summary } = await supabase
      .from("review_summary")
      .select("*")
      .eq("source_type", "land")
      .in("source_id", ids);

    return list.map((item) => {
      const s = summary?.find((x) => x.source_id === item.land_id);
      return {
        ...item,
        avg_rating: s?.avg_rating ?? 0,
        total_reviews: s?.total_reviews ?? 0,
      };
    });
  },

  async getLandDetails(id: string) {
    const { data: land } = await supabase
      .from("land_arrangements")
      .select("*")
      .eq("land_id", id)
      .single();

    const { data: blocked } = await supabase
      .from("land_availability")
      .select("date")
      .eq("land_id", id);

    const { data: summary } = await supabase
      .from("review_summary")
      .select("*")
      .eq("source_type", "land")
      .eq("source_id", id)
      .single();

    return {
      ...land,
      unavailable_dates: blocked?.map((b) => b.date) ?? [],
      avg_rating: summary?.avg_rating ?? 0,
      total_reviews: summary?.total_reviews ?? 0,
    };
  },

  async bookLand(payload: {
    land_id: string;
    user_id: string;
    date: string;
    total_price: number;
  }) {
    return await supabase.from("land_bookings").insert(payload);
  },

  async blockDate(land_id: string, date: string) {
    return await supabase.from("land_availability").insert({ land_id, date });
  },

createLandArrangement: (data: any) =>
supabase.from("land_arrangements").insert(data),

updateLandArrangement: (id: any, data: any) =>
supabase.from("land_arrangements").update(data).eq("land_id", id),

deleteLandArrangement: (id: any) =>
supabase.from("land_arrangements").delete().eq("land_id", id),

};

