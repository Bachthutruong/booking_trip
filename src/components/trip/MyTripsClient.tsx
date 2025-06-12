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
import useSWR from 'swr';

interface MyTripsClientProps {
  tripIdFromParam?: string;
  phoneFromParam?: string;
  nameFromParam?: string;
  serverTrips?: Trip[];
}

export default function MyTripsClient({ tripIdFromParam, phoneFromParam, nameFromParam, serverTrips }: MyTripsClientProps) {
  const [inputPhone, setInputPhone] = useState(phoneFromParam || '');
  const [inputName, setInputName] = useState(nameFromParam || '');
  const [phone, setPhone] = useState(phoneFromParam || '');
  const [name, setName] = useState(nameFromParam || '');
  const [districts, setDistricts] = useState<DistrictSurcharge[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [noTripsFound, setNoTripsFound] = useState(false);
  const { toast } = useToast();

  // SWR fetcher
  const fetcher = (url: string) => fetch(url).then(res => res.json());
  const shouldFetch = phone.trim() && name.trim();
  const { data, isLoading, mutate, isValidating } = useSWR(
    shouldFetch ? `/api/my-trips?phone=${encodeURIComponent(phone)}&name=${encodeURIComponent(name)}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  const trips: Trip[] = data?.trips || [];

  useEffect(() => {
    getDistrictSurcharges().then(setDistricts);
  }, []);

  // Set initial values from URL params and fetch if both are present
  useEffect(() => {
    if (serverTrips && serverTrips.length > 0) {
      // Nếu có trips từ server, không fetch lại
      setNoTripsFound(false);
      return;
    }
    if (phoneFromParam && nameFromParam && (!serverTrips || serverTrips.length === 0)) {
      setNoTripsFound(false);
    }
  }, [phoneFromParam, nameFromParam, serverTrips]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPhone(e.target.value);
    setError(null);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputName(e.target.value);
    setError(null);
  };

  const handleFetchTrips = () => {
    if (!inputPhone.trim() || !inputName.trim()) {
      setError('请输入您的手机号码和姓名。');
      setNoTripsFound(false);
      return;
    }
    setError(null);
    setPhone(inputPhone.trim());
    setName(inputName.trim());
    // mutate sẽ được gọi tự động do phone/name thay đổi
  };

  useEffect(() => {
    if (!isLoading && shouldFetch && trips.length === 0) {
      setNoTripsFound(true);
    } else {
      setNoTripsFound(false);
    }
  }, [isLoading, shouldFetch, trips.length]);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">查詢您的共乘</CardTitle>
          <CardDescription>請輸入您在發起共乘或加入共乘時輸入的姓名和聯絡電話</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-grow">
              <label htmlFor="phoneInput" className="block text-sm font-medium text-foreground mb-1">
              您的聯絡電話
              </label>
              <Input
                id="phoneInput"
                type="tel"
                value={inputPhone}
                onChange={handlePhoneChange}
                placeholder="e.g., 0912345678"
                className="text-base"
                disabled={isLoading || isValidating}
              />
              <label htmlFor="nameInput" className="block text-sm font-medium text-foreground mt-4 mb-1">
                您的姓名
              </label>
              <Input
                id="nameInput"
                type="text"
                value={inputName}
                onChange={handleNameChange}
                placeholder="e.g., John Doe"
                className="text-base"
                disabled={isLoading || isValidating}
              />
            </div>
            <Button
              onClick={handleFetchTrips}
              disabled={isLoading || isValidating || !inputPhone.trim() || !inputName.trim()}
              className="h-10 w-full sm:w-auto"
            >
              {(isLoading || isValidating) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              查詢
            </Button>
          </div>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {noTripsFound && !isLoading && shouldFetch && (
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
          <h2 className="text-2xl font-semibold font-headline">您的共乘</h2>
          {trips.map(trip => (
            <TripListItem
              key={trip.id}
              trip={trip}
              highlight={trip.id === tripIdFromParam}
              onActionStart={() => {}}
              onActionComplete={() => mutate()}
              currentUsersPhone={phone}
              districts={districts}
            />
          ))}
        </div>
      )}
    </div>
  );
}
