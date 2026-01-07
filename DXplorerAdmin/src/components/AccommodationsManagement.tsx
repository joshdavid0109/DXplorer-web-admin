import React, { useEffect, useRef, useState } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  X,
  Upload,
  MapPin,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

/* ===================== TYPES ===================== */

interface Accommodation {
  id: string;
  title: string;
  description: string;
  property_type: "Hotel" | "Transient";
  city: string;
  province: string;
  price: number;
  amenities: string[];
  image_urls: string[];
  status: "active" | "inactive" | "archived";
}

/* ===================== HELPERS ===================== */


const normalizeImages = (image_urls: any): string[] => {
  if (!image_urls) return [];
  if (Array.isArray(image_urls)) return image_urls.filter(Boolean);
  if (typeof image_urls === "string") return [image_urls];
  return [];
};

const AMENITIES = [
  "Free WiFi",
  "Parking",
  "Breakfast Included",
  "Air Conditioning",
  "Swimming Pool",
  "24/7 Reception",
];

/* ===================== COMPONENT ===================== */

const AccommodationsManagement: React.FC = () => {
  const [items, setItems] = useState<Accommodation[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Accommodation | null>(null);
  const [form, setForm] = useState<Partial<Accommodation>>({
    property_type: "Hotel",
    amenities: [],
    image_urls: [],
    status: "archived",
  });
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);


  /* ===================== LOAD ===================== */

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data, error } = await supabase
      .from("user_listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("LOAD ACCOMMODATIONS ERROR:", error);
      return;
    }

    setItems(
      (data || []).map((x) => ({
        ...x,
        image_urls: normalizeImages(x.image_urls),
      }))
    );
  };

  /* ===================== IMAGE UPLOAD ===================== */

  const uploadImage = async (file: File) => {
    const path = `accommodations/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("accommodations")
      .upload(path, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from("accommodations")
      .getPublicUrl(path);

    return data.publicUrl;
  };

  const handleFiles = async (files: FileList | File[]) => {
    const uploaded: string[] = [];

    for (const file of Array.from(files)) {
      uploaded.push(await uploadImage(file));
    }

    setForm((prev) => ({
      ...prev,
      image_urls: [...(prev.image_urls || []), ...uploaded],
    }));
  };

  /* ===================== CRUD ===================== */

  const openCreate = () => {
    setEditing(null);
    setForm({
      property_type: "Hotel",
      amenities: [],
      image_urls: [],
      status: "archived",
    });
    setShowModal(true);
  };


  const save = async () => {
    setLoading(true);

    try {
      if (editing) {
        await supabase
          .from("user_listings")
          .update(form)
          .eq("id", editing.id);
      } else {
        await supabase.from("user_listings").insert(form);
      }

      setShowModal(false);
      load();
    } catch (e) {
      console.error("SAVE ERROR:", e);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this accommodation?")) return;
    await supabase.from("user_listings").delete().eq("id", id);
    load();
  };

  const toggleAmenity = (a: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities?.includes(a)
        ? prev.amenities.filter((x) => x !== a)
        : [...(prev.amenities || []), a],
    }));
  };

  const removeImage = (idx: number) => {
    const imgs = [...(form.image_urls || [])];
    imgs.splice(idx, 1);
    setForm({ ...form, image_urls: imgs });
  };

  /* ===================== UI ===================== */


  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Accommodations</h1>
          <p className="text-gray-600">
            Manage hotels and transient listings
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#154689] text-white rounded-lg"
        >
          <Plus className="h-4 w-4" />
          Add Accommodation
        </button>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((x) => (

            console.log(x),
          <div
            key={x.id}
            className="bg-white rounded-2xl shadow-sm border overflow-visible"
          >
            <img
              src={x.image_urls?.[0] || "https://via.placeholder.com/400"}
              className="h-48 w-full object-cover"
            />

            <div className="p-5 space-y-3">
              <h3 className="font-bold text-lg">{x.title}</h3>

              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {x.city}, {x.province}
              </p>

              <div className="flex justify-between items-center">
                <span className="font-bold text-xl">
                  ₱{x.price.toLocaleString()}
                </span>
                <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">
                  {x.property_type}
                </span>
              </div>

              <div className="flex gap-2">
                <div className="relative group">
                <button
                    disabled
                    className="px-3 py-2 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
                >
                    <Edit3 className="h-4 w-4" />
                </button>

                {/* Tooltip */}
                <div
                    className="absolute left-full ml-2 top-1/2 -translate-y-1/2
                            z-50
                            opacity-0 group-hover:opacity-100
                            pointer-events-none
                            transition-opacity duration-200
                            bg-gray-900 text-white text-xs rounded-md px-3 py-2
                            whitespace-nowrap shadow-lg"
                >
                    Only the host can edit this listing
                </div>
                </div>
                <button
                  onClick={() => remove(x.id)}
                  className="bg-red-50 text-red-700 px-3 py-2 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="bg-[#154689] p-6 text-white flex justify-between">
              <h2 className="text-xl font-bold">
                {editing ? "Edit Accommodation" : "New Accommodation"}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* BASIC */}
              <input
                className="w-full border px-4 py-3 rounded-xl"
                placeholder="Title"
                value={form.title || ""}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
              />

              <textarea
                className="w-full border px-4 py-3 rounded-xl h-28"
                placeholder="Description"
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  className="border px-4 py-3 rounded-xl"
                  placeholder="City"
                  value={form.city || ""}
                  onChange={(e) =>
                    setForm({ ...form, city: e.target.value })
                  }
                />
                <input
                  className="border px-4 py-3 rounded-xl"
                  placeholder="Province"
                  value={form.province || ""}
                  onChange={(e) =>
                    setForm({ ...form, province: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <select
                  className="border px-4 py-3 rounded-xl"
                  value={form.property_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      property_type: e.target.value as any,
                    })
                  }
                >
                  <option value="Hotel">Hotel</option>
                  <option value="Transient">Transient</option>
                </select>

                <input
                  type="number"
                  className="border px-4 py-3 rounded-xl"
                  placeholder="Price"
                  value={form.price || 0}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                />
              </div>

              {/* AMENITIES */}
              <div>
                <p className="font-semibold mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.map((a) => (
                    <button
                      key={a}
                      onClick={() => toggleAmenity(a)}
                      className={`px-3 py-1 rounded-full text-sm border ${
                        form.amenities?.includes(a)
                          ? "bg-[#154689] text-white"
                          : "bg-gray-100"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* IMAGES */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  handleFiles(e.dataTransfer.files);
                }}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer ${
                  dragging ? "border-blue-500 bg-blue-50" : ""
                }`}
              >
                <Upload className="mx-auto mb-2 text-gray-400" />
                Drag & drop images or click to upload
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files && handleFiles(e.target.files)
                  }
                />
              </div>

              {(form.image_urls?.length ?? 0) > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {form.image_urls?.map((img, i) => (
                    <div key={i} className="relative">
                      <img
                        src={img}
                        className="h-24 w-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 border rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={loading}
                className="px-6 py-2 bg-[#154689] text-white rounded-xl"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccommodationsManagement;
