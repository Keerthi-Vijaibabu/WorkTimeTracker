"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { suggestProject, type SuggestProjectOutput } from '@/ai/flows/suggest-project-flow';
import { verifyWorking, type VerifyWorkingOutput } from '@/ai/flows/verify-working-flow';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Play, Square, BrainCircuit, Loader2 } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Session = {
  startTime: Date;
  stopTime: Date;
  duration: number;
};

// This is a mock storage. In a real app, you'd use a database.
const verificationLog: { photoDataUri: string, result: VerifyWorkingOutput, timestamp: Date }[] = [];
export const getVerificationLog = () => verificationLog;

export function WorkTracker() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

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
        verificationLog.unshift({ photoDataUri, result, timestamp: new Date() });
        console.log("Work verification successful", result);
      } catch (error) {
        console.error("Automatic verification failed", error);
        // We don't show a toast here to keep it hidden from the user
      }
    }
  }, [hasCameraPermission, sessions, formatTime]);
  
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - (startTime?.getTime() ?? 0));
      }, 1000);
      
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
    const now = new Date();
    setStartTime(now);
    setIsRunning(true);
    setElapsedTime(0);
  };

  const handleStop = () => {
    if (startTime) {
      const stopTime = new Date();
      setSessions(prev => [{ startTime, stopTime, duration: stopTime.getTime() - startTime.getTime() }, ...prev]);
    }
    setIsRunning(false);
  };

  const recentProjects = [
    { name: "Website Redesign", date: "2024-07-20T10:00:00Z", client: "Innovate Inc." },
    { name: "Mobile App Dev", date: "2024-07-19T15:30:00Z", client: "TechCorp" },
    { name: "API Integration", date: "2024-07-18T11:00:00Z", client: "Innovate Inc." },
    { name: "Marketing Campaign", date: "2024-07-17T09:00:00Z", client: "Growth Co." },
  ];

  const handleSuggestProject = async () => {
    if (!taskDescription.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a task description." });
      return;
    }
    setIsSuggesting(true);
    setSuggestion(null);
    try {
      const result = await suggestProject({ currentTaskDescription: taskDescription, recentProjects });
      setSuggestion(result);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "AI Suggestion Failed", description: "Could not get project suggestion. Please try again." });
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 flex flex-col gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Time Tracker</CardTitle>
            <CardDescription>Start and stop your work sessions here.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
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

        {hasCameraPermission === false && (
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
            <CardDescription>Get smart suggestions and insights.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
              <Textarea
                placeholder="Describe your current task... e.g., 'fixing bugs on the checkout page'"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={3}
              />
              <Button onClick={handleSuggestProject} disabled={isSuggesting} className="w-full">
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
