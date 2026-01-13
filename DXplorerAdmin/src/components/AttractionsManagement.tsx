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
  Star,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { attractionService } from "../../service/attractionService";

/* ===================== TYPES ===================== */

interface Attraction {
  attraction_id: string;
  attraction_code: string;
  title: string;
  description: string;
  city: string;
  country: string;
  category: string;
  price: number;
  weighted_rating?: number;
  image_url: string[];
  status: "active" | "inactive" | "archived";
}

/* ===================== DEFAULT FORM ===================== */

const emptyForm: Partial<Attraction> = {
  title: "",
  description: "",
  city: "",
  country: "",
  category: "attraction",
  price: 0,
  image_url: [],
  status: "archived",
};

/* ===================== COMPONENT ===================== */

const AttractionsManagement: React.FC = () => {
  const [items, setItems] = useState<Attraction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Attraction | null>(null);
  const [form, setForm] = useState<Partial<Attraction>>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ===================== LOAD ===================== */

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const data = await attractionService.getAllAttractions();
    setItems(data || []);
  };

  const validateFile = (file: File) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    return 'Invalid file type. Only JPG, PNG, GIF, WebP allowed.';
  }

  if (file.size > maxSize) {
    return 'File size must be less than 5MB.';
  }

  return null;
};


  /* ===================== IMAGE UPLOAD ===================== */

const uploadImage = async (file: File) => {
  const validationError = validateFile(file);
  if (validationError) {
    alert(validationError);
    return null;
  }

  const filePath = `attractions/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from('images') // ✅ SAME bucket as Tours
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Supabase upload error:', uploadError);
    alert(uploadError.message);
    return null;
  }

  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(filePath);

  return data.publicUrl;
};



const handleFiles = async (files: FileList | File[]) => {
  if (!files.length) return;

  setIsSubmitting(true);

  try {
    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      const imageUrl = await uploadImage(file);
      if (imageUrl) {
        uploadedUrls.push(imageUrl);
      }
    }

    // ✅ SINGLE state update (this is the fix)
    if (uploadedUrls.length > 0) {
      setForm(prev => ({
        ...prev,
        image_url: [...(prev.image_url || []), ...uploadedUrls],
      }));
    }

  } catch (err) {
    console.error("Upload failed:", err);
  } finally {
    setIsSubmitting(false);
  }
};





  /* ===================== ACTIONS ===================== */

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (item: Attraction) => {
    setEditing(item);
    setForm(item);
    setShowModal(true);
  };

  const save = async () => {
    if (!form.title || !form.price) return;
    setIsSubmitting(true); 

    try {
      if (editing) {
        await attractionService.updateAttraction(
          editing.attraction_id,
          form
        );
      } else {
        await attractionService.createAttraction(form);
      }
      setShowModal(false);
      load();
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this attraction?")) return;
    await attractionService.deleteAttraction(id);
    load();
  };

  const removeImage = (index: number) => {
    const imgs = [...(form.image_url || [])];
    imgs.splice(index, 1);
    setForm({ ...form, image_url: imgs });
  };

  /* ===================== UI HELPERS ===================== */

  /* ===================== RENDER ===================== */

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Attractions Management
          </h1>
          <p className="text-gray-600">
            Create, edit, and manage attractions & experiences
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#154689] text-white rounded-lg"
        >
          <Plus className="h-4 w-4" />
          Add Attraction
        </button>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.attraction_id}
            className="group bg-white rounded-2xl shadow-sm border hover:shadow-xl overflow-hidden"
          >
            <div className="relative h-48">
              <img
                src={
                  item.image_url?.[0]                }
                className="w-full h-full object-cover"
              />

              <div className="absolute top-3 right-3 space-y-2">
                

                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                  {item.category}
                </span>
              </div>

             {(item.weighted_rating ?? 0) > 0 && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/90 px-3 py-1 rounded-full">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">
                    {item.weighted_rating}
                    </span>
                </div>
            )}

            </div>

            <div className="p-5 space-y-3">
              <h3 className="font-bold text-lg">{item.title}</h3>

              <p className="text-sm text-gray-500">
                {item.city}, {item.country}
              </p>

              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">
                  ₱{item.price.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500">per person</span>
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
                  onClick={() => remove(item.attraction_id)}
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
                    {editing ? "Edit Attraction" : "Create Attraction"}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Attraction details & media
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

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <input
                    className="px-4 py-3 border rounded-xl"
                    placeholder="City"
                    value={form.city || ""}
                    onChange={(e) =>
                      setForm({ ...form, city: e.target.value })
                    }
                  />
                  <input
                    className="px-4 py-3 border rounded-xl"
                    placeholder="Country"
                    value={form.country || ""}
                    onChange={(e) =>
                      setForm({ ...form, country: e.target.value })
                    }
                  />
                </div>
              </section>

              {/* MEDIA */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="text-green-600" />
                  <h4 className="font-semibold text-lg">Images</h4>
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!isSubmitting) setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (!isSubmitting) handleFiles(e.dataTransfer.files);
                  }}
                  onClick={() => {
                    if (!isSubmitting) fileInputRef.current?.click();
                  }}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition
                    ${isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"}
                  `}
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

                {form.image_url && form.image_url.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {form.image_url.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.jpg";
                          }}
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

                <input
                  type="number"
                  className="w-full px-4 py-3 border rounded-xl"
                  placeholder="Price"
                  value={form.price || 0}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                />
              </section>

              {/* META */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="text-gray-600" />
                  <h4 className="font-semibold text-lg">Category & Status</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <select
                    className="px-4 py-3 border rounded-xl"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    <option value="attraction">Attraction</option>
                    <option value="tour">Tour</option>
                    <option value="experience">Experience</option>
                    <option value="transport">Transport</option>
                  </select>

                  <select
                    className="px-4 py-3 border rounded-xl"
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as any })
                    }
                  >
                    <option value="archived">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
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

export default AttractionsManagement;
