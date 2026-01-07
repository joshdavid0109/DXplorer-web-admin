import { supabase } from "../lib/supabase";

type BookAttractionPayload = {
  attraction_code: string;
  user_id: string;
  date: string;
  quantity: number;
  total_price: number;
};

export const attractionService = {
  /* -------------------------------------------------------------------------- */
  /* FETCH ALL ATTRACTIONS */
  /* -------------------------------------------------------------------------- */
  async getAllAttractions() {
    const { data: list, error } = await supabase
      .from("attractions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !list) {
      console.error("Error loading attractions:", error);
      return [];
    }

    const ids = list.map((x) => x.attraction_code).filter(Boolean);

    if (ids.length === 0) return list;

    const { data: summaries, error: summaryError } = await supabase
      .from("review_summary")
      .select("source_id, avg_rating, total_reviews, weighted_rating")
      .eq("source_type", "attraction")
      .in("source_id", ids);

    if (summaryError) {
      console.warn("Review summary error:", summaryError);
      return list.map((item) => ({
        ...item,
        avg_rating: 0,
        total_reviews: 0,
        weighted_rating: 0,
      }));
    }

    return list.map((item) => {
      const summary = summaries?.find(
        (s) => s.source_id === item.attraction_code
      );

      return {
        ...item,
        avg_rating: summary?.avg_rating ?? 0,
        total_reviews: summary?.total_reviews ?? 0,
        weighted_rating: summary?.weighted_rating ?? 0,
      };
    });
  },

  /* -------------------------------------------------------------------------- */
  /* FEATURED ATTRACTIONS */
  /* -------------------------------------------------------------------------- */
  async getFeaturedAttractions() {
    const { data: summaries, error } = await supabase
      .from("review_summary")
      .select("source_id, avg_rating, total_reviews, weighted_rating")
      .eq("source_type", "attraction")
      .order("weighted_rating", { ascending: false })
      .limit(4);

    if (error || !summaries?.length) return [];

    const codes = summaries.map((s) => s.source_id).filter(Boolean);

    const { data: details } = await supabase
      .from("attractions")
      .select("*")
      .in("attraction_code", codes)
      .eq("status", "active");

    if (!details?.length) return [];

    return summaries
      .map((s) => {
        const attraction = details.find(
          (a) => a.attraction_code === s.source_id
        );

        if (!attraction) return null;

        return {
          ...attraction,
          avg_rating: s.avg_rating ?? 0,
          total_reviews: s.total_reviews ?? 0,
          weighted_rating: s.weighted_rating ?? 0,
        };
      })
      .filter(Boolean);
  },

  /* -------------------------------------------------------------------------- */
  /* ATTRACTION DETAILS */
  /* -------------------------------------------------------------------------- */
  async getAttractionDetails(code: string) {
    const { data: attraction, error } = await supabase
      .from("attractions")
      .select("*")
      .eq("attraction_code", code)
      .single();

    if (error || !attraction) {
      console.error("Attraction not found:", error);
      return null;
    }

    const { data: unavailable } = await supabase
      .from("attraction_availability")
      .select("unavailable_date")
      .eq("attraction_code", code);

    const { data: reviews } = await supabase
      .from("review_summary")
      .select("avg_rating, total_reviews, weighted_rating")
      .eq("source_type", "attraction")
      .eq("source_id", code)
      .single();

    return {
      ...attraction,
      unavailable_dates:
        unavailable?.map((u) => u.unavailable_date) ?? [],
      avg_rating: reviews?.avg_rating ?? 0,
      total_reviews: reviews?.total_reviews ?? 0,
      weighted_rating: reviews?.weighted_rating ?? 0,
    };
  },

  /* -------------------------------------------------------------------------- */
  /* BOOK ATTRACTION */
  /* -------------------------------------------------------------------------- */
  async bookAttraction(payload: BookAttractionPayload) {
    if (!payload.user_id) {
      throw new Error("User must be logged in to book an attraction");
    }

    const { data, error } = await supabase
      .from("attraction_bookings")
      .insert({
        attraction_code: payload.attraction_code,
        user_id: payload.user_id,
        booking_date: payload.date, // ✅ FIXED COLUMN NAME
        quantity: payload.quantity,
        total_price: payload.total_price,
      })
      .select()
      .single();

    if (error) {
      console.error("BOOK ATTRACTION ERROR:", error);
      throw error;
    }

    return data;
  },

  /* -------------------------------------------------------------------------- */
  /* BLOCK DATE */
  /* -------------------------------------------------------------------------- */
  async blockAttractionDate(code: string, date: string) {
    const { data, error } = await supabase
      .from("attraction_availability")
      .insert({
        attraction_code: code,
        unavailable_date: date,
      })
      .select()
      .single();

    if (error) {
      console.error("BLOCK DATE ERROR:", error);
      throw error;
    }

    return data;
  },
  /* -------------------------------------------------------------------------- */
  /* CREATE ATTRACTION (ADMIN) */
  /* -------------------------------------------------------------------------- */
  async createAttraction(payload: any) {
    const { data, error } = await supabase
      .from("attractions")
      .insert({
        attraction_code: `AT-${Date.now()}`,
        title: payload.title,
        description: payload.description,
        city: payload.city,
        country: payload.country,
        category: payload.category,
        price: payload.price,
        image_urls: payload.image_urls || [],
        status: payload.status || "archived",
      })
      .select()
      .single();

    if (error) {
      console.error("CREATE ATTRACTION ERROR:", error);
      throw error;
    }

    return data;
  },

  /* -------------------------------------------------------------------------- */
  /* UPDATE ATTRACTION (ADMIN) */
  /* -------------------------------------------------------------------------- */
  async updateAttraction(attraction_id: string, payload: any) {
    const { data, error } = await supabase
      .from("attractions")
      .update({
        title: payload.title,
        description: payload.description,
        city: payload.city,
        country: payload.country,
        category: payload.category,
        price: payload.price,
        image_urls: payload.image_urls,
        status: payload.status,
      })
      .eq("attraction_id", attraction_id)
      .select()
      .single();

    if (error) {
      console.error("UPDATE ATTRACTION ERROR:", error);
      throw error;
    }

    return data;
  },

  /* -------------------------------------------------------------------------- */
  /* DELETE ATTRACTION (ADMIN) */
  /* -------------------------------------------------------------------------- */
  async deleteAttraction(attraction_id: string) {
    const { error } = await supabase
      .from("attractions")
      .delete()
      .eq("attraction_id", attraction_id);

    if (error) {
      console.error("DELETE ATTRACTION ERROR:", error);
      throw error;
    }

    return true;
  },
};
