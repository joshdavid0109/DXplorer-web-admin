import React, { useEffect, useRef, useState } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  X,
  MapPin,
  Image as ImageIcon,
  DollarSign,
  Filter,
  Upload,
} from "lucide-react";
import { landService } from "../../service/landService";
import { supabase } from "../../lib/supabase";

/* ===================== TYPES ===================== */

interface LandArrangement {
  land_id: string;
  title: string;
  description: string;
  image_url: string[]; // ✅ MULTIPLE IMAGES
  price: number;
  service_type: "hotel" | "transfer" | "guide" | "meals";
  pricing_type: "per_night" | "per_trip" | "per_person";
  status: "active" | "inactive" | "archived";
}

/* ===================== DEFAULT FORM ===================== */

const emptyForm: Partial<LandArrangement> = {
  title: "",
  description: "",
  image_url: [],
  price: 0,
  service_type: "hotel",
  pricing_type: "per_night",
  status: "archived",
};

/* ===================== COMPONENT ===================== */

const LandArrangementsManagement: React.FC = () => {
  const [items, setItems] = useState<LandArrangement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LandArrangement | null>(null);
  const [form, setForm] = useState<Partial<LandArrangement>>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ===================== LOAD ===================== */

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const data = await landService.getAllLandArrangements();
    setItems(data || []);
  };

  /* ===================== IMAGE UPLOAD ===================== */

  const uploadImage = async (file: File) => {
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from("land-arrangements")
      .upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from("land-arrangements")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleFiles = async (files: FileList | File[]) => {
    const uploaded: string[] = [];

    for (const file of Array.from(files)) {
      const url = await uploadImage(file);
      uploaded.push(url);
    }

    setForm((prev) => ({
      ...prev,
      image_url: [...(prev.image_url || []), ...uploaded],
    }));
  };

  /* ===================== ACTIONS ===================== */

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (item: LandArrangement) => {
    setEditing(item);
    setForm(item);
    setShowModal(true);
  };

  const save = async () => {
    if (!form.title || !form.price) return;
    setIsSubmitting(true);

    try {
      if (editing) {
        await landService.updateLandArrangement(editing.land_id, form);
      } else {
        await landService.createLandArrangement(form);
      }
      setShowModal(false);
      load();
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this land arrangement?")) return;
    await landService.deleteLandArrangement(id);
    load();
  };

  const removeImage = (index: number) => {
    const imgs = [...(form.image_url || [])];
    imgs.splice(index, 1);
    setForm({ ...form, image_url: imgs });
  };

  /* ===================== UI HELPERS ===================== */

  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "inactive":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  /* ===================== RENDER ===================== */

  console.log("items", items);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Land Arrangements
          </h1>
          <p className="text-gray-600">
            Manage hotels, transfers, guides, and meals
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#154689] text-white rounded-lg"
        >
          <Plus className="h-4 w-4" />
          Add Arrangement
        </button>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.land_id}
            className="group bg-white rounded-2xl shadow-sm border hover:shadow-xl overflow-hidden"
          >
            <div className="relative h-48">
              <img
                src={
                  item.image_url?.[0] ||
                  "https://via.placeholder.com/400x300"
                }
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 space-y-2">
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${statusBadge(
                    item.status
                  )}`}
                >
                  {item.status}
                </span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                  {item.service_type}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <h3 className="font-bold text-lg">{item.title}</h3>

              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">
                  ₱{item.price.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500">
                  /{item.pricing_type}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(item)}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg"
                >
                  <Edit3 className="h-4 w-4 inline mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => remove(item.land_id)}
                  className="px-3 py-2 bg-red-50 text-red-700 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===================== MODAL ===================== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* HEADER */}
            <div className="bg-[#154689] p-6 text-white rounded-t-2xl flex justify-between">
              <div className="flex gap-4 items-center">
                <div className="p-3 bg-white/20 rounded-xl">
                  {editing ? <Edit3 /> : <Plus />}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">
                    {editing ? "Edit Land Arrangement" : "Create Land Arrangement"}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Manage land arrangement details
                  </p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)}>
                <X />
              </button>
            </div>

            {/* CONTENT */}
            <div className="p-6 overflow-y-auto space-y-8">
              {/* BASIC INFO */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="text-blue-600" />
                  <h4 className="font-semibold text-lg">Basic Information</h4>
                </div>

                <input
                  className="w-full px-4 py-3 border rounded-xl mb-3"
                  placeholder="Title"
                  value={form.title || ""}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                />

                <textarea
                  className="w-full px-4 py-3 border rounded-xl h-28"
                  placeholder="Description"
                  value={form.description || ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </section>

              {/* MEDIA */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="text-green-600" />
                  <h4 className="font-semibold text-lg">Images</h4>
                </div>

                {/* DROPZONE */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFiles(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300"
                  }`}
                >
                  <Upload className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Drag & drop images or click to upload
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files && handleFiles(e.target.files)
                    }
                  />
                </div>

                {/* PREVIEW GRID */}
                {form.image_url && form.image_url.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {form.image_url.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          className="h-24 w-full object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* PRICING */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="text-emerald-600" />
                  <h4 className="font-semibold text-lg">Pricing</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    className="px-4 py-3 border rounded-xl"
                    placeholder="Price"
                    value={form.price || 0}
                    onChange={(e) =>
                      setForm({ ...form, price: Number(e.target.value) })
                    }
                  />

                  <select
                    className="px-4 py-3 border rounded-xl"
                    value={form.pricing_type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        pricing_type: e.target.value as any,
                      })
                    }
                  >
                    <option value="per_night">Per Night</option>
                    <option value="per_person">Per Person</option>
                  </select>
                </div>

                <select
                  className="w-full px-4 py-3 border rounded-xl mt-4"
                  value={form.service_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      service_type: e.target.value as any,
                    })
                  }
                >
                  <option value="hotel">Hotel</option>
                  <option value="transfer">Transient</option>
                </select>
              </section>

              {/* STATUS */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="text-gray-600" />
                  <h4 className="font-semibold text-lg">Status</h4>
                </div>

                <select
                  className="w-full px-4 py-3 border rounded-xl"
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as any,
                    })
                  }
                >
                  <option value="archived">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </section>
            </div>

            {/* FOOTER */}
            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 border rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={isSubmitting}
                className="px-6 py-2 bg-[#154689] text-white rounded-xl"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandArrangementsManagement;
