import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Building2,
  Users,
  Star,
  Phone,
} from "lucide-react";

const MAINTENANCE_LIST = [
  { id: "1", name: "FixIt Handyman Services", type: "Company", specialty: "General repairs & plumbing", rating: 4.7, phone: "+1 555-0201" },
  { id: "2", name: "Ahmed Al-Hassan", type: "Freelancer", specialty: "Electrical & AC repair", rating: 4.9, phone: "+1 555-0202" },
  { id: "3", name: "ProBuild Maintenance", type: "Company", specialty: "Painting & carpentry", rating: 4.5, phone: "+1 555-0203" },
  { id: "4", name: "Sara Johnson", type: "Freelancer", specialty: "Appliance repair", rating: 4.8, phone: "+1 555-0204" },
  { id: "5", name: "AllFix Solutions", type: "Company", specialty: "Full property maintenance", rating: 4.6, phone: "+1 555-0205" },
];

export default function SettingsMaintenancePage() {
  const [, setLocation] = useLocation();

  return (
    <div className="pb-8">
      <div className="flex items-center gap-2.5 px-4 py-4 border-b sticky top-0 bg-background z-50 mb-4">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setLocation("/settings")}
          data-testid="button-back-maintenance"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold" data-testid="text-maintenance-title">Maintenance</h1>
      </div>

      <div className="px-4 py-4 space-y-3">
        {MAINTENANCE_LIST.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-3.5 rounded-md border" data-testid={`maintenance-${item.id}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted flex-shrink-0">
              {item.type === "Company" ? (
                <Building2 className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Users className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium">{item.name}</p>
                <Badge variant="secondary" className="text-xs">{item.type}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{item.specialty}</p>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                  {item.rating}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {item.phone}
                </span>
              </div>
            </div>
            <Button size="sm" variant="outline" data-testid={`button-contact-maintenance-${item.id}`}>
              Contact
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
