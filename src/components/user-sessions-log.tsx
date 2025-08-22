
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getUserSessions, type UserSession, getProjects, type Project, getUsers, type User } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function UserSessionsLog() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');


  useEffect(() => {
    setIsClient(true);
    const unsubscribe = getUserSessions(setSessions);
    
    const fetchInitialData = async () => {
        setProjects(await getProjects());
        setUsers(await getUsers());
    }
    fetchInitialData();

    return () => unsubscribe();
  }, []);

  const formatTime = useCallback((time: number) => {
    const totalSeconds = Math.floor(time / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, []);

  const { projectNames, userEmails, filteredSessions } = useMemo(() => {
    const userEmails = ['all', ...Array.from(new Set(users.map(u => u.email)))];
    const projectNames = ['all', ...Array.from(new Set(projects.map(p => p.name)))];

    const filteredSessions = sessions.filter(session => {
      const userMatch = selectedUser === 'all' || session.userEmail === selectedUser;
      const projectMatch = selectedProject === 'all' || session.project === selectedProject;
      return userMatch && projectMatch;
    });

    return { userEmails, projectNames, filteredSessions };
  }, [sessions, selectedUser, selectedProject, projects, users]);


  return (
    <Card className="shadow-lg border-primary/20">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>User Work Sessions</CardTitle>
            <CardDescription>A log of all user work sessions.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                    {userEmails.map(user => (
                        <SelectItem key={user} value={user}>{user === 'all' ? 'All Users' : user}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by project" />
                </SelectTrigger>
                <SelectContent>
                    {projectNames.map(project => (
                        <SelectItem key={project} value={project}>{project === 'all' ? 'All Projects' : project}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead className="text-right">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{session.userEmail}</TableCell>
                    <TableCell>{session.project}</TableCell>
                    <TableCell>{isClient ? session.startTime.toDate().toLocaleDateString() : ''}</TableCell>
                    <TableCell>{isClient ? session.startTime.toDate().toLocaleTimeString() : ''}</TableCell>
                    <TableCell>{isClient ? session.stopTime.toDate().toLocaleTimeString() : ''}</TableCell>
                    <TableCell className="text-right">{isClient ? formatTime(session.duration) : ''}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No work sessions recorded for the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
