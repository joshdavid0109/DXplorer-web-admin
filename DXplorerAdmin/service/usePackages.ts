import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { ExtendedPackage } from "./packagesService";

interface FilterOptions {
  searchTerm?: string;
  status?: string;
  packageLabel?: string;
}

export function usePackages() {
  const [allPackages, setAllPackages] = useState<ExtendedPackage[]>([]);
  const [packages, setPackages] = useState<ExtendedPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ------------------------------------------------------------------
  // Fetch packages once (with related tables)
  // ------------------------------------------------------------------
  const fetchPackages = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("packages")
      .select(`
        *,
        package_details(*),
        package_dates(*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Fetch booking counts
    const { data: bookingCounts } = await supabase
      .from("bookings")
      .select("package_id, booking_id");

    const bookingsMap: Record<string, number> = {};
    bookingCounts?.forEach((b) => {
      bookingsMap[b.package_id] = (bookingsMap[b.package_id] || 0) + 1;
    });

    // Attach counts to each package
    const enriched = (data || []).map(pkg => ({
      ...pkg,
      bookings: bookingsMap[pkg.package_id] || 0
    }));

    setAllPackages(enriched);
    setPackages(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    setPackages(allPackages);
  }, [allPackages]);


  // ------------------------------------------------------------------
  // Instant client-side filtering
  // ------------------------------------------------------------------
  const filterPackages = (filters: FilterOptions) => {
  // -----------------------------------------------
  // 🔥 1. If search box is empty → show all packages
  // -----------------------------------------------
  if (!filters.searchTerm || filters.searchTerm.trim() === "") {
    setPackages(allPackages);
    return;
  }

  let filtered = [...allPackages];

  // -----------------------------------------------
  // 🔎 2. Apply search filter
  // -----------------------------------------------
  const q = filters.searchTerm.toLowerCase();
  filtered = filtered.filter(pkg =>
    pkg.main_location?.toLowerCase().includes(q)
  );

  // -----------------------------------------------
  // 🟢 3. Status filter
  // -----------------------------------------------
  if (filters.status && filters.status !== "all") {
    filtered = filtered.filter(pkg => pkg.status === filters.status);
  }

  // -----------------------------------------------
  // 🔵 4. Tour type filter
  // -----------------------------------------------
  if (filters.packageLabel && filters.packageLabel !== "all") {
    filtered = filtered.filter(pkg => pkg.tour_type === filters.packageLabel);
  }

  setPackages(filtered);
};


  // ------------------------------------------------------------------
  // Sync UI list when DB changes
  // ------------------------------------------------------------------
  useEffect(() => {
    setPackages(allPackages);
  }, [allPackages]);

  // ------------------------------------------------------------------
  // CRUD
  // ------------------------------------------------------------------
  const createPackage = async (newData: any) => {
    const { data, error } = await supabase
      .from("packages")
      .insert([
        {
          main_location: newData.destination,
          price: newData.price,
          duration: newData.duration,
          nights: newData.nights,
          status: newData.status,
          tour_type: newData.tour_type,
          image_url: newData.image_url,
        }
      ])
      .select()
      .single();

    if (error) throw error;

    await fetchPackages();
    return data;
  };

  const updatePackage = async (id: string, updatedData: any) => {
    const { error } = await supabase
      .from("packages")
      .update({
        main_location: updatedData.destination,
        price: updatedData.price,
        duration: updatedData.duration,
        nights: updatedData.nights,
        status: updatedData.status,
        tour_type: updatedData.tour_type,
        image_url: updatedData.image_url,
      })
      .eq("package_id", id);

    if (error) throw error;

    await fetchPackages();
  };

  const deletePackage = async (id: string) => {
    const { error } = await supabase
      .from("packages")
      .delete()
      .eq("package_id", id);

    if (error) throw error;

    await fetchPackages();
  };

  return {
    packages,
    allPackages,
    loading,
    error,
    filterPackages,
    createPackage,
    updatePackage,
    deletePackage,
    refresh: fetchPackages
  };
}
