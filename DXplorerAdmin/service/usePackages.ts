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
        package_availability(*)
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
    // 1️⃣ Insert into packages
    const { data: pkg, error: pkgError } = await supabase
      .from("packages")
      .insert([
        {
          main_location: newData.destination,
          price: newData.price,
          duration: newData.duration,
          nights: newData.nights,
          status: newData.status,
          tour_type: newData.tour_type,
        }
      ])
      .select()
      .single();

    if (pkgError) throw pkgError;

    // 2️⃣ Insert into package_details
    const { error: detailsError } = await supabase
      .from("package_details")
      .insert({
        package_id: pkg.package_id,
        itinerary: newData.itinerary,
        side_locations: newData.side_locations,
        inclusions: newData.inclusions,
        image_url: newData.image_url ? [newData.image_url] : [],
      });

    if (detailsError) throw detailsError;

    // 3️⃣ Insert availability
    if (Array.isArray(newData.available_dates) && newData.available_dates.length) {
      const rows = newData.available_dates.map((d: any) => ({
        package_id: pkg.package_id,
        start_date: d.start,
        end_date: d.end,
        remaining_slots: d.remaining_slots,
      }));

      const { error } = await supabase
        .from("package_availability")
        .insert(rows);

      if (error) throw error;
    }

    await fetchPackages();
    return pkg;
  };


const updatePackage = async (packageId: string, packageData: any) => {
  try {
    /* ===============================
       1. UPDATE packages
    ================================ */
    const { error: pkgError } = await supabase
      .from("packages")
      .update({
        main_location: packageData.destination,
        price: packageData.price,
        duration: packageData.duration,
        nights: packageData.nights,
        status: packageData.status,
        tour_type: packageData.tour_type,
      })
      .eq("package_id", packageId);

    if (pkgError) throw pkgError;

    /* ===============================
       2. UPSERT package_details (JSONB image_url)
    ================================ */
    const { error: detailsError } = await supabase
      .from("package_details")
      .upsert(
        {
          package_id: packageId,
          itinerary: packageData.itinerary || "",
          side_locations: packageData.side_locations || [],
          inclusions: packageData.inclusions || [],
          image_url: packageData.image_url
            ? Array.isArray(packageData.image_url)
              ? packageData.image_url
              : [packageData.image_url]
            : [],
        },
        { onConflict: "package_id" }
      );

    if (detailsError) throw detailsError;

    /* ===============================
       3. UPDATE package_availability (normalized)
    ================================ */
    await supabase
      .from("package_availability")
      .delete()
      .eq("package_id", packageId);

    if (Array.isArray(packageData.available_dates)) {
      const availabilityRows = packageData.available_dates.map((d: any) => ({
        package_id: packageId,
        start_date: d.start,
        end_date: d.end,
        remaining_slots: d.remaining_slots,
      }));

      if (availabilityRows.length) {
        const { error } = await supabase
          .from("package_availability")
          .insert(availabilityRows);

        if (error) throw error;
      }
    }

    /* ===============================
       4. UPDATE package_dates (JSONB snapshot)
       🔥 THIS IS WHAT YOU ASKED FOR
    ================================ */
    /* ===============================
   4. UPDATE package_dates (JSONB)
   ✅ MUST BE ARRAY
================================ */
await supabase
  .from("package_dates")
  .delete()
  .eq("package_id", packageId);

if (Array.isArray(packageData.available_dates)) {
  const jsonbRows = packageData.available_dates.map((d: any) => ({
    package_id: packageId,
    available_Date: [
      {
        start: d.start,
        end: d.end,
        remaining_slots: d.remaining_slots,
      },
    ],
  }));

  if (jsonbRows.length) {
    const { error } = await supabase
      .from("package_dates")
      .insert(jsonbRows);

    if (error) throw error;
  }
}


    return true;
  } catch (err) {
    console.error("❌ updatePackage failed:", err);
    throw err;
  }
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
