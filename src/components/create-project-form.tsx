
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { addProject, type Project } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateProjectFormProps {
    onProjectCreated: (newProject: Project) => void;
}

export function CreateProjectForm({ onProjectCreated }: CreateProjectFormProps) {
    const [name, setName] = useState('');
    const [client, setClient] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !client.trim()) {
            toast({
                variant: 'destructive',
                title: 'Missing Fields',
                description: 'Please fill out both project name and client.'
            });
            return;
        }

        setIsLoading(true);
        try {
            const newProject = addProject({ name, client });
            onProjectCreated(newProject);
            toast({
                title: 'Project Created',
                description: `Successfully created project "${name}".`
            });
            setName('');
            setClient('');
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to create project.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="border-primary/20">
            <CardHeader>
                <CardTitle>Create New Project</CardTitle>
                <CardDescription>Add a new project to the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="project-name">Project Name</Label>
                        <Input id="project-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Q3 Marketing Campaign" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="client-name">Client Name</Label>
                        <Input id="client-name" value={client} onChange={e => setClient(e.target.value)} placeholder="e.g., Global Innovations Ltd." />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Project
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
