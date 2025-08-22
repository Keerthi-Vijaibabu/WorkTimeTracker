import { WorkTracker } from "@/components/work-tracker";

export default function Home() {
  return (
    <main className="bg-background font-body text-foreground">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight" style={{color: 'hsl(var(--primary))'}}>
            WorkTracker
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
            Your smart assistant for effective time management. Start tracking, get project suggestions, and verify your focus.
          </p>
        </header>
        <WorkTracker />
      </div>
    </main>
  );
}
