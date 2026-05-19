'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Pencil,
  Trash2,
  Shield,
  UserCog,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  createStaffAction,
  updateStaffAction,
  deleteStaffAction,
} from '@/actions/admin-staff-actions';
import { useAdminTranslation } from '@/components/AdminTranslationProvider';

interface StaffMember {
  _id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';
  createdAt: string;
}

interface StaffTableProps {
  staff: StaffMember[];
  currentUserId: string;
}

export function StaffTable({ staff, currentUserId }: StaffTableProps) {
  const { t } = useAdminTranslation();

  const roleConfig = {
    SUPER_ADMIN: {
      label: t('staff.roles.superAdmin'),
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: Shield,
    },
    ADMIN: {
      label: t('staff.roles.admin'),
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: UserCog,
    },
    MODERATOR: {
      label: t('staff.roles.moderator'),
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: UserCheck,
    },
  };
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'MODERATOR' as 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR',
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'MODERATOR' });
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error(t('staff.toast.fillAllFields'));
      return;
    }

    setIsLoading(true);
    const result = await createStaffAction(formData);
    setIsLoading(false);

    if (result.success) {
      toast.success(t('staff.toast.addSuccess'));
      setIsAddOpen(false);
      resetForm();
      window.location.reload();
    } else {
      toast.error(result.error || t('staff.toast.addFailed'));
    }
  };

  const handleEdit = async () => {
    if (!selectedStaff) return;

    setIsLoading(true);
    const updateData: any = {};
    if (formData.name) updateData.name = formData.name;
    if (formData.email) updateData.email = formData.email;
    if (formData.password) updateData.password = formData.password;
    if (formData.role) updateData.role = formData.role;

    const result = await updateStaffAction(selectedStaff._id, updateData);
    setIsLoading(false);

    if (result.success) {
      toast.success(t('staff.toast.updateSuccess'));
      setIsEditOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || t('staff.toast.updateFailed'));
    }
  };

  const handleDelete = async () => {
    if (!selectedStaff) return;

    setIsLoading(true);
    const result = await deleteStaffAction(selectedStaff._id);
    setIsLoading(false);

    if (result.success) {
      toast.success(t('staff.toast.deleteSuccess'));
      setIsDeleteOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || t('staff.toast.deleteFailed'));
    }
  };

  const openEdit = (member: StaffMember) => {
    setSelectedStaff(member);
    setFormData({
      name: member.name,
      email: member.email,
      password: '',
      role: member.role,
    });
    setIsEditOpen(true);
  };

  const openDelete = (member: StaffMember) => {
    setSelectedStaff(member);
    setIsDeleteOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('staff.table.title')}</CardTitle>
          <Button
            onClick={() => {
              resetForm();
              setIsAddOpen(true);
            }}
            className="bg-[#8C52FF] hover:bg-[#7a47e6]"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('staff.table.addStaff')}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('staff.table.name')}</TableHead>
                <TableHead>{t('staff.table.email')}</TableHead>
                <TableHead>{t('staff.table.role')}</TableHead>
                <TableHead>{t('staff.table.created')}</TableHead>
                <TableHead className="text-right">
                  {t('staff.table.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => {
                const config = roleConfig[member.role];
                const Icon = config.icon;
                return (
                  <TableRow key={member._id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={config.color}>
                        <Icon className="mr-1 h-3 w-3" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(member.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        timeZone: 'UTC',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(member)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDelete(member)}
                          disabled={member._id === currentUserId}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {staff.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground py-8 text-center"
                  >
                    {t('staff.table.noStaffYet')}{' '}
                    {t('staff.table.addFirstStaff')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('staff.modal.addStaffMember')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder={t('staff.modal.fullName')}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <Input
              type="email"
              placeholder={t('staff.modal.emailAddress')}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            <Input
              type="password"
              placeholder={t('staff.modal.password')}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
            <Select
              value={formData.role}
              onValueChange={(v: any) => setFormData({ ...formData, role: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUPER_ADMIN">
                  {t('staff.roles.superAdmin')}
                </SelectItem>
                <SelectItem value="ADMIN">{t('staff.roles.admin')}</SelectItem>
                <SelectItem value="MODERATOR">
                  {t('staff.roles.moderator')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              {t('staff.modal.cancel')}
            </Button>
            <Button
              onClick={handleAdd}
              disabled={isLoading}
              className="bg-[#8C52FF] hover:bg-[#7a47e6]"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('staff.modal.addStaff')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('staff.modal.editStaffMember')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder={t('staff.modal.fullName')}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <Input
              type="email"
              placeholder={t('staff.modal.emailAddress')}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            <Input
              type="password"
              placeholder={t('staff.modal.newPassword')}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
            <Select
              value={formData.role}
              onValueChange={(v: any) => setFormData({ ...formData, role: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUPER_ADMIN">
                  {t('staff.roles.superAdmin')}
                </SelectItem>
                <SelectItem value="ADMIN">{t('staff.roles.admin')}</SelectItem>
                <SelectItem value="MODERATOR">
                  {t('staff.roles.moderator')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              {t('staff.modal.cancel')}
            </Button>
            <Button
              onClick={handleEdit}
              disabled={isLoading}
              className="bg-[#8C52FF] hover:bg-[#7a47e6]"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('staff.modal.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('staff.modal.deleteStaffMember')}</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            {t('staff.modal.deleteConfirm', {
              name: selectedStaff?.name || '',
            })}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              {t('staff.modal.cancel')}
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isLoading}
              variant="destructive"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('staff.modal.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
