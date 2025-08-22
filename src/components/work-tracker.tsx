
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { suggestProject, type SuggestProjectOutput } from '@/ai/flows/suggest-project-flow';
import { verifyWorking } from '@/ai/flows/verify-working-flow';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Play, Square, BrainCircuit, Loader2 } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Session, UserSession } from '@/lib/data';
import { addUserSession, addVerificationLog, getProjects } from '@/lib/data';

export function WorkTracker() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentProject, setCurrentProject] = useState('');
  const [projects, setProjects] = useState(getProjects());

  const [taskDescription, setTaskDescription] = useState('');
  const [suggestion, setSuggestion] = useState<SuggestProjectOutput | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const verificationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const { toast } = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = useCallback((time: number) => {
    const totalSeconds = Math.floor(time / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, []);
  
  useEffect(() => {
    const getCameraPermission = async () => {
      if (typeof window === 'undefined') return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true});
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings for automatic work verification.',
        });
      }
    };

    getCameraPermission();
  }, [toast]);

  const handleVerifyWorking = useCallback(async () => {
    if (!videoRef.current || !hasCameraPermission) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoDataUri = canvas.toDataURL('image/jpeg');
      
      try {
        const previousTasks = sessions.map(s => `Worked for ${formatTime(s.duration)} on ${s.startTime.toLocaleDateString()}`);
        const result = await verifyWorking({ photoDataUri, previousTasks: previousTasks.slice(0, 3) });
        addVerificationLog({ photoDataUri, result, timestamp: new Date() });
        console.log("Work verification successful", result);
      } catch (error) {
        console.error("Automatic verification failed", error);
        // We don't show a toast here to keep it hidden from the user
      }
    }
  }, [hasCameraPermission, sessions, formatTime]);
  
  useEffect(() => {
    if (isRunning) {
      if (startTime) {
        timerRef.current = setInterval(() => {
          setElapsedTime(Date.now() - startTime.getTime());
        }, 1000);
      }
      
      // Start automatic verification, run once then every 1 minute
      handleVerifyWorking(); 
      verificationIntervalRef.current = setInterval(handleVerifyWorking, 60000); 

    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (verificationIntervalRef.current) clearInterval(verificationIntervalRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (verificationIntervalRef.current) clearInterval(verificationIntervalRef.current);
    };
  }, [isRunning, startTime, handleVerifyWorking]);

  const handleStart = () => {
    if (!currentProject) {
      toast({
        variant: 'destructive',
        title: 'Project not selected',
        description: 'Please select a project before starting the timer.',
      });
      return;
    }
    const now = new Date();
    setStartTime(now);
    setIsRunning(true);
    setElapsedTime(0);
  };

  const handleStop = () => {
    if (startTime) {
      const stopTime = new Date();
      const newSession: Session = { 
        startTime, 
        stopTime, 
        duration: stopTime.getTime() - startTime.getTime() 
      };
      setSessions(prev => [newSession, ...prev]);
      
      const userSession: UserSession = {
        ...newSession,
        userEmail: user?.email || 'Anonymous',
        project: currentProject,
      }
      addUserSession(userSession);
    }
    setIsRunning(false);
  };

  const handleSuggestProject = async () => {
    if (!taskDescription.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a task description." });
      return;
    }
    setIsSuggesting(true);
    setSuggestion(null);
    try {
      const recentProjectsForSuggestion = projects.map(p => ({
        name: p.name,
        client: p.client,
        date: new Date().toISOString() // Using current date as a placeholder
      }));
      const result = await suggestProject({ currentTaskDescription: taskDescription, recentProjects: recentProjectsForSuggestion });
      setSuggestion(result);
      if (result.suggestedProjectName) {
        setCurrentProject(result.suggestedProjectName);
      }
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "AI Suggestion Failed", description: "Could not get project suggestion. Please try again." });
    } finally {
      setIsSuggesting(false);
    }
  };

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 flex flex-col gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Time Tracker</CardTitle>
            <CardDescription>Select a project, then start your work session.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="w-full max-w-sm">
                <Label htmlFor="project-select">Project</Label>
                <Select value={currentProject} onValueChange={setCurrentProject} disabled={isRunning}>
                    <SelectTrigger id="project-select">
                        <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                        {projects.map(p => (
                            <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <p className="text-6xl font-bold tabular-nums tracking-tighter" style={{color: 'hsl(var(--primary))'}}>{isClient ? formatTime(elapsedTime) : '00:00:00'}</p>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            {!isRunning ? (
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 w-32" onClick={handleStart}>
                <Play className="mr-2 h-5 w-5" /> Start
              </Button>
            ) : (
              <Button size="lg" variant="secondary" className="w-32" onClick={handleStop}>
                <Square className="mr-2 h-5 w-5" /> Stop
              </Button>
            )}
          </CardFooter>
        </Card>
        
        <video ref={videoRef} className="w-0 h-0" autoPlay muted playsInline />

        {isClient && hasCameraPermission === false && (
            <Alert variant="destructive">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                Automatic work verification is disabled. Please allow camera access to use this feature.
                </AlertDescription>
            </Alert>
        )}

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Session History</CardTitle>
            <CardDescription>A log of your recent work sessions.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
              <Table>
                <TableHeader>
                  <TableRow>
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
                        <TableCell>{isClient ? session.startTime.toLocaleDateString() : ''}</TableCell>
                        <TableCell>{isClient ? session.startTime.toLocaleTimeString() : ''}</TableCell>
                        <TableCell>{isClient ? session.stopTime.toLocaleTimeString() : ''}</TableCell>
                        <TableCell className="text-right">{isClient ? formatTime(session.duration) : ''}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">No sessions recorded yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="shadow-lg min-h-full">
          <CardHeader>
            <CardTitle>AI Assistant</CardTitle>
            <CardDescription>Get a project suggestion for your task.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
              <Textarea
                placeholder="Describe your current task... e.g., 'fixing bugs on the checkout page'"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={3}
                disabled={isRunning}
              />
              <Button onClick={handleSuggestProject} disabled={isSuggesting || isRunning} className="w-full">
                {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                Suggest Project
              </Button>
              {isSuggesting && <Skeleton className="h-24 w-full" />}
              {suggestion && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Suggested Project: {suggestion.suggestedProjectName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
