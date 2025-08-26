
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getUsers, updateUserRole, deleteUser, getProjects, getTasks, type User, type Project, type Task } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [userToRemove, setUserToRemove] = useState<User | null>(null);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const fetchAllData = async () => {
    setUsers(await getUsers());
    setProjects(await getProjects());
    setTasks(await getTasks());
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const filteredUsers = useMemo(() => {
    if (selectedProject === 'all') {
      return users;
    }
    const userEmailsInProject = new Set(
      tasks
        .filter(task => task.projectId === selectedProject)
        .map(task => task.assignedTo)
    );
    return users.filter(user => userEmailsInProject.has(user.email));
  }, [users, tasks, selectedProject]);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'worker') => {
    if (userId === currentUser?.uid) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: "You cannot change your own role.",
      });
      fetchAllData();
      return;
    }
    
    try {
      await updateUserRole(userId, newRole);
      toast({
        title: 'Success',
        description: `User role updated to ${newRole}.`,
      });
      fetchAllData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update user role.',
      });
      fetchAllData();
    }
  };

  const handleRemoveUser = async () => {
    if (!userToRemove) return;
    if (userToRemove.id === currentUser?.uid) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: "You cannot remove yourself.",
        });
        setUserToRemove(null);
        return;
    }

    try {
        await deleteUser(userToRemove.id);
        toast({
            title: 'User Removed',
            description: `${userToRemove.name} has been removed from the system.`,
        });
        fetchAllData();
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to remove user.',
        });
    } finally {
        setUserToRemove(null);
    }
  }

  return (
    <>
        <Card className="shadow-lg border-primary/20">
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>View and manage user roles in the system.</CardDescription>
                </div>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Filter by project" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {projects.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-[60vh]">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                        <Select
                            value={user.role}
                            onValueChange={(newRole: 'admin' | 'worker') => handleRoleChange(user.id, newRole)}
                            disabled={user.id === currentUser?.uid}
                        >
                            <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="worker">Worker</SelectItem>
                            </SelectContent>
                        </Select>
                        </TableCell>
                        <TableCell className="text-right">
                           <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setUserToRemove(user)}
                                disabled={user.id === currentUser?.uid}
                            >
                                <X className="h-4 w-4 text-destructive" />
                           </Button>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        No users found for this filter.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </ScrollArea>
        </CardContent>
        </Card>
        
        <AlertDialog open={!!userToRemove} onOpenChange={(open) => !open && setUserToRemove(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently remove the user's data from the application. 
                    They will lose their role and associated data.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setUserToRemove(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRemoveUser} className="bg-destructive hover:bg-destructive/90">
                    Yes, remove user
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
