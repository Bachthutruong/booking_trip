'use client';

import { useState, useEffect, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getUserTrips } from '@/actions/tripActions';
import type { Trip } from '@/lib/types';
import TripListItem from './TripListItem';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { getDistrictSurcharges } from '@/actions/configActions';
import type { DistrictSurcharge } from '@/lib/types';

interface MyTripsClientProps {
  tripIdFromParam?: string;
  phoneFromParam?: string;
  nameFromParam?: string;
}

export default function MyTripsClient({ tripIdFromParam, phoneFromParam, nameFromParam }: MyTripsClientProps) {
  const [phone, setPhone] = useState(phoneFromParam || '');
  const [name, setName] = useState(nameFromParam || '');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(false); // For initial load or explicit search
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, startTransition] = useTransition(); // For actions within list items like proof upload revalidation
  const { toast } = useToast();
  const [districts, setDistricts] = useState<DistrictSurcharge[]>([]);
  const [noTripsFound, setNoTripsFound] = useState(false);

  // Fetch districts once on mount
  useEffect(() => {
    getDistrictSurcharges().then(setDistricts);
  }, []);

  const handleFetchTrips = () => {
    if (!phone.trim() || !name.trim()) {
      setError('请输入您的手机号码和姓名。');
      setTrips([]); // Clear previous results if any
      setNoTripsFound(false);
      return;
    }
    setError(null);
    setIsLoading(true); // Explicit search loading state
    setNoTripsFound(false);
    startTransition(async () => {
      try {
        const fetchedTrips = await getUserTrips(phone, name);
        setTrips(fetchedTrips);
        if (fetchedTrips.length === 0) {
          setNoTripsFound(true);
        } else {
          setNoTripsFound(false);
        }
      } catch (err) {
        console.error("Error fetching trips:", err);
        setError('无法加载行程。请检查您的连接并重试。');
        toast({ title: "错误", description: "无法加载行程。", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    });
  };

  useEffect(() => {
    if (phoneFromParam && phoneFromParam.trim() !== '') {
      setPhone(phoneFromParam);
    }
    if (nameFromParam && nameFromParam.trim() !== '') {
      setName(nameFromParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneFromParam, nameFromParam]);

  // Tự động fetch nếu có đủ phone và name từ param
  useEffect(() => {
    if (phone && name) {
      handleFetchTrips();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, name]);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">查找您的预订</CardTitle>
          <CardDescription>输入您在预订时使用的手机号码以查看您的行程详情。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-grow">
              <label htmlFor="phoneInput" className="block text-sm font-medium text-foreground mb-1">
                您的手机号码
              </label>
              <Input
                id="phoneInput"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g., 0912345678"
                className="text-base"
                disabled={isLoading || isTransitioning}
              />
              <label htmlFor="nameInput" className="block text-sm font-medium text-foreground mt-4 mb-1">
                您的姓名
              </label>
              <Input
                id="nameInput"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., John Doe"
                className="text-base"
                disabled={isLoading || isTransitioning}
              />
            </div>
            <Button onClick={handleFetchTrips} disabled={isLoading || isTransitioning || !phone.trim() || !name.trim()} className="h-10 w-full sm:w-auto">
              {(isLoading || isTransitioning) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              查找行程
            </Button>
          </div>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {noTripsFound && !isLoading && (
        <div className="text-center py-6">
          <Alert variant="default" className="max-w-xl mx-auto">
            <Info className="h-5 w-5 mr-2" />
            <AlertTitle>没有找到行程</AlertTitle>
            <AlertDescription>
              我们找不到与该手机号码和姓名相关的行程。
            </AlertDescription>
          </Alert>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-10">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">正在加载您的行程...</p>
        </div>
      )}

      {!isLoading && trips.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold font-headline">您的预订行程</h2>
          {trips.map(trip => (
            <TripListItem
              key={trip.id}
              trip={trip}
              highlight={trip.id === tripIdFromParam}
              onActionStart={() => startTransition(() => { })}
              onActionComplete={() => handleFetchTrips()}
              currentUsersPhone={phone}
              districts={districts}
            />
          ))}
        </div>
      )}
    </div>
  );
}
