import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../services/api";
import {
  FormField,
  TextInput,
  TextArea,
  PrimaryButton,
} from "../../components/FormField";
import ConfirmModal, { useConfirm } from "../../components/ConfirmModal";
import ErrorState from "../../components/ErrorState";
import { SkeletonCard } from "../../components/Skeleton";
import { useToast, apiErrorMessage } from "../../context/ToastContext";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function AdminSettings() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [settings, setSettings] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [imageError, setImageError] = useState("");

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const load = useCallback(() => {
    setLoadError("");
    setSettings(null);
    return api
      .get("/business")
      .then((res) => {
        if (isMounted.current) {
          setSettings(res.data?.data || null);
        }
      })
      .catch((err) => {
        if (isMounted.current) {
          setLoadError(apiErrorMessage(err, "Could not load settings."));
        }
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = (path, value) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImageError("");
    if (file.size > MAX_FILE_SIZE) {
      setImageError("Logo file is too large. Maximum size is 5MB.");
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/business/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (isMounted.current) {
        setSettings((prev) =>
          prev ? { ...prev, logo: res.data?.data } : prev,
        );
        toast.success("Logo updated.");
      }
    } catch (err) {
      if (isMounted.current) {
        setImageError(apiErrorMessage(err, "Could not upload logo."));
      }
    } finally {
      if (isMounted.current) {
        setUploadingLogo(false);
      }
    }
  };

  const handleHeroUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImageError("");
    if (file.size > MAX_FILE_SIZE) {
      setImageError("Hero image file is too large. Maximum size is 5MB.");
      return;
    }

    setUploadingHero(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/business/hero-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (isMounted.current) {
        setSettings((prev) =>
          prev ? { ...prev, heroImages: res.data?.data } : prev,
        );
        toast.success("Hero image added.");
      }
    } catch (err) {
      if (isMounted.current) {
        setImageError(apiErrorMessage(err, "Could not upload hero image."));
      }
    } finally {
      if (isMounted.current) {
        setUploadingHero(false);
      }
    }
  };

  const handleHeroDelete = (publicId) => {
    confirmDialog.ask({
      title: "Remove this hero image?",
      confirmLabel: "Remove",
      tone: "danger",
      onConfirm: async () => {
        setImageError("");
        try {
          const res = await api.delete(
            `/business/hero-image/${encodeURIComponent(publicId)}`,
          );
          if (isMounted.current) {
            setSettings((prev) =>
              prev ? { ...prev, heroImages: res.data?.data } : prev,
            );
            toast.success("Hero image removed.");
          }
        } catch (err) {
          if (isMounted.current) {
            const msg = apiErrorMessage(err, "Could not remove hero image.");
            setImageError(msg);
            toast.error(msg);
          }
        }
      },
    });
  };

  const save = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await api.put("/business", settings);
      if (isMounted.current) {
        toast.success("Business settings updated.");
      }
    } catch (err) {
      if (isMounted.current) {
        toast.error(apiErrorMessage(err, "Could not save settings."));
      }
    } finally {
      if (isMounted.current) {
        setSaving(false);
      }
    }
  };

  if (loadError) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-6">
          Settings
        </h1>
        <div className="bg-white rounded-xl border border-gray-100 max-w-3xl shadow-sm">
          <ErrorState message={loadError} onRetry={load} />
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-6">
          Settings
        </h1>
        <div className="space-y-6 max-w-3xl">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={2} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure your core business details, contact information, social
          links, and assets.
        </p>
      </div>

      <form onSubmit={save} className="space-y-6 max-w-3xl mt-6">
        <section className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
            1. Business Information
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Business Name">
              <TextInput
                value={settings.businessName || ""}
                onChange={(e) => update("businessName", e.target.value)}
              />
            </FormField>
            <FormField label="Tagline (English)">
              <TextInput
                value={settings.tagline?.en || ""}
                onChange={(e) => update("tagline.en", e.target.value)}
              />
            </FormField>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <FormField label="Short Description (English)">
              <TextArea
                rows={3}
                value={settings.shortDescription?.en || ""}
                onChange={(e) => update("shortDescription.en", e.target.value)}
              />
            </FormField>
            <FormField label="Short Description (Tamil)">
              <TextArea
                rows={3}
                value={settings.shortDescription?.ta || ""}
                onChange={(e) => update("shortDescription.ta", e.target.value)}
                placeholder="தமிழ் உள்ளீடு"
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
            2. Contact Information
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Phone Number">
              <TextInput
                value={settings.phone || ""}
                onChange={(e) => update("phone", e.target.value)}
                autoComplete="tel"
              />
            </FormField>
            <FormField label="WhatsApp Number">
              <TextInput
                value={settings.whatsapp || ""}
                onChange={(e) => update("whatsapp", e.target.value)}
              />
            </FormField>
          </div>
          <div className="mt-4">
            <FormField label="Default WhatsApp Message (English)">
              <TextArea
                rows={2}
                value={settings.whatsappDefaultMessage?.en || ""}
                onChange={(e) =>
                  update("whatsappDefaultMessage.en", e.target.value)
                }
              />
            </FormField>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <FormField label="Email">
              <TextInput
                type="email"
                value={settings.email || ""}
                onChange={(e) => update("email", e.target.value)}
                autoComplete="email"
              />
            </FormField>
            <FormField label="Address (English)">
              <TextInput
                value={settings.address?.en || ""}
                onChange={(e) => update("address.en", e.target.value)}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-1">3. Social Links</h2>
          <p className="text-xs text-gray-400 mb-4">
            Shown as icons in the site footer. Leave blank to hide an icon.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Facebook URL">
              <TextInput
                type="url"
                placeholder="https://facebook.com/yourpage"
                value={settings.socialLinks?.facebook || ""}
                onChange={(e) => update("socialLinks.facebook", e.target.value)}
              />
            </FormField>
            <FormField label="Instagram URL">
              <TextInput
                type="url"
                placeholder="https://instagram.com/yourpage"
                value={settings.socialLinks?.instagram || ""}
                onChange={(e) =>
                  update("socialLinks.instagram", e.target.value)
                }
              />
            </FormField>
            <FormField label="YouTube URL">
              <TextInput
                type="url"
                placeholder="https://youtube.com/@yourchannel"
                value={settings.socialLinks?.youtube || ""}
                onChange={(e) => update("socialLinks.youtube", e.target.value)}
              />
            </FormField>
            <FormField label="Twitter / X URL">
              <TextInput
                type="url"
                placeholder="https://x.com/yourhandle"
                value={settings.socialLinks?.twitter || ""}
                onChange={(e) => update("socialLinks.twitter", e.target.value)}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-1">4. Company Stats</h2>
          <p className="text-xs text-gray-400 mb-4">
            Shown on the About page (&quot;1000+ Happy Customers&quot;, etc).
            Keep these accurate — update them as your business grows.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Happy Customers">
              <TextInput
                type="number"
                min="0"
                value={settings.stats?.happyCustomers ?? 0}
                onChange={(e) =>
                  update("stats.happyCustomers", Number(e.target.value))
                }
              />
            </FormField>
            <FormField label="Successful Trips">
              <TextInput
                type="number"
                min="0"
                value={settings.stats?.successfulTrips ?? 0}
                onChange={(e) =>
                  update("stats.successfulTrips", Number(e.target.value))
                }
              />
            </FormField>
            <FormField label="Years of Experience">
              <TextInput
                type="number"
                min="0"
                value={settings.stats?.yearsExperience ?? 0}
                onChange={(e) =>
                  update("stats.yearsExperience", Number(e.target.value))
                }
              />
            </FormField>
            <FormField label="Outstation Destinations">
              <TextInput
                type="number"
                min="0"
                value={settings.stats?.outstationDestinations ?? 0}
                onChange={(e) =>
                  update("stats.outstationDestinations", Number(e.target.value))
                }
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
            5. Logo &amp; Hero Images
          </h2>

          <div className="flex items-center gap-4 mb-6">
            {settings.logo?.url ? (
              <img
                src={settings.logo.url}
                alt="Current logo"
                className="w-16 h-16 object-contain rounded-lg border border-gray-100 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-400 text-center px-1 bg-gray-50">
                No logo set
              </div>
            )}
            <div>
              <label className="inline-block cursor-pointer text-sm font-semibold text-red-600 hover:underline">
                {uploadingLogo ? "Uploading..." : "Upload new logo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={uploadingLogo}
                  onChange={handleLogoUpload}
                />
              </label>
              <p className="text-xs text-gray-400 mt-1">
                JPEG, PNG, WEBP, or GIF — max 5MB. Replaces the current logo
                everywhere on the public site.
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-800">
                Homepage hero images
              </p>
              <label className="inline-block cursor-pointer text-sm font-semibold text-red-600 hover:underline">
                {uploadingHero ? "Uploading..." : "+ Add image"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={uploadingHero}
                  onChange={handleHeroUpload}
                />
              </label>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {(settings.heroImages || []).map((img) => (
                <div key={img.publicId} className="relative group">
                  <img
                    src={img.url}
                    alt=""
                    className="w-full aspect-video object-cover rounded-lg border border-gray-100 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleHeroDelete(img.publicId)}
                    className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white text-xs rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition shadow"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {(!settings.heroImages || settings.heroImages.length === 0) && (
                <p className="col-span-full text-xs text-gray-400 py-2">
                  No hero images uploaded yet.
                </p>
              )}
            </div>
            {imageError && (
              <p role="alert" className="text-xs text-red-600 font-medium mt-2">
                {imageError}
              </p>
            )}
          </div>
        </section>

        <PrimaryButton type="submit" loading={saving} className="max-w-xs">
          Save Changes
        </PrimaryButton>
      </form>
      <ConfirmModal {...confirmDialog.props} />
    </div>
  );
}
