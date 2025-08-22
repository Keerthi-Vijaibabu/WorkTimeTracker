
"use client";

import { useState, useEffect, useCallback } from 'react';
import { getUserSessions, type UserSession } from '@/components/work-tracker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from './ui/button';

export function UserSessionsLog() {
  const [sessions, setSessions] = useState<UserSession[]>(getUserSessions());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const interval = setInterval(() => {
      setSessions([...getUserSessions()]);
    }, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setSessions([...getUserSessions()]);
  }

  const formatTime = useCallback((time: number) => {
    const totalSeconds = Math.floor(time / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, []);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>User Work Sessions</CardTitle>
            <CardDescription>A log of all user work sessions.</CardDescription>
          </div>
          <Button onClick={handleRefresh}>Refresh</Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead className="text-right">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length > 0 ? (
                sessions.map((session, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{session.userEmail}</TableCell>
                    <TableCell>{isClient ? session.startTime.toLocaleDateString() : ''}</TableCell>
                    <TableCell>{isClient ? session.startTime.toLocaleTimeString() : ''}</TableCell>
                    <TableCell>{isClient ? session.stopTime.toLocaleTimeString() : ''}</TableCell>
                    <TableCell className="text-right">{isClient ? formatTime(session.duration) : ''}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No work sessions recorded yet.
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

