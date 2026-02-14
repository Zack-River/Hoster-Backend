import { useState } from "react";
import { useLocation } from "wouter";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ChevronDown,
  ThumbsUp,
  MessageCircle,
  Plus,
  Send,
} from "lucide-react";

const COMMUNITY_QUESTIONS = [
  {
    id: "1",
    question: "What's the best way to handle late check-outs?",
    author: "HostPro_Mike",
    date: "2 days ago",
    likes: 14,
    answers: [
      { author: "SunnyRentals", text: "I charge a flat fee of $25/hour after checkout time. Most guests understand.", date: "1 day ago", likes: 8 },
      { author: "BeachHost22", text: "I give a 30-minute grace period, then send a polite reminder via the app.", date: "1 day ago", likes: 5 },
    ],
  },
  {
    id: "2",
    question: "How do you manage pricing during off-season?",
    author: "CityLoft_Anna",
    date: "5 days ago",
    likes: 22,
    answers: [
      { author: "RevenueMax", text: "I drop rates by 20-30% and offer weekly discounts. Occupancy stays high.", date: "4 days ago", likes: 12 },
      { author: "MountainView", text: "I keep the same base price but add value - free breakfast, late checkout.", date: "3 days ago", likes: 9 },
    ],
  },
  {
    id: "3",
    question: "Tips for getting more 5-star reviews?",
    author: "GardenHost",
    date: "1 week ago",
    likes: 31,
    answers: [
      { author: "SuperHost_Jay", text: "Personal welcome note + small local gift. Works every time.", date: "6 days ago", likes: 18 },
      { author: "LakeRetreat", text: "Follow up the day after checkout with a thank-you message and review request.", date: "5 days ago", likes: 11 },
    ],
  },
  {
    id: "4",
    question: "How do you deal with noise complaints from neighbors?",
    author: "UrbanHost_Lee",
    date: "3 days ago",
    likes: 19,
    answers: [
      { author: "QuietStays", text: "I use noise monitoring devices (NoiseAware) and set clear quiet hours in house rules.", date: "2 days ago", likes: 10 },
      { author: "HostHelper", text: "I give neighbors my phone number directly so they can call me instead of complaining online.", date: "2 days ago", likes: 7 },
    ],
  },
  {
    id: "5",
    question: "Best practices for key handoff without meeting guests?",
    author: "RemoteHost_Sam",
    date: "4 days ago",
    likes: 25,
    answers: [
      { author: "SmartLock_Pro", text: "Smart locks with unique codes per guest, auto-expire after checkout. No keys needed.", date: "3 days ago", likes: 15 },
      { author: "LockboxFan", text: "A quality lockbox near the door. Change the code after each guest.", date: "3 days ago", likes: 8 },
    ],
  },
];

interface QuestionItem {
  id: string;
  question: string;
  author: string;
  date: string;
  likes: number;
  answers: { author: string; text: string; date: string; likes: number }[];
}

export default function CommunityQuestionsPage() {
  const [, setLocation] = useLocation();
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [askDialogOpen, setAskDialogOpen] = useState(false);
  const [questionTitle, setQuestionTitle] = useState("");
  const [questionDetails, setQuestionDetails] = useState("");
  const [userQuestions, setUserQuestions] = useState<QuestionItem[]>([]);
  const { toast } = useToast();

  const allQuestions = [...userQuestions, ...COMMUNITY_QUESTIONS];

  const handleSubmitQuestion = () => {
    if (!questionTitle.trim()) return;
    const newQuestion: QuestionItem = {
      id: `user-${Date.now()}`,
      question: questionTitle.trim(),
      author: "You",
      date: "Just now",
      likes: 0,
      answers: [],
    };
    setUserQuestions((prev) => [newQuestion, ...prev]);
    toast({ title: "Question submitted", description: "Your question has been posted to the community." });
    setAskDialogOpen(false);
    setQuestionTitle("");
    setQuestionDetails("");
  };

  return (
    <div className="pb-6">
      <div className="flex items-center gap-3 px-4 py-3 border-b sticky top-0 bg-background z-50">
        <button
          className="flex items-center gap-1.5 text-sm text-muted-foreground"
          onClick={() => setLocation("/settings")}
          data-testid="button-back-community"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Go back</span>
        </button>
        <h1 className="text-lg font-semibold flex-1" data-testid="text-community-title">Community Questions</h1>
        <Button
          size="sm"
          onClick={() => setAskDialogOpen(true)}
          data-testid="button-ask-question"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Ask
        </Button>
      </div>

      <div className="px-4 py-3 space-y-3">
        {allQuestions.map((q) => (
          <Collapsible
            key={q.id}
            open={expandedQuestion === q.id}
            onOpenChange={(open) => setExpandedQuestion(open ? q.id : null)}
          >
            <div className="rounded-md border" data-testid={`community-question-${q.id}`}>
              <CollapsibleTrigger className="flex items-start gap-3 p-3.5 w-full text-left" data-testid={`trigger-question-${q.id}`}>
                <ChevronDown className={`h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0 transition-transform duration-200 ${expandedQuestion === q.id ? "" : "-rotate-90"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{q.question}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">{q.author}</span>
                    <span className="text-xs text-muted-foreground">{q.date}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ThumbsUp className="h-3 w-3" /> {q.likes}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageCircle className="h-3 w-3" /> {q.answers.length}
                    </span>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3.5 pb-3.5 space-y-2 ml-7">
                  {q.answers.map((a, i) => (
                    <div key={i} className="p-3 rounded-md bg-muted/50" data-testid={`answer-${q.id}-${i}`}>
                      <p className="text-xs leading-relaxed">{a.text}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-xs font-medium text-muted-foreground">{a.author}</span>
                        <span className="text-xs text-muted-foreground">{a.date}</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ThumbsUp className="h-2.5 w-2.5" /> {a.likes}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>

      <Dialog open={askDialogOpen} onOpenChange={setAskDialogOpen}>
        <DialogContent className="max-w-sm rounded-lg" data-testid="dialog-ask-question">
          <DialogHeader>
            <DialogTitle className="text-base">Ask the Community</DialogTitle>
            <DialogDescription>
              Post a question and get answers from other hosts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Your question..."
                value={questionTitle}
                onChange={(e) => setQuestionTitle(e.target.value)}
                autoFocus
                data-testid="input-question-title"
              />
            </div>
            <div>
              <Textarea
                placeholder="Add more details (optional)"
                value={questionDetails}
                onChange={(e) => setQuestionDetails(e.target.value)}
                className="min-h-[80px]"
                data-testid="input-question-details"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="flex-1"
                onClick={handleSubmitQuestion}
                disabled={!questionTitle.trim()}
                data-testid="button-submit-question"
              >
                <Send className="h-4 w-4 mr-1.5" />
                Post Question
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAskDialogOpen(false);
                  setQuestionTitle("");
                  setQuestionDetails("");
                }}
                data-testid="button-cancel-question"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
