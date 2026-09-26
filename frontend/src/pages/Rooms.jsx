import React, { useState, useEffect } from "react";
import { roomsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import TableSkeleton from "../components/TableSkeleton";
import {
  DoorClosed,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Users,
  Layers,
  CheckCircle,
} from "lucide-react";

export default function Rooms() {
  const { role } = useAuth();
  const { success, error } = useToast();
  const canModify = ["admin", "hod"].includes(role?.toLowerCase());

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const initialFormState = {
    room_name: "",
    room_type: "Classroom",
    capacity: 60,
    status: "active",
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params = {};
      if (typeFilter !== "all") params.room_type = typeFilter;

      const res = await roomsApi.getAll(params);
      const data = res.data || res;
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      error(err.message || "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [typeFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await roomsApi.create({
        ...formData,
        capacity: Number(formData.capacity) || 60,
      });
      success("Room added successfully!");
      setIsCreateOpen(false);
      setFormData(initialFormState);
      fetchRooms();
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to create room");
    } finally {
      setFormLoading(false);
    }
  };

  const openEdit = (room) => {
    setSelectedRoom(room);
    setFormData({
      room_name: room.room_name || "",
      room_type: room.room_type || "Classroom",
      capacity: room.capacity || 60,
      status: room.status || "active",
    });
    setIsEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedRoom) return;
    setFormLoading(true);
    try {
      await roomsApi.update(selectedRoom.id, {
        ...formData,
        capacity: Number(formData.capacity) || 60,
      });
      success("Room updated successfully!");
      setIsEditOpen(false);
      setSelectedRoom(null);
      fetchRooms();
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to update room");
    } finally {
      setFormLoading(false);
    }
  };

  const openDelete = (room) => {
    setSelectedRoom(room);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedRoom) return;
    setFormLoading(true);
    try {
      await roomsApi.delete(selectedRoom.id);
      success("Room deleted successfully!");
      setIsDeleteOpen(false);
      setSelectedRoom(null);
      fetchRooms();
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to delete room");
    } finally {
      setFormLoading(false);
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const q = search.toLowerCase();
    const nameMatch = (r.room_name || "").toLowerCase().includes(q);
    const typeMatch = (r.room_type || "").toLowerCase().includes(q);
    return nameMatch || typeMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DoorClosed className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Rooms & Labs Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure classrooms, computer labs, seminar halls, and seating capacities.
          </p>
        </div>

        {canModify && (
          <button
            onClick={() => {
              setFormData(initialFormState);
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-indigo-600/20 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Add Room
          </button>
        )}
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by room name or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Room Types</option>
            <option value="Classroom">Classroom</option>
            <option value="Lab">Lab</option>
            <option value="Seminar Hall">Seminar Hall</option>
            <option value="Auditorium">Auditorium</option>
          </select>

          <button
            onClick={fetchRooms}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Rooms Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        {loading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : filteredRooms.length === 0 ? (
          <div className="p-12 text-center">
            <DoorClosed className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">
              No rooms found
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {search ? "No rooms match your search query." : "No rooms have been added yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/75 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Room Name / Number</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6">Capacity</th>
                  <th className="py-3.5 px-6">Status</th>
                  {canModify && <th className="py-3.5 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                {filteredRooms.map((room) => (
                  <tr
                    key={room.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-700/40 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                          {room.room_name?.slice(0, 3) || "RM"}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {room.room_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {room.room_type || "Classroom"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{room.capacity || 60} Seats</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          room.status === "active"
                            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        <CheckCircle className="w-3 h-3" />
                        {room.status || "active"}
                      </span>
                    </td>
                    {canModify && (
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => openEdit(room)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg transition"
                          title="Edit Room"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDelete(room)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition"
                          title="Delete Room"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Room"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Room Name / Identifier *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 204, LH-1, Lab 3"
              value={formData.room_name}
              onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Room Type
            </label>
            <select
              value={formData.room_type}
              onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Classroom">Classroom</option>
              <option value="Lab">Computer / Hardware Lab</option>
              <option value="Seminar Hall">Seminar Hall</option>
              <option value="Auditorium">Auditorium</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Seating Capacity
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive / Maintenance</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50"
            >
              {formLoading ? "Creating..." : "Create Room"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Room"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Room Name / Identifier *
            </label>
            <input
              type="text"
              required
              value={formData.room_name}
              onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Room Type
            </label>
            <select
              value={formData.room_type}
              onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Classroom">Classroom</option>
              <option value="Lab">Computer / Hardware Lab</option>
              <option value="Seminar Hall">Seminar Hall</option>
              <option value="Auditorium">Auditorium</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Seating Capacity
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive / Maintenance</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50"
            >
              {formLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Room"
        message={`Are you sure you want to delete room "${selectedRoom?.room_name}"? This action cannot be undone if the room is not used by existing timetables.`}
        loading={formLoading}
      />
    </div>
  );
}
