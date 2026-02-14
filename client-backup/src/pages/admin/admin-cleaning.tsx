import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ClipboardList,
  Star,
  Image,
  AlertTriangle,
  Check,
  Clock,
  XCircle,
  Users,
  FileText,
  Flag,
} from "lucide-react";

type AdminSubscription = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string | null;
  updatedAt: string | null;
  declineMessage: string | null;
  hostName: string;
  hostEmail: string | null;
  providerName: string;
  providerCompany: string | null;
  listingIds: string[];
};

type AdminReview = {
  id: string;
  rating: number;
  comment: string | null;
  flaggedForAdmin: boolean;
  createdAt: string | null;
  hostName: string;
  providerName: string;
  providerCompany: string | null;
};

type AdminVisitReport = {
  id: string;
  visitDate: string;
  notes: string | null;
  photos: string[];
  createdAt: string | null;
  providerName: string;
  listingName: string;
  review: { rating: number; comment: string | null; flaggedForAdmin: boolean } | null;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i <= Math.round(rating) ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default function AdminCleaningPage() {
  const [tab, setTab] = useState("subscriptions");
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);

  const { data: subscriptions, isLoading: loadingSubs } = useQuery<AdminSubscription[]>({
    queryKey: ["/api/admin/cleaning/subscriptions"],
  });

  const { data: reviews, isLoading: loadingReviews } = useQuery<AdminReview[]>({
    queryKey: ["/api/admin/cleaning/reviews"],
  });

  const { data: visitReports, isLoading: loadingReports } = useQuery<AdminVisitReport[]>({
    queryKey: ["/api/admin/cleaning/visit-reports"],
  });

  const pendingCount = subscriptions?.filter(s => s.status === "PENDING").length || 0;
  const activeCount = subscriptions?.filter(s => s.status === "ACCEPTED").length || 0;
  const declinedCount = subscriptions?.filter(s => s.status === "DECLINED").length || 0;
  const flaggedReviews = reviews?.filter(r => r.flaggedForAdmin) || [];
  const totalReports = visitReports?.length || 0;

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-admin-cleaning-title">Cleaning Marketplace</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor cleaning service subscriptions, visit reports, and host reviews.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold" data-testid="stat-active-subs">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>
            <p className="text-2xl font-bold" data-testid="stat-pending-subs">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Visit Reports</span>
            </div>
            <p className="text-2xl font-bold" data-testid="stat-visit-reports">{totalReports}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Flag className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Flagged</span>
            </div>
            <p className="text-2xl font-bold text-red-600" data-testid="stat-flagged-reviews">{flaggedReviews.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">
            <ClipboardList className="h-4 w-4 mr-1.5" />
            Subscriptions
          </TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">
            <Image className="h-4 w-4 mr-1.5" />
            Visit Reports
          </TabsTrigger>
          <TabsTrigger value="reviews" data-testid="tab-reviews">
            <Star className="h-4 w-4 mr-1.5" />
            Reviews
          </TabsTrigger>
          <TabsTrigger value="flagged" data-testid="tab-flagged">
            <AlertTriangle className="h-4 w-4 mr-1.5" />
            Flagged ({flaggedReviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="mt-4 space-y-3">
          {loadingSubs ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-md" />)}
            </div>
          ) : subscriptions && subscriptions.length > 0 ? (
            subscriptions.map((sub) => (
              <Card key={sub.id} data-testid={`admin-sub-${sub.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className={
                          sub.status === "ACCEPTED" ? "bg-green-100 text-green-700" :
                          sub.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }>
                          {sub.status === "ACCEPTED" ? <Check className="h-4 w-4" /> :
                           sub.status === "PENDING" ? <Clock className="h-4 w-4" /> :
                           <XCircle className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {sub.hostName}
                          <span className="text-muted-foreground mx-1.5">to</span>
                          {sub.providerCompany || sub.providerName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{sub.hostEmail}</p>
                        <p className="text-xs text-muted-foreground">Properties: {sub.listingIds?.length || 0} listing(s)</p>
                      </div>
                    </div>
                    <Badge variant={
                      sub.status === "ACCEPTED" ? "default" :
                      sub.status === "PENDING" ? "secondary" : "destructive"
                    }>
                      {sub.status}
                    </Badge>
                  </div>
                  {sub.declineMessage && (
                    <p className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded">Decline reason: {sub.declineMessage}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Created: {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : "N/A"}
                    {sub.updatedAt && ` | Updated: ${new Date(sub.updatedAt).toLocaleDateString()}`}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No subscriptions yet.</p>
          )}
        </TabsContent>

        <TabsContent value="reports" className="mt-4 space-y-3">
          {loadingReports ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-md" />)}
            </div>
          ) : visitReports && visitReports.length > 0 ? (
            visitReports.map((report) => (
              <Card key={report.id} data-testid={`admin-report-${report.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-medium">{report.listingName}</p>
                      <p className="text-xs text-muted-foreground">
                        By: {report.providerName}
                      </p>
                      <p className="text-xs text-muted-foreground">Visit: {report.visitDate}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="cursor-pointer" onClick={() => {
                        setSelectedPhotos(report.photos || []);
                        setSelectedPhotoIdx(0);
                        setPhotoDialogOpen(true);
                      }}>
                        <Image className="h-3 w-3 mr-1" />
                        {report.photos?.length || 0} photos
                      </Badge>
                      {report.review && (
                        <Badge variant={report.review.flaggedForAdmin ? "destructive" : "default"}>
                          {report.review.flaggedForAdmin && <AlertTriangle className="h-3 w-3 mr-1" />}
                          <Star className="h-3 w-3 mr-0.5 fill-current" /> {report.review.rating}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {report.notes && <p className="text-xs text-muted-foreground mt-2">{report.notes}</p>}
                  {report.review?.comment && (
                    <div className={`text-xs mt-2 p-2 rounded ${report.review.flaggedForAdmin ? "bg-red-50 text-red-700" : "bg-muted"}`}>
                      Review: "{report.review.comment}"
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No visit reports yet.</p>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-4 space-y-3">
          {loadingReviews ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-md" />)}
            </div>
          ) : reviews && reviews.length > 0 ? (
            reviews.map((review) => (
              <Card key={review.id} data-testid={`admin-review-${review.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <StarRating rating={review.rating} />
                        <span className="text-xs text-muted-foreground">
                          by {review.hostName}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        For: {review.providerCompany || review.providerName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {review.flaggedForAdmin && (
                        <Badge variant="destructive">
                          <Flag className="h-3 w-3 mr-1" />
                          Flagged
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </div>
                  {review.comment && <p className="text-sm mt-2">{review.comment}</p>}
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No reviews yet.</p>
          )}
        </TabsContent>

        <TabsContent value="flagged" className="mt-4 space-y-3">
          {flaggedReviews.length > 0 ? (
            flaggedReviews.map((review) => (
              <Card key={review.id} className="border-red-200" data-testid={`flagged-review-${review.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700">Needs attention</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StarRating rating={review.rating} />
                    <span className="text-xs text-muted-foreground">
                      {review.hostName}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Provider: {review.providerCompany || review.providerName}
                  </p>
                  {review.comment && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-sm">{review.comment}</div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No flagged reviews. All clear.</p>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Visit Photos ({selectedPhotos.length})</DialogTitle>
          </DialogHeader>
          {selectedPhotos.length > 0 && (
            <div>
              <img
                src={selectedPhotos[selectedPhotoIdx]}
                alt={`Photo ${selectedPhotoIdx + 1}`}
                className="w-full rounded-md mb-3"
              />
              <div className="grid grid-cols-6 gap-1.5">
                {selectedPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    className={`aspect-square rounded overflow-hidden border-2 cursor-pointer ${idx === selectedPhotoIdx ? "border-primary" : "border-transparent"}`}
                    onClick={() => setSelectedPhotoIdx(idx)}
                  >
                    <img src={photo} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
