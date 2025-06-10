'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function UsersTable({ users: initialUsers }: { users: any[] }) {
  // Dialog state for edit
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog state for create
  const [openCreate, setOpenCreate] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'staff'>('staff');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [openDelete, setOpenDelete] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);

  const [users, setUsers] = useState(initialUsers);

  // Refetch users
  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users/list');
    const data = await res.json();
    setUsers(data.users);
  };

  // Khi mở trang lần đầu, đồng bộ users nếu props thay đổi (SSR -> CSR)
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setRole(user.role);
    setPassword('');
    setError(null);
    setOpenEdit(true);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser?.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, password }),
      });
      const result = await res.json();
      if (!result.success) setError(result.message);
      else {
        setOpenEdit(false);
        await fetchUsers();
      }
    } catch (e: any) {
      setError(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreateLoading(true);
    setCreateError(null);
    if (newPassword !== newConfirmPassword) {
      setCreateError('密碼不匹配。');
      setCreateLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole }),
      });
      const result = await res.json();
      if (!result.success) setCreateError(result.message);
      else {
        setOpenCreate(false);
        await fetchUsers();
      }
    } catch (e: any) {
      setCreateError(e.message || 'Error');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = (user: any) => {
    setUserToDelete(user);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}/edit`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!result.success) setError(result.message);
      else {
        setOpenDelete(false);
        setUserToDelete(null);
        await fetchUsers();
      }
    } catch (e: any) {
      setError(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">管理用戶</h1>
        <Button onClick={() => setOpenCreate(true)}>添加新用戶</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">用戶名稱</th>
              <th className="px-4 py-2 text-left">角色</th>
              <th className="px-4 py-2 text-left">創建時間</th>
              <th className="px-4 py-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-2">{user.username}</td>
                <td className="px-4 py-2 capitalize">{user.role}</td>
                <td className="px-4 py-2">{user.createdAt instanceof Date ? user.createdAt.toLocaleString() : new Date(user.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2 text-right">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>編輯</Button>{' '}
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(user)}>刪除</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Edit Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯用戶</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>角色</Label>
              <select value={role} onChange={e => setRole(e.target.value as 'admin' | 'staff')} className="w-full border rounded p-2">
                <option value="staff">員工</option>
                <option value="admin">管理員</option>
              </select>
            </div>
            <div>
              <Label>重置密碼</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="留空以保持當前密碼" />
            </div>
            {error && <div className="text-destructive text-sm">{error}</div>}
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={loading}>{loading ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Create Dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加新用戶</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>用戶名稱</Label>
              <Input value={newUsername} onChange={e => setNewUsername(e.target.value)} required />
            </div>
            <div>
              <Label>密碼</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            </div>
            <div>
              <Label>確認密碼</Label>
              <Input type="password" value={newConfirmPassword} onChange={e => setNewConfirmPassword(e.target.value)} required />
            </div>
            <div>
              <Label>角色</Label>
              <select value={newRole} onChange={e => setNewRole(e.target.value as 'admin' | 'staff')} className="w-full border rounded p-2">
                <option value="staff">員工</option>
                <option value="admin">管理員</option>
              </select>
            </div>
            {createError && <div className="text-destructive text-sm">{createError}</div>}
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={createLoading}>{createLoading ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Dialog */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>刪除用戶</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>確定要刪除用戶 <b>{userToDelete?.username}</b> 嗎？此操作無法撤銷。</p>
            {error && <div className="text-destructive text-sm">{error}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDelete(false)} disabled={loading}>取消</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={loading}>{loading ? '刪除中...' : '刪除'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 