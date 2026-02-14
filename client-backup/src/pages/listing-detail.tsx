import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ChannelIcon } from "@/components/channel-icon";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  MapPin,
  Image,
  DollarSign,
  BedDouble,
  Bath,
  Users,
  CigaretteOff,
  Cigarette,
  Car,
  Wifi,
  Wind,
  Utensils,
  Tv,
  Dog,
  Clock,
  Hash,
  Save,
  Pencil,
  Copy,
  Link2,
  Plus,
  X,
  Loader2,
  RefreshCw,
  Dumbbell,
  Waves,
  Coffee,
  Heater,
  WashingMachine,
} from "lucide-react";
import type { ChannelKey } from "@/lib/constants";
import propertyBeach from "@assets/property-beach-studio.jpg";
import propertyLoft from "@assets/property-downtown-loft.jpg";
import propertyCabin from "@assets/property-mountain-cabin.jpg";
import propertyRiverside from "@assets/property-riverside.jpg";
import propertyVilla from "@assets/property-garden-villa.jpg";
import propertyLake from "@assets/property-lake-house.jpg";

const LISTING_IMAGES: Record<string, string> = {
  "Sunny Beach Studio": propertyBeach,
  "Downtown Loft": propertyLoft,
  "Mountain View Cabin": propertyCabin,
  "Riverside Apartment": propertyRiverside,
  "Garden Villa": propertyVilla,
  "Lake House Retreat": propertyLake,
};

const LISTING_DESCRIPTIONS: Record<string, string> = {
  "Sunny Beach Studio": "A bright and airy studio just steps from the beach. Perfect for couples or solo travelers looking for a relaxing getaway. Features a fully equipped kitchen, comfortable queen bed, and a private balcony with ocean views.",
  "Downtown Loft": "Modern loft in the heart of downtown. Walking distance to restaurants, shops, and nightlife. Open-plan design with exposed brick walls, high ceilings, and contemporary furnishings.",
  "Mountain View Cabin": "Cozy cabin nestled in the mountains with stunning panoramic views. Ideal for nature lovers and outdoor enthusiasts. Includes a hot tub, fireplace, and fully stocked kitchen.",
  "Riverside Apartment": "Charming apartment overlooking the river. Peaceful location with easy access to hiking trails and local attractions. Two bedrooms, modern amenities, and a spacious living area.",
  "Garden Villa": "Elegant villa surrounded by lush gardens. Features a private pool, outdoor dining area, and three spacious bedrooms. Perfect for families or groups seeking luxury and privacy.",
  "Lake House Retreat": "Lakefront retreat with private dock and kayaks. Stunning sunset views from the wraparound deck. Four bedrooms, open-plan kitchen, and cozy living spaces.",
};

const LISTING_LOCATIONS: Record<string, string> = {
  "Sunny Beach Studio": "Miami Beach, FL, USA",
  "Downtown Loft": "New York, NY, USA",
  "Mountain View Cabin": "Aspen, CO, USA",
  "Riverside Apartment": "Portland, OR, USA",
  "Garden Villa": "Savannah, GA, USA",
  "Lake House Retreat": "Lake Tahoe, CA, USA",
};

const LISTING_MAP_LINKS: Record<string, string> = {
  "Sunny Beach Studio": "https://maps.google.com/?q=25.7907,-80.1300",
  "Downtown Loft": "https://maps.google.com/?q=40.7128,-74.0060",
  "Mountain View Cabin": "https://maps.google.com/?q=39.1911,-106.8175",
  "Riverside Apartment": "https://maps.google.com/?q=45.5152,-122.6784",
  "Garden Villa": "https://maps.google.com/?q=32.0809,-81.0912",
  "Lake House Retreat": "https://maps.google.com/?q=39.0968,-120.0324",
};

const LISTING_DETAILS: Record<string, { bedrooms: number; bathrooms: number; maxGuests: number; roomNumber: string; basePrice: number; cleaningFee: number }> = {
  "Sunny Beach Studio": { bedrooms: 1, bathrooms: 1, maxGuests: 2, roomNumber: "101", basePrice: 120, cleaningFee: 45 },
  "Downtown Loft": { bedrooms: 1, bathrooms: 1, maxGuests: 4, roomNumber: "4B", basePrice: 185, cleaningFee: 60 },
  "Mountain View Cabin": { bedrooms: 2, bathrooms: 2, maxGuests: 6, roomNumber: "C-12", basePrice: 210, cleaningFee: 75 },
  "Riverside Apartment": { bedrooms: 2, bathrooms: 1, maxGuests: 4, roomNumber: "203", basePrice: 145, cleaningFee: 50 },
  "Garden Villa": { bedrooms: 3, bathrooms: 2, maxGuests: 8, roomNumber: "V-1", basePrice: 320, cleaningFee: 95 },
  "Lake House Retreat": { bedrooms: 4, bathrooms: 3, maxGuests: 10, roomNumber: "LH-5", basePrice: 380, cleaningFee: 110 },
};

const ALL_AMENITIES = [
  { icon: Wifi, label: "Wi-Fi" },
  { icon: Car, label: "Parking" },
  { icon: Wind, label: "AC" },
  { icon: Utensils, label: "Kitchen" },
  { icon: Tv, label: "TV" },
  { icon: Dumbbell, label: "Gym" },
  { icon: Waves, label: "Pool" },
  { icon: Coffee, label: "Coffee" },
  { icon: Heater, label: "Heating" },
  { icon: WashingMachine, label: "Laundry" },
];

const DEFAULT_AMENITIES = ["Wi-Fi", "Parking", "AC", "Kitchen", "TV"];

function getListingImage(name: string): string {
  return LISTING_IMAGES[name] || propertyBeach;
}

function getAmenityIcon(label: string) {
  const found = ALL_AMENITIES.find(a => a.label === label);
  return found?.icon || Wifi;
}

interface SettingsData {
  channels: Array<{
    channelKey: string;
    channelId: string;
    name: string;
    status: string;
  }>;
  listings: Array<{
    id: string;
    name: string;
    status: string;
    avgPrice: number | null;
    currency: string;
    photos: string[] | null;
    amenities: string[] | null;
    channels: Array<{ channelKey: ChannelKey; channelName: string }>;
  }>;
}

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const listingId = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery<SettingsData>({
    queryKey: ["/api/settings"],
  });

  const listing = data?.listings.find((l) => l.id === listingId);

  const defaults = listing ? LISTING_DETAILS[listing.name] || { bedrooms: 1, bathrooms: 1, maxGuests: 2, roomNumber: "N/A", basePrice: 100, cleaningFee: 40 } : null;

  const [isEditing, setIsEditing] = useState(false);
  const [listingName, setListingName] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [locationVal, setLocationVal] = useState<string | null>(null);
  const [unitLocation, setUnitLocation] = useState<string | null>(null);
  const [basePrice, setBasePrice] = useState<string | null>(null);
  const [cleaningFee, setCleaningFee] = useState<string | null>(null);
  const [bedrooms, setBedrooms] = useState<string | null>(null);
  const [bathrooms, setBathrooms] = useState<string | null>(null);
  const [maxGuests, setMaxGuests] = useState<string | null>(null);
  const [roomNumber, setRoomNumber] = useState<string | null>(null);
  const [smoking, setSmoking] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [selfCheckIn, setSelfCheckIn] = useState(true);
  const [amenitiesDialogOpen, setAmenitiesDialogOpen] = useState(false);
  const [editedAmenities, setEditedAmenities] = useState<string[]>([]);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);

  const photoUploadMutation = useMutation({
    mutationFn: async (image: string) => {
      const res = await apiRequest("POST", `/api/listings/${listingId}/photos`, { image });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Photo added" });
    },
    onError: () => {
      toast({ title: "Failed to upload photo", variant: "destructive" });
    },
  });

  const photoDeleteMutation = useMutation({
    mutationFn: async (photoUrl: string) => {
      const res = await apiRequest("DELETE", `/api/listings/${listingId}/photos`, { photoUrl });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Photo removed" });
    },
  });

  const amenitiesMutation = useMutation({
    mutationFn: async (amenities: string[]) => {
      const res = await apiRequest("PUT", `/api/listings/${listingId}/amenities`, { amenities });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Amenities updated" });
      setAmenitiesDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update amenities", variant: "destructive" });
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sync/import-listings", {});
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      if (data?.importedCount > 0) {
        toast({ title: `${data.importedCount} unit(s) synced from channels` });
      } else {
        toast({ title: "All units already synced" });
      }
      setSyncDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Sync failed", variant: "destructive" });
    },
  });

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be under 5MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      photoUploadMutation.mutate(result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  if (isLoading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full rounded-md" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <p className="text-sm text-muted-foreground">Listing not found</p>
        <Button variant="ghost" onClick={() => setLocation("/settings")} className="mt-3" data-testid="button-back-not-found">
          Back to Settings
        </Button>
      </div>
    );
  }

  const details = defaults!;
  const currentName = listingName ?? listing.name;
  const listingDesc = description ?? LISTING_DESCRIPTIONS[listing.name] ?? "No description available.";
  const listingLoc = locationVal ?? LISTING_LOCATIONS[listing.name] ?? "Location not set";
  const listingMapLink = unitLocation ?? LISTING_MAP_LINKS[listing.name] ?? "";
  const listingBasePrice = basePrice ?? String(details.basePrice);
  const listingCleaningFee = cleaningFee ?? String(details.cleaningFee);
  const listingBedrooms = bedrooms ?? String(details.bedrooms);
  const listingBathrooms = bathrooms ?? String(details.bathrooms);
  const listingMaxGuests = maxGuests ?? String(details.maxGuests);
  const listingRoomNumber = roomNumber ?? details.roomNumber;

  const listingAmenities = listing.amenities && listing.amenities.length > 0
    ? listing.amenities
    : DEFAULT_AMENITIES;

  const listingPhotos = listing.photos || [];

  const connectedChannels = data?.channels?.filter(ch => ch.status === "CONNECTED") || [];

  const handleSave = () => {
    setIsEditing(false);
    toast({ title: "Changes saved" });
  };

  const handlePasteLocation = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUnitLocation(text);
      toast({ title: "Location pasted from clipboard" });
    } catch {
      toast({ title: "Could not read clipboard", description: "Please paste manually into the field", variant: "destructive" });
    }
  };

  const openAmenitiesDialog = () => {
    setEditedAmenities([...listingAmenities]);
    setAmenitiesDialogOpen(true);
  };

  const toggleAmenity = (label: string) => {
    setEditedAmenities(prev =>
      prev.includes(label) ? prev.filter(a => a !== label) : [...prev, label]
    );
  };

  return (
    <div className="pb-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
        data-testid="input-photo-file"
      />

      <div className="relative">
        <img
          src={listingPhotos.length > 0 ? listingPhotos[0] : getListingImage(listing.name)}
          alt={listing.name}
          className="w-full h-44 object-cover"
          data-testid="img-listing-hero"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button
          className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-black/30 text-white text-sm"
          onClick={() => setLocation("/settings")}
          data-testid="button-back-listing"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Go back</span>
        </button>
        <button
          className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-black/30 text-white text-sm"
          onClick={() => setIsEditing(!isEditing)}
          data-testid="button-edit-listing"
        >
          <Pencil className="h-4 w-4" />
          <span>{isEditing ? "Cancel" : "Edit"}</span>
        </button>
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <Input
                value={currentName}
                onChange={(e) => setListingName(e.target.value)}
                className="text-lg font-semibold bg-black/30 text-white border-white/30 placeholder:text-white/50"
                data-testid="input-listing-name"
              />
            ) : (
              <h1 className="text-lg font-semibold text-white" data-testid="text-listing-name">
                {currentName}
              </h1>
            )}
            <Badge
              className={
                listing.status === "ACTIVE"
                  ? "bg-emerald-400/90 text-emerald-950 border-emerald-300/50 no-default-hover-elevate no-default-active-elevate"
                  : ""
              }
              variant={listing.status === "ACTIVE" ? "default" : "secondary"}
              data-testid="badge-listing-status"
            >
              {listing.status === "ACTIVE" ? "Active" : listing.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        <section>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Location</Label>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              value={listingLoc}
              onChange={(e) => setLocationVal(e.target.value)}
              className="text-sm"
              readOnly={!isEditing}
              data-testid="input-listing-location"
            />
          </div>
        </section>

        <section>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Unit Location (Google Maps)</Label>
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              value={listingMapLink}
              onChange={(e) => setUnitLocation(e.target.value)}
              placeholder="Paste Google Maps link here"
              className="text-sm flex-1"
              readOnly={!isEditing}
              data-testid="input-unit-location"
            />
            {isEditing && (
              <Button
                size="icon"
                variant="outline"
                onClick={handlePasteLocation}
                data-testid="button-paste-location"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
          {listingMapLink && !isEditing && (
            <a
              href={listingMapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary mt-1 inline-block"
              data-testid="link-open-map"
            >
              Open in Google Maps
            </a>
          )}
        </section>

        <section>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Description</Label>
          <Textarea
            value={listingDesc}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[140px] text-sm"
            readOnly={!isEditing}
            data-testid="input-listing-description"
          />
        </section>

        <section>
          <Label className="text-xs text-muted-foreground mb-2 block">Property details</Label>
          {isEditing ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Bedrooms</Label>
                <div className="flex items-center gap-1.5">
                  <BedDouble className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <Input type="number" value={listingBedrooms} onChange={(e) => setBedrooms(e.target.value)} className="text-sm" data-testid="input-bedrooms" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Bathrooms</Label>
                <div className="flex items-center gap-1.5">
                  <Bath className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <Input type="number" value={listingBathrooms} onChange={(e) => setBathrooms(e.target.value)} className="text-sm" data-testid="input-bathrooms" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Max Guests</Label>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <Input type="number" value={listingMaxGuests} onChange={(e) => setMaxGuests(e.target.value)} className="text-sm" data-testid="input-max-guests" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Room/Unit #</Label>
                <div className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <Input value={listingRoomNumber} onChange={(e) => setRoomNumber(e.target.value)} className="text-sm" data-testid="input-room-number" />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              <div className="flex flex-col items-center gap-1 p-2.5 rounded-md border text-center">
                <BedDouble className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold">{listingBedrooms}</p>
                <p className="text-xs text-muted-foreground">Beds</p>
              </div>
              <div className="flex flex-col items-center gap-1 p-2.5 rounded-md border text-center">
                <Bath className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold">{listingBathrooms}</p>
                <p className="text-xs text-muted-foreground">Baths</p>
              </div>
              <div className="flex flex-col items-center gap-1 p-2.5 rounded-md border text-center">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold">{listingMaxGuests}</p>
                <p className="text-xs text-muted-foreground">Guests</p>
              </div>
              <div className="flex flex-col items-center gap-1 p-2.5 rounded-md border text-center">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold">{listingRoomNumber}</p>
                <p className="text-xs text-muted-foreground">Room</p>
              </div>
            </div>
          )}
        </section>

        <section>
          <Label className="text-xs text-muted-foreground mb-2 block">Pricing</Label>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">Base price / night</Label>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <Input
                    type="number"
                    value={listingBasePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="text-sm"
                    readOnly={!isEditing}
                    data-testid="input-base-price"
                  />
                </div>
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">Cleaning fee</Label>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <Input
                    type="number"
                    value={listingCleaningFee}
                    onChange={(e) => setCleaningFee(e.target.value)}
                    className="text-sm"
                    readOnly={!isEditing}
                    data-testid="input-cleaning-fee"
                  />
                </div>
              </div>
            </div>
            {listing.avgPrice !== null && (
              <p className="text-xs text-muted-foreground" data-testid="text-avg-booking">
                Avg. booking total: ${listing.avgPrice}
              </p>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between gap-2 mb-2">
            <Label className="text-xs text-muted-foreground block">Connected channels</Label>
            {connectedChannels.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSyncDialogOpen(true)}
                data-testid="button-sync-channels"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Sync
              </Button>
            )}
          </div>
          {listing.channels.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {listing.channels.map((ch) => (
                <div
                  key={ch.channelKey}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border"
                  data-testid={`listing-channel-${ch.channelKey.toLowerCase()}`}
                >
                  <ChannelIcon channelKey={ch.channelKey} size={14} />
                  <span className="text-xs">{ch.channelName}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-md border">
              <p className="text-xs text-muted-foreground flex-1">No channels connected.</p>
              {connectedChannels.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => setSyncDialogOpen(true)}
                  data-testid="button-sync-channels-empty"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Sync from apps
                </Button>
              )}
            </div>
          )}
        </section>

        <section>
          <Label className="text-xs text-muted-foreground mb-2 block">Rules</Label>
          <div className="space-y-3 p-3 rounded-md border">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {smoking ? (
                  <Cigarette className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <CigaretteOff className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="text-sm">Smoking allowed</span>
              </div>
              <Switch
                checked={smoking}
                onCheckedChange={setSmoking}
                disabled={!isEditing}
                data-testid="switch-smoking"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Dog className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm">Pets allowed</span>
              </div>
              <Switch
                checked={petsAllowed}
                onCheckedChange={setPetsAllowed}
                disabled={!isEditing}
                data-testid="switch-pets"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm">Self check-in</span>
              </div>
              <Switch
                checked={selfCheckIn}
                onCheckedChange={setSelfCheckIn}
                disabled={!isEditing}
                data-testid="switch-self-checkin"
              />
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between gap-2 mb-2">
            <Label className="text-xs text-muted-foreground block">Amenities</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={openAmenitiesDialog}
              data-testid="button-edit-amenities"
            >
              <Pencil className="h-3 w-3 mr-1.5" />
              Edit
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {listingAmenities.map((label) => {
              const Icon = getAmenityIcon(label);
              return (
                <Badge
                  key={label}
                  variant="secondary"
                  className="gap-1"
                  data-testid={`amenity-${label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </Badge>
              );
            })}
          </div>
        </section>

        <section>
          <Label className="text-xs text-muted-foreground mb-2 block">Photos</Label>
          <div className="grid grid-cols-3 gap-2">
            {listingPhotos.length === 0 && (
              <>
                <img
                  src={getListingImage(listing.name)}
                  alt={`${listing.name} photo 1`}
                  className="w-full aspect-square object-cover rounded-md"
                  data-testid="img-listing-photo-default-1"
                />
                <img
                  src={getListingImage(listing.name)}
                  alt={`${listing.name} photo 2`}
                  className="w-full aspect-square object-cover rounded-md opacity-90"
                  data-testid="img-listing-photo-default-2"
                />
              </>
            )}
            {listingPhotos.map((photo, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={photo}
                  alt={`${listing.name} photo ${idx + 1}`}
                  className="w-full aspect-square object-cover rounded-md"
                  data-testid={`img-listing-photo-${idx}`}
                />
                <button
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ visibility: "visible" }}
                  onClick={() => photoDeleteMutation.mutate(photo)}
                  data-testid={`button-delete-photo-${idx}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <div
              className="w-full aspect-square rounded-md bg-muted flex flex-col items-center justify-center cursor-pointer hover-elevate active-elevate-2 gap-1"
              onClick={handlePhotoUpload}
              data-testid="button-add-photo"
            >
              {photoUploadMutation.isPending ? (
                <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
              ) : (
                <>
                  <Plus className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-medium">Add Photo</span>
                </>
              )}
            </div>
          </div>
        </section>

        {isEditing && (
          <Button
            className="w-full"
            onClick={handleSave}
            data-testid="button-save-listing"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        )}
      </div>

      <Dialog open={amenitiesDialogOpen} onOpenChange={setAmenitiesDialogOpen}>
        <DialogContent className="max-w-sm rounded-lg" data-testid="dialog-edit-amenities">
          <DialogHeader>
            <DialogTitle className="text-base">Edit Amenities</DialogTitle>
            <DialogDescription>
              Select the amenities available at this property.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {ALL_AMENITIES.map(({ icon: Icon, label }) => {
              const isSelected = editedAmenities.includes(label);
              return (
                <div
                  key={label}
                  className={`flex items-center gap-3 p-2.5 rounded-md border cursor-pointer ${
                    isSelected ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => toggleAmenity(label)}
                  data-testid={`amenity-toggle-${label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-sm flex-1">{label}</span>
                  {isSelected && (
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                      <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={() => amenitiesMutation.mutate(editedAmenities)}
              disabled={amenitiesMutation.isPending}
              data-testid="button-save-amenities"
            >
              {amenitiesMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Save className="h-4 w-4 mr-1.5" />
              )}
              Save
            </Button>
            <Button
              variant="outline"
              onClick={() => setAmenitiesDialogOpen(false)}
              data-testid="button-cancel-amenities"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent className="max-w-sm rounded-lg" data-testid="dialog-sync-channels">
          <DialogHeader>
            <DialogTitle className="text-base">Sync from Channels</DialogTitle>
            <DialogDescription>
              Import this unit's data from your connected booking channels.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              {connectedChannels.map((ch) => (
                <div
                  key={ch.channelKey}
                  className="flex items-center gap-2.5 p-2.5 rounded-md border"
                  data-testid={`sync-channel-${ch.channelKey.toLowerCase()}`}
                >
                  <ChannelIcon channelKey={ch.channelKey as ChannelKey} size={16} />
                  <span className="text-sm flex-1">{ch.name}</span>
                  <Badge variant="secondary" className="text-[10px]">Connected</Badge>
                </div>
              ))}
            </div>
            <Button
              className="w-full"
              onClick={() => importMutation.mutate()}
              disabled={importMutation.isPending}
              data-testid="button-confirm-sync"
            >
              {importMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1.5" />
              )}
              Sync Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
