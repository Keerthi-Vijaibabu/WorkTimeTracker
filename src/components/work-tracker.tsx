
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
import { Play, Square, BrainCircuit, Loader2, PlayCircle, CheckCircle } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { UserSession, Task, Project } from '@/lib/data';
import { addUserSession, addVerificationLog, getProjects, getTasks, updateTaskStatus, getUserSessions } from '@/lib/data';
import { Timestamp } from 'firebase/firestore';


export function WorkTracker() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [currentProject, setCurrentProject] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [previousTaskStatus, setPreviousTaskStatus] = useState<Task['status'] | null>(null);


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
  
  const getCameraPermission = async () => {
    if (typeof window === 'undefined') return false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({video: true});
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return true;
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings for automatic work verification.',
      });
      return false;
    }
  };

  const handleVerifyWorking = useCallback(async () => {
    if (!videoRef.current || !videoRef.current.srcObject || !user?.uid) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoDataUri = canvas.toDataURL('image/jpeg');
      
      try {
        const previousTasks = sessions.map(s => `Worked on ${s.project} for ${formatTime(s.duration)} on ${s.stopTime.toDate().toLocaleDateString()}`);
        const result = await verifyWorking({ photoDataUri, previousTasks: previousTasks.slice(0, 3) });
        if(user?.email){
            await addVerificationLog(user.uid, { photoDataUri, result, timestamp: Timestamp.now(), userEmail: user.email });
        }
        console.log("Work verification successful", result);
      } catch (error) {
        console.error("Automatic verification failed", error);
        // We don't show a toast here to keep it hidden from the user
      }
    }
  }, [sessions, formatTime, user]);
  
  useEffect(() => {
    if (isRunning) {
      if (startTime) {
        timerRef.current = setInterval(() => {
          setElapsedTime(Date.now() - startTime.getTime());
        }, 1000);
      }
      
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
  
  const fetchMyTasks = useCallback(async () => {
    if (user?.email) {
        const allTasks = await getTasks();
        const userTasks = allTasks.filter(task => task.assignedTo === user.email && task.status !== 'verified');
        setMyTasks(userTasks);
    }
  }, [user?.email]);
  
  const fetchProjects = useCallback(async () => {
    const projectList = await getProjects();
    setProjects(projectList);
  }, []);

  useEffect(() => {
    if (!user) return; // Don't fetch data until user is loaded

    fetchMyTasks();
    fetchProjects();
    
    let unsubscribe: (() => void) | undefined;
    if (user?.uid) {
      unsubscribe = getUserSessions(setSessions, user.uid);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, fetchMyTasks, fetchProjects]);

  const handleStart = async (task: Task | null = null) => {
    let projectToStart = '';
    
    const cameraReady = await getCameraPermission();
    if (!cameraReady) {
        toast({ variant: 'destructive', title: 'Camera Required', description: 'Camera access is required to start tracking.' });
        return;
    }
    
    if (task) {
        const project = projects.find(p => p.id === task.projectId);
        if(project) {
            projectToStart = project.name;
            setCurrentProject(project.name);
            setTaskDescription(task.description);
            setActiveTask(task);
            setPreviousTaskStatus(task.status);
            await updateTaskStatus(task.id, 'inprogress');
            await fetchMyTasks();
        } else {
             toast({ variant: 'destructive', title: 'Error', description: 'Project for this task not found.' });
             return;
        }
    } else {
        projectToStart = currentProject;
    }

    if (!projectToStart) {
      toast({
        variant: 'destructive',
        title: 'Project not selected',
        description: 'Please select a project or start from a task.',
      });
      return;
    }
    const now = new Date();
    setStartTime(now);
    setIsRunning(true);
    setElapsedTime(0);
  };

  const handleStop = async () => {
    if (startTime && user?.uid) {
      const stopTime = new Date();
      const duration = stopTime.getTime() - startTime.getTime();
      
      const userSession: Omit<UserSession, 'id'> = {
        startTime: Timestamp.fromDate(startTime),
        stopTime: Timestamp.fromDate(stopTime),
        duration: duration,
        userEmail: user?.email || 'Anonymous',
        project: currentProject,
      }
      await addUserSession(user.uid, userSession);
    }
    setIsRunning(false);
    
    if(activeTask && previousTaskStatus){
        await updateTaskStatus(activeTask.id, previousTaskStatus);
        await fetchMyTasks();
    }
    setActiveTask(null);
    setPreviousTaskStatus(null);
    
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
    }
    setHasCameraPermission(null);
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

  const handleMarkTaskComplete = async (task: Task) => {
    try {
        await updateTaskStatus(task.id, 'completed');
        await fetchMyTasks();
        toast({
            title: "Task Marked as Complete",
            description: "Your task is now pending admin verification."
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: "Could not mark task as complete. Please try again."
        });
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 p-4 md:p-6">
      <div className="lg:col-span-3 flex flex-col gap-8">
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle>Time Tracker</CardTitle>
            <CardDescription>{activeTask ? `Working on: "${activeTask.description}"` : "Select a project, then start your work session."}</CardDescription>
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
            <p className="text-6xl font-bold tabular-nums tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent py-2">{isClient ? formatTime(elapsedTime) : '00:00:00'}</p>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            {!isRunning ? (
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 w-32" onClick={() => handleStart()}>
                <Play className="mr-2 h-5 w-5" /> Start
              </Button>
            ) : (
              <Button size="lg" variant="secondary" className="w-32" onClick={handleStop}>
                <Square className="mr-2 h-5 w-5" /> Stop
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card className="shadow-lg border-primary/20">
            <CardHeader>
                <CardTitle>My Assigned Tasks</CardTitle>
                <CardDescription>Start a task or mark it as complete.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-48">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Task</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {myTasks.length > 0 ? (
                                myTasks.map((task) => {
                                    const project = projects.find(p => p.id === task.projectId);
                                    const isCompleted = task.status === 'completed';
                                    return (
                                    <TableRow key={task.id}>
                                        <TableCell className="font-medium max-w-xs truncate">{task.description}</TableCell>
                                        <TableCell>{project?.name || 'Loading...'}</TableCell>
                                        <TableCell>{task.status}</TableCell>
                                        <TableCell className="text-right">
                                            {isCompleted ? (
                                                <span className="text-sm text-muted-foreground italic">Pending Verification</span>
                                            ) : (
                                                <div className="flex gap-2 justify-end">
                                                    <Button variant="ghost" size="icon" onClick={() => handleStart(task)} disabled={isRunning}>
                                                        <PlayCircle className="h-5 w-5 text-accent" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleMarkTaskComplete(task)} disabled={isRunning}>
                                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        You have no assigned tasks.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
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

      </div>

      <div className="lg:col-span-2 flex flex-col gap-8">
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle>AI Assistant</CardTitle>
            <CardDescription>Get a project suggestion for a new task.</CardDescription>
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
         <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle>Session History</CardTitle>
            <CardDescription>A log of your recent work sessions.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.length > 0 ? (
                    sessions.map((session, index) => (
                      <TableRow key={session.id || index}>
                        <TableCell>{isClient ? session.stopTime.toDate().toLocaleDateString() : ''}</TableCell>
                        <TableCell>{session.project}</TableCell>
                        <TableCell className="text-right">{isClient ? formatTime(session.duration) : ''}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">No sessions recorded yet.</TableCell>
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
