import { useState, useEffect } from "react";
import { sindpanAuthApi } from "@/services/sindpanAuthApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function ApiHealthCheck() {
  const [status, setStatus] = useState<'loading' | 'online' | 'offline'>('loading');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkHealth = async () => {
    setStatus('loading');
    try {
      await sindpanAuthApi.healthcheck();
      setStatus('online');
      setLastCheck(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
      setStatus('offline');
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getStatusBadge = () => {
    switch (status) {
      case 'loading':
        return <Badge variant="outline">Verificando...</Badge>;
      case 'online':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Online</Badge>;
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>;
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>API SINDPAN:</span>
      {getStatusBadge()}
      <Button
        variant="ghost"
        size="sm"
        onClick={checkHealth}
        disabled={status === 'loading'}
        className="h-6 w-6 p-0"
      >
        <RefreshCw className={`h-3 w-3 ${status === 'loading' ? 'animate-spin' : ''}`} />
      </Button>
      {lastCheck && (
        <span className="text-xs">
          {lastCheck.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
