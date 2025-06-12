'use client';

import type { Trip } from '@/lib/types';
import JoinableTripCard from './JoinableTripCard';
import { useState, useEffect, useTransition, useCallback, useRef } from 'react';
import { Input } from '../ui/input';
import { Loader2, Search, WifiOff } from 'lucide-react';
import { getJoinableTripsPaginated } from '@/actions/tripActions';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { ITINERARY_TYPES } from '@/lib/constants';
import { useInView } from 'react-intersection-observer';

// Thêm props initialTrips
interface JoinableTripsListProps {
  initialTrips?: any[];
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function JoinableTripsList({ initialTrips = [] }: JoinableTripsListProps) {
  const [allTrips, setAllTrips] = useState<any[]>(initialTrips); // Tất cả trips từ server
  const [trips, setTrips] = useState<any[]>([]); // Trips sau khi filter/search
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Không cần loading khi đã có initialTrips
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [itineraryTypes, setItineraryTypes] = useState<{ type: string, label: string }[]>([]);
  const [displayCount, setDisplayCount] = useState(6);

  // Nếu initialTrips thay đổi (do SSR/hydration), cập nhật lại state
  useEffect(() => {
    setAllTrips(initialTrips);
  }, [initialTrips]);

  // Không fetch trips khi mount nữa!

  // Fetch danh sách itinerary types động
  useEffect(() => {
    fetch('/api/admin/itineraries/list')
      .then(res => res.json())
      .then(data => {
        // Lấy unique type và label từ danh sách itinerary
        const typesMap: Record<string, string> = {};
        (data.itineraries || []).forEach((it: any) => {
          if (it.type && it.name) typesMap[it.type] = it.name;
        });
        setItineraryTypes(Object.entries(typesMap).map(([type, label]) => ({ type, label })));
      });
  }, []);

  // Filter client-side khi search/filter đổi
  useEffect(() => {
    let filtered = allTrips;
    if (selectedType) {
      filtered = filtered.filter(trip => trip.itineraryType === selectedType);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(trip =>
        (trip.itineraryName && trip.itineraryName.toLowerCase().includes(term)) ||
        (trip.date && trip.date.toLowerCase().includes(term)) ||
        (trip.contactName && trip.contactName.toLowerCase().includes(term))
      );
    }
    setTrips(filtered);
    setDisplayCount(6); // Reset displayCount khi filter/search đổi
  }, [allTrips, searchTerm, selectedType]);

  const handleFilterChange = (type: string | null) => {
    setSelectedType(type);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-headline">加入現有旅程</h1>
          <p className="text-lg text-muted-foreground mt-2">找到已確認的旅程並加入！</p>
        </div>
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
          <Button onClick={() => window.location.reload()} variant="link" className="p-0 h-auto ml-1 text-destructive hover:underline">
            重试
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Luôn render thanh tìm kiếm và filter buttons, chỉ thay đổi phần kết quả
  return (
    <div className="space-y-8">
      {/* Thanh tìm kiếm */}
      <div className="relative max-w-lg mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="按名称、日期、地点或创建者搜索行程..."
          value={searchTerm}
          onChange={handleInputChange}
          className="pl-10 text-base"
        />
      </div>

      {/* Itinerary Type Filter Buttons */}
      <div className="flex gap-3 justify-center mb-2 flex-wrap">
        <Button
          key="all"
          variant={selectedType === null ? 'default' : 'outline'}
          onClick={() => handleFilterChange(null)}
          className={selectedType === null ? 'bg-primary text-white' : ''}
        >
          所有行程
        </Button>
        {itineraryTypes.map(({ type, label }) => (
          <Button
            key={type}
            variant={selectedType === type ? 'default' : 'outline'}
            onClick={() => handleFilterChange(selectedType === type ? null : type)}
            className={selectedType === type ? 'bg-primary text-white' : ''}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Kết quả */}
      <div>
        {trips.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
              {trips.slice(0, displayCount).map(trip => (
                <JoinableTripCard key={trip.id} trip={trip} />
              ))}
            </div>
            <div className="flex justify-center mt-6 gap-4">
              {displayCount < trips.length && (
                <Button onClick={() => setDisplayCount(c => c + 6)}>
                  载入更多
                </Button>
              )}
              {displayCount > 6 && (
                <Button variant="outline" onClick={() => setDisplayCount(6)}>
                  收起
                </Button>
              )}
            </div>
          </>
        ) : (
          <Alert className="max-w-lg mx-auto">
            <Search className="h-5 w-5" />
            <AlertTitle>没有可用的行程</AlertTitle>
            <AlertDescription>
              目前没有可用的确认行程。请稍后再试或创建自己的行程！
            </AlertDescription>
          </Alert>
        )}
      </div>
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
