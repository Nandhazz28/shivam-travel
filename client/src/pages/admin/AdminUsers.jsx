import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ShieldOff,
  ShieldCheck as ShieldCheckIcon,
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  ArrowRightLeft,
} from "lucide-react";
import AdminStatCard from "../../components/admin/AdminStatCard";
import StatusBadge from "../../components/admin/StatusBadge";
import DataTable from "../../components/admin/DataTable";
import Modal from "../../components/admin/Modal";
import ConfirmModal, { useConfirm } from "../../components/ConfirmModal";
import Avatar from "../../components/Avatar";
import { SkeletonStatCards } from "../../components/Skeleton";
import {
  FormField,
  TextInput,
  Select,
  PrimaryButton,
} from "../../components/FormField";
import api from "../../services/api";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useToast, apiErrorMessage } from "../../context/ToastContext";

const ROLES = [
  "Administrator",
  "Manager",
  "Booking Staff",
  "Driver",
  "Customer Support",
];
const EMPTY = { name: "", email: "", password: "", role: "Booking Staff" };

export default function AdminUsers() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const { admin: currentAdmin } = useAdminAuth();

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState("");

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    return api
      .get("/admin/users")
      .then((res) => {
        if (isMounted.current) {
          setUsers(res.data?.data || []);
          setStats(res.data?.stats || null);
          setError("");
        }
      })
      .catch((err) => {
        if (isMounted.current) {
          setError(
            err.response?.status === 403
              ? "Only Administrator-role accounts can view staff users."
              : apiErrorMessage(err, "Could not load users."),
          );
        }
      })
      .finally(() => {
        if (isMounted.current) {
          setLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      name: u.name || "",
      email: u.email || "",
      password: "",
      role: u.role || "Booking Staff",
    });
    setFormError("");
    setModalOpen(true);
  };

  const openTransferModal = () => {
    setTransferEmail("");
    setTransferError("");
    setTransferModalOpen(true);
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (transferring) return;

    confirmDialog.ask({
      title: "Transfer Account Ownership?",
      message: `Are you sure you want to transfer your administrator privileges and business control to "${transferEmail}"? You will lose access and control of this profile.`,
      confirmLabel: "Transfer Account",
      tone: "danger",
      onConfirm: async () => {
        setTransferring(true);
        setTransferError("");
        try {
          await api.post("/admin/users/transfer-ownership", {
            email: transferEmail,
          });
          if (isMounted.current) {
            toast.success("Account ownership transferred successfully.");
            setTransferModalOpen(false);
          }
        } catch (err) {
          if (isMounted.current) {
            setTransferError(
              apiErrorMessage(err, "Could not transfer account."),
            );
          }
        } finally {
          if (isMounted.current) {
            setTransferring(false);
          }
        }
      },
    });
  };

  const save = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        await api.put(`/admin/users/${editing._id}`, {
          name: form.name,
          email: form.email,
          role: form.role,
        });
        if (isMounted.current) {
          toast.success("Staff account updated.");
        }
      } else {
        await api.post("/admin/users", form);
        if (isMounted.current) {
          toast.success("Staff account created.");
        }
      }
      if (isMounted.current) {
        setModalOpen(false);
      }
      load();
    } catch (err) {
      if (isMounted.current) {
        setFormError(apiErrorMessage(err, "Could not save staff account."));
      }
    } finally {
      if (isMounted.current) {
        setSaving(false);
      }
    }
  };

  const toggleActive = async (u) => {
    try {
      await api.patch(`/admin/users/${u._id}/toggle-active`);
      if (isMounted.current) {
        toast.success(
          u.isActive ? `${u.name} deactivated.` : `${u.name} activated.`,
        );
      }
      load();
    } catch (err) {
      if (isMounted.current) {
        toast.error(apiErrorMessage(err, "Could not update account status."));
      }
    }
  };

  const remove = (u) => {
    confirmDialog.ask({
      title: "Delete staff account?",
      message: `This permanently deletes "${u.name}"'s account. This cannot be undone.`,
      confirmLabel: "Delete",
      tone: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/admin/users/${u._id}`);
          if (isMounted.current) {
            toast.success("Staff account deleted.");
          }
          load();
        } catch (err) {
          if (isMounted.current) {
            toast.error(
              apiErrorMessage(err, "Could not delete staff account."),
            );
          }
        }
      },
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 bg-brand-red text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition"
          >
            <Plus size={16} aria-hidden="true" /> Add User
          </button>
        </div>
      </div>

      {loading && <SkeletonStatCards count={4} />}
      {!loading && error && (
        <p role="alert" className="text-red-600 text-sm mb-4">
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <AdminStatCard
              icon={<Users size={18} />}
              label="Total Users"
              value={stats?.totalUsers ?? users.length}
              color="blue"
            />
            <AdminStatCard
              icon={<UserCheck size={18} />}
              label="Active Users"
              value={stats?.activeUsers ?? "—"}
              color="green"
            />
            <AdminStatCard
              icon={<UserX size={18} />}
              label="Inactive Users"
              value={stats?.inactiveUsers ?? "—"}
              color="amber"
            />
            <AdminStatCard
              icon={<ShieldCheck size={18} />}
              label="Admin Users"
              value={stats?.adminRoleUsers ?? "—"}
              color="purple"
            />
          </div>

          <DataTable
            columns={[
              {
                key: "name",
                label: "Name",
                render: (u) => (
                  <div className="flex items-center gap-2">
                    <Avatar name={u.name} size="sm" />
                    <span className="font-medium text-gray-800">
                      {u.name}{" "}
                      {currentAdmin &&
                        String(currentAdmin._id) === String(u._id) && (
                          <span className="text-xs text-gray-400 font-normal">
                            (You)
                          </span>
                        )}
                    </span>
                  </div>
                ),
              },
              { key: "email", label: "Email" },
              { key: "role", label: "Role" },
              {
                key: "isActive",
                label: "Status",
                render: (u) => (
                  <StatusBadge status={u.isActive ? "Active" : "Inactive"} />
                ),
              },
            ]}
            rows={users}
            emptyMessage="No staff users found."
            emptyIcon={Users}
            renderActions={(u) => {
              const isSelf =
                currentAdmin && String(currentAdmin._id) === String(u._id);
              return (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(u)}
                    className="p-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                    aria-label={`Edit ${u.name}`}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(u)}
                    disabled={isSelf}
                    className="p-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label={
                      u.isActive ? `Deactivate ${u.name}` : `Activate ${u.name}`
                    }
                    title={
                      isSelf
                        ? "You cannot deactivate your own account"
                        : undefined
                    }
                  >
                    {u.isActive ? (
                      <ShieldOff size={14} />
                    ) : (
                      <ShieldCheckIcon size={14} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(u)}
                    disabled={isSelf}
                    className="p-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label={`Delete ${u.name}`}
                    title={
                      isSelf ? "You cannot delete your own account" : undefined
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            }}
          />
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit User" : "Add User"}
      >
        <form onSubmit={save} className="space-y-4">
          <FormField label="Full Name">
            <TextInput
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              autoComplete="name"
            />
          </FormField>
          <FormField label="Email Address">
            <TextInput
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              required
              autoComplete="email"
            />
          </FormField>
          {!editing && (
            <FormField label="Temporary Password (min. 8 characters)">
              <TextInput
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                minLength={8}
                required
                autoComplete="new-password"
              />
            </FormField>
          )}
          <FormField label="Role">
            <Select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </FormField>

          {formError && (
            <p role="alert" className="text-red-600 text-sm">
              {formError}
            </p>
          )}
          <PrimaryButton type="submit" loading={saving}>
            {editing ? "Save Changes" : "Create Account"}
          </PrimaryButton>
        </form>
      </Modal>      <Modal
        open={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Transfer Account"
      >
        <form onSubmit={handleTransfer} className="space-y-4">
          <p className="text-sm text-gray-500">
            Move your business profile and settings to another account securely.
          </p>

          <FormField label="Target Account Email">
            <TextInput
              type="email"
              placeholder="newowner@example.com"
              value={transferEmail}
              onChange={(e) => setTransferEmail(e.target.value)}
              required
            />
          </FormField>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            <span className="font-semibold">Note:</span> Once transferred, you
            will lose administrative privileges for this business profile.
          </div>

          {transferError && (
            <p role="alert" className="text-red-600 text-sm">
              {transferError}
            </p>
          )}

          <div className="pt-2">
            <PrimaryButton type="submit" loading={transferring}>
              Initiate Transfer
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      <ConfirmModal {...confirmDialog.props} />
    </div>
  );
}
