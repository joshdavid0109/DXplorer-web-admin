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

interface CarRental {
  id: string;
  car_code: string;
  car_name: string;
  brand: string;
  vehicle_type: string;
  transmission: string;
  city: string;
  base_price: number;
  image_url: string[];
  status: "active" | "inactive" | "archived";
}

/* ===================== HELPERS ===================== */

const normalizeImages = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") return [value];
  return [];
};

const VEHICLE_TYPES = ["sedan", "suv", "van", "mpv"];
const TRANSMISSIONS = ["automatic", "manual"];

/* ===================== COMPONENT ===================== */

const CarRentalsManagement: React.FC = () => {
  const [items, setItems] = useState<CarRental[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CarRental | null>(null);
  const [form, setForm] = useState<Partial<CarRental>>({
    vehicle_type: "sedan",
    transmission: "automatic",
    image_url: [],
    status: "archived",
  });
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);

  /* ===================== LOAD ===================== */

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data, error } = await supabase
      .from("car_rentals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("LOAD CARS ERROR:", error);
      return;
    }

    setItems(
      (data || []).map((x) => ({
        ...x,
        image_url: normalizeImages(x.image_url),
      }))
    );
  };

  /* ===================== IMAGE UPLOAD ===================== */

  const uploadImage = async (file: File) => {
    const path = `cars/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("cars")
      .upload(path, file);

    if (error) throw error;

    const { data } = supabase.storage.from("cars").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleFiles = async (files: FileList | File[]) => {
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      uploaded.push(await uploadImage(file));
    }

    setForm((prev) => ({
      ...prev,
      image_url: [...(prev.image_url || []), ...uploaded],
    }));
  };

  /* ===================== CRUD ===================== */

  const openCreate = () => {
    setEditing(null);
    setForm({
      vehicle_type: "sedan",
      transmission: "automatic",
      image_url: [],
      status: "archived",
    });
    setShowModal(true);
  };

  const openEdit = (item: CarRental) => {
    setEditing(item);
    setForm(item);
    setShowModal(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await supabase
          .from("car_rentals")
          .update(form)
          .eq("id", editing.id);
      } else {
        await supabase.from("car_rentals").insert({
          ...form,
          car_code: `CAR-${Date.now()}`,
        });
      }

      setShowModal(false);
      load();
    } catch (e) {
      console.error("SAVE CAR ERROR:", e);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this car rental?")) return;
    await supabase.from("car_rentals").delete().eq("id", id);
    load();
  };

  const removeImage = (idx: number) => {
    const imgs = [...(form.image_url || [])];
    imgs.splice(idx, 1);
    setForm({ ...form, image_url: imgs });
  };

  /* ===================== UI ===================== */

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Car Rentals</h1>
          <p className="text-gray-600">
            Manage available vehicles and rental pricing
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#154689] text-white rounded-lg"
        >
          <Plus className="h-4 w-4" />
          Add Car
        </button>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((x) => (
          <div
            key={x.id}
            className="bg-white rounded-2xl shadow-sm border overflow-hidden"
          >
            <img
              src={x.image_url?.[0] || "https://via.placeholder.com/400"}
              className="h-48 w-full object-cover"
            />

            <div className="p-5 space-y-3">
              <h3 className="font-bold text-lg">
                {x.car_name} ({x.brand})
              </h3>

              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {x.city}
              </p>

              <div className="flex justify-between items-center">
                <span className="font-bold text-xl">
                  ₱{x.base_price.toLocaleString()}
                </span>
                <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">
                  {x.vehicle_type} • {x.transmission}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(x)}
                  className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg"
                >
                  <Edit3 className="inline h-4 w-4 mr-1" />
                  Edit
                </button>
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
                {editing ? "Edit Car" : "New Car"}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <input
                className="w-full border px-4 py-3 rounded-xl"
                placeholder="Car Name"
                value={form.car_name || ""}
                onChange={(e) =>
                  setForm({ ...form, car_name: e.target.value })
                }
              />

              <input
                className="w-full border px-4 py-3 rounded-xl"
                placeholder="Brand"
                value={form.brand || ""}
                onChange={(e) =>
                  setForm({ ...form, brand: e.target.value })
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <select
                  className="border px-4 py-3 rounded-xl"
                  value={form.vehicle_type}
                  onChange={(e) =>
                    setForm({ ...form, vehicle_type: e.target.value })
                  }
                >
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>

                <select
                  className="border px-4 py-3 rounded-xl"
                  value={form.transmission}
                  onChange={(e) =>
                    setForm({ ...form, transmission: e.target.value })
                  }
                >
                  {TRANSMISSIONS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>

              <input
                className="border px-4 py-3 rounded-xl"
                placeholder="City"
                value={form.city || ""}
                onChange={(e) =>
                  setForm({ ...form, city: e.target.value })
                }
              />

              <input
                type="number"
                className="border px-4 py-3 rounded-xl"
                placeholder="Base Price"
                value={form.base_price || 0}
                onChange={(e) =>
                  setForm({
                    ...form,
                    base_price: Number(e.target.value),
                  })
                }
              />

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

              {(form.image_url?.length ?? 0) > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {(form.image_url || []).map((img, i) => (
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
                disabled={saving}
                className="px-6 py-2 bg-[#154689] text-white rounded-xl"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarRentalsManagement;
