"use client";
import { useState, useEffect } from "react";
import { Users as UsersIcon, Plus, Edit2, Trash2, Mail, ShieldAlert, X, User as UserIcon, Eye, EyeOff } from "lucide-react";

interface User {
    id: number;
    full_name: string;
    email: string;
    role: string;
    created_at: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({ full_name: "", email: "", password: "", role: "Operator" });
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("access_token");
            const res = await fetch("https://crowd-monitoring-behaviour-analysis.onrender.com/api/users", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                setError("Failed to fetch users.");
            }
        } catch (err) {
            setError("Error connecting to server.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({ full_name: user.full_name, email: user.email, password: "", role: user.role });
        } else {
            setEditingUser(null);
            setFormData({ full_name: "", email: "", password: "", role: "Operator" });
        }
        setShowPassword(false);
        setIsModalOpen(true);
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        const token = localStorage.getItem("access_token");
        const url = editingUser ? `https://crowd-monitoring-behaviour-analysis.onrender.com/api/users/${editingUser.id}` : "https://crowd-monitoring-behaviour-analysis.onrender.com/api/users";
        const method = editingUser ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchUsers();
            } else {
                const data = await res.json();
                setError(data.error || "Failed to save user.");
            }
        } catch (err) {
            setError("Server connection failed.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async (id: number) => {
        setDeletingId(id);
        setShowDeleteConfirm(null);
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`https://crowd-monitoring-behaviour-analysis.onrender.com/api/users/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                fetchUsers();
            } else {
                const data = await res.json();
                alert(`Failed: ${data.error || 'Deletion failed'}`);
            }
        } catch (err) {
            alert("Connection error during deletion.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto py-4">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md" style={{backgroundColor: '#0f172a'}}>
                        <UsersIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">Add, update, and remove system personnel.</p>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-2.5 text-white rounded-xl font-bold text-sm shadow-lg transition-all"
                    style={{backgroundColor: '#0f172a'}}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1e293b')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0f172a')}
                >
                    <Plus className="w-4 h-4" />
                    Create User
                </button>
            </div>

            {error && !isModalOpen && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-lg flex items-center gap-3 text-sm font-semibold">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    {error}
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center font-bold text-slate-400">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center font-bold text-slate-400">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs uppercase">
                                                {user.full_name?.charAt(0) || "U"}
                                            </div>
                                            {user.full_name}
                                        </td>
                                        <td className="px-6 py-4">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg inline-flex text-[10px] font-bold uppercase tracking-widest ${user.role === "Admin" ? "bg-slate-900 text-white" :
                                                    user.role === "Authority" ? "bg-blue-600 text-white" :
                                                        "bg-slate-100 text-slate-500 border border-slate-200"
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-xs font-semibold whitespace-nowrap">
                                            {user.created_at || "N/A"}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(user)}
                                                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100"
                                                    title="Edit User"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={deletingId !== null}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setShowDeleteConfirm(user.id);
                                                    }}
                                                    className={`p-2 rounded-lg transition-all border ${
                                                        deletingId === user.id 
                                                        ? "bg-slate-100 text-slate-400" 
                                                        : "text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100"
                                                    }`}
                                                    title="Delete User"
                                                >
                                                    {deletingId === user.id ? (
                                                        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                            <h2 className="text-lg font-bold text-slate-800">
                                {editingUser ? "Edit User Account" : "Create New User"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {error && isModalOpen && (
                            <div className="mx-6 mt-6 p-3 bg-red-50 text-red-600 text-xs font-bold rounded border border-red-100">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSaveUser} className="p-6 space-y-4" autoComplete="off">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                                <div className="relative">
                                    <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                    <input
                                        type="text" required
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-sm"
                                        placeholder="John Doe"
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                    <input
                                        type="email" required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-sm"
                                        placeholder="user@example.com"
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                                        {editingUser ? "New Password" : "Password"}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required={!editingUser}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-sm pr-10"
                                            placeholder={editingUser ? "Leave blank to keep" : "••••••••"}
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-sm appearance-none bg-white cursor-pointer"
                                        autoComplete="off"
                                    >
                                        <option value="Operator">Operator</option>
                                        <option value="Authority">Authority</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 font-bold text-sm rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2.5 text-white font-bold text-sm rounded-xl transition-all shadow-md disabled:opacity-50"
                                    style={{backgroundColor: '#0f172a'}}
                                >
                                    {saving ? "Saving..." : "Save User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm !== null && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShieldAlert className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Delete User?</h3>
                            <p className="text-slate-500 text-sm mb-6">
                                This action is permanent and cannot be undone. Are you sure you want to proceed?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-600 font-bold text-sm rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteUser(showDeleteConfirm)}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 transition-colors shadow-md"
                                >
                                    Confirm Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
