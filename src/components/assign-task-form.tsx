
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { addTask, getUsers, type Project, type Task } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AssignTaskFormProps {
    projects: Project[];
    onTaskAssigned: (newTask: Task) => void;
}

export function AssignTaskForm({ projects, onTaskAssigned }: AssignTaskFormProps) {
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const users = getUsers();
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject || !selectedUser || !description.trim()) {
            toast({
                variant: 'destructive',
                title: 'Missing Fields',
                description: 'Please select a project, user, and provide a task description.'
            });
            return;
        }

        setIsLoading(true);
        try {
            const newTask = addTask({
                projectId: selectedProject,
                assignedTo: selectedUser,
                description,
                status: 'todo'
            });
            onTaskAssigned(newTask);
            toast({
                title: 'Task Assigned',
                description: 'Successfully assigned task.'
            });
            setSelectedProject('');
            setSelectedUser('');
            setDescription('');
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to assign task.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Assign New Task</CardTitle>
                <CardDescription>Assign a task to a user for a specific project.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="task-project">Project</Label>
                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                            <SelectTrigger id="task-project">
                                <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="task-user">Assign To</Label>
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                            <SelectTrigger id="task-user">
                                <SelectValue placeholder="Select a user" />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map(u => (
                                    <SelectItem key={u.id} value={u.email}>{u.name} ({u.email})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="task-description">Task Description</Label>
                        <Textarea id="task-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Design the new landing page mockups" />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Assign Task
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
