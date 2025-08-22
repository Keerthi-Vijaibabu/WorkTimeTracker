"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { suggestProject, type SuggestProjectOutput } from '@/ai/flows/suggest-project-flow';
import { verifyWorking, type VerifyWorkingOutput } from '@/ai/flows/verify-working-flow';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Play, Square, BrainCircuit, Camera, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';

type Session = {
  startTime: Date;
  stopTime: Date;
  duration: number;
};

export function WorkTracker() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  const [taskDescription, setTaskDescription] = useState('');
  const [suggestion, setSuggestion] = useState<SuggestProjectOutput | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const [verificationResult, setVerificationResult] = useState<VerifyWorkingOutput | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationPhoto, setVerificationPhoto] = useState<string | null>(null);

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
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - (startTime?.getTime() ?? 0));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, startTime]);

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

  const handleVerifyWorking = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    setVerificationPhoto(null);
    try {
      const photoUrl = 'https://placehold.co/640x480.png';
      setVerificationPhoto(photoUrl);
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const previousTasks = sessions.map(s => `Worked for ${formatTime(s.duration)} on ${s.startTime.toLocaleDateString()}`);
        const result = await verifyWorking({ photoDataUri: base64data, previousTasks: previousTasks.slice(0, 3) });
        setVerificationResult(result);
        setIsVerifying(false);
      };
      reader.onerror = () => { throw new Error("Could not read image file."); };
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "AI Verification Failed", description: "Could not verify your status. Please try again." });
      setIsVerifying(false);
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
            <p className="text-6xl font-bold tabular-nums tracking-tighter" style={{color: 'hsl(var(--primary))'}}>{formatTime(elapsedTime)}</p>
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
                        <TableCell>{session.startTime.toLocaleDateString()}</TableCell>
                        <TableCell>{session.startTime.toLocaleTimeString()}</TableCell>
                        <TableCell>{session.stopTime.toLocaleTimeString()}</TableCell>
                        <TableCell className="text-right">{formatTime(session.duration)}</TableCell>
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
            <Tabs defaultValue="suggestion">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="suggestion">Project Suggestion</TabsTrigger>
                <TabsTrigger value="verification">Work Verification</TabsTrigger>
              </TabsList>
              <TabsContent value="suggestion" className="mt-4">
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
              </TabsContent>
              <TabsContent value="verification" className="mt-4">
                <div className="space-y-4">
                   <p className="text-sm text-center text-muted-foreground">Randomly check if you are still on task.</p>
                  <Button onClick={handleVerifyWorking} disabled={isVerifying} className="w-full">
                    {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                    Verify I'm Working
                  </Button>
                  {(isVerifying || verificationPhoto) && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                      {isVerifying && !verificationPhoto && <Skeleton className="h-full w-full" />}
                       {verificationPhoto && <Image src={verificationPhoto} alt="Verification photo" layout="fill" objectFit="cover" data-ai-hint="person working" />}
                    </div>
                  )}
                  {isVerifying && !verificationResult && <Skeleton className="h-28 w-full" />}
                  {verificationResult && (
                    <Card className="bg-muted/50">
                       <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg">Verification Result</CardTitle>
                         <Badge variant={verificationResult.isWorking ? "default" : "destructive"} className={cn(verificationResult.isWorking ? "bg-green-500" : "bg-red-500", "text-white")}>
                          {verificationResult.isWorking ? <CheckCircle className="mr-1 h-4 w-4" /> : <XCircle className="mr-1 h-4 w-4" />}
                          {verificationResult.isWorking ? "Working" : "Not Working"}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Confidence: {Math.round(verificationResult.confidence * 100)}%</p>
                          <Progress value={verificationResult.confidence * 100} className="h-2" />
                          <p className="text-sm text-muted-foreground pt-2">{verificationResult.details}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
