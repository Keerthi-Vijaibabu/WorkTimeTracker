
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getVerificationLog, type VerificationLogEntry } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserSessionsLog } from './user-sessions-log';
import { ProjectManagement } from './project-management';
import { useAuth } from '@/hooks/use-auth';


export function AdminDashboard() {
  const { user } = useAuth();
  const [log, setLog] = useState<VerificationLogEntry[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    let unsubscribe: () => void;
    if (user?.email) {
      unsubscribe = getVerificationLog(setLog);
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);
  
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <Tabs defaultValue="sessions">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sessions">User Sessions</TabsTrigger>
          <TabsTrigger value="verification">Verification Log</TabsTrigger>
          <TabsTrigger value="projects">Project Management</TabsTrigger>
        </TabsList>
        <TabsContent value="sessions">
            <UserSessionsLog />
        </TabsContent>
        <TabsContent value="verification">
          <Card className="shadow-lg border-primary/20">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Work Verification Log</CardTitle>
                  <CardDescription>Automatic checks performed on the user.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Screenshot</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {log.length > 0 ? (
                      log.map((entry) => (
                        <TableRow key={entry.id}>
                           <TableCell>{entry.userEmail}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {isClient ? entry.timestamp.toDate().toLocaleString() : ''}
                          </TableCell>
                          <TableCell>
                            <div className="relative w-40 h-32 rounded-md overflow-hidden border">
                              <Image src={entry.photoDataUri} alt="Verification photo" layout="fill" objectFit="cover" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={entry.result.isWorking ? "default" : "destructive"} className={cn(entry.result.isWorking ? "bg-green-500" : "bg-red-500", "text-white")}>
                              {entry.result.isWorking ? <CheckCircle className="mr-1 h-4 w-4" /> : <XCircle className="mr-1 h-4 w-4" />}
                              {entry.result.isWorking ? "Working" : "Not Working"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2 max-w-xs">
                                <div className='flex items-center gap-2'>
                                  <p className="text-sm font-medium whitespace-nowrap">Confidence:</p>
                                  <Progress value={entry.result.confidence * 100} className="h-2 w-24" />
                                  <span>{Math.round(entry.result.confidence * 100)}%</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{entry.result.details}</p>
                              </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No verification data yet. The user needs to start the timer.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="projects">
          <ProjectManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
