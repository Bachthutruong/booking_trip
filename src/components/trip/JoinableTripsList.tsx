'use client';

import type { Trip } from '@/lib/types';
import JoinableTripCard from './JoinableTripCard';
import { useState, useEffect, useTransition, useCallback } from 'react';
import { Input } from '../ui/input';
import { Loader2, Search, WifiOff } from 'lucide-react';
import { getJoinableTripsPaginated } from '@/actions/tripActions';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { ITINERARY_TYPES } from '@/lib/constants';
import { useInView } from 'react-intersection-observer';

// No longer needs initialTrips prop if fetching client-side
// interface JoinableTripsListProps {
//   initialTrips: Trip[];
// }

export default function JoinableTripsList() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const INITIAL_ITEMS = 3;
  const ITEMS_PER_PAGE = 6;

  const { ref, inView } = useInView({
    threshold: 0,
  });

  const fetchTrips = useCallback(async (isNewSearch = false) => {
    if (isLoading) return;

    setError(null);
    startTransition(async () => {
      try {
        const skip = isNewSearch ? 0 : (page - 1) * ITEMS_PER_PAGE;
        const limit = isNewSearch ? INITIAL_ITEMS : ITEMS_PER_PAGE;
        const { trips: newTrips, total: totalCount } = await getJoinableTripsPaginated(
          limit,
          skip,
          searchTerm,
          selectedType || undefined
        );

        if (isNewSearch) {
          setTrips(newTrips);
          setPage(1);
        } else {
          setTrips(prev => [...prev, ...newTrips]);
        }

        setTotal(totalCount);
        setHasMore(skip + newTrips.length < totalCount);
      } catch (err) {
        console.error("Failed to fetch joinable trips: ", err);
        setError("无法加载行程。请检查您的连接并重试。");
        setTrips([]);
        setHasMore(false);
      }
    });
  }, [page, searchTerm, selectedType, isLoading]);

  // Initial load
  useEffect(() => {
    fetchTrips(true);
  }, [searchTerm, selectedType]);

  // Load more when scrolling
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      setPage(prev => prev + 1);
      fetchTrips();
    }
  }, [inView, hasMore, isLoading, fetchTrips]);

  if (isLoading && trips.length === 0) {
    return (
      <div className="space-y-8">
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input type="text" placeholder="加载行程..." disabled className="pl-10 text-base" value={searchTerm} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-lg mx-auto">
        <WifiOff className="h-5 w-5" />
        <AlertTitle>加载错误</AlertTitle>
        <AlertDescription>
          {error}
          <Button onClick={() => fetchTrips(true)} variant="link" className="p-0 h-auto ml-1 text-destructive hover:underline">
            重试
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!isLoading && trips.length === 0 && !error) {
    return (
      <Alert className="max-w-lg mx-auto">
        <Search className="h-5 w-5" />
        <AlertTitle>没有可用的行程</AlertTitle>
        <AlertDescription>
          目前没有可用的确认行程。请稍后再试或创建自己的行程！
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative max-w-lg mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="按名称、日期、地点或创建者搜索行程..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 text-base"
          disabled={isLoading}
        />
      </div>

      {/* Itinerary Type Filter Buttons */}
      <div className="flex gap-3 justify-center mb-2">
        <Button
          key="all"
          variant={selectedType === null ? 'default' : 'outline'}
          onClick={() => setSelectedType(null)}
          className={selectedType === null ? 'bg-primary text-white' : ''}
          disabled={isLoading}
        >
          所有行程
        </Button>
        {Object.entries(ITINERARY_TYPES).map(([key, label]) => (
          <Button
            key={key}
            variant={selectedType === key ? 'default' : 'outline'}
            onClick={() => setSelectedType(selectedType === key ? null : key)}
            className={selectedType === key ? 'bg-primary text-white' : ''}
            disabled={isLoading}
          >
            {label}
          </Button>
        ))}
      </div>

      {trips.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {trips.map(trip => (
            <JoinableTripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}

      {/* Loading indicator and infinite scroll trigger */}
      <div ref={ref} className="h-20 flex items-center justify-center">
        {isLoading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
        {!isLoading && !hasMore && trips.length > 0 && (
          <p className="text-muted-foreground">没有更多行程了</p>
        )}
      </div>

      {!isLoading && searchTerm && trips.length === 0 && (
        <p className="text-center text-muted-foreground text-lg mt-10">
          没有符合您搜索条件的行程。
        </p>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="border bg-card text-card-foreground shadow-sm rounded-xl p-0 overflow-hidden animate-pulse">
      <div className="h-40 w-full bg-muted" />
      <div className="p-6 space-y-3">
        <div className="h-6 w-3/4 bg-muted rounded" />
        <div className="h-4 w-1/2 bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-5/6 bg-muted rounded" />
      </div>
      <div className="p-6 pt-0">
        <div className="h-10 w-full bg-muted rounded" />
      </div>
    </div>
  );
}
