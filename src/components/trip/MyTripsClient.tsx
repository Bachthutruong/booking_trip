'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Trip } from '@/lib/types';
import TripListItem from './TripListItem';
import { useToast } from '@/hooks/use-toast';
import { Search, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import type { DistrictSurcharge } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { startTransition } from 'react';

interface MyTripsClientProps {
  tripIdFromParam?: string;
  phoneFromParam?: string;
  nameFromParam?: string;
  serverTrips: Trip[];
  districts: DistrictSurcharge[];
}

export default function MyTripsClient({ 
  tripIdFromParam, 
  phoneFromParam, 
  nameFromParam, 
  serverTrips,
  districts 
}: MyTripsClientProps) {
  const router = useRouter();
  const [inputPhone, setInputPhone] = useState(phoneFromParam || '');
  const [inputName, setInputName] = useState(nameFromParam || '');
  const [phone, setPhone] = useState(phoneFromParam || '');
  const [name, setName] = useState(nameFromParam || '');
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

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
      return;
    }
    setError(null);
    setPhone(inputPhone.trim());
    setName(inputName.trim());
    setIsSearching(true);

    startTransition(() => {
      router.push(`/my-trips?phone=${encodeURIComponent(inputPhone.trim())}&name=${encodeURIComponent(inputName.trim())}`);
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFetchTrips();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">查詢您的共乘</CardTitle>
          <CardDescription>請輸入您在發起共乘或加入共乘時輸入的姓名和聯絡電話</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-grow w-full">
              <label htmlFor="phoneInput" className="block text-sm font-medium text-foreground mb-1">
                您的聯絡電話
              </label>
              <Input
                id="phoneInput"
                type="tel"
                value={inputPhone}
                onChange={handlePhoneChange}
                onKeyPress={handleKeyPress}
                placeholder="e.g., 0912345678"
                className="text-base w-full"
                disabled={isSearching}
              />
              <label htmlFor="nameInput" className="block text-sm font-medium text-foreground mt-4 mb-1">
                您的姓名
              </label>
              <Input
                id="nameInput"
                type="text"
                value={inputName}
                onChange={handleNameChange}
                onKeyPress={handleKeyPress}
                placeholder="e.g., John Doe"
                className="text-base w-full"
                disabled={isSearching}
              />
            </div>
            <div className="w-full sm:w-auto">
              <Button
                onClick={handleFetchTrips}
                disabled={!inputPhone.trim() || !inputName.trim() || isSearching}
                className="h-10 w-full sm:w-auto"
              >
                <Search className="mr-2 h-4 w-4" />
                查詢
              </Button>
            </div>
          </div>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {serverTrips.length === 0 && phone && name && (
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

      {serverTrips.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold font-headline">您的共乘</h2>
          {serverTrips.map(trip => (
            <TripListItem
              key={trip.id}
              trip={trip}
              highlight={trip.id === tripIdFromParam}
              onActionStart={() => {}}
              onActionComplete={() => {
                startTransition(() => {
                  router.refresh();
                });
              }}
              currentUsersPhone={phone}
              districts={districts}
            />
          ))}
        </div>
      )}
    </div>
  );
}
