
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getProjects, getTasks, type Project, type Task, updateTaskStatus } from '@/lib/data';
import { CreateProjectForm } from './create-project-form';
import { AssignTaskForm } from './assign-task-form';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ProjectManagement() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [verifyingTaskId, setVerifyingTaskId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProjects = async () => {
    if(user) setProjects(await getProjects());
  }

  const fetchTasks = async () => {
    if(user) setTasks(await getTasks());
  }

  useEffect(() => {
    if (!user) return; // Don't fetch until user is authenticated
    fetchProjects();
    fetchTasks();
  }, [user]);

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prev => [...prev, newProject]);
  }

  const handleTaskAssigned = (newTask: Task) => {
    setTasks(prev => [...prev, newTask]);
    fetchTasks();
  }

  const handleVerifyTask = async (taskId: string) => {
    setVerifyingTaskId(taskId);
    try {
      await updateTaskStatus(taskId, 'verified');
      await fetchTasks();
      toast({
        title: "Task Verified",
        description: "The task has been successfully verified and is now closed."
      })
    } catch(e) {
        toast({
            variant: 'destructive',
            title: 'Verification Failed',
            description: 'Could not verify the task. Please try again.'
        })
    } finally {
        setVerifyingTaskId(null);
    }
  }

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown';
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <CreateProjectForm onProjectCreated={handleProjectCreated} />
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>List of all created projects.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Client</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.length > 0 ? (
                    projects.map(project => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>{project.client}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                        No projects created yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <AssignTaskForm projects={projects} onTaskAssigned={handleTaskAssigned} />
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Assigned Tasks</CardTitle>
            <CardDescription>List of all assigned tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.length > 0 ? (
                    tasks.map(task => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{getProjectName(task.projectId)}</TableCell>
                        <TableCell>{task.assignedTo}</TableCell>
                        <TableCell>{task.description}</TableCell>
                        <TableCell>
                            <Badge 
                                className={cn({
                                    'bg-gray-500': task.status === 'todo',
                                    'bg-blue-500': task.status === 'inprogress',
                                    'bg-yellow-500': task.status === 'completed',
                                    'bg-green-500': task.status === 'verified',
                                }, 'text-white')}
                            >
                                {task.status}
                            </Badge>
                        </TableCell>
                         <TableCell className="text-right">
                           {task.status === 'completed' && (
                             <Button 
                                size="sm" 
                                onClick={() => handleVerifyTask(task.id)}
                                disabled={verifyingTaskId === task.id}
                             >
                               {verifyingTaskId === task.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                               Verify
                             </Button>
                           )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No tasks assigned yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
