import { getAdminUsersCollection } from '@/lib/mongodb';
import UsersTable from './UsersTable';
import { verifyAdminToken } from '@/actions/adminAuthActions';

export default async function AdminUsersPage() {
  const user = await verifyAdminToken();
  if (!user.isAuthenticated || user.role !== 'admin') {
    return <div>You do not have permission to access this page.</div>;
  }
  const usersCollection = await getAdminUsersCollection();
  const users = await usersCollection.find({}).toArray();
  return <UsersTable users={users} />;
} 